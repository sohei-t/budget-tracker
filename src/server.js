/**
 * Express Server
 *
 * Main entry point for the Budget Tracker SPA.
 * Serves API endpoints and static frontend files.
 * Binds to 0.0.0.0 for LAN access.
 * @module server
 */

'use strict';

const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');

const taskRoutes = require('./routes/taskRoutes');
const actualRoutes = require('./routes/actualRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const actualController = require('./controllers/actualController');
const errorHandler = require('./middleware/errorHandler');
const { getLocalIP } = require('./utils/networkUtils');
const { getDb } = require('./models/db');

const app = express();

// Initialize database on startup
getDb();

// Security headers (relaxed CSP for SPA)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      fontSrc: ["'self'"]
    }
  }
}));

// Compression
app.use(compression());

// Logging (skip in test)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// CORS
app.use(cors());

// JSON body parser
app.use(express.json({ limit: '1mb' }));

// Static files (SPA frontend)
app.use(express.static(path.join(__dirname, '..', 'public')));

// API Routes
app.use('/api/tasks', taskRoutes);
app.use('/api/actuals', actualRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Actuals nested under tasks
app.get('/api/tasks/:id/actuals', actualController.getActuals);
app.post('/api/tasks/:id/actuals', actualController.recordActual);

// SPA fallback: serve index.html for all non-API routes
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'API endpoint not found' }
    });
  }
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Error handler
app.use(errorHandler);

// Start server (only when not imported for testing)
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    const ip = getLocalIP();
    console.log('');
    console.log('==============================================');
    console.log('  Budget Tracker - SPA Architecture');
    console.log('==============================================');
    console.log(`  Local:   http://localhost:${PORT}`);
    console.log(`  Network: http://${ip}:${PORT}`);
    console.log('==============================================');
    console.log('');
  });
}

module.exports = app;
