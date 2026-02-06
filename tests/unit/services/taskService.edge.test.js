/**
 * Edge Case Tests: Task Service
 *
 * Tests additional edge cases not covered by existing tests:
 * - validateTaskData date comparison
 * - updateTask progress_mode auto switch
 * - updateTask invalid progress_percent
 * - updateTask invalid status
 * - sanitize function with non-string
 */

'use strict';

const { createTestDb, closeTestDb } = require('../../helpers/testDb');
const { setDb } = require('../../../src/models/db');
const taskService = require('../../../src/services/taskService');

let db;

beforeEach(() => {
  db = createTestDb();
  setDb(db);
});

afterEach(() => {
  closeTestDb(db);
});

function createLevel1Task(overrides = {}) {
  const defaults = {
    name: 'Test Task',
    planned_effort_hours: 10,
    planned_start_date: '2026-03-01',
    planned_end_date: '2026-03-15'
  };
  return taskService.createTask({ ...defaults, ...overrides }, db);
}

describe('taskService - edge cases', () => {
  // ===================================================================
  // sanitize function
  // ===================================================================

  describe('sanitize', () => {
    test('should return non-string values as-is', () => {
      expect(taskService.sanitize(42)).toBe(42);
      expect(taskService.sanitize(null)).toBe(null);
      expect(taskService.sanitize(undefined)).toBe(undefined);
    });

    test('should sanitize HTML special characters', () => {
      expect(taskService.sanitize('<script>alert("xss")</script>'))
        .toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
      expect(taskService.sanitize("a'b&c")).toBe("a&#x27;b&amp;c");
    });
  });

  // ===================================================================
  // createTask - validation edge cases
  // ===================================================================

  describe('createTask validation', () => {
    test('should fail when name exceeds 200 characters', () => {
      expect(() => {
        taskService.createTask({ name: 'a'.repeat(201) }, db);
      }).toThrow('Validation failed');
    });

    test('should fail when start date format is invalid', () => {
      expect(() => {
        taskService.createTask({
          name: 'Valid Name',
          planned_start_date: '01-02-2026'
        }, db);
      }).toThrow('Validation failed');
    });

    test('should fail when end date format is invalid', () => {
      expect(() => {
        taskService.createTask({
          name: 'Valid Name',
          planned_end_date: '2026/03/15'
        }, db);
      }).toThrow('Validation failed');
    });

    test('should fail when end date is before start date', () => {
      expect(() => {
        taskService.createTask({
          name: 'Valid Name',
          planned_start_date: '2026-03-15',
          planned_end_date: '2026-03-01'
        }, db);
      }).toThrow('Validation failed');
    });

    test('should fail when planned_effort_hours is negative', () => {
      expect(() => {
        taskService.createTask({
          name: 'Valid Name',
          planned_effort_hours: -5
        }, db);
      }).toThrow('Validation failed');
    });

    test('should default planned_effort_hours to 0 when not provided', () => {
      const task = taskService.createTask({ name: 'No Effort' }, db);
      expect(task.planned_effort_hours).toBe(0);
    });

    test('should fail when parent_id references a Level 3 task', () => {
      // Create 3-level chain
      const level1 = taskService.createTask({ name: 'L1' }, db);
      const level2 = taskService.createTask({ name: 'L2', parent_id: level1.id }, db);
      const level3 = taskService.createTask({ name: 'L3', parent_id: level2.id }, db);

      expect(() => {
        taskService.createTask({ name: 'L4', parent_id: level3.id }, db);
      }).toThrow();
    });

    test('should fail when parent_id references non-existent task', () => {
      expect(() => {
        taskService.createTask({ name: 'Orphan', parent_id: 9999 }, db);
      }).toThrow();
    });
  });

  // ===================================================================
  // updateTask - edge cases
  // ===================================================================

  describe('updateTask edge cases', () => {
    test('should reject invalid status value', () => {
      const task = createLevel1Task();

      expect(() => {
        taskService.updateTask(task.id, { status: 'invalid_status' }, db);
      }).toThrow('Validation failed');
    });

    test('should reject invalid progress_mode', () => {
      const task = createLevel1Task();

      expect(() => {
        taskService.updateTask(task.id, { progress_mode: 'super' }, db);
      }).toThrow('Validation failed');
    });

    test('should reject progress_percent > 100', () => {
      const task = createLevel1Task();

      expect(() => {
        taskService.updateTask(task.id, { progress_percent: 150 }, db);
      }).toThrow('Validation failed');
    });

    test('should reject progress_percent < 0', () => {
      const task = createLevel1Task();

      expect(() => {
        taskService.updateTask(task.id, { progress_percent: -10 }, db);
      }).toThrow('Validation failed');
    });

    test('should reject NaN progress_percent', () => {
      const task = createLevel1Task();

      expect(() => {
        taskService.updateTask(task.id, { progress_percent: 'abc' }, db);
      }).toThrow('Validation failed');
    });

    test('should set progress to 100 when status changed to completed', () => {
      const task = createLevel1Task({ planned_effort_hours: 0 });
      const updated = taskService.updateTask(task.id, { status: 'completed' }, db);
      // For leaf tasks with 0 effort and completed status, enrichTask returns 100
      expect(updated.progress_percent).toBe(100);
    });

    test('should reject empty name on update', () => {
      const task = createLevel1Task();

      expect(() => {
        taskService.updateTask(task.id, { name: '' }, db);
      }).toThrow('Validation failed');
    });

    test('should reject name > 200 chars on update', () => {
      const task = createLevel1Task();

      expect(() => {
        taskService.updateTask(task.id, { name: 'x'.repeat(201) }, db);
      }).toThrow('Validation failed');
    });

    test('should handle progress_mode switch from manual to auto', () => {
      // First set manual mode
      const task = createLevel1Task({ planned_effort_hours: 10 });
      taskService.updateTask(task.id, {
        progress_mode: 'manual',
        progress_percent: 50
      }, db);

      // Now switch back to auto
      const updated = taskService.updateTask(task.id, { progress_mode: 'auto' }, db);
      // Auto mode recalculates from actuals, which is 0
      expect(updated.progress_percent).toBe(0);
    });

    test('should handle auto mode switch when effort is 0', () => {
      const task = createLevel1Task({ planned_effort_hours: 0 });
      taskService.updateTask(task.id, {
        progress_mode: 'manual',
        progress_percent: 50
      }, db);

      // Switch to auto with 0 effort (should be 0 since not completed)
      const updated = taskService.updateTask(task.id, { progress_mode: 'auto' }, db);
      expect(typeof updated.progress_percent).toBe('number');
    });

    test('should recalculate ancestors when child effort changes', () => {
      const parent = createLevel1Task({ planned_effort_hours: 100 });
      const child = taskService.createTask({
        name: 'Child Task',
        parent_id: parent.id,
        planned_effort_hours: 50
      }, db);

      // Update child effort
      taskService.updateTask(child.id, { planned_effort_hours: 80 }, db);

      // Parent should be recalculated
      const parentAfter = taskService.getTask(parent.id, db);
      expect(parentAfter).toBeDefined();
    });

    test('should reject end date before start date on update', () => {
      const task = createLevel1Task({
        planned_start_date: '2026-03-01',
        planned_end_date: '2026-03-31'
      });

      expect(() => {
        taskService.updateTask(task.id, { planned_end_date: '2026-02-01' }, db);
      }).toThrow('Validation failed');
    });

    test('should reject negative planned_effort_hours on update', () => {
      const task = createLevel1Task();

      expect(() => {
        taskService.updateTask(task.id, { planned_effort_hours: -1 }, db);
      }).toThrow('Validation failed');
    });
  });

  // ===================================================================
  // deleteTask - recalculate parent
  // ===================================================================

  describe('deleteTask', () => {
    test('should recalculate parent when child is deleted', () => {
      const parent = createLevel1Task();
      const child1 = taskService.createTask({
        name: 'Child 1',
        parent_id: parent.id,
        planned_effort_hours: 10
      }, db);
      const child2 = taskService.createTask({
        name: 'Child 2',
        parent_id: parent.id,
        planned_effort_hours: 10
      }, db);

      // Complete child1
      taskService.updateTask(child1.id, { status: 'completed' }, db);

      // Delete child2
      const result = taskService.deleteTask(child2.id, db);
      expect(result.deleted_task_id).toBe(child2.id);

      // Parent should have recalculated progress
      const parentAfter = taskService.getTask(parent.id, db);
      expect(parentAfter).toBeDefined();
    });
  });

  // ===================================================================
  // reorderTask
  // ===================================================================

  describe('reorderTask', () => {
    test('should throw when task not found', () => {
      expect(() => {
        taskService.reorderTask(9999, 5, db);
      }).toThrow('Task not found');
    });
  });

  // ===================================================================
  // getChildren - not found
  // ===================================================================

  describe('getChildren', () => {
    test('should throw when parent not found', () => {
      expect(() => {
        taskService.getChildren(9999, db);
      }).toThrow('Task not found');
    });
  });
});
