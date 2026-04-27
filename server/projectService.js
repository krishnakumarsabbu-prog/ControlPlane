'use strict';

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_FILE = path.join(__dirname, 'projects.json');

function _load() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (_) {}
  return [];
}

function _save(projects) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(projects, null, 2), 'utf8');
}

function getAll() {
  return _load();
}

function getById(id) {
  return _load().find(p => p.id === id) || null;
}

function create({ name, path: projectPath, startCommand, port, autoRestart = false, maxRetries = 3 }) {
  if (!name || !projectPath || !startCommand) {
    throw new Error('name, path, and startCommand are required');
  }

  if (!fs.existsSync(projectPath)) {
    throw new Error(`Path does not exist: ${projectPath}`);
  }

  if (typeof maxRetries !== 'number' || maxRetries < 0 || maxRetries > 10) {
    throw new Error('maxRetries must be a number between 0 and 10');
  }

  const projects = _load();
  const project = {
    id: uuidv4(),
    name,
    path: projectPath,
    startCommand,
    status: 'idle',
    port: port || null,
    lastRunAt: null,
    autoRestart: Boolean(autoRestart),
    maxRetries: maxRetries,
  };
  projects.push(project);
  _save(projects);
  return project;
}

function updateConfig(id, { autoRestart, maxRetries }) {
  const projects = _load();
  const idx = projects.findIndex(p => p.id === id);
  if (idx === -1) throw new Error(`Project not found: ${id}`);

  if (autoRestart !== undefined) projects[idx].autoRestart = Boolean(autoRestart);
  if (maxRetries !== undefined) {
    const n = Number(maxRetries);
    if (isNaN(n) || n < 0 || n > 10) throw new Error('maxRetries must be between 0 and 10');
    projects[idx].maxRetries = n;
  }
  _save(projects);
  return projects[idx];
}

function updateStatus(id, status, extra = {}) {
  const projects = _load();
  const idx = projects.findIndex(p => p.id === id);
  if (idx === -1) throw new Error(`Project not found: ${id}`);

  projects[idx] = { ...projects[idx], status, ...extra };
  _save(projects);
  return projects[idx];
}

function remove(id) {
  const projects = _load();
  const idx = projects.findIndex(p => p.id === id);
  if (idx === -1) throw new Error(`Project not found: ${id}`);
  projects.splice(idx, 1);
  _save(projects);
}

module.exports = { getAll, getById, create, updateStatus, updateConfig, remove };
