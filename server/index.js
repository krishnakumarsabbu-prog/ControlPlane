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
// GET /projects — list all projects, merging live registry status
// ---------------------------------------------------------------------------
app.get('/projects', (req, res) => {
  try {
    const projects = projectService.getAll().map(p => {
      const entry = processService.getRegistryEntry(p.id);
      if (entry) {
        return { ...p, status: entry.status, port: entry.port ?? p.port };
      }
      return p;
    });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /projects — create a new project
// ---------------------------------------------------------------------------
app.post('/projects', (req, res) => {
  try {
    const { name, path, startCommand, port } = req.body;
    const project = projectService.create({ name, path, startCommand, port });
    res.status(201).json(project);
  } catch (err) {
    const status = err.message.includes('does not exist') || err.message.includes('required') ? 400 : 500;
    res.status(status).json({ error: err.message });
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
    const status = err.message.includes('already') ? 409
      : err.message.includes('not found') ? 404
      : 500;
    res.status(status).json({ error: err.message });
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
    const status = err.message.includes('not found') ? 404
      : err.message.includes('Cannot stop') ? 409
      : 500;
    res.status(status).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /projects/:id/logs — fetch ring-buffered logs for a project
// ---------------------------------------------------------------------------
app.get('/projects/:id/logs', (req, res) => {
  try {
    const project = projectService.getById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const logs = logService.getLogs(req.params.id);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /logs — all logs across all projects (used by frontend global log view)
// ---------------------------------------------------------------------------
app.get('/logs', (req, res) => {
  try {
    res.json(logService.getAllLogs());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /logs/clear — wipe all logs
// ---------------------------------------------------------------------------
app.post('/logs/clear', (req, res) => {
  try {
    logService.clearLogs();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /stats — system CPU + memory
// ---------------------------------------------------------------------------
app.get('/stats', (req, res) => {
  try {
    res.json(processService.getSystemMetrics());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get('/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Lapi Cloud server listening on http://localhost:${PORT}`);
});
