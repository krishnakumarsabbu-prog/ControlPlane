'use strict';

const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const repo = require('./projectRepository');

function getAll() {
  try {
    return repo.getAllProjects();
  } catch (err) {
    throw new Error(`getAll: ${err.message}`);
  }
}

function getById(id) {
  try {
    return repo.getProjectById(id);
  } catch (err) {
    throw new Error(`getById: ${err.message}`);
  }
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

  try {
    return repo.createProject({
      id: uuidv4(),
      name,
      path: projectPath,
      startCommand,
      status: 'idle',
      port: port || null,
      lastRunAt: null,
      autoRestart: Boolean(autoRestart),
      maxRetries,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    throw new Error(`create: ${err.message}`);
  }
}

function updateConfig(id, { autoRestart, maxRetries }) {
  const project = repo.getProjectById(id);
  if (!project) throw new Error(`Project not found: ${id}`);

  const data = {};
  if (autoRestart !== undefined) data.autoRestart = Boolean(autoRestart);
  if (maxRetries !== undefined) {
    const n = Number(maxRetries);
    if (isNaN(n) || n < 0 || n > 10) throw new Error('maxRetries must be between 0 and 10');
    data.maxRetries = n;
  }

  try {
    return repo.updateProject(id, data);
  } catch (err) {
    throw new Error(`updateConfig: ${err.message}`);
  }
}

function updateStatus(id, status, extra = {}) {
  try {
    return repo.updateProject(id, { status, ...extra });
  } catch (err) {
    throw new Error(`updateStatus: ${err.message}`);
  }
}

function remove(id) {
  try {
    repo.deleteProject(id);
  } catch (err) {
    throw new Error(`remove: ${err.message}`);
  }
}

module.exports = { getAll, getById, create, updateStatus, updateConfig, remove };
