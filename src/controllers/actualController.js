/**
 * Actual Controller
 *
 * Handles HTTP request/response for actual recording endpoints.
 * @module controllers/actualController
 */

'use strict';

const actualService = require('../services/actualService');

/**
 * GET /api/tasks/:id/actuals - Get all actuals for a task
 */
function getActuals(req, res, next) {
  try {
    const taskId = parseInt(req.params.id, 10);
    if (isNaN(taskId)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid task ID' }
      });
    }

    const result = actualService.getActualsForTask(taskId);
    res.json({
      success: true,
      data: result.actuals,
      meta: {
        task_id: taskId,
        cumulative_hours: result.cumulativeHours,
        planned_effort_hours: result.task.planned_effort_hours,
        entries_count: result.actuals.length
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/tasks/:id/actuals - Record a daily actual
 */
function recordActual(req, res, next) {
  try {
    const taskId = parseInt(req.params.id, 10);
    if (isNaN(taskId)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid task ID' }
      });
    }

    const result = actualService.recordActual(taskId, req.body);
    const status = result.isUpsert ? 200 : 201;
    res.status(status).json({
      success: true,
      data: result.entry,
      meta: {
        is_upsert: result.isUpsert,
        new_cumulative_hours: result.newCumulativeHours,
        new_progress_percent: result.newProgressPercent
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/actuals/:id - Update an actual entry
 */
function updateActual(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid actual ID' }
      });
    }

    const updated = actualService.updateActual(id, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/actuals/:id - Delete an actual entry
 */
function deleteActual(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid actual ID' }
      });
    }

    const result = actualService.deleteActual(id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getActuals,
  recordActual,
  updateActual,
  deleteActual
};
