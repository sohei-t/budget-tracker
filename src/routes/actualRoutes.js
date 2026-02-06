/**
 * Actual Routes
 * @module routes/actualRoutes
 */

'use strict';

const express = require('express');
const router = express.Router();
const actualController = require('../controllers/actualController');

// Actual entry CRUD (by actual ID)
router.put('/:id', actualController.updateActual);
router.delete('/:id', actualController.deleteActual);

module.exports = router;
