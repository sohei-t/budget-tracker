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

// Response time tracking (set header before response is sent)
app.use((req, res, next) => {
  req._startTime = process.hrtime.bigint();
  const originalJson = res.json.bind(res);
  res.json = function(body) {
    const elapsed = Number(process.hrtime.bigint() - req._startTime) / 1e6;
    res.set('X-Response-Time', `${elapsed.toFixed(2)}ms`);
    return originalJson(body);
  };
  next();
});

// Logging (skip in test)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// CORS
app.use(cors());

// JSON body parser with optimized limit
app.use(express.json({ limit: '256kb' }));

// Enable ETag for API responses (weak ETags for JSON)
app.set('etag', 'weak');

// Static files (SPA frontend) with optimized caching
app.use(express.static(path.join(__dirname, '..', 'public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
  etag: true,
  lastModified: true,
  index: 'index.html'
}));

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
