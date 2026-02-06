/**
 * Task Routes
 * @module routes/taskRoutes
 */

'use strict';

const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

router.get('/', taskController.listTasks);
router.get('/:id', taskController.getTask);
router.get('/:id/children', taskController.getChildren);
router.post('/', taskController.createTask);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);
router.put('/:id/reorder', taskController.reorderTask);

module.exports = router;
