'use strict';

const db = require('./db');

const LOG_LIMIT = 500;

function addLog(projectId, message, type = 'INFO') {
  try {
    db.prepare(`
      INSERT INTO logs (projectId, message, type, timestamp)
      VALUES (?, ?, ?, ?)
    `).run(projectId, message, type, new Date().toISOString());
  } catch (err) {
    throw new Error(`addLog: ${err.message}`);
  }
}

function getLogs(projectId, limit = LOG_LIMIT) {
  try {
    return db.prepare(`
      SELECT * FROM logs WHERE projectId = ?
      ORDER BY id DESC LIMIT ?
    `).all(projectId, limit).reverse();
  } catch (err) {
    throw new Error(`getLogs: ${err.message}`);
  }
}

function clearLogs(projectId) {
  try {
    if (projectId) {
      db.prepare('DELETE FROM logs WHERE projectId = ?').run(projectId);
    } else {
      db.prepare('DELETE FROM logs').run();
    }
  } catch (err) {
    throw new Error(`clearLogs: ${err.message}`);
  }
}

module.exports = { addLog, getLogs, clearLogs };
