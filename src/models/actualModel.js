/**
 * Actual Model
 *
 * Data access layer for the actuals table.
 * Handles CRUD for daily actual recordings with upsert support.
 * @module models/actualModel
 */

'use strict';

const { getDb } = require('./db');

/**
 * Finds all actuals for a given task, ordered by date descending.
 * @param {number} taskId - Task ID
 * @param {Database} [db] - Optional database instance
 * @returns {Array<Object>} List of actual entries
 */
function findByTaskId(taskId, db) {
  const _db = db || getDb();
  return _db.prepare(`
    SELECT * FROM actuals
    WHERE task_id = ?
    ORDER BY work_date DESC
  `).all(taskId);
}

/**
 * Finds an actual by ID.
 * @param {number} id - Actual entry ID
 * @param {Database} [db] - Optional database instance
 * @returns {Object|undefined} The actual entry or undefined
 */
function findById(id, db) {
  const _db = db || getDb();
  return _db.prepare('SELECT * FROM actuals WHERE id = ?').get(id);
}

/**
 * Finds an actual entry for a specific task and date.
 * @param {number} taskId - Task ID
 * @param {string} workDate - ISO date string (YYYY-MM-DD)
 * @param {Database} [db] - Optional database instance
 * @returns {Object|undefined} The actual entry or undefined
 */
function findByTaskAndDate(taskId, workDate, db) {
  const _db = db || getDb();
  return _db.prepare(`
    SELECT * FROM actuals
    WHERE task_id = ? AND work_date = ?
  `).get(taskId, workDate);
}

/**
 * Gets cumulative actual hours for a task.
 * @param {number} taskId - Task ID
 * @param {Database} [db] - Optional database instance
 * @returns {number} Sum of actual hours
 */
function getCumulativeHours(taskId, db) {
  const _db = db || getDb();
  const result = _db.prepare(`
    SELECT COALESCE(SUM(actual_hours), 0) as total
    FROM actuals
    WHERE task_id = ?
  `).get(taskId);
  return result.total;
}

/**
 * Creates or updates an actual entry (upsert by task_id + work_date).
 * @param {Object} data - Actual data
 * @param {Database} [db] - Optional database instance
 * @returns {{ entry: Object, isUpsert: boolean }} The created/updated entry and whether it was an upsert
 */
function upsert(data, db) {
  const _db = db || getDb();

  const existing = findByTaskAndDate(data.task_id, data.work_date, _db);

  if (existing) {
    _db.prepare(`
      UPDATE actuals SET
        actual_hours = @actual_hours,
        notes = @notes,
        updated_at = datetime('now')
      WHERE id = @id
    `).run({
      id: existing.id,
      actual_hours: data.actual_hours,
      notes: data.notes || ''
    });
    return { entry: findById(existing.id, _db), isUpsert: true };
  } else {
    const info = _db.prepare(`
      INSERT INTO actuals (task_id, work_date, actual_hours, notes)
      VALUES (@task_id, @work_date, @actual_hours, @notes)
    `).run({
      task_id: data.task_id,
      work_date: data.work_date,
      actual_hours: data.actual_hours,
      notes: data.notes || ''
    });
    return { entry: findById(info.lastInsertRowid, _db), isUpsert: false };
  }
}

/**
 * Updates an existing actual entry.
 * @param {number} id - Actual ID
 * @param {Object} updates - Fields to update
 * @param {Database} [db] - Optional database instance
 * @returns {Object|undefined} The updated entry
 */
function update(id, updates, db) {
  const _db = db || getDb();
  const fields = [];
  const values = { id };

  if (updates.actual_hours !== undefined) {
    fields.push('actual_hours = @actual_hours');
    values.actual_hours = updates.actual_hours;
  }
  if (updates.notes !== undefined) {
    fields.push('notes = @notes');
    values.notes = updates.notes;
  }

  if (fields.length === 0) return findById(id, _db);

  fields.push("updated_at = datetime('now')");

  _db.prepare(`UPDATE actuals SET ${fields.join(', ')} WHERE id = @id`).run(values);
  return findById(id, _db);
}

/**
 * Deletes an actual entry.
 * @param {number} id - Actual ID
 * @param {Database} [db] - Optional database instance
 * @returns {boolean} Whether a row was deleted
 */
function remove(id, db) {
  const _db = db || getDb();
  const info = _db.prepare('DELETE FROM actuals WHERE id = ?').run(id);
  return info.changes > 0;
}

module.exports = {
  findByTaskId,
  findById,
  findByTaskAndDate,
  getCumulativeHours,
  upsert,
  update,
  remove
};
