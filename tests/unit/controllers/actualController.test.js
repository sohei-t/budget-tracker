/**
 * Unit Tests: Actual Controller
 *
 * Tests controller-level validation (NaN ID checks) and error propagation.
 * Focuses on branch coverage for validation paths.
 */

'use strict';

const actualController = require('../../../src/controllers/actualController');

function createMockReq(params = {}, body = {}) {
  return { params, body };
}

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

describe('Actual Controller', () => {
  // ===================================================================
  // getActuals - branch: invalid ID
  // ===================================================================

  describe('getActuals', () => {
    test('should return 400 when task ID is NaN', () => {
      const req = createMockReq({ id: 'abc' });
      const res = createMockRes();
      const next = jest.fn();

      actualController.getActuals(req, res, next);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toBe('Invalid task ID');
    });

    test('should call next when service throws', () => {
      const req = createMockReq({ id: '999' });
      const res = createMockRes();
      const next = jest.fn();

      jest.spyOn(require('../../../src/services/actualService'), 'getActualsForTask')
        .mockImplementation(() => { throw new Error('Task not found'); });

      actualController.getActuals(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));

      require('../../../src/services/actualService').getActualsForTask.mockRestore();
    });
  });

  // ===================================================================
  // recordActual - branch: invalid task ID
  // ===================================================================

  describe('recordActual', () => {
    test('should return 400 when task ID is NaN', () => {
      const req = createMockReq({ id: 'invalid' }, { actual_hours: 5 });
      const res = createMockRes();
      const next = jest.fn();

      actualController.recordActual(req, res, next);

      expect(res.statusCode).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should call next when service throws', () => {
      const req = createMockReq({ id: '1' }, { actual_hours: 5 });
      const res = createMockRes();
      const next = jest.fn();

      jest.spyOn(require('../../../src/services/actualService'), 'recordActual')
        .mockImplementation(() => { throw new Error('Validation failed'); });

      actualController.recordActual(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));

      require('../../../src/services/actualService').recordActual.mockRestore();
    });
  });

  // ===================================================================
  // updateActual - branch: invalid actual ID
  // ===================================================================

  describe('updateActual', () => {
    test('should return 400 when actual ID is NaN', () => {
      const req = createMockReq({ id: 'xyz' }, { actual_hours: 3 });
      const res = createMockRes();
      const next = jest.fn();

      actualController.updateActual(req, res, next);

      expect(res.statusCode).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toBe('Invalid actual ID');
    });

    test('should call next when service throws', () => {
      const req = createMockReq({ id: '1' }, { actual_hours: 3 });
      const res = createMockRes();
      const next = jest.fn();

      jest.spyOn(require('../../../src/services/actualService'), 'updateActual')
        .mockImplementation(() => { throw new Error('Not found'); });

      actualController.updateActual(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));

      require('../../../src/services/actualService').updateActual.mockRestore();
    });
  });

  // ===================================================================
  // deleteActual - branch: invalid actual ID
  // ===================================================================

  describe('deleteActual', () => {
    test('should return 400 when actual ID is NaN', () => {
      const req = createMockReq({ id: 'not-number' });
      const res = createMockRes();
      const next = jest.fn();

      actualController.deleteActual(req, res, next);

      expect(res.statusCode).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toBe('Invalid actual ID');
    });

    test('should call next when service throws', () => {
      const req = createMockReq({ id: '1' });
      const res = createMockRes();
      const next = jest.fn();

      jest.spyOn(require('../../../src/services/actualService'), 'deleteActual')
        .mockImplementation(() => { throw new Error('Not found'); });

      actualController.deleteActual(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));

      require('../../../src/services/actualService').deleteActual.mockRestore();
    });
  });
});
