/**
 * Database Module
 *
 * Manages SQLite connection, schema initialization, and WAL mode.
 * Supports dependency injection for testing (in-memory DB).
 * @module models/db
 */

'use strict';

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const TASKS_SCHEMA = `
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_id INTEGER DEFAULT NULL,
    level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 3),
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    planned_start_date TEXT DEFAULT NULL,
    planned_end_date TEXT DEFAULT NULL,
    planned_effort_hours REAL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'not_started'
      CHECK (status IN ('not_started', 'in_progress', 'completed')),
    progress_percent REAL DEFAULT 0
      CHECK (progress_percent BETWEEN 0 AND 100),
    progress_mode TEXT NOT NULL DEFAULT 'auto'
      CHECK (progress_mode IN ('auto', 'manual')),
    sort_order INTEGER DEFAULT 0,
    is_deleted INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (parent_id) REFERENCES tasks(id) ON DELETE CASCADE
  );
`;

const ACTUALS_SCHEMA = `
  CREATE TABLE IF NOT EXISTS actuals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    work_date TEXT NOT NULL,
    actual_hours REAL NOT NULL DEFAULT 0
      CHECK (actual_hours >= 0),
    notes TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    UNIQUE(task_id, work_date)
  );
`;

const INDEXES = `
  CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_level ON tasks(level);
  CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
  CREATE INDEX IF NOT EXISTS idx_tasks_deleted ON tasks(is_deleted);
  CREATE INDEX IF NOT EXISTS idx_actuals_task ON actuals(task_id);
  CREATE INDEX IF NOT EXISTS idx_actuals_date ON actuals(work_date);
  CREATE INDEX IF NOT EXISTS idx_tasks_parent_deleted_sort ON tasks(parent_id, is_deleted, sort_order);
  CREATE INDEX IF NOT EXISTS idx_tasks_level_deleted ON tasks(level, is_deleted);
  CREATE INDEX IF NOT EXISTS idx_actuals_task_date ON actuals(task_id, work_date);
`;

const SCHEMA_VERSION = `
  CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER PRIMARY KEY,
    applied_at TEXT DEFAULT (datetime('now'))
  );
  INSERT OR IGNORE INTO schema_version (version) VALUES (1);
`;

/** @type {Database|null} */
let _db = null;

/**
 * Initializes the schema on the given database instance.
 * @param {Database} db - The database to initialize
 */
function initializeSchema(db) {
  db.exec(TASKS_SCHEMA);
  db.exec(ACTUALS_SCHEMA);
  db.exec(INDEXES);
  db.exec(SCHEMA_VERSION);
}

/**
 * Gets or creates the singleton database connection.
 * @param {string} [dbPath] - Optional path to the database file
 * @returns {Database} The database instance
 */
function getDb(dbPath) {
  if (_db && _db.open) {
    return _db;
  }

  const resolvedPath = dbPath || path.join(__dirname, '..', '..', 'data', 'budget-tracker.db');

  // Ensure directory exists
  const dir = path.dirname(resolvedPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  _db = new Database(resolvedPath);

  // Performance-critical PRAGMAs
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  _db.pragma('synchronous = NORMAL');    // Safe with WAL, faster than FULL
  _db.pragma('cache_size = -8000');       // 8MB cache (negative = KB)
  _db.pragma('temp_store = MEMORY');      // Keep temp tables in memory
  _db.pragma('mmap_size = 268435456');    // 256MB memory-mapped I/O

  initializeSchema(_db);

  return _db;
}

/**
 * Sets the database instance (for dependency injection in tests).
 * @param {Database} db - The database instance to use
 */
function setDb(db) {
  _db = db;
}

/**
 * Closes the database connection.
 */
function closeDb() {
  if (_db && _db.open) {
    _db.close();
    _db = null;
  }
}

module.exports = {
  getDb,
  setDb,
  closeDb,
  initializeSchema
};
