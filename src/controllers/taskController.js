/**
 * Task Controller
 *
 * Handles HTTP request/response for task endpoints.
 * @module controllers/taskController
 */

'use strict';

const taskService = require('../services/taskService');

/**
 * GET /api/tasks - List all Level 1 tasks
 */
function listTasks(req, res, next) {
  try {
    const tasks = taskService.getTopLevelTasks();
    res.json({
      success: true,
      data: tasks,
      meta: { total: tasks.length, level: 1 }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/tasks/:id - Get a single task
 */
function getTask(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid task ID' }
      });
    }

    const task = taskService.getTask(id);
    res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/tasks/:id/children - Get children of a task
 */
function getChildren(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid task ID' }
      });
    }

    const result = taskService.getChildren(id);
    res.json({
      success: true,
      data: result.children,
      meta: {
        total: result.children.length,
        parent_id: id,
        parent_name: result.parent.name
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/tasks - Create a new task
 */
function createTask(req, res, next) {
  try {
    const task = taskService.createTask(req.body);
    res.status(201).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/tasks/:id - Update a task
 */
function updateTask(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid task ID' }
      });
    }

    const task = taskService.updateTask(id, req.body);
    res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/tasks/:id - Soft delete a task
 */
function deleteTask(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid task ID' }
      });
    }

    const result = taskService.deleteTask(id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/tasks/:id/reorder - Update task sort order
 */
function reorderTask(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid task ID' }
      });
    }

    const sortOrder = parseInt(req.body.sort_order, 10);
    if (isNaN(sortOrder)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid sort order' }
      });
    }

    const result = taskService.reorderTask(id, sortOrder);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listTasks,
  getTask,
  getChildren,
  createTask,
  updateTask,
  deleteTask,
  reorderTask
};
