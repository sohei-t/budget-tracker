/**
 * Test Database Helper
 *
 * Provides an in-memory SQLite database for isolated test execution.
 * Each call to createTestDb() returns a fresh database with the full schema.
 */

'use strict';

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

/**
 * SQL schema for creating the tasks table
 */
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

/**
 * SQL schema for creating the actuals table
 */
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

/**
 * SQL for creating indexes
 */
const INDEXES = `
  CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_level ON tasks(level);
  CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
  CREATE INDEX IF NOT EXISTS idx_tasks_deleted ON tasks(is_deleted);
  CREATE INDEX IF NOT EXISTS idx_actuals_task ON actuals(task_id);
  CREATE INDEX IF NOT EXISTS idx_actuals_date ON actuals(work_date);
`;

/**
 * SQL for schema version table
 */
const SCHEMA_VERSION = `
  CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER PRIMARY KEY,
    applied_at TEXT DEFAULT (datetime('now'))
  );
  INSERT OR IGNORE INTO schema_version (version) VALUES (1);
`;

/**
 * Creates a fresh in-memory SQLite database with the full schema.
 * @returns {Database} A better-sqlite3 database instance
 */
function createTestDb() {
  const db = new Database(':memory:');

  // Enable WAL mode and foreign keys
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Create schema
  db.exec(TASKS_SCHEMA);
  db.exec(ACTUALS_SCHEMA);
  db.exec(INDEXES);
  db.exec(SCHEMA_VERSION);

  return db;
}

/**
 * Inserts sample test data into the database.
 * Creates a 3-level hierarchy with actuals.
 * @param {Database} db - The database instance
 * @returns {Object} References to inserted IDs
 */
function seedTestData(db) {
  // Level 1: Major Items
  const major1 = db.prepare(`
    INSERT INTO tasks (parent_id, level, name, description, planned_start_date, planned_end_date, planned_effort_hours, status, sort_order)
    VALUES (NULL, 1, 'Design Phase', 'All design work', '2026-02-10', '2026-02-20', 40, 'in_progress', 1)
  `).run();

  const major2 = db.prepare(`
    INSERT INTO tasks (parent_id, level, name, description, planned_start_date, planned_end_date, planned_effort_hours, status, sort_order)
    VALUES (NULL, 1, 'Development Phase', 'All development work', '2026-02-15', '2026-02-28', 120, 'not_started', 2)
  `).run();

  // Level 2: Middle Items (under Design Phase)
  const middle1 = db.prepare(`
    INSERT INTO tasks (parent_id, level, name, description, planned_start_date, planned_end_date, planned_effort_hours, status, sort_order)
    VALUES (?, 2, 'Wireframes', 'Create wireframes', '2026-02-10', '2026-02-12', 15, 'completed', 1)
  `).run(major1.lastInsertRowid);

  const middle2 = db.prepare(`
    INSERT INTO tasks (parent_id, level, name, description, planned_start_date, planned_end_date, planned_effort_hours, status, sort_order)
    VALUES (?, 2, 'UI Design', 'Design UI mockups', '2026-02-12', '2026-02-17', 25, 'in_progress', 2)
  `).run(major1.lastInsertRowid);

  // Level 3: Minor Items (under Wireframes)
  const minor1 = db.prepare(`
    INSERT INTO tasks (parent_id, level, name, description, planned_start_date, planned_end_date, planned_effort_hours, status, sort_order)
    VALUES (?, 3, 'Dashboard Wireframe', 'Wireframe for dashboard page', '2026-02-10', '2026-02-11', 8, 'completed', 1)
  `).run(middle1.lastInsertRowid);

  const minor2 = db.prepare(`
    INSERT INTO tasks (parent_id, level, name, description, planned_start_date, planned_end_date, planned_effort_hours, status, sort_order)
    VALUES (?, 3, 'Task List Wireframe', 'Wireframe for task list page', '2026-02-11', '2026-02-12', 7, 'completed', 2)
  `).run(middle1.lastInsertRowid);

  // Actuals for minor tasks
  db.prepare(`
    INSERT INTO actuals (task_id, work_date, actual_hours, notes)
    VALUES (?, '2026-02-10', 6.5, 'Completed dashboard wireframe draft')
  `).run(minor1.lastInsertRowid);

  db.prepare(`
    INSERT INTO actuals (task_id, work_date, actual_hours, notes)
    VALUES (?, '2026-02-11', 2.0, 'Refined dashboard wireframe')
  `).run(minor1.lastInsertRowid);

  db.prepare(`
    INSERT INTO actuals (task_id, work_date, actual_hours, notes)
    VALUES (?, '2026-02-11', 5.0, 'Created task list wireframe')
  `).run(minor2.lastInsertRowid);

  db.prepare(`
    INSERT INTO actuals (task_id, work_date, actual_hours, notes)
    VALUES (?, '2026-02-12', 2.5, 'Finalized task list wireframe')
  `).run(minor2.lastInsertRowid);

  return {
    major1Id: major1.lastInsertRowid,
    major2Id: major2.lastInsertRowid,
    middle1Id: middle1.lastInsertRowid,
    middle2Id: middle2.lastInsertRowid,
    minor1Id: minor1.lastInsertRowid,
    minor2Id: minor2.lastInsertRowid
  };
}

/**
 * Closes and cleans up a test database.
 * @param {Database} db - The database instance to close
 */
function closeTestDb(db) {
  if (db && db.open) {
    db.close();
  }
}

module.exports = {
  createTestDb,
  seedTestData,
  closeTestDb,
  TASKS_SCHEMA,
  ACTUALS_SCHEMA,
  INDEXES
};
