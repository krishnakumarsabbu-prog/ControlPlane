'use strict';

const { v4: uuidv4 } = require('uuid');
const db = require('./db');

function saveCommand({ command, cwd, projectId, projectName, stdout, stderr, exitCode }) {
  const id = uuidv4();
  const executedAt = new Date().toISOString();
  db.prepare(`
    INSERT INTO command_history (id, command, cwd, projectId, projectName, stdout, stderr, exitCode, executedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, command, cwd || null, projectId || null, projectName || null, stdout || '', stderr || '', exitCode ?? 0, executedAt);
  return { id, command, cwd, projectId, projectName, stdout, stderr, exitCode, executedAt };
}

function getHistory(projectId, limit = 50) {
  if (projectId) {
    return db.prepare(`
      SELECT * FROM command_history WHERE projectId = ? ORDER BY executedAt DESC LIMIT ?
    `).all(projectId, limit);
  }
  return db.prepare(`
    SELECT * FROM command_history ORDER BY executedAt DESC LIMIT ?
  `).all(limit);
}

module.exports = { saveCommand, getHistory };
