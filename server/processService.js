'use strict';

const { spawn } = require('child_process');
const net = require('net');
const os = require('os');
const http = require('http');
const logService = require('./logService');
const projectService = require('./projectService');

// Map<projectId, ProcessEntry>
const registry = new Map();

// Map<port, projectId> — global port registry
const portRegistry = new Map();

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
  } catch (_) {
    // process may already be gone
  }
}

// Check if a PID is still alive (zombie detection)
function _isPidAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (_) {
    return false;
  }
}

// Ping a project's /health endpoint
function _pingHealth(port) {
  return new Promise(resolve => {
    const options = {
      hostname: '127.0.0.1',
      port,
      path: '/health',
      method: 'GET',
      timeout: 3000,
    };
    const req = http.request(options, res => {
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
}

function _startHealthCheck(projectId, entry) {
  if (entry.healthCheckInterval) clearInterval(entry.healthCheckInterval);
  if (!entry.port) return;

  entry.healthCheckInterval = setInterval(async () => {
    const current = registry.get(projectId);
    if (!current || current.status !== 'running') {
      clearInterval(entry.healthCheckInterval);
      return;
    }

    const healthy = await _pingHealth(current.port);
    if (!healthy) {
      const project = projectService.getById(projectId);
      const name = project ? project.name : projectId;
      logService.push(projectId, name, `Health check failed on port ${current.port}`, 'system');
      current.status = 'error';
      projectService.updateStatus(projectId, 'error');
      clearInterval(entry.healthCheckInterval);

      // Trigger auto-restart if configured
      if (project && project.autoRestart && current.restartCount < (project.maxRetries || 3)) {
        _scheduleRestart(projectId, current);
      }
    }
  }, 15000); // every 15s
}

function _scheduleRestart(projectId, entry) {
  const project = projectService.getById(projectId);
  if (!project) return;

  const delay = Math.min(1000 * Math.pow(2, entry.restartCount), 30000); // exponential backoff, max 30s
  logService.push(
    projectId,
    project.name,
    `Auto-restart scheduled in ${Math.round(delay / 1000)}s (attempt ${entry.restartCount + 1}/${project.maxRetries || 3})`,
    'system',
  );

  setTimeout(async () => {
    // Only restart if still in error/stopped state and not manually restarted
    const current = registry.get(projectId);
    const currentProject = projectService.getById(projectId);
    if (!currentProject) return;
    if (current && (current.status === 'running' || current.status === 'starting')) return;

    try {
      await _spawnProcess(projectId, entry.restartCount + 1);
    } catch (err) {
      logService.push(projectId, project.name, `Auto-restart failed: ${err.message}`, 'system');
    }
  }, delay);
}

async function _spawnProcess(projectId, restartCount = 0) {
  const project = projectService.getById(projectId);
  if (!project) throw new Error(`Project not found: ${projectId}`);

  const { cmd, args } = _parseCommand(project.startCommand);

  projectService.updateStatus(projectId, 'starting', { lastRunAt: new Date().toISOString() });
  logService.pushSystem(projectId, project.name, `Starting: ${project.startCommand}`);

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
    restartCount,
    healthCheckInterval: null,
    config: project,
  };
  registry.set(projectId, entry);

  if (entry.port) {
    portRegistry.set(entry.port, projectId);
  }

  child.stdout.on('data', (data) => {
    const text = data.toString();
    logService.push(projectId, project.name, text, 'stdout');

    const detectedPort = _extractPort(text);
    if (detectedPort && !entry.port) {
      entry.port = detectedPort;
      portRegistry.set(detectedPort, projectId);
      projectService.updateStatus(projectId, 'running', { port: detectedPort });
      _startHealthCheck(projectId, entry);
    }

    if (entry.status === 'starting') {
      entry.status = 'running';
      projectService.updateStatus(projectId, 'running', { port: entry.port });
      if (entry.port) _startHealthCheck(projectId, entry);
    }
  });

  child.stderr.on('data', (data) => {
    const text = data.toString();
    logService.push(projectId, project.name, text, 'stderr');

    const detectedPort = _extractPort(text);
    if (detectedPort && !entry.port) {
      entry.port = detectedPort;
      portRegistry.set(detectedPort, projectId);
      projectService.updateStatus(projectId, 'running', { port: detectedPort });
      _startHealthCheck(projectId, entry);
    }

    if (entry.status === 'starting') {
      entry.status = 'running';
      projectService.updateStatus(projectId, 'running', { port: entry.port });
      if (entry.port) _startHealthCheck(projectId, entry);
    }
  });

  child.on('error', (err) => {
    entry.status = 'error';
    projectService.updateStatus(projectId, 'error');
    logService.push(projectId, project.name, `Process error: ${err.message}`, 'system');
    if (entry.healthCheckInterval) clearInterval(entry.healthCheckInterval);
  });

  child.on('close', (code) => {
    const isError = code !== 0 && code !== null;
    entry.status = isError ? 'error' : 'stopped';
    if (entry.port) portRegistry.delete(entry.port);
    projectService.updateStatus(projectId, entry.status, { port: null });
    logService.pushSystem(projectId, project.name, `Process exited with code ${code}`);
    if (entry.healthCheckInterval) clearInterval(entry.healthCheckInterval);

    const currentProject = projectService.getById(projectId);
    registry.delete(projectId);

    if (isError && currentProject && currentProject.autoRestart && restartCount < (currentProject.maxRetries || 3)) {
      _scheduleRestart(projectId, entry);
    }
  });

  // Transition to running after grace period if no output triggered it
  setTimeout(() => {
    if (entry.status === 'starting' && registry.has(projectId)) {
      entry.status = 'running';
      projectService.updateStatus(projectId, 'running', { port: entry.port });
      if (entry.port) _startHealthCheck(projectId, entry);
    }
  }, 5000);

  return projectService.getById(projectId);
}

async function start(projectId) {
  // Startup safety: prevent double-start
  if (registry.has(projectId)) {
    const entry = registry.get(projectId);
    if (entry.status === 'running' || entry.status === 'starting') {
      throw new Error(`Project ${projectId} is already ${entry.status}`);
    }
  }

  // Zombie detection: check persisted status vs actual process
  const project = projectService.getById(projectId);
  if (!project) throw new Error(`Project not found: ${projectId}`);

  if (project.status === 'running' && !registry.has(projectId)) {
    // Stale running state — process is gone, clean it up
    logService.pushSystem(projectId, project.name, 'Detected zombie state — cleaning up stale running status');
    projectService.updateStatus(projectId, 'stopped', { port: null });
    if (project.port) portRegistry.delete(project.port);
  }

  return _spawnProcess(projectId, 0);
}

async function stop(projectId) {
  const project = projectService.getById(projectId);
  if (!project) throw new Error(`Project not found: ${projectId}`);

  const entry = registry.get(projectId);
  if (!entry) {
    // Not in registry but persisted as running — mark stopped
    projectService.updateStatus(projectId, 'stopped', { port: null });
    if (project.port) portRegistry.delete(project.port);
    return projectService.getById(projectId);
  }

  if (entry.status !== 'running' && entry.status !== 'starting') {
    throw new Error(`Cannot stop project in state: ${entry.status}`);
  }

  logService.pushSystem(projectId, project.name, `Stopping ${project.name}...`);
  if (entry.healthCheckInterval) clearInterval(entry.healthCheckInterval);
  _killTree(entry.pid);

  if (entry.port) portRegistry.delete(entry.port);
  entry.status = 'stopped';
  projectService.updateStatus(projectId, 'stopped', { port: null, lastRunAt: new Date().toISOString() });
  registry.delete(projectId);

  return projectService.getById(projectId);
}

function getRegistryEntry(projectId) {
  const entry = registry.get(projectId) || null;
  if (!entry) return null;

  // Include zombie check info
  const isAlive = entry.pid ? _isPidAlive(entry.pid) : false;
  return { ...entry, process: undefined, isAlive };
}

function getPortRegistry() {
  const result = {};
  for (const [port, projectId] of portRegistry.entries()) {
    const project = projectService.getById(projectId);
    result[port] = {
      projectId,
      projectName: project ? project.name : 'Unknown',
    };
  }
  return result;
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

module.exports = { start, stop, getRegistryEntry, getPortRegistry, getSystemMetrics };
