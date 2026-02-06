/**
 * Unit Tests: Error Handler Middleware
 *
 * Tests global error handling: AppError, SQLITE_CONSTRAINT, and generic errors.
 */

'use strict';

const errorHandler = require('../../../src/middleware/errorHandler');

function createMockRes() {
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      res.statusCode = code;
      return res;
    },
    json(data) {
      res.body = data;
      return res;
    }
  };
  return res;
}

function createMockReq() {
  return {};
}

function createMockNext() {
  return jest.fn();
}

describe('errorHandler middleware', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  // ===================================================================
  // AppError with statusCode
  // ===================================================================

  describe('AppError with statusCode', () => {
    test('should return the error status code and structured error body', () => {
      const err = new Error('Task not found');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      err.details = [];

      const req = createMockReq();
      const res = createMockRes();
      const next = createMockNext();

      errorHandler(err, req, res, next);

      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Task not found',
          details: []
        }
      });
    });

    test('should use SERVER_ERROR as default code when err.code is missing', () => {
      const err = new Error('Something went wrong');
      err.statusCode = 500;
      // No err.code set

      const req = createMockReq();
      const res = createMockRes();
      const next = createMockNext();

      errorHandler(err, req, res, next);

      expect(res.body.error.code).toBe('SERVER_ERROR');
    });

    test('should include details when provided', () => {
      const err = new Error('Validation failed');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      err.details = [{ field: 'name', message: 'Required' }];

      const req = createMockReq();
      const res = createMockRes();
      const next = createMockNext();

      errorHandler(err, req, res, next);

      expect(res.body.error.details).toEqual([{ field: 'name', message: 'Required' }]);
    });

    test('should default details to empty array when not provided', () => {
      const err = new Error('Bad request');
      err.statusCode = 400;
      err.code = 'BAD_REQUEST';
      // No err.details set

      const req = createMockReq();
      const res = createMockRes();
      const next = createMockNext();

      errorHandler(err, req, res, next);

      expect(res.body.error.details).toEqual([]);
    });
  });

  // ===================================================================
  // SQLITE_CONSTRAINT errors
  // ===================================================================

  describe('SQLITE_CONSTRAINT errors', () => {
    test('should return 400 with DATABASE_ERROR code', () => {
      const err = new Error('SQLITE_CONSTRAINT: UNIQUE constraint failed');

      const req = createMockReq();
      const res = createMockRes();
      const next = createMockNext();

      errorHandler(err, req, res, next);

      expect(res.statusCode).toBe(400);
      expect(res.body).toEqual({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Database constraint violation',
          details: []
        }
      });
    });

    test('should handle SQLITE_CONSTRAINT with additional text', () => {
      const err = new Error('Error: SQLITE_CONSTRAINT_FOREIGNKEY');

      const req = createMockReq();
      const res = createMockRes();
      const next = createMockNext();

      errorHandler(err, req, res, next);

      expect(res.statusCode).toBe(400);
      expect(res.body.error.code).toBe('DATABASE_ERROR');
    });
  });

  // ===================================================================
  // Default 500 error
  // ===================================================================

  describe('Default 500 error', () => {
    test('should return 500 with error message in non-production', () => {
      process.env.NODE_ENV = 'test';
      const err = new Error('Unexpected crash');

      const req = createMockReq();
      const res = createMockRes();
      const next = createMockNext();

      errorHandler(err, req, res, next);

      expect(res.statusCode).toBe(500);
      expect(res.body.error.code).toBe('SERVER_ERROR');
      expect(res.body.error.message).toBe('Unexpected crash');
    });

    test('should return generic message in production', () => {
      process.env.NODE_ENV = 'production';
      const err = new Error('Secret internal error');

      const req = createMockReq();
      const res = createMockRes();
      const next = createMockNext();

      errorHandler(err, req, res, next);

      expect(res.statusCode).toBe(500);
      expect(res.body.error.message).toBe('An unexpected error occurred');
    });

    test('should fallback to "Internal server error" when no message and not production', () => {
      process.env.NODE_ENV = 'development';
      const err = new Error();

      const req = createMockReq();
      const res = createMockRes();
      const next = createMockNext();

      errorHandler(err, req, res, next);

      expect(res.statusCode).toBe(500);
      // Empty string from Error() is falsy, so falls through to 'Internal server error'
      expect(res.body.error.message).toBe('Internal server error');
    });
  });

  // ===================================================================
  // Logging behavior
  // ===================================================================

  describe('Logging behavior', () => {
    test('should log error in non-test environment', () => {
      process.env.NODE_ENV = 'development';
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const err = new Error('Test log error');
      err.code = 'TEST_ERROR';
      err.stack = 'stack trace line 1\nstack trace line 2';

      const req = createMockReq();
      const res = createMockRes();
      const next = createMockNext();

      errorHandler(err, req, res, next);

      // First call logs error message
      expect(consoleSpy).toHaveBeenCalledWith('[ERROR] TEST_ERROR: Test log error');
      // Second call logs stack in development
      expect(consoleSpy).toHaveBeenCalledWith(err.stack);

      consoleSpy.mockRestore();
    });

    test('should not log stack in non-development environment', () => {
      process.env.NODE_ENV = 'staging';
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const err = new Error('Staging error');
      err.code = 'STAGING_ERR';
      err.stack = 'stack trace';

      const req = createMockReq();
      const res = createMockRes();
      const next = createMockNext();

      errorHandler(err, req, res, next);

      // Should log error message
      expect(consoleSpy).toHaveBeenCalledWith('[ERROR] STAGING_ERR: Staging error');
      // Should NOT log stack (not in development)
      expect(consoleSpy).not.toHaveBeenCalledWith('stack trace');

      consoleSpy.mockRestore();
    });

    test('should not log in test environment', () => {
      process.env.NODE_ENV = 'test';
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const err = new Error('Silent error');
      err.stack = 'stack trace';

      const req = createMockReq();
      const res = createMockRes();
      const next = createMockNext();

      errorHandler(err, req, res, next);

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('should use UNKNOWN when error has no code and env is not test', () => {
      process.env.NODE_ENV = 'staging';
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const err = new Error('No code error');
      // No err.code set

      const req = createMockReq();
      const res = createMockRes();
      const next = createMockNext();

      errorHandler(err, req, res, next);

      expect(consoleSpy).toHaveBeenCalledWith('[ERROR] UNKNOWN: No code error');
      consoleSpy.mockRestore();
    });
  });
});
