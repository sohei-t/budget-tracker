/**
 * Actual Service
 *
 * Business logic for daily actual recording, cumulative tracking,
 * and integration with progress recalculation.
 * @module services/actualService
 */

'use strict';

const actualModel = require('../models/actualModel');
const taskModel = require('../models/taskModel');
const progressService = require('./progressService');
const { AppError } = require('./taskService');

/**
 * Validates actual recording data.
 * @param {Object} data - Actual data
 * @returns {{ valid: boolean, errors: Array, data: Object }}
 */
function validateActualData(data) {
  const errors = [];
  const cleaned = {};

  // Work date validation
  if (!data.work_date) {
    // Default to today
    const today = new Date();
    cleaned.work_date = today.toISOString().slice(0, 10);
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(data.work_date)) {
    errors.push({ field: 'work_date', message: 'Date must be in YYYY-MM-DD format' });
  } else {
    cleaned.work_date = data.work_date;
  }

  // Actual hours validation
  const hours = parseFloat(data.actual_hours);
  if (data.actual_hours === undefined || data.actual_hours === null || isNaN(hours)) {
    errors.push({ field: 'actual_hours', message: 'Actual hours is required' });
  } else if (hours <= 0) {
    errors.push({ field: 'actual_hours', message: 'Actual hours must be greater than 0' });
  } else if (hours > 24) {
    errors.push({ field: 'actual_hours', message: 'Actual hours cannot exceed 24 per day' });
  } else {
    cleaned.actual_hours = hours;
  }

  // Notes validation
  const notes = data.notes || '';
  if (notes.length > 1000) {
    errors.push({ field: 'notes', message: 'Notes must be 1000 characters or less' });
  }
  // Sanitize notes
  cleaned.notes = notes
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return { valid: errors.length === 0, errors, data: cleaned };
}

/**
 * Records a daily actual entry for a task (with upsert support).
 * @param {number} taskId - Task ID
 * @param {Object} data - Actual data (work_date, actual_hours, notes)
 * @param {Database} [db] - Optional database instance
 * @returns {{ entry: Object, isUpsert: boolean, newCumulativeHours: number, newProgressPercent: number }}
 */
function recordActual(taskId, data, db) {
  const task = taskModel.findById(taskId, db);
  if (!task) {
    throw new AppError('Task not found', 'NOT_FOUND', 404);
  }

  const validation = validateActualData(data);
  if (!validation.valid) {
    throw new AppError('Validation failed', 'VALIDATION_ERROR', 400, validation.errors);
  }

  const cleaned = validation.data;
  cleaned.task_id = taskId;

  const { entry, isUpsert } = actualModel.upsert(cleaned, db);

  // Auto-transition status to in_progress
  if (task.status === 'not_started') {
    taskModel.update(taskId, { status: 'in_progress' }, db);
  }

  // Recalculate progress for task and ancestors
  const progress = progressService.calculateTaskProgress(taskId, db);
  taskModel.update(taskId, { progress_percent: progress }, db);

  if (task.parent_id) {
    progressService.recalculateAncestors(task.parent_id, db);
  }

  const cumulative = actualModel.getCumulativeHours(taskId, db);

  return {
    entry,
    isUpsert,
    newCumulativeHours: cumulative,
    newProgressPercent: progress
  };
}

/**
 * Gets all actuals for a task with cumulative info.
 * @param {number} taskId - Task ID
 * @param {Database} [db] - Optional database instance
 * @returns {{ actuals: Array<Object>, cumulativeHours: number, task: Object }}
 */
function getActualsForTask(taskId, db) {
  const task = taskModel.findById(taskId, db);
  if (!task) {
    throw new AppError('Task not found', 'NOT_FOUND', 404);
  }

  const actuals = actualModel.findByTaskId(taskId, db);
  const cumulativeHours = actualModel.getCumulativeHours(taskId, db);

  return {
    actuals,
    cumulativeHours,
    task
  };
}

/**
 * Updates an existing actual entry.
 * @param {number} actualId - Actual entry ID
 * @param {Object} updates - Fields to update
 * @param {Database} [db] - Optional database instance
 * @returns {Object} Updated actual entry
 */
function updateActual(actualId, updates, db) {
  const actual = actualModel.findById(actualId, db);
  if (!actual) {
    throw new AppError('Actual entry not found', 'NOT_FOUND', 404);
  }

  // Validate hours if provided
  if (updates.actual_hours !== undefined) {
    const hours = parseFloat(updates.actual_hours);
    if (isNaN(hours) || hours <= 0 || hours > 24) {
      throw new AppError('Validation failed', 'VALIDATION_ERROR', 400, [
        { field: 'actual_hours', message: 'Actual hours must be between 0.1 and 24' }
      ]);
    }
    updates.actual_hours = hours;
  }

  // Validate notes if provided
  if (updates.notes !== undefined && updates.notes.length > 1000) {
    throw new AppError('Validation failed', 'VALIDATION_ERROR', 400, [
      { field: 'notes', message: 'Notes must be 1000 characters or less' }
    ]);
  }

  const updated = actualModel.update(actualId, updates, db);

  // Recalculate progress
  const task = taskModel.findById(actual.task_id, db);
  if (task) {
    const progress = progressService.calculateTaskProgress(actual.task_id, db);
    taskModel.update(actual.task_id, { progress_percent: progress }, db);
    if (task.parent_id) {
      progressService.recalculateAncestors(task.parent_id, db);
    }
  }

  return updated;
}

/**
 * Deletes an actual entry and recalculates progress.
 * @param {number} actualId - Actual entry ID
 * @param {Database} [db] - Optional database instance
 * @returns {{ deleted_actual_id: number, message: string }}
 */
function deleteActual(actualId, db) {
  const actual = actualModel.findById(actualId, db);
  if (!actual) {
    throw new AppError('Actual entry not found', 'NOT_FOUND', 404);
  }

  const taskId = actual.task_id;
  actualModel.remove(actualId, db);

  // Recalculate progress
  const task = taskModel.findById(taskId, db);
  if (task) {
    const progress = progressService.calculateTaskProgress(taskId, db);
    taskModel.update(taskId, { progress_percent: progress }, db);
    if (task.parent_id) {
      progressService.recalculateAncestors(task.parent_id, db);
    }
  }

  return {
    deleted_actual_id: actualId,
    message: 'Actual entry deleted'
  };
}

/**
 * Gets cumulative hours for a task.
 * @param {number} taskId - Task ID
 * @param {Database} [db] - Optional database instance
 * @returns {number} Cumulative hours
 */
function getCumulativeHours(taskId, db) {
  return actualModel.getCumulativeHours(taskId, db);
}

module.exports = {
  recordActual,
  getActualsForTask,
  updateActual,
  deleteActual,
  getCumulativeHours,
  validateActualData
};
