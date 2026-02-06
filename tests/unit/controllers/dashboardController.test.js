/**
 * Unit Tests: Dashboard Controller
 *
 * Tests controller error propagation to the error handler middleware.
 */

'use strict';

const dashboardController = require('../../../src/controllers/dashboardController');

function createMockReq() {
  return {};
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

describe('Dashboard Controller', () => {
  // ===================================================================
  // getSummary - error path
  // ===================================================================

  describe('getSummary', () => {
    test('should call next(err) when service throws', () => {
      const req = createMockReq();
      const res = createMockRes();
      const next = jest.fn();

      jest.spyOn(require('../../../src/services/dashboardService'), 'getSummary')
        .mockImplementation(() => { throw new Error('Database error'); });

      dashboardController.getSummary(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe('Database error');

      require('../../../src/services/dashboardService').getSummary.mockRestore();
    });
  });

  // ===================================================================
  // getDelays - error path
  // ===================================================================

  describe('getDelays', () => {
    test('should call next(err) when service throws', () => {
      const req = createMockReq();
      const res = createMockRes();
      const next = jest.fn();

      jest.spyOn(require('../../../src/services/dashboardService'), 'getDelayedTasks')
        .mockImplementation(() => { throw new Error('Query failed'); });

      dashboardController.getDelays(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));

      require('../../../src/services/dashboardService').getDelayedTasks.mockRestore();
    });
  });
});
