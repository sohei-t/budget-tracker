/**
 * Progress Service
 *
 * Core business logic for progress calculation, delay detection,
 * and cascading recalculation through the task hierarchy.
 * @module services/progressService
 */

'use strict';

const taskModel = require('../models/taskModel');
const actualModel = require('../models/actualModel');

/**
 * Calculates progress for a single task.
 * - Leaf tasks (auto mode): (cumulative_actual / planned_effort) * 100, capped at 100.
 * - Leaf tasks (manual mode): Returns user-set progress_percent.
 * - Parent tasks: Weighted average of children by planned effort.
 * @param {number} taskId - Task ID
 * @param {Database} [db] - Optional database instance
 * @returns {number} Progress percentage (0-100, 1 decimal)
 */
function calculateTaskProgress(taskId, db) {
  const task = taskModel.findById(taskId, db);
  if (!task) return 0;

  const children = taskModel.findChildren(taskId, db);

  if (children.length > 0) {
    // Parent task: aggregate from children
    return calculateParentProgress(children, db);
  }

  // Leaf task
  if (task.progress_mode === 'manual') {
    return task.progress_percent;
  }

  // Auto mode
  const cumulative = actualModel.getCumulativeHours(taskId, db);

  if (task.planned_effort_hours > 0) {
    const raw = (cumulative / task.planned_effort_hours) * 100;
    return Math.round(Math.min(100, raw) * 10) / 10;
  }

  // No planned effort
  return task.status === 'completed' ? 100 : 0;
}

/**
 * Calculates progress for a parent task from its children.
 * Uses weighted average by planned effort. Falls back to equal weight if all zero.
 * @param {Array<Object>} children - Child tasks
 * @param {Database} [db] - Optional database instance
 * @returns {number} Progress percentage
 */
function calculateParentProgress(children, db) {
  if (children.length === 0) return 0;

  // Recursively calculate each child's progress first
  const childProgresses = children.map(child => ({
    progress: calculateTaskProgress(child.id, db),
    effort: child.planned_effort_hours || 0
  }));

  const totalEffort = childProgresses.reduce((sum, c) => sum + c.effort, 0);

  if (totalEffort > 0) {
    const weightedSum = childProgresses.reduce(
      (sum, c) => sum + c.progress * c.effort, 0
    );
    return Math.round((weightedSum / totalEffort) * 10) / 10;
  }

  // Equal weight fallback
  const avg = childProgresses.reduce((sum, c) => sum + c.progress, 0) / childProgresses.length;
  return Math.round(avg * 10) / 10;
}

/**
 * Calculates delay status for a task.
 * @param {Object} task - Task object
 * @param {number} [progressPercent] - Override progress value
 * @returns {{ status: string, delay_days: number, expected_progress: number }}
 */
