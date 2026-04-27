'use strict';

const { v4: uuidv4 } = require('uuid');

const MAX_LOGS = 1000;

// Map<projectId, LogEntry[]>
const logBuffers = new Map();

// Global sequence counter for incremental polling
let _seq = 0;

function _getBuffer(projectId) {
  if (!logBuffers.has(projectId)) {
    logBuffers.set(projectId, []);
  }
  return logBuffers.get(projectId);
}

function _classifyLevel(text, stream) {
  const lower = text.toLowerCase();
  if (stream === 'system') return 'system';
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
      seq: ++_seq,
      timestamp: now.toTimeString().slice(0, 8),
      level: _classifyLevel(line, stream),
      project: projectName,
      projectId,
      message: line,
    };
    buf.push(entry);
    if (buf.length > MAX_LOGS) {
      buf.splice(0, buf.length - MAX_LOGS);
    }
  }
}

function pushSystem(projectId, projectName, text) {
  push(projectId, projectName, text, 'system');
}

function getLogs(projectId, since = 0) {
  const buf = _getBuffer(projectId);
  if (since === 0) return buf.slice();
  return buf.filter(e => e.seq > since);
}

function getAllLogs(since = 0) {
  const all = [];
  for (const buf of logBuffers.values()) {
    const entries = since === 0 ? buf : buf.filter(e => e.seq > since);
    all.push(...entries);
  }
  all.sort((a, b) => a.seq - b.seq);
  return all;
}

function clearLogs(projectId) {
  if (projectId) {
    logBuffers.set(projectId, []);
  } else {
    logBuffers.clear();
  }
}

function getCurrentSeq() {
  return _seq;
}

module.exports = { push, pushSystem, getLogs, getAllLogs, clearLogs, getCurrentSeq };
