'use strict';

const express = require('express');
const cors = require('cors');
const { execFile, spawn } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);
const projectService = require('./projectService');
const processService = require('./processService');
const logService = require('./logService');
const profileRepo = require('./profileRepository');
const commandHistoryRepo = require('./commandHistoryRepository');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// ---------------------------------------------------------------------------
// Structured error logger
// ---------------------------------------------------------------------------
function logError(context, err) {
  const ts = new Date().toISOString();
  console.error(`[${ts}] [ERROR] ${context}:`, err.message || String(err));
}

// ---------------------------------------------------------------------------
// Error helper
// ---------------------------------------------------------------------------
function apiError(res, err) {
  const msg = err.message || String(err);
  let status = 500;
  if (/not found/i.test(msg)) status = 404;
  else if (/already|cannot stop|cannot start/i.test(msg)) status = 409;
  else if (/required|does not exist|must be/i.test(msg)) status = 400;
  res.status(status).json({ error: msg });
}

// ---------------------------------------------------------------------------
// Input validation helpers
// ---------------------------------------------------------------------------
function validateId(id) {
  return typeof id === 'string' && /^[0-9a-f-]{1,64}$/i.test(id);
}

function validateSince(raw) {
  const n = parseInt(raw, 10);
  return isNaN(n) || n < 0 ? 0 : n;
}

// ---------------------------------------------------------------------------
// GET /projects
// ---------------------------------------------------------------------------
app.get('/projects', (req, res) => {
  try {
    const projects = projectService.getAll().map(p => {
      const entry = processService.getRegistryEntry(p.id);
      if (entry) {
        return { ...p, status: entry.status, port: entry.port ?? p.port, restartCount: entry.restartCount ?? 0 };
      }
      return { ...p, restartCount: 0 };
    });
    res.json(projects);
  } catch (err) {
    logError('GET /projects', err);
    apiError(res, err);
  }
});

// ---------------------------------------------------------------------------
// POST /projects — create a new project
// ---------------------------------------------------------------------------
app.post('/projects', (req, res) => {
  try {
    const { name, path, startCommand, port, autoRestart, maxRetries } = req.body || {};
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'name is required' });
    }
    if (!path || typeof path !== 'string') {
      return res.status(400).json({ error: 'path is required' });
    }
    if (!startCommand || typeof startCommand !== 'string') {
      return res.status(400).json({ error: 'startCommand is required' });
    }
    const project = projectService.create({ name: name.trim(), path, startCommand, port, autoRestart, maxRetries });
    res.status(201).json(project);
  } catch (err) {
    logError('POST /projects', err);
    apiError(res, err);
  }
});

// ---------------------------------------------------------------------------
// PATCH /projects/:id/config
// ---------------------------------------------------------------------------
app.patch('/projects/:id/config', (req, res) => {
  try {
    if (!validateId(req.params.id)) return res.status(400).json({ error: 'Invalid project id' });
    const { autoRestart, maxRetries } = req.body || {};
    const project = projectService.updateConfig(req.params.id, { autoRestart, maxRetries });
    res.json(project);
  } catch (err) {
    logError('PATCH /projects/:id/config', err);
    apiError(res, err);
  }
});

// ---------------------------------------------------------------------------
// POST /projects/:id/start
// ---------------------------------------------------------------------------
app.post('/projects/:id/start', async (req, res) => {
  try {
    if (!validateId(req.params.id)) return res.status(400).json({ error: 'Invalid project id' });
    const project = await processService.start(req.params.id);
    res.json(project);
  } catch (err) {
    logError('POST /projects/:id/start', err);
    apiError(res, err);
  }
});

// ---------------------------------------------------------------------------
// POST /projects/:id/stop
// ---------------------------------------------------------------------------
app.post('/projects/:id/stop', async (req, res) => {
  try {
    if (!validateId(req.params.id)) return res.status(400).json({ error: 'Invalid project id' });
    const project = await processService.stop(req.params.id);
    res.json(project);
  } catch (err) {
    logError('POST /projects/:id/stop', err);
    apiError(res, err);
  }
});

