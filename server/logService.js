'use strict';

const { v4: uuidv4 } = require('uuid');
const logRepo = require('./logRepository');
const db = require('./db');

const LOG_LIMIT = 500;

// In-memory seq counter for incremental polling (resets on server restart)
let _seq = 0;

// In-memory buffer used for incremental since-based polling
// Map<projectId, LogEntry[]>
const _buffers = new Map();

function _getBuffer(projectId) {
  if (!_buffers.has(projectId)) _buffers.set(projectId, []);
  return _buffers.get(projectId);
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
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  const now = new Date();

  for (const line of lines) {
    const level = _classifyLevel(line, stream);
    const entry = {
      id: uuidv4(),
      seq: ++_seq,
      timestamp: now.toTimeString().slice(0, 8),
      level,
      project: projectName,
      projectId,
      message: line,
    };

    const buf = _getBuffer(projectId);
    buf.push(entry);
    if (buf.length > LOG_LIMIT) buf.splice(0, buf.length - LOG_LIMIT);

    try {
      logRepo.addLog(projectId, line, level.toUpperCase());
    } catch (_) {
      // non-fatal — don't crash process on log write failure
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
  for (const buf of _buffers.values()) {
    const entries = since === 0 ? buf : buf.filter(e => e.seq > since);
    all.push(...entries);
  }
  all.sort((a, b) => a.seq - b.seq);
  return all;
}

function clearLogs(projectId) {
  try {
    logRepo.clearLogs(projectId);
  } catch (_) {}

  if (projectId) {
    _buffers.set(projectId, []);
  } else {
    _buffers.clear();
  }
}

function getCurrentSeq() {
  return _seq;
}

module.exports = { push, pushSystem, getLogs, getAllLogs, clearLogs, getCurrentSeq };
