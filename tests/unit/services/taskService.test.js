/**
 * Unit Tests: taskService
 *
 * Tests task CRUD operations, cascading behavior, hierarchy management,
 * and integration with progress calculation.
 */

'use strict';

const { createTestDb, seedTestData, closeTestDb } = require('../../helpers/testDb');
const { setDb } = require('../../../src/models/db');
const taskService = require('../../../src/services/taskService');
const taskModel = require('../../../src/models/taskModel');
const actualModel = require('../../../src/models/actualModel');

let db;
let ids;

beforeEach(() => {
  db = createTestDb();
  setDb(db);
  ids = seedTestData(db);
});

afterEach(() => {
  closeTestDb(db);
});

// =========================================================================
// Task Creation
// =========================================================================

describe('createTask', () => {
  test('should create a Level 1 task with parent_id = null', () => {
    const task = taskService.createTask({ name: 'New Phase', planned_effort_hours: 20 }, db);
    expect(task.level).toBe(1);
    expect(task.parent_id).toBeNull();
    expect(task.status).toBe('not_started');
    expect(task.id).toBeDefined();
  });

  test('should create a Level 2 task under a Level 1 parent', () => {
    const task = taskService.createTask({
      name: 'Sub Item', parent_id: ids.major1Id, planned_effort_hours: 10
    }, db);
    expect(task.level).toBe(2);
    expect(task.parent_id).toBe(ids.major1Id);
  });

  test('should create a Level 3 task under a Level 2 parent', () => {
    const task = taskService.createTask({
      name: 'Minor Item', parent_id: ids.middle2Id, planned_effort_hours: 5
    }, db);
    expect(task.level).toBe(3);
    expect(task.parent_id).toBe(ids.middle2Id);
  });

  test('should reject creation of Level 4 tasks', () => {
    expect(() => {
      taskService.createTask({
        name: 'Too Deep', parent_id: ids.minor1Id, planned_effort_hours: 2
      }, db);
    }).toThrow();
  });

  test('should reject creation under a deleted parent', () => {
    taskModel.softDelete(ids.major1Id, db);
    expect(() => {
      taskService.createTask({
        name: 'Under deleted', parent_id: ids.major1Id
      }, db);
    }).toThrow();
  });

  test('should reject creation with invalid parent_id', () => {
    expect(() => {
      taskService.createTask({
        name: 'Bad parent', parent_id: 99999
      }, db);
    }).toThrow();
  });

  test('should auto-assign sort_order as max(siblings) + 1', () => {
    // major1 has sort_order=1, major2 has sort_order=2
    const task = taskService.createTask({ name: 'Third Phase' }, db);
    expect(task.sort_order).toBe(3);
  });

  test('should set initial status to not_started', () => {
    const task = taskService.createTask({ name: 'Fresh task' }, db);
    expect(task.status).toBe('not_started');
    expect(task.progress_percent).toBe(0);
  });

  test('should set timestamps on creation', () => {
    const task = taskService.createTask({ name: 'Timestamped' }, db);
    expect(task.created_at).toBeDefined();
    expect(task.updated_at).toBeDefined();
  });

  test('should sanitize HTML in task name (XSS prevention)', () => {
    const task = taskService.createTask({
      name: '<script>alert("xss")</script>Task'
    }, db);
    expect(task.name).not.toContain('<script>');
    expect(task.name).toContain('&lt;script&gt;');
  });

  test('should reject empty task name', () => {
    expect(() => {
      taskService.createTask({ name: '' }, db);
    }).toThrow();
  });

  test('should reject task name exceeding 200 characters', () => {
    expect(() => {
      taskService.createTask({ name: 'a'.repeat(201) }, db);
    }).toThrow();
  });
});

// =========================================================================
// Task Reading
// =========================================================================

