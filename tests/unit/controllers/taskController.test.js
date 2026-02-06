/**
 * Unit Tests: Task Controller
 *
 * Tests controller-level validation (NaN ID checks) and error propagation.
 * Focuses on branch coverage for all validation paths.
 */

'use strict';

const taskController = require('../../../src/controllers/taskController');

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

describe('Task Controller', () => {
  // ===================================================================
  // listTasks - error path
  // ===================================================================

  describe('listTasks', () => {
    test('should call next(err) when service throws', () => {
      const req = createMockReq();
      const res = createMockRes();
      const next = jest.fn();

      // Mock the service to throw
      jest.spyOn(require('../../../src/services/taskService'), 'getTopLevelTasks')
        .mockImplementation(() => { throw new Error('DB error'); });

      taskController.listTasks(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));

      require('../../../src/services/taskService').getTopLevelTasks.mockRestore();
    });
  });

  // ===================================================================
  // getTask - branch: invalid ID
  // ===================================================================

  describe('getTask', () => {
    test('should return 400 when ID is NaN (string)', () => {
      const req = createMockReq({ id: 'abc' });
      const res = createMockRes();
      const next = jest.fn();

      taskController.getTask(req, res, next);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should return 400 when ID is NaN (undefined)', () => {
      const req = createMockReq({ id: undefined });
      const res = createMockRes();
      const next = jest.fn();

      taskController.getTask(req, res, next);

      expect(res.statusCode).toBe(400);
    });

    test('should call next when service throws', () => {
      const req = createMockReq({ id: '1' });
      const res = createMockRes();
      const next = jest.fn();

      jest.spyOn(require('../../../src/services/taskService'), 'getTask')
        .mockImplementation(() => { throw new Error('Not found'); });

      taskController.getTask(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));

      require('../../../src/services/taskService').getTask.mockRestore();
    });
  });

  // ===================================================================
  // getChildren - branch: invalid ID
  // ===================================================================

  describe('getChildren', () => {
    test('should return 400 when parent ID is NaN', () => {
      const req = createMockReq({ id: 'not-a-number' });
      const res = createMockRes();
      const next = jest.fn();

      taskController.getChildren(req, res, next);

      expect(res.statusCode).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should call next when service throws', () => {
      const req = createMockReq({ id: '999' });
      const res = createMockRes();
      const next = jest.fn();

      jest.spyOn(require('../../../src/services/taskService'), 'getChildren')
        .mockImplementation(() => { throw new Error('Not found'); });

      taskController.getChildren(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));

      require('../../../src/services/taskService').getChildren.mockRestore();
    });
  });

  // ===================================================================
  // createTask - error path
  // ===================================================================

  describe('createTask', () => {
    test('should call next when service throws validation error', () => {
      const req = createMockReq({}, { name: '' });
      const res = createMockRes();
      const next = jest.fn();

      jest.spyOn(require('../../../src/services/taskService'), 'createTask')
        .mockImplementation(() => { throw new Error('Validation failed'); });

      taskController.createTask(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));

      require('../../../src/services/taskService').createTask.mockRestore();
    });
  });

  // ===================================================================
  // updateTask - branch: invalid ID
  // ===================================================================

  describe('updateTask', () => {
    test('should return 400 when ID is NaN', () => {
      const req = createMockReq({ id: 'xyz' }, { name: 'Updated' });
      const res = createMockRes();
      const next = jest.fn();

      taskController.updateTask(req, res, next);

      expect(res.statusCode).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should call next when service throws', () => {
      const req = createMockReq({ id: '1' }, { name: 'Updated' });
      const res = createMockRes();
      const next = jest.fn();

      jest.spyOn(require('../../../src/services/taskService'), 'updateTask')
        .mockImplementation(() => { throw new Error('Not found'); });

      taskController.updateTask(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));

      require('../../../src/services/taskService').updateTask.mockRestore();
    });
  });

  // ===================================================================
  // deleteTask - branch: invalid ID
  // ===================================================================

  describe('deleteTask', () => {
    test('should return 400 when ID is NaN', () => {
      const req = createMockReq({ id: 'delete-me' });
      const res = createMockRes();
      const next = jest.fn();

      taskController.deleteTask(req, res, next);

      expect(res.statusCode).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should call next when service throws', () => {
      const req = createMockReq({ id: '1' });
      const res = createMockRes();
      const next = jest.fn();

      jest.spyOn(require('../../../src/services/taskService'), 'deleteTask')
        .mockImplementation(() => { throw new Error('Not found'); });

      taskController.deleteTask(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));

      require('../../../src/services/taskService').deleteTask.mockRestore();
    });
  });

  // ===================================================================
  // reorderTask - branches: invalid ID, invalid sort_order
  // ===================================================================

  describe('reorderTask', () => {
    test('should return 400 when ID is NaN', () => {
      const req = createMockReq({ id: 'bad' }, { sort_order: 1 });
      const res = createMockRes();
      const next = jest.fn();

      taskController.reorderTask(req, res, next);

      expect(res.statusCode).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toBe('Invalid task ID');
    });

    test('should return 400 when sort_order is NaN', () => {
      const req = createMockReq({ id: '1' }, { sort_order: 'abc' });
      const res = createMockRes();
      const next = jest.fn();

      taskController.reorderTask(req, res, next);

      expect(res.statusCode).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toBe('Invalid sort order');
    });

    test('should call next when service throws', () => {
      const req = createMockReq({ id: '1' }, { sort_order: '5' });
      const res = createMockRes();
      const next = jest.fn();

      jest.spyOn(require('../../../src/services/taskService'), 'reorderTask')
        .mockImplementation(() => { throw new Error('Not found'); });

      taskController.reorderTask(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));

      require('../../../src/services/taskService').reorderTask.mockRestore();
    });
  });
});
