'use strict';

const { v4: uuidv4 } = require('uuid');

const MAX_LOGS = 1000;

// Map<projectId, LogEntry[]>
const logBuffers = new Map();

function _getBuffer(projectId) {
  if (!logBuffers.has(projectId)) {
    logBuffers.set(projectId, []);
  }
  return logBuffers.get(projectId);
}

function _classifyLevel(text) {
  const lower = text.toLowerCase();
  if (/\b(error|err|exception|traceback|fatal)\b/.test(lower)) return 'error';
  if (/\b(warn|warning)\b/.test(lower)) return 'warn';
  if (/\b(debug|verbose)\b/.test(lower)) return 'debug';
  if (/\b(started|ready|listening|compiled|success|ok)\b/.test(lower)) return 'success';
  return 'info';
}

function push(projectId, projectName, text, stream = 'stdout') {
  const buf = _getBuffer(projectId);
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  const now = new Date();

  for (const line of lines) {
    const entry = {
      id: uuidv4(),
      timestamp: now.toTimeString().slice(0, 8),
      level: stream === 'stderr' ? _classifyLevel(line) : _classifyLevel(line),
      project: projectName,
      message: line,
    };
    buf.push(entry);
    if (buf.length > MAX_LOGS) {
      buf.splice(0, buf.length - MAX_LOGS);
    }
  }
}

function getLogs(projectId) {
  return _getBuffer(projectId).slice();
}

function getAllLogs() {
  const all = [];
  for (const buf of logBuffers.values()) {
    all.push(...buf);
  }
  all.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  return all;
}

function clearLogs(projectId) {
  if (projectId) {
    logBuffers.set(projectId, []);
  } else {
    logBuffers.clear();
  }
}

module.exports = { push, getLogs, getAllLogs, clearLogs };
