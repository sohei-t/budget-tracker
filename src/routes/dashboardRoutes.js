/**
 * Dashboard Routes
 * @module routes/dashboardRoutes
 */

'use strict';

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/', dashboardController.getSummary);
router.get('/delays', dashboardController.getDelays);

module.exports = router;
