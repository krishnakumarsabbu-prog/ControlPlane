'use strict';

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'lapi.db');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    path        TEXT NOT NULL,
    startCommand TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'idle',
    port        INTEGER,
    lastRunAt   TEXT,
    autoRestart INTEGER NOT NULL DEFAULT 0,
    maxRetries  INTEGER NOT NULL DEFAULT 3,
    createdAt   TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS logs (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    projectId TEXT NOT NULL,
    message   TEXT NOT NULL,
    type      TEXT NOT NULL DEFAULT 'INFO',
    timestamp TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS profiles (
    id        TEXT PRIMARY KEY,
    name      TEXT NOT NULL,
    color     TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS profile_projects (
    profileId TEXT NOT NULL,
    projectId TEXT NOT NULL,
    PRIMARY KEY (profileId, projectId)
  );
`);

module.exports = db;
