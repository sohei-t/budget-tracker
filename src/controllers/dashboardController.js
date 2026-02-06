/**
 * Dashboard Controller
 *
 * Handles HTTP request/response for dashboard endpoints.
 * @module controllers/dashboardController
 */

'use strict';

const dashboardService = require('../services/dashboardService');

/**
 * GET /api/dashboard - Get overall project summary
 */
function getSummary(req, res, next) {
  try {
    const summary = dashboardService.getSummary();
    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/dashboard/delays - Get delayed tasks list
 */
function getDelays(req, res, next) {
  try {
    const delays = dashboardService.getDelayedTasks();
    const overdueCount = delays.filter(d => d.delay_status === 'overdue').length;
    const atRiskCount = delays.filter(d => d.delay_status === 'at_risk').length;

    res.json({
      success: true,
      data: delays,
      meta: {
        overdue_count: overdueCount,
        at_risk_count: atRiskCount,
        total_delayed: delays.length
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSummary,
  getDelays
};
