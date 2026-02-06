/**
 * Dashboard Service
 *
 * Provides aggregated statistics for the project dashboard.
 * Optimized to use batch queries instead of per-task enrichment (N+1 elimination).
 * @module services/dashboardService
 */

'use strict';

const taskModel = require('../models/taskModel');
const progressService = require('./progressService');

/**
 * Gets overall project summary statistics.
 * Uses batch queries and in-memory computation to minimize database round trips.
 * @param {Database} [db] - Optional database instance
 * @returns {Object} Dashboard summary data
 */
function getSummary(db) {
  // Single query to get all tasks with cumulative hours (eliminates N+1)
  const allTasks = taskModel.findAllWithCumulativeHours(db);
  const childrenCountsMap = taskModel.getChildrenCountsMap(db);

  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = allTasks.filter(t => t.status === 'in_progress').length;
  const notStartedTasks = allTasks.filter(t => t.status === 'not_started').length;

  // Build task lookup map for efficient parent-child traversal
  const taskMap = new Map();
  for (const t of allTasks) {
    taskMap.set(t.id, t);
  }

  // Build children map for in-memory hierarchy traversal
  const childrenMap = new Map();
  for (const t of allTasks) {
    if (t.parent_id !== null) {
      if (!childrenMap.has(t.parent_id)) {
        childrenMap.set(t.parent_id, []);
      }
      childrenMap.get(t.parent_id).push(t);
    }
  }

  // Calculate progress for all tasks in memory (bottom-up)
  const progressMap = new Map();
  calculateProgressBatch(allTasks, childrenMap, progressMap);

  // Calculate overall progress from Level 1 tasks
  const level1Tasks = allTasks.filter(t => t.level === 1);
  let overallProgress = 0;

  if (level1Tasks.length > 0) {
    const totalEffort = level1Tasks.reduce((sum, t) => sum + (t.planned_effort_hours || 0), 0);

    if (totalEffort > 0) {
      const weightedSum = level1Tasks.reduce(
        (sum, t) => sum + (progressMap.get(t.id) || 0) * (t.planned_effort_hours || 0), 0
      );
      overallProgress = Math.round((weightedSum / totalEffort) * 10) / 10;
    } else {
      const avgProgress = level1Tasks.reduce((sum, t) => sum + (progressMap.get(t.id) || 0), 0) / level1Tasks.length;
      overallProgress = Math.round(avgProgress * 10) / 10;
    }
  }

  // Delay counts using in-memory progress values
  let overdueCount = 0;
  let atRiskCount = 0;
  let onTrackCount = 0;

  for (const task of allTasks) {
    const progress = progressMap.get(task.id) || 0;
    const delay = progressService.calculateDelayStatus(task, progress);
    if (delay.status === 'overdue') overdueCount++;
    else if (delay.status === 'at_risk') atRiskCount++;
    else onTrackCount++;
  }

  // By level breakdown
  const byLevel = {
    level_1: { total: 0, completed: 0, in_progress: 0, not_started: 0 },
    level_2: { total: 0, completed: 0, in_progress: 0, not_started: 0 },
    level_3: { total: 0, completed: 0, in_progress: 0, not_started: 0 }
  };

  for (const task of allTasks) {
    const key = `level_${task.level}`;
    if (byLevel[key]) {
      byLevel[key].total++;
      byLevel[key][task.status]++;
    }
  }

  // Major items summary using cached progress
  const majorItems = level1Tasks.map(t => {
    const progress = progressMap.get(t.id) || 0;
    const delay = progressService.calculateDelayStatus(t, progress);
    return {
      id: t.id,
      name: t.name,
      progress_percent: progress,
      status: t.status,
      delay_status: delay.status
    };
  });

  return {
    total_tasks: totalTasks,
    completed_tasks: completedTasks,
    in_progress_tasks: inProgressTasks,
    not_started_tasks: notStartedTasks,
    overall_progress_percent: overallProgress,
    delayed_tasks_count: overdueCount + atRiskCount,
    on_track_count: onTrackCount,
    at_risk_count: atRiskCount,
    overdue_count: overdueCount,
    by_level: byLevel,
    major_items: majorItems
  };
}

