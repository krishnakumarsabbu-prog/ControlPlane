'use strict';

const db = require('./db');

function _row(row) {
  if (!row) return null;
  return {
    ...row,
    autoRestart: Boolean(row.autoRestart),
    port: row.port ?? null,
    lastRunAt: row.lastRunAt ?? null,
  };
}

function getAllProjects() {
  try {
    return db.prepare('SELECT * FROM projects ORDER BY createdAt ASC').all().map(_row);
  } catch (err) {
    throw new Error(`getAllProjects: ${err.message}`);
  }
}

function getProjectById(id) {
  try {
    return _row(db.prepare('SELECT * FROM projects WHERE id = ?').get(id));
  } catch (err) {
    throw new Error(`getProjectById: ${err.message}`);
  }
}

function createProject({ id, name, path, startCommand, status, port, lastRunAt, autoRestart, maxRetries, createdAt }) {
  try {
    db.prepare(`
      INSERT INTO projects (id, name, path, startCommand, status, port, lastRunAt, autoRestart, maxRetries, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, path, startCommand, status, port ?? null, lastRunAt ?? null, autoRestart ? 1 : 0, maxRetries, createdAt);
    return getProjectById(id);
  } catch (err) {
    throw new Error(`createProject: ${err.message}`);
  }
}

function updateProject(id, data) {
  try {
    const project = getProjectById(id);
    if (!project) throw new Error(`Project not found: ${id}`);

    const fields = [];
    const values = [];

    const allowed = ['name', 'path', 'startCommand', 'status', 'port', 'lastRunAt', 'autoRestart', 'maxRetries'];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(key === 'autoRestart' ? (data[key] ? 1 : 0) : data[key]);
      }
    }

    if (fields.length === 0) return project;

    values.push(id);
    db.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return getProjectById(id);
  } catch (err) {
    throw new Error(`updateProject: ${err.message}`);
  }
}

function deleteProject(id) {
  try {
    const info = db.prepare('DELETE FROM projects WHERE id = ?').run(id);
    if (info.changes === 0) throw new Error(`Project not found: ${id}`);
  } catch (err) {
    throw new Error(`deleteProject: ${err.message}`);
  }
}

module.exports = { getAllProjects, getProjectById, createProject, updateProject, deleteProject };