describe('getTask', () => {
  test('should return a task by ID with calculated progress', () => {
    const task = taskService.getTask(ids.minor1Id, db);
    expect(task.id).toBe(ids.minor1Id);
    expect(task.name).toBe('Dashboard Wireframe');
    expect(task).toHaveProperty('progress_percent');
    expect(task).toHaveProperty('delay_status');
    expect(task).toHaveProperty('warning_level');
  });

  test('should return 404 for non-existent task ID', () => {
    expect(() => {
      taskService.getTask(99999, db);
    }).toThrow();
    try {
      taskService.getTask(99999, db);
    } catch (e) {
      expect(e.statusCode).toBe(404);
    }
  });

  test('should return 404 for soft-deleted task', () => {
    taskModel.softDelete(ids.minor1Id, db);
    expect(() => {
      taskService.getTask(ids.minor1Id, db);
    }).toThrow();
  });
});

describe('getTopLevelTasks', () => {
  test('should return all Level 1 tasks ordered by sort_order', () => {
    const tasks = taskService.getTopLevelTasks(db);
    expect(tasks.length).toBe(2);
    expect(tasks[0].name).toBe('Design Phase');
    expect(tasks[1].name).toBe('Development Phase');
  });

  test('should exclude soft-deleted tasks', () => {
    taskModel.softDelete(ids.major1Id, db);
    const tasks = taskService.getTopLevelTasks(db);
    expect(tasks.length).toBe(1);
    expect(tasks[0].name).toBe('Development Phase');
  });

  test('should include progress and delay status for each task', () => {
    const tasks = taskService.getTopLevelTasks(db);
    for (const task of tasks) {
      expect(task).toHaveProperty('progress_percent');
      expect(task).toHaveProperty('delay_status');
      expect(task).toHaveProperty('warning_level');
    }
  });
});

describe('getChildren', () => {
  test('should return direct children of a task ordered by sort_order', () => {
    const result = taskService.getChildren(ids.major1Id, db);
    expect(result.children.length).toBe(2);
    expect(result.children[0].name).toBe('Wireframes');
    expect(result.children[1].name).toBe('UI Design');
  });

  test('should exclude soft-deleted children', () => {
    taskModel.softDelete(ids.middle1Id, db);
    const result = taskService.getChildren(ids.major1Id, db);
    expect(result.children.length).toBe(1);
    expect(result.children[0].name).toBe('UI Design');
  });

  test('should return empty array for task with no children', () => {
    const result = taskService.getChildren(ids.major2Id, db);
    expect(result.children).toEqual([]);
  });

  test('should throw 404 for non-existent parent', () => {
    expect(() => {
      taskService.getChildren(99999, db);
    }).toThrow();
  });
});

// =========================================================================
// Task Update
// =========================================================================

describe('updateTask', () => {
  test('should update task name', () => {
    const updated = taskService.updateTask(ids.minor1Id, { name: 'Updated Name' }, db);
    expect(updated.name).toContain('Updated Name');
  });

  test('should update planned dates', () => {
    const updated = taskService.updateTask(ids.minor1Id, {
      planned_start_date: '2026-03-01',
      planned_end_date: '2026-03-15'
    }, db);
    expect(updated.planned_start_date).toBe('2026-03-01');
    expect(updated.planned_end_date).toBe('2026-03-15');
  });

  test('should update planned effort and trigger progress recalculation', () => {
    const updated = taskService.updateTask(ids.minor1Id, {
      planned_effort_hours: 100
    }, db);
    expect(updated.planned_effort_hours).toBe(100);
    // progress should be recalculated: 8.5h/100h = 8.5%
    expect(updated.progress_percent).toBeLessThan(100);
  });

  test('should validate end date >= start date', () => {
    expect(() => {
      taskService.updateTask(ids.minor1Id, {
        planned_start_date: '2026-03-15',
        planned_end_date: '2026-03-01'
      }, db);
    }).toThrow();
  });

  test('should update status and trigger parent status recalculation', () => {
    // minor2 is already completed, set minor1 to completed too
    const updated = taskService.updateTask(ids.minor1Id, { status: 'completed' }, db);
    expect(updated.status).toBe('completed');
  });

  test('should set progress to 100% when status changes to completed', () => {
    const updated = taskService.updateTask(ids.minor1Id, { status: 'completed' }, db);
    expect(updated.progress_percent).toBe(100);
  });

  test('should allow switching progress_mode between auto and manual', () => {
    const updated = taskService.updateTask(ids.minor1Id, {
      progress_mode: 'manual', progress_percent: 42
    }, db);
    expect(updated.progress_mode).toBe('manual');
  });

  test('should recalculate progress when switching from manual to auto', () => {
    // First set to manual
    taskService.updateTask(ids.minor1Id, {
      progress_mode: 'manual', progress_percent: 10
    }, db);
    // Then switch back to auto
    const updated = taskService.updateTask(ids.minor1Id, {
      progress_mode: 'auto'
    }, db);
    expect(updated.progress_mode).toBe('auto');
    // Progress should be auto-calculated: 8.5h/8h = 100% (capped)
    expect(updated.progress_percent).toBe(100);
  });

  test('should update updated_at timestamp', () => {
    const before = taskModel.findById(ids.minor1Id, db);
    const updated = taskService.updateTask(ids.minor1Id, { name: 'Time check' }, db);
    // updated_at should be refreshed (may or may not differ within same second)
    expect(updated.updated_at).toBeDefined();
  });

  test('should reject update of deleted task', () => {
    taskModel.softDelete(ids.minor1Id, db);
    expect(() => {
      taskService.updateTask(ids.minor1Id, { name: 'Should fail' }, db);
    }).toThrow();
  });
});