/**
 * Batch-calculates progress for all tasks in memory.
 * Processes leaf tasks first (by highest level), then parents.
 * @param {Array<Object>} allTasks - All tasks with cumulative_hours field
 * @param {Map<number, Array>} childrenMap - Parent ID -> children array
 * @param {Map<number, number>} progressMap - Task ID -> progress (output)
 */
function calculateProgressBatch(allTasks, childrenMap, progressMap) {
  // Sort by level descending (leaves first)
  const sortedTasks = [...allTasks].sort((a, b) => b.level - a.level);

  for (const task of sortedTasks) {
    const children = childrenMap.get(task.id) || [];

    if (children.length > 0) {
      // Parent task: weighted average of children
      const childProgresses = children.map(child => ({
        progress: progressMap.get(child.id) || 0,
        effort: child.planned_effort_hours || 0
      }));

      const totalEffort = childProgresses.reduce((sum, c) => sum + c.effort, 0);

      if (totalEffort > 0) {
        const weightedSum = childProgresses.reduce(
          (sum, c) => sum + c.progress * c.effort, 0
        );
        progressMap.set(task.id, Math.round((weightedSum / totalEffort) * 10) / 10);
      } else {
        const avg = childProgresses.reduce((sum, c) => sum + c.progress, 0) / childProgresses.length;
        progressMap.set(task.id, Math.round(avg * 10) / 10);
      }
    } else {
      // Leaf task
      if (task.progress_mode === 'manual') {
        progressMap.set(task.id, task.progress_percent);
      } else {
        const cumulative = task.cumulative_hours || 0;
        if (task.planned_effort_hours > 0) {
          const raw = (cumulative / task.planned_effort_hours) * 100;
          progressMap.set(task.id, Math.round(Math.min(100, raw) * 10) / 10);
        } else {
          progressMap.set(task.id, task.status === 'completed' ? 100 : 0);
        }
      }
    }
  }
}

/**
 * Gets list of delayed tasks (overdue and at_risk).
 * Optimized to use batch progress calculation.
 * @param {Database} [db] - Optional database instance
 * @returns {Array<Object>} List of delayed tasks sorted by severity
 */
function getDelayedTasks(db) {
  const allTasks = taskModel.findAllWithCumulativeHours(db);
  const delayed = [];

  // Build children map for in-memory hierarchy traversal
  const childrenMap = new Map();
  for (const t of allTasks) {
    if (t.parent_id !== null) {
      if (!childrenMap.has(t.parent_id)) {
        childrenMap.set(t.parent_id, []);
      }
      childrenMap.get(t.parent_id).push(t);
    }
  }

  // Batch calculate progress
  const progressMap = new Map();
  calculateProgressBatch(allTasks, childrenMap, progressMap);

  for (const task of allTasks) {
    if (!task.planned_start_date || !task.planned_end_date) continue;

    const progress = progressMap.get(task.id) || 0;
    const delay = progressService.calculateDelayStatus(task, progress);
    const warning = progressService.getWarningLevel(task, progress);

    if (delay.status === 'overdue' || delay.status === 'at_risk') {
      delayed.push({
        id: task.id,
        name: task.name,
        level: task.level,
        planned_end_date: task.planned_end_date,
        progress_percent: progress,
        delay_status: delay.status,
        delay_days: delay.delay_days,
        expected_progress: delay.expected_progress,
        warning_level: warning
      });
    }
  }

  // Sort: overdue first, then at_risk, then by delay_days desc
  delayed.sort((a, b) => {
    if (a.delay_status === 'overdue' && b.delay_status !== 'overdue') return -1;
    if (a.delay_status !== 'overdue' && b.delay_status === 'overdue') return 1;
    return b.delay_days - a.delay_days;
  });

  return delayed;
}

module.exports = {
  getSummary,
  getDelayedTasks
};
