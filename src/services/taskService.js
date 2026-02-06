/**
 * Task Service
 *
 * Business logic for task CRUD operations, hierarchy management,
 * and integration with progress calculation.
 * @module services/taskService
 */

'use strict';

const taskModel = require('../models/taskModel');
const progressService = require('./progressService');

/**
 * Custom error class for application errors.
 */
class AppError extends Error {
  constructor(message, code, statusCode = 400, details = []) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Sanitizes a string to prevent XSS.
 * @param {string} str - Input string
 * @returns {string} Sanitized string
 */
function sanitize(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Validates task creation data.
 * @param {Object} data - Task data
 * @param {Database} [db] - Optional database instance
 * @returns {{ valid: boolean, errors: Array, data: Object }}
 */
function validateTaskData(data, db) {
  const errors = [];
  const cleaned = {};

  // Name validation
  const name = (data.name || '').trim();
  if (!name) {
    errors.push({ field: 'name', message: 'Task name is required' });
  } else if (name.length > 200) {
    errors.push({ field: 'name', message: 'Task name must be 200 characters or less' });
  }
  cleaned.name = sanitize(name);

  // Description
  cleaned.description = sanitize((data.description || '').substring(0, 2000));

  // Dates
  cleaned.planned_start_date = data.planned_start_date || null;
  cleaned.planned_end_date = data.planned_end_date || null;

  if (cleaned.planned_start_date && !/^\d{4}-\d{2}-\d{2}$/.test(cleaned.planned_start_date)) {
    errors.push({ field: 'planned_start_date', message: 'Invalid date format. Use YYYY-MM-DD' });
  }
  if (cleaned.planned_end_date && !/^\d{4}-\d{2}-\d{2}$/.test(cleaned.planned_end_date)) {
    errors.push({ field: 'planned_end_date', message: 'Invalid date format. Use YYYY-MM-DD' });
  }
  if (cleaned.planned_start_date && cleaned.planned_end_date &&
      cleaned.planned_end_date < cleaned.planned_start_date) {
    errors.push({ field: 'planned_end_date', message: 'End date must be on or after start date' });
  }

  // Effort
  const effort = parseFloat(data.planned_effort_hours);
  if (data.planned_effort_hours !== undefined && data.planned_effort_hours !== null) {
    if (isNaN(effort) || effort < 0) {
      errors.push({ field: 'planned_effort_hours', message: 'Planned effort must be 0 or greater' });
    } else {
      cleaned.planned_effort_hours = effort;
    }
  } else {
    cleaned.planned_effort_hours = 0;
  }

  // Parent validation
  cleaned.parent_id = data.parent_id || null;
  if (cleaned.parent_id !== null) {
    const parent = taskModel.findById(cleaned.parent_id, db);
    if (!parent) {
      errors.push({ field: 'parent_id', message: 'Parent task not found' });
    } else if (parent.level >= 3) {
      errors.push({ field: 'parent_id', message: 'Maximum hierarchy depth is 3 levels' });
    }
  }

  return { valid: errors.length === 0, errors, data: cleaned };
}

/**
 * Creates a new task.
 * @param {Object} data - Task creation data
 * @param {Database} [db] - Optional database instance
 * @returns {Object} Created task with computed fields
 */
function createTask(data, db) {
  const validation = validateTaskData(data, db);
  if (!validation.valid) {
    throw new AppError('Validation failed', 'VALIDATION_ERROR', 400, validation.errors);
  }

  const cleaned = validation.data;

  // Determine level
  let level = 1;
  if (cleaned.parent_id) {
    const parent = taskModel.findById(cleaned.parent_id, db);
    if (!parent) {
      throw new AppError('Parent task not found', 'NOT_FOUND', 404);
    }
    if (parent.level >= 3) {
      throw new AppError('Maximum hierarchy depth is 3 levels', 'HIERARCHY_ERROR', 400);
    }
    level = parent.level + 1;
  }

  // Auto-assign sort order
  const maxSort = taskModel.getMaxSortOrder(cleaned.parent_id, db);
  cleaned.sort_order = maxSort + 1;
  cleaned.level = level;

  const created = taskModel.create(cleaned, db);
  return progressService.enrichTask(created, db);
}

/**
 * Gets a task by ID with computed fields.
 * @param {number} id - Task ID
 * @param {Database} [db] - Optional database instance
 * @returns {Object} Task with computed fields
 */
function getTask(id, db) {
  const task = taskModel.findById(id, db);
  if (!task) {
    throw new AppError('Task not found', 'NOT_FOUND', 404);
  }
  return progressService.enrichTask(task, db);
}

/**
 * Gets all top-level tasks with computed fields.
 * @param {Database} [db] - Optional database instance
 * @returns {Array<Object>} List of enriched Level 1 tasks
 */
function getTopLevelTasks(db) {
  const tasks = taskModel.findTopLevel(db);
  return tasks.map(t => progressService.enrichTask(t, db));
}

/**
 * Gets children of a task with computed fields.
 * @param {number} parentId - Parent task ID
 * @param {Database} [db] - Optional database instance
 * @returns {{ children: Array<Object>, parent: Object }}
 */
function getChildren(parentId, db) {
  const parent = taskModel.findById(parentId, db);
  if (!parent) {
    throw new AppError('Task not found', 'NOT_FOUND', 404);
  }

  const children = taskModel.findChildren(parentId, db);
  return {
    children: children.map(c => progressService.enrichTask(c, db)),
    parent: progressService.enrichTask(parent, db)
  };
}

/**
 * Updates a task's properties.
 * @param {number} id - Task ID
 * @param {Object} updates - Fields to update
 * @param {Database} [db] - Optional database instance
 * @returns {Object} Updated task with computed fields
 */
function updateTask(id, updates, db) {
  const task = taskModel.findById(id, db);
  if (!task) {
    throw new AppError('Task not found', 'NOT_FOUND', 404);
  }

  const errors = [];

  // Validate name if provided
  if (updates.name !== undefined) {
    const name = (updates.name || '').trim();
    if (!name) {
      errors.push({ field: 'name', message: 'Task name is required' });
    } else if (name.length > 200) {
      errors.push({ field: 'name', message: 'Task name must be 200 characters or less' });
    }
    updates.name = sanitize(name);
  }

  // Validate description if provided
  if (updates.description !== undefined) {
    updates.description = sanitize((updates.description || '').substring(0, 2000));
  }

  // Validate dates
  const startDate = updates.planned_start_date !== undefined ? updates.planned_start_date : task.planned_start_date;
  const endDate = updates.planned_end_date !== undefined ? updates.planned_end_date : task.planned_end_date;

  if (startDate && endDate && endDate < startDate) {
    errors.push({ field: 'planned_end_date', message: 'End date must be on or after start date' });
  }

  // Validate effort
  if (updates.planned_effort_hours !== undefined) {
    const effort = parseFloat(updates.planned_effort_hours);
    if (isNaN(effort) || effort < 0) {
      errors.push({ field: 'planned_effort_hours', message: 'Planned effort must be 0 or greater' });
    } else {
      updates.planned_effort_hours = effort;
    }
  }

  // Validate status
  if (updates.status !== undefined) {
    const validStatuses = ['not_started', 'in_progress', 'completed'];
    if (!validStatuses.includes(updates.status)) {
      errors.push({ field: 'status', message: 'Invalid status value' });
    }
  }

  // Validate progress mode
  if (updates.progress_mode !== undefined) {
    const validModes = ['auto', 'manual'];
    if (!validModes.includes(updates.progress_mode)) {
      errors.push({ field: 'progress_mode', message: 'Invalid progress mode' });
    }
  }

  // Validate progress_percent
  if (updates.progress_percent !== undefined) {
    const pct = parseFloat(updates.progress_percent);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      errors.push({ field: 'progress_percent', message: 'Progress must be between 0 and 100' });
    } else {
      updates.progress_percent = pct;
    }
  }

  if (errors.length > 0) {
    throw new AppError('Validation failed', 'VALIDATION_ERROR', 400, errors);
  }

  // Handle status change to completed
  if (updates.status === 'completed') {
    updates.progress_percent = 100;
  }

  // Handle auto mode switch - recalculate progress
  if (updates.progress_mode === 'auto' && task.progress_mode === 'manual') {
    const cumulative = require('../models/actualModel').getCumulativeHours(id, db);
    const effort = updates.planned_effort_hours !== undefined
      ? updates.planned_effort_hours
      : task.planned_effort_hours;
    if (effort > 0) {
      updates.progress_percent = Math.round(Math.min(100, (cumulative / effort) * 100) * 10) / 10;
    } else {
      updates.progress_percent = task.status === 'completed' ? 100 : 0;
    }
  }

  const updated = taskModel.update(id, updates, db);

  // Recalculate ancestors if effort or status changed
  if (updates.planned_effort_hours !== undefined || updates.status !== undefined ||
      updates.progress_percent !== undefined || updates.progress_mode !== undefined) {
    if (task.parent_id) {
      progressService.recalculateAncestors(task.parent_id, db);
    }
  }

  return progressService.enrichTask(updated, db);
}

/**
 * Soft-deletes a task and all descendants.
 * @param {number} id - Task ID
 * @param {Database} [db] - Optional database instance
 * @returns {{ deleted_task_id: number, deleted_descendants_count: number, message: string }}
 */
function deleteTask(id, db) {
  const task = taskModel.findById(id, db);
  if (!task) {
    throw new AppError('Task not found', 'NOT_FOUND', 404);
  }

  const count = taskModel.softDelete(id, db);

  // Recalculate parent progress
  if (task.parent_id) {
    progressService.recalculateAncestors(task.parent_id, db);
  }

  return {
    deleted_task_id: id,
    deleted_descendants_count: count - 1,
    message: `Task and ${count - 1} sub-tasks deleted`
  };
}

/**
 * Updates the sort order of a task.
 * @param {number} id - Task ID
 * @param {number} newOrder - New sort order
 * @param {Database} [db] - Optional database instance
 * @returns {{ id: number, sort_order: number }}
 */
function reorderTask(id, newOrder, db) {
  const task = taskModel.findById(id, db);
  if (!task) {
    throw new AppError('Task not found', 'NOT_FOUND', 404);
  }

  taskModel.update(id, { sort_order: newOrder }, db);
  return { id, sort_order: newOrder };
}

module.exports = {
  createTask,
  getTask,
  getTopLevelTasks,
  getChildren,
  updateTask,
  deleteTask,
  reorderTask,
  AppError,
  sanitize
};
