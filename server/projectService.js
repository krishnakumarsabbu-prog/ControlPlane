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

function create({ name, path: projectPath, startCommand, port }) {
  if (!name || !projectPath || !startCommand) {
    throw new Error('name, path, and startCommand are required');
  }

  if (!fs.existsSync(projectPath)) {
    throw new Error(`Path does not exist: ${projectPath}`);
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
  };
  projects.push(project);
  _save(projects);
  return project;
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

module.exports = { getAll, getById, create, updateStatus, remove };
