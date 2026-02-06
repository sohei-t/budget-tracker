/**
 * Task Model
 *
 * Data access layer for the tasks table.
 * All queries use parameterized statements to prevent SQL injection.
 * @module models/taskModel
 */

'use strict';

const { getDb } = require('./db');

/**
 * Finds all Level 1 (top-level) tasks that are not deleted.
 * @param {Database} [db] - Optional database instance
 * @returns {Array<Object>} List of top-level tasks
 */
function findTopLevel(db) {
  const _db = db || getDb();
  return _db.prepare(`
    SELECT * FROM tasks
    WHERE parent_id IS NULL AND is_deleted = 0
    ORDER BY sort_order ASC, id ASC
  `).all();
}

/**
 * Finds a task by ID (non-deleted).
 * @param {number} id - Task ID
 * @param {Database} [db] - Optional database instance
 * @returns {Object|undefined} The task or undefined
 */
function findById(id, db) {
  const _db = db || getDb();
  return _db.prepare(`
    SELECT * FROM tasks
    WHERE id = ? AND is_deleted = 0
  `).get(id);
}

/**
 * Finds a task by ID including deleted ones (for internal use).
 * @param {number} id - Task ID
 * @param {Database} [db] - Optional database instance
 * @returns {Object|undefined} The task or undefined
 */
function findByIdRaw(id, db) {
  const _db = db || getDb();
  return _db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
}

/**
 * Finds direct children of a task (non-deleted).
 * @param {number} parentId - Parent task ID
 * @param {Database} [db] - Optional database instance
 * @returns {Array<Object>} List of child tasks
 */
function findChildren(parentId, db) {
  const _db = db || getDb();
  return _db.prepare(`
    SELECT * FROM tasks
    WHERE parent_id = ? AND is_deleted = 0
    ORDER BY sort_order ASC, id ASC
  `).all(parentId);
}

/**
 * Counts non-deleted direct children of a task.
 * @param {number} parentId - Parent task ID
 * @param {Database} [db] - Optional database instance
 * @returns {number} Count of children
 */
function countChildren(parentId, db) {
  const _db = db || getDb();
  const result = _db.prepare(`
    SELECT COUNT(*) as count FROM tasks
    WHERE parent_id = ? AND is_deleted = 0
  `).get(parentId);
  return result.count;
}

/**
 * Gets the max sort_order among siblings.
 * @param {number|null} parentId - Parent task ID or null for top-level
 * @param {Database} [db] - Optional database instance
 * @returns {number} Maximum sort order
 */
function getMaxSortOrder(parentId, db) {
  const _db = db || getDb();
  const query = parentId === null
    ? 'SELECT MAX(sort_order) as max_order FROM tasks WHERE parent_id IS NULL AND is_deleted = 0'
    : 'SELECT MAX(sort_order) as max_order FROM tasks WHERE parent_id = ? AND is_deleted = 0';
  const result = parentId === null
    ? _db.prepare(query).get()
    : _db.prepare(query).get(parentId);
  return result.max_order || 0;
}

/**
 * Creates a new task.
 * @param {Object} data - Task data
 * @param {Database} [db] - Optional database instance
 * @returns {Object} The created task
 */
function create(data, db) {
  const _db = db || getDb();
  const stmt = _db.prepare(`
    INSERT INTO tasks (parent_id, level, name, description, planned_start_date, planned_end_date,
      planned_effort_hours, status, progress_percent, progress_mode, sort_order)
    VALUES (@parent_id, @level, @name, @description, @planned_start_date, @planned_end_date,
      @planned_effort_hours, @status, @progress_percent, @progress_mode, @sort_order)
  `);

  const info = stmt.run({
    parent_id: data.parent_id ?? null,
    level: data.level,
    name: data.name,
    description: data.description || '',
    planned_start_date: data.planned_start_date || null,
    planned_end_date: data.planned_end_date || null,
    planned_effort_hours: data.planned_effort_hours || 0,
    status: 'not_started',
    progress_percent: 0,
    progress_mode: 'auto',
    sort_order: data.sort_order || 0
  });

  return findByIdRaw(info.lastInsertRowid, _db);
}

/**
 * Updates a task's fields.
 * @param {number} id - Task ID
 * @param {Object} updates - Fields to update
 * @param {Database} [db] - Optional database instance
 * @returns {Object|undefined} The updated task
 */
function update(id, updates, db) {
  const _db = db || getDb();
  const fields = [];
  const values = {};

  const allowedFields = [
    'name', 'description', 'planned_start_date', 'planned_end_date',
    'planned_effort_hours', 'status', 'progress_percent', 'progress_mode', 'sort_order'
  ];

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      fields.push(`${field} = @${field}`);
      values[field] = updates[field];
    }
  }

  if (fields.length === 0) {
    return findById(id, _db);
  }

  fields.push("updated_at = datetime('now')");
  values.id = id;

  _db.prepare(`
    UPDATE tasks SET ${fields.join(', ')}
    WHERE id = @id AND is_deleted = 0
  `).run(values);

  return findById(id, _db);
}

/**
 * Soft-deletes a task and all its descendants.
 * @param {number} id - Task ID
 * @param {Database} [db] - Optional database instance
 * @returns {number} Number of deleted tasks (including descendants)
 */
function softDelete(id, db) {
  const _db = db || getDb();

  // Recursively find all descendant IDs
  const descendantIds = [];
  function findDescendants(parentId) {
    const children = _db.prepare(
      'SELECT id FROM tasks WHERE parent_id = ? AND is_deleted = 0'
    ).all(parentId);
    for (const child of children) {
      descendantIds.push(child.id);
      findDescendants(child.id);
    }
  }
  findDescendants(id);

  const allIds = [id, ...descendantIds];

  const stmt = _db.prepare("UPDATE tasks SET is_deleted = 1, updated_at = datetime('now') WHERE id = ?");
  const deleteAll = _db.transaction(() => {
    for (const tid of allIds) {
      stmt.run(tid);
    }
  });
  deleteAll();

  return allIds.length;
}

/**
 * Finds all non-deleted tasks (for dashboard calculations).
 * @param {Database} [db] - Optional database instance
 * @returns {Array<Object>} All non-deleted tasks
 */
function findAll(db) {
  const _db = db || getDb();
  return _db.prepare('SELECT * FROM tasks WHERE is_deleted = 0 ORDER BY level ASC, sort_order ASC').all();
}

module.exports = {
  findTopLevel,
  findById,
  findByIdRaw,
  findChildren,
  countChildren,
  getMaxSortOrder,
  create,
  update,
  softDelete,
  findAll
};