function calculateDelayStatus(task, progressPercent) {
  const progress = progressPercent !== undefined ? progressPercent : task.progress_percent;

  if (!task.planned_start_date || !task.planned_end_date) {
    return { status: 'unknown', delay_days: 0, expected_progress: 0 };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = new Date(task.planned_start_date + 'T00:00:00');
  const endDate = new Date(task.planned_end_date + 'T00:00:00');

  // Past due date and not complete
  if (today > endDate && progress < 100) {
    const delayDays = Math.floor((today - endDate) / (1000 * 60 * 60 * 24));
    return { status: 'overdue', delay_days: delayDays, expected_progress: 100 };
  }

  // Completed, even if past due
  if (progress >= 100) {
    return { status: 'on_track', delay_days: 0, expected_progress: 0 };
  }

  // Before start date
  if (today < startDate) {
    return { status: 'not_started', delay_days: 0, expected_progress: 0 };
  }

  // In progress: check if at risk
  const totalDuration = (endDate - startDate) / (1000 * 60 * 60 * 24);
  if (totalDuration <= 0) {
    return { status: 'on_track', delay_days: 0, expected_progress: 0 };
  }

  const elapsedDays = (today - startDate) / (1000 * 60 * 60 * 24);
  const elapsedRatio = elapsedDays / totalDuration;
  const expectedProgress = elapsedRatio * 100;

  if (progress < expectedProgress * 0.75) {
    return { status: 'at_risk', delay_days: 0, expected_progress: Math.round(expectedProgress * 10) / 10 };
  }

  return { status: 'on_track', delay_days: 0, expected_progress: Math.round(expectedProgress * 10) / 10 };
}

/**
 * Gets the warning level based on delay status.
 * - 'red': overdue with < 100% progress
 * - 'yellow': at_risk
 * - 'none': on_track or completed
 * @param {Object} task - Task object
 * @param {number} [progress] - Override progress
 * @returns {string} 'red' | 'yellow' | 'none'
 */
function getWarningLevel(task, progress) {
  if (task.status === 'completed' || (progress !== undefined && progress >= 100)) {
    return 'none';
  }

  const delay = calculateDelayStatus(task, progress);

  if (delay.status === 'overdue') return 'red';
  if (delay.status === 'at_risk') return 'yellow';
  return 'none';
}

/**
 * Recalculates progress for a task and all its ancestors.
 * Also updates parent statuses.
 * @param {number} taskId - Starting task ID
 * @param {Database} [db] - Optional database instance
 */
function recalculateAncestors(taskId, db) {
  const task = taskModel.findById(taskId, db);
  if (!task) return;

  // Calculate and save this task's progress
  const progress = calculateTaskProgress(taskId, db);
  taskModel.update(taskId, { progress_percent: progress }, db);

  // Update parent if exists
  if (task.parent_id) {
    // Recalculate parent progress
    const parentProgress = calculateTaskProgress(task.parent_id, db);
    taskModel.update(task.parent_id, { progress_percent: parentProgress }, db);

    // Update parent status based on children
    updateParentStatus(task.parent_id, db);

    // Continue up the chain
    const parent = taskModel.findById(task.parent_id, db);
    if (parent && parent.parent_id) {
      recalculateAncestors(parent.parent_id, db);
    }
  }
}

/**
 * Updates a parent task's status based on its children's statuses.
 * @param {number} parentId - Parent task ID
 * @param {Database} [db] - Optional database instance
 */
function updateParentStatus(parentId, db) {
  const children = taskModel.findChildren(parentId, db);
  if (children.length === 0) return;

  const completedCount = children.filter(c => c.status === 'completed').length;
  const inProgressCount = children.filter(c => c.status === 'in_progress').length;

  let newStatus;
  if (completedCount === children.length) {
    newStatus = 'completed';
  } else if (inProgressCount > 0 || completedCount > 0) {
    newStatus = 'in_progress';
  } else {
    newStatus = 'not_started';
  }

  const updates = { status: newStatus };
  if (newStatus === 'completed') {
    updates.progress_percent = 100;
  }

  taskModel.update(parentId, updates, db);
}

/**
 * Enriches a task object with computed fields.
 * @param {Object} task - Task object
 * @param {Database} [db] - Optional database instance
 * @returns {Object} Task with computed fields added
 */
function enrichTask(task, db) {
  if (!task) return task;

  const progress = calculateTaskProgress(task.id, db);
  const delay = calculateDelayStatus(task, progress);
  const warning = getWarningLevel(task, progress);
  const childrenCount = taskModel.countChildren(task.id, db);
  const cumulative = actualModel.getCumulativeHours(task.id, db);

  return {
    ...task,
    progress_percent: progress,
    delay_status: delay.status,
    delay_days: delay.delay_days,
    expected_progress: delay.expected_progress,
    warning_level: warning,
    children_count: childrenCount,
    cumulative_actual_hours: cumulative
  };
}

module.exports = {
  calculateTaskProgress,
  calculateParentProgress,
  calculateDelayStatus,
  getWarningLevel,
  recalculateAncestors,
  updateParentStatus,
  enrichTask
};
