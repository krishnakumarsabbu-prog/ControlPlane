'use strict';

const express = require('express');
const cors = require('cors');
const projectService = require('./projectService');
const processService = require('./processService');
const logService = require('./logService');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

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
// GET /projects — list all projects, merging live registry status
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
    apiError(res, err);
  }
});

// ---------------------------------------------------------------------------
// POST /projects — create a new project
// ---------------------------------------------------------------------------
app.post('/projects', (req, res) => {
  try {
    const { name, path, startCommand, port, autoRestart, maxRetries } = req.body;
    const project = projectService.create({ name, path, startCommand, port, autoRestart, maxRetries });
    res.status(201).json(project);
  } catch (err) {
    apiError(res, err);
  }
});

// ---------------------------------------------------------------------------
// PATCH /projects/:id/config — update autoRestart / maxRetries
// ---------------------------------------------------------------------------
app.patch('/projects/:id/config', (req, res) => {
  try {
    const { autoRestart, maxRetries } = req.body;
    const project = projectService.updateConfig(req.params.id, { autoRestart, maxRetries });
    res.json(project);
  } catch (err) {
    apiError(res, err);
  }
});

// ---------------------------------------------------------------------------
// POST /projects/:id/start — spawn the process
// ---------------------------------------------------------------------------
app.post('/projects/:id/start', async (req, res) => {
  try {
    const project = await processService.start(req.params.id);
    res.json(project);
  } catch (err) {
    apiError(res, err);
  }
});

// ---------------------------------------------------------------------------
// POST /projects/:id/stop — kill the process tree
// ---------------------------------------------------------------------------
app.post('/projects/:id/stop', async (req, res) => {
  try {
    const project = await processService.stop(req.params.id);
    res.json(project);
  } catch (err) {
    apiError(res, err);
  }
});

// ---------------------------------------------------------------------------
// GET /projects/:id/logs — fetch ring-buffered logs for a project
//   ?since=<seq>  — return only entries with seq > since (incremental)
// ---------------------------------------------------------------------------
app.get('/projects/:id/logs', (req, res) => {
  try {
    const project = projectService.getById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const since = parseInt(req.query.since, 10) || 0;
    const logs = logService.getLogs(req.params.id, since);
    res.json({ logs, seq: logService.getCurrentSeq() });
  } catch (err) {
    apiError(res, err);
  }
});

// ---------------------------------------------------------------------------
// POST /projects/:id/logs/clear — clear logs for a specific project
// ---------------------------------------------------------------------------
app.post('/projects/:id/logs/clear', (req, res) => {
  try {
    logService.clearLogs(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    apiError(res, err);
  }
});

// ---------------------------------------------------------------------------
// GET /logs — all logs across all projects
//   ?since=<seq>  — incremental fetch
// ---------------------------------------------------------------------------
app.get('/logs', (req, res) => {
  try {
    const since = parseInt(req.query.since, 10) || 0;
    const logs = logService.getAllLogs(since);
    res.json({ logs, seq: logService.getCurrentSeq() });
  } catch (err) {
    apiError(res, err);
  }
});

// ---------------------------------------------------------------------------
// POST /logs/clear — wipe all logs
// ---------------------------------------------------------------------------
app.post('/logs/clear', (req, res) => {
  try {
    logService.clearLogs();
    res.json({ ok: true, seq: logService.getCurrentSeq() });
  } catch (err) {
    apiError(res, err);
  }
});

// ---------------------------------------------------------------------------
// GET /stats — system CPU + memory
// ---------------------------------------------------------------------------
app.get('/stats', (req, res) => {
  try {
    res.json(processService.getSystemMetrics());
  } catch (err) {
    apiError(res, err);
  }
});

// ---------------------------------------------------------------------------
// GET /ports — active port registry
// ---------------------------------------------------------------------------
app.get('/ports', (req, res) => {
  try {
    res.json(processService.getPortRegistry());
  } catch (err) {
    apiError(res, err);
  }
});

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get('/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Lapi Cloud server listening on http://localhost:${PORT}`);
});
