/**
 * Dashboard Service
 *
 * Provides aggregated statistics for the project dashboard.
 * @module services/dashboardService
 */

'use strict';

const taskModel = require('../models/taskModel');
const progressService = require('./progressService');

/**
 * Gets overall project summary statistics.
 * @param {Database} [db] - Optional database instance
 * @returns {Object} Dashboard summary data
 */
function getSummary(db) {
  const allTasks = taskModel.findAll(db);

  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = allTasks.filter(t => t.status === 'in_progress').length;
  const notStartedTasks = allTasks.filter(t => t.status === 'not_started').length;

  // Calculate overall progress from Level 1 tasks
  const level1Tasks = allTasks.filter(t => t.level === 1);
  let overallProgress = 0;

  if (level1Tasks.length > 0) {
    const enrichedLevel1 = level1Tasks.map(t => progressService.enrichTask(t, db));
    const totalEffort = enrichedLevel1.reduce((sum, t) => sum + (t.planned_effort_hours || 0), 0);

    if (totalEffort > 0) {
      const weightedSum = enrichedLevel1.reduce(
        (sum, t) => sum + t.progress_percent * (t.planned_effort_hours || 0), 0
      );
      overallProgress = Math.round((weightedSum / totalEffort) * 10) / 10;
    } else {
      const avgProgress = enrichedLevel1.reduce((sum, t) => sum + t.progress_percent, 0) / enrichedLevel1.length;
      overallProgress = Math.round(avgProgress * 10) / 10;
    }
  }

  // Delay counts
  let overdueCount = 0;
  let atRiskCount = 0;
  let onTrackCount = 0;

  for (const task of allTasks) {
    const enriched = progressService.enrichTask(task, db);
    if (enriched.delay_status === 'overdue') overdueCount++;
    else if (enriched.delay_status === 'at_risk') atRiskCount++;
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

  // Major items summary
  const majorItems = level1Tasks.map(t => {
    const enriched = progressService.enrichTask(t, db);
    return {
      id: enriched.id,
      name: enriched.name,
      progress_percent: enriched.progress_percent,
      status: enriched.status,
      delay_status: enriched.delay_status
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
 * Gets list of delayed tasks (overdue and at_risk).
 * @param {Database} [db] - Optional database instance
 * @returns {Array<Object>} List of delayed tasks sorted by severity
 */
function getDelayedTasks(db) {
  const allTasks = taskModel.findAll(db);
  const delayed = [];

  for (const task of allTasks) {
    if (!task.planned_start_date || !task.planned_end_date) continue;

    const enriched = progressService.enrichTask(task, db);

    if (enriched.delay_status === 'overdue' || enriched.delay_status === 'at_risk') {
      delayed.push({
        id: enriched.id,
        name: enriched.name,
        level: enriched.level,
        planned_end_date: enriched.planned_end_date,
        progress_percent: enriched.progress_percent,
        delay_status: enriched.delay_status,
        delay_days: enriched.delay_days,
        expected_progress: enriched.expected_progress,
        warning_level: enriched.warning_level
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