// ---------------------------------------------------------------------------
// GET /projects/:id/logs
// ---------------------------------------------------------------------------
app.get('/projects/:id/logs', (req, res) => {
  try {
    if (!validateId(req.params.id)) return res.status(400).json({ error: 'Invalid project id' });
    const project = projectService.getById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const since = validateSince(req.query.since);
    const logs = logService.getLogs(req.params.id, since);
    res.json({ logs, seq: logService.getCurrentSeq() });
  } catch (err) {
    logError('GET /projects/:id/logs', err);
    apiError(res, err);
  }
});

// ---------------------------------------------------------------------------
// POST /projects/:id/logs/clear
// ---------------------------------------------------------------------------
app.post('/projects/:id/logs/clear', (req, res) => {
  try {
    if (!validateId(req.params.id)) return res.status(400).json({ error: 'Invalid project id' });
    logService.clearLogs(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    logError('POST /projects/:id/logs/clear', err);
    apiError(res, err);
  }
});

// ---------------------------------------------------------------------------
// GET /logs
// ---------------------------------------------------------------------------
app.get('/logs', (req, res) => {
  try {
    const since = validateSince(req.query.since);
    const logs = logService.getAllLogs(since);
    res.json({ logs, seq: logService.getCurrentSeq() });
  } catch (err) {
    logError('GET /logs', err);
    apiError(res, err);
  }
});

// ---------------------------------------------------------------------------
// POST /logs/clear
// ---------------------------------------------------------------------------
app.post('/logs/clear', (req, res) => {
  try {
    logService.clearLogs();
    res.json({ ok: true, seq: logService.getCurrentSeq() });
  } catch (err) {
    logError('POST /logs/clear', err);
    apiError(res, err);
  }
});

// ---------------------------------------------------------------------------
// GET /stats
// ---------------------------------------------------------------------------
app.get('/stats', (req, res) => {
  try {
    res.json(processService.getSystemMetrics());
  } catch (err) {
    logError('GET /stats', err);
    apiError(res, err);
  }
});

// ---------------------------------------------------------------------------
// GET /ports
// ---------------------------------------------------------------------------
app.get('/ports', (req, res) => {
  try {
    res.json(processService.getPortRegistry());
  } catch (err) {
    logError('GET /ports', err);
    apiError(res, err);
  }
});

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get('/health', (_req, res) => res.json({ ok: true }));

// ---------------------------------------------------------------------------
// GET /profiles
// ---------------------------------------------------------------------------
app.get('/profiles', (req, res) => {
  try {
    res.json(profileRepo.getAllProfiles());
  } catch (err) {
    logError('GET /profiles', err);
    apiError(res, err);
  }
});

// ---------------------------------------------------------------------------
// POST /profiles
// ---------------------------------------------------------------------------
app.post('/profiles', (req, res) => {
  try {
    const { name, color } = req.body || {};
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'name is required' });
    }
    if (!color || typeof color !== 'string') {
      return res.status(400).json({ error: 'color is required' });
    }
    res.status(201).json(profileRepo.createProfile(name.trim(), color));
  } catch (err) {
    logError('POST /profiles', err);
    apiError(res, err);
  }
});