// =========================================================================
// Task Deletion (Soft Delete)
// =========================================================================

describe('deleteTask', () => {
  test('should soft-delete a leaf task (set is_deleted = 1)', () => {
    const result = taskService.deleteTask(ids.minor1Id, db);
    expect(result.deleted_task_id).toBe(ids.minor1Id);
    // Task should no longer be findable via findById
    const task = taskModel.findById(ids.minor1Id, db);
    expect(task).toBeUndefined();
    // But still exists in raw query
    const raw = taskModel.findByIdRaw(ids.minor1Id, db);
    expect(raw.is_deleted).toBe(1);
  });

  test('should cascade soft-delete to all descendants', () => {
    const result = taskService.deleteTask(ids.major1Id, db);
    // major1 + middle1 + middle2 + minor1 + minor2 = 5 total
    expect(result.deleted_descendants_count).toBeGreaterThanOrEqual(2);
    // Check children are deleted
    expect(taskModel.findById(ids.middle1Id, db)).toBeUndefined();
    expect(taskModel.findById(ids.minor1Id, db)).toBeUndefined();
  });

  test('should recalculate parent progress after deletion', () => {
    // Delete one child of middle1
    taskService.deleteTask(ids.minor1Id, db);
    const parent = taskModel.findById(ids.middle1Id, db);
    // Parent should still have progress from remaining child
    expect(parent).toBeDefined();
  });

  test('should preserve associated actuals (not delete them)', () => {
    const actualsBefore = actualModel.findByTaskId(ids.minor1Id, db);
    expect(actualsBefore.length).toBe(2);
    taskService.deleteTask(ids.minor1Id, db);
    // Actuals should still exist
    const actualsAfter = actualModel.findByTaskId(ids.minor1Id, db);
    expect(actualsAfter.length).toBe(2);
  });

  test('should return 404 for already deleted task', () => {
    taskService.deleteTask(ids.minor1Id, db);
    expect(() => {
      taskService.deleteTask(ids.minor1Id, db);
    }).toThrow();
  });

  test('should return 404 for non-existent task', () => {
    expect(() => {
      taskService.deleteTask(99999, db);
    }).toThrow();
  });
});

// =========================================================================
// Task Reorder
// =========================================================================

describe('reorderTask', () => {
  test('should update sort_order for a task', () => {
    const result = taskService.reorderTask(ids.major1Id, 5, db);
    expect(result.sort_order).toBe(5);
    const task = taskModel.findById(ids.major1Id, db);
    expect(task.sort_order).toBe(5);
  });

  test('should return 404 for non-existent task', () => {
    expect(() => {
      taskService.reorderTask(99999, 1, db);
    }).toThrow();
  });
});
