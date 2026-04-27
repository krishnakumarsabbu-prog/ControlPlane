'use strict';

const { spawn } = require('child_process');
const net = require('net');
const os = require('os');
const logService = require('./logService');
const projectService = require('./projectService');

// Map<projectId, ProcessEntry>
const registry = new Map();

const PORT_PATTERNS = [
  /port[:\s]+(\d{2,5})/i,
  /localhost:(\d{2,5})/i,
  /0\.0\.0\.0:(\d{2,5})/i,
  /127\.0\.0\.1:(\d{2,5})/i,
  /:(\d{2,5})\b/,
];

function _extractPort(text) {
  for (const re of PORT_PATTERNS) {
    const m = re.exec(text);
    if (m) {
      const p = parseInt(m[1], 10);
      if (p >= 1024 && p <= 65535) return p;
    }
  }
  return null;
}

function _isPortAvailable(port) {
  return new Promise(resolve => {
    const srv = net.createServer();
    srv.once('error', () => resolve(false));
    srv.once('listening', () => {
      srv.close(() => resolve(true));
    });
    srv.listen(port, '127.0.0.1');
  });
}

function _parseCommand(startCommand) {
  const parts = startCommand.trim().split(/\s+/);
  return { cmd: parts[0], args: parts.slice(1) };
}

function _isWindows() {
  return os.platform() === 'win32';
}

function _killTree(pid) {
  try {
    if (_isWindows()) {
      spawn('taskkill', ['/PID', String(pid), '/T', '/F'], { detached: true, stdio: 'ignore' });
    } else {
      process.kill(-pid, 'SIGTERM');
      setTimeout(() => {
        try { process.kill(-pid, 'SIGKILL'); } catch (_) {}
      }, 3000);
    }
  } catch (err) {
    // process may already be gone
  }
}

async function start(projectId) {
  if (registry.has(projectId)) {
    const entry = registry.get(projectId);
    if (entry.status === 'running' || entry.status === 'starting') {
      throw new Error(`Project ${projectId} is already ${entry.status}`);
    }
  }

  const project = projectService.getById(projectId);
  if (!project) throw new Error(`Project not found: ${projectId}`);

  const { cmd, args } = _parseCommand(project.startCommand);

  projectService.updateStatus(projectId, 'starting', { lastRunAt: new Date().toISOString() });
  logService.push(projectId, project.name, `Starting: ${project.startCommand}`, 'stdout');

  let child;
  try {
    child = spawn(cmd, args, {
      cwd: project.path,
      shell: true,
      detached: !_isWindows(),
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env },
    });
  } catch (err) {
    projectService.updateStatus(projectId, 'error');
    logService.push(projectId, project.name, `Failed to spawn: ${err.message}`, 'stderr');
    throw err;
  }

  const entry = {
    pid: child.pid,
    process: child,
    status: 'starting',
    startTime: Date.now(),
    port: project.port || null,
    restartCount: registry.has(projectId) ? (registry.get(projectId).restartCount || 0) : 0,
    config: project,
  };
  registry.set(projectId, entry);

  child.stdout.on('data', (data) => {
    const text = data.toString();
    logService.push(projectId, project.name, text, 'stdout');

    const detectedPort = _extractPort(text);
    if (detectedPort && !entry.port) {
      _isPortAvailable(detectedPort).then(available => {
        if (!available) {
          entry.port = detectedPort;
          projectService.updateStatus(projectId, 'running', { port: detectedPort });
        }
      });
      entry.port = detectedPort;
      projectService.updateStatus(projectId, 'running', { port: detectedPort });
    }

    if (entry.status === 'starting') {
      entry.status = 'running';
      projectService.updateStatus(projectId, 'running', { port: entry.port });
    }
  });

  child.stderr.on('data', (data) => {
    const text = data.toString();
    logService.push(projectId, project.name, text, 'stderr');

    const detectedPort = _extractPort(text);
    if (detectedPort && !entry.port) {
      entry.port = detectedPort;
      projectService.updateStatus(projectId, 'running', { port: detectedPort });
    }

    if (entry.status === 'starting') {
      entry.status = 'running';
      projectService.updateStatus(projectId, 'running', { port: entry.port });
    }
  });

  child.on('error', (err) => {
    entry.status = 'error';
    projectService.updateStatus(projectId, 'error');
    logService.push(projectId, project.name, `Process error: ${err.message}`, 'stderr');
  });

  child.on('close', (code) => {
    const isError = code !== 0 && code !== null;
    entry.status = isError ? 'error' : 'stopped';
    projectService.updateStatus(projectId, entry.status, { port: null });
    logService.push(
      projectId,
      project.name,
      `Process exited with code ${code}`,
      isError ? 'stderr' : 'stdout',
    );
    registry.delete(projectId);
  });

  // Transition to running after a short grace period if no output triggered it
  setTimeout(() => {
    if (entry.status === 'starting' && registry.has(projectId)) {
      entry.status = 'running';
      projectService.updateStatus(projectId, 'running', { port: entry.port });
    }
  }, 5000);

  return projectService.getById(projectId);
}

async function stop(projectId) {
  const project = projectService.getById(projectId);
  if (!project) throw new Error(`Project not found: ${projectId}`);

  const entry = registry.get(projectId);
  if (!entry) {
    // Not in registry but persisted as running — mark stopped
    projectService.updateStatus(projectId, 'stopped', { port: null });
    return projectService.getById(projectId);
  }

  if (entry.status !== 'running' && entry.status !== 'starting') {
    throw new Error(`Cannot stop project in state: ${entry.status}`);
  }

  logService.push(projectId, project.name, `Stopping ${project.name}...`, 'stdout');
  _killTree(entry.pid);

  entry.status = 'stopped';
  projectService.updateStatus(projectId, 'stopped', { port: null, lastRunAt: new Date().toISOString() });
  registry.delete(projectId);

  return projectService.getById(projectId);
}

function getRegistryEntry(projectId) {
  return registry.get(projectId) || null;
}

function getSystemMetrics() {
  const cpus = os.cpus();
  let totalIdle = 0, totalTick = 0;
  for (const cpu of cpus) {
    for (const type in cpu.times) totalTick += cpu.times[type];
    totalIdle += cpu.times.idle;
  }
  const cpuUsage = Math.round(100 - (totalIdle / totalTick) * 100);

  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  return {
    cpu: Math.max(0, Math.min(100, cpuUsage)),
    ram: parseFloat((usedMem / 1024 ** 3).toFixed(1)),
    ramTotal: parseFloat((totalMem / 1024 ** 3).toFixed(1)),
  };
}

module.exports = { start, stop, getRegistryEntry, getSystemMetrics };