// ---------------------------------------------------------------------------
// DELETE /profiles/:id
// ---------------------------------------------------------------------------
app.delete('/profiles/:id', (req, res) => {
  try {
    if (!validateId(req.params.id)) return res.status(400).json({ error: 'Invalid profile id' });
    profileRepo.deleteProfile(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    logError('DELETE /profiles/:id', err);
    apiError(res, err);
  }
});

// ---------------------------------------------------------------------------
// PUT /profiles/:id/projects
// ---------------------------------------------------------------------------
app.put('/profiles/:id/projects', (req, res) => {
  try {
    if (!validateId(req.params.id)) return res.status(400).json({ error: 'Invalid profile id' });
    const { projectIds } = req.body || {};
    if (!Array.isArray(projectIds)) return res.status(400).json({ error: 'projectIds must be an array' });
    if (projectIds.some(id => !validateId(id))) {
      return res.status(400).json({ error: 'projectIds contains invalid entries' });
    }
    profileRepo.updateProfileProjects(req.params.id, projectIds);
    res.json({ ok: true });
  } catch (err) {
    logError('PUT /profiles/:id/projects', err);
    apiError(res, err);
  }
});

// ---------------------------------------------------------------------------
// POST /vscode/open — open a path or project in VS Code
// ---------------------------------------------------------------------------
app.post('/vscode/open', async (req, res) => {
  try {
    const { projectId, path: customPath } = req.body || {};
    let targetPath = customPath;

    if (projectId) {
      if (!validateId(projectId)) return res.status(400).json({ error: 'Invalid project id' });
      const project = projectService.getById(projectId);
      if (!project) return res.status(404).json({ error: 'Project not found' });
      targetPath = project.path;
    }

    if (!targetPath || typeof targetPath !== 'string') {
      return res.status(400).json({ error: 'path or projectId is required' });
    }

    await execFileAsync('code', [targetPath], { timeout: 8000 });
    res.json({ ok: true, path: targetPath });
  } catch (err) {
    logError('POST /vscode/open', err);
    const msg = err.code === 'ENOENT'
      ? "VS Code CLI not found. Install it via VS Code: Shell Command: Install 'code' command in PATH."
      : err.message || String(err);
    res.status(500).json({ error: msg });
  }
});

// ---------------------------------------------------------------------------
// POST /terminal/run — execute an arbitrary command
// ---------------------------------------------------------------------------
app.post('/terminal/run', async (req, res) => {
  try {
    const { command, cwd, projectId } = req.body || {};
    if (!command || typeof command !== 'string' || command.trim().length === 0) {
      return res.status(400).json({ error: 'command is required' });
    }

    let workingDir = cwd;
    let projectName;

    if (projectId) {
      if (!validateId(projectId)) return res.status(400).json({ error: 'Invalid project id' });
      const project = projectService.getById(projectId);
      if (!project) return res.status(404).json({ error: 'Project not found' });
      if (!workingDir) workingDir = project.path;
      projectName = project.name;
    }

    const options = {
      shell: true,
      timeout: 30000,
      maxBuffer: 1024 * 1024,
    };
    if (workingDir) options.cwd = workingDir;

    let stdout = '';
    let stderr = '';
    let exitCode = 0;

    try {
      const result = await execFileAsync(command.split(' ')[0], command.split(' ').slice(1), {
        ...options,
        shell: true,
      });
      stdout = result.stdout || '';
      stderr = result.stderr || '';
    } catch (execErr) {
      stdout = execErr.stdout || '';
      stderr = execErr.stderr || execErr.message || '';
      exitCode = execErr.code ?? 1;
    }

    const entry = commandHistoryRepo.saveCommand({
      command: command.trim(),
      cwd: workingDir || null,
      projectId: projectId || null,
      projectName: projectName || null,
      stdout,
      stderr,
      exitCode,
    });

    res.json({ ok: true, stdout, stderr, exitCode, id: entry.id });
  } catch (err) {
    logError('POST /terminal/run', err);
    apiError(res, err);
  }
});

// ---------------------------------------------------------------------------
// GET /terminal/history — get command execution history
// ---------------------------------------------------------------------------
app.get('/terminal/history', (req, res) => {
  try {
    const projectId = req.query.projectId;
    if (projectId && !validateId(projectId)) {
      return res.status(400).json({ error: 'Invalid project id' });
    }
    const history = commandHistoryRepo.getHistory(projectId || null, 50);
    res.json(history);
  } catch (err) {
    logError('GET /terminal/history', err);
    apiError(res, err);
  }
});

// ---------------------------------------------------------------------------
// On startup: mark any persisted 'running'/'starting' projects as stopped
// (handles backend restart without process recovery)
// ---------------------------------------------------------------------------
try {
  const staleProjects = projectService.getAll().filter(
    p => p.status === 'running' || p.status === 'starting',
  );
  for (const p of staleProjects) {
    projectService.updateStatus(p.id, 'stopped', { port: null });
    console.log(`[startup] Marked stale project "${p.name}" as stopped`);
  }
} catch (err) {
  console.error('[startup] Failed to reset stale project statuses:', err.message);
}

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------
function shutdown(signal) {
  console.log(`\n[${signal}] Shutting down gracefully...`);
  process.exit(0);
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Catch unhandled rejections to prevent silent crashes
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err.message, err.stack);
});

app.listen(PORT, () => {
  console.log(`Lapi Cloud server listening on http://localhost:${PORT}`);
});
