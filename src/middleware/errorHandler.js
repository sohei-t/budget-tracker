/**
 * Error Handler Middleware
 *
 * Global error handler that formats error responses consistently.
 * @module middleware/errorHandler
 */

'use strict';

/**
 * Express error handling middleware.
 * @param {Error} err - The error object
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Next middleware
 */
function errorHandler(err, req, res, next) {
  // Log error for debugging
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[ERROR] ${err.code || 'UNKNOWN'}: ${err.message}`);
    if (err.stack && process.env.NODE_ENV === 'development') {
      console.error(err.stack);
    }
  }

  // AppError with known status code
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code || 'SERVER_ERROR',
        message: err.message,
        details: err.details || []
      }
    });
  }

  // SQLite constraint errors
  if (err.message && err.message.includes('SQLITE_CONSTRAINT')) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Database constraint violation',
        details: []
      }
    });
  }

  // Default 500 error
  res.status(500).json({
    success: false,
    error: {
      code: 'SERVER_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message || 'Internal server error',
      details: []
    }
  });
}

module.exports = errorHandler;
