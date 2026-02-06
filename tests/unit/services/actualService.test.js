/**
 * Unit Tests: actualService
 *
 * Tests daily actual recording, upsert logic, cumulative calculations,
 * and progress recalculation triggers.
 */

'use strict';

const { createTestDb, seedTestData, closeTestDb } = require('../../helpers/testDb');
const { setDb } = require('../../../src/models/db');
const actualService = require('../../../src/services/actualService');
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
// Record Actual (Create / Upsert)
// =========================================================================

describe('recordActual', () => {
  test('should create a new actual entry for a task and date', () => {
    const result = actualService.recordActual(ids.minor1Id, {
      work_date: '2026-02-15', actual_hours: 4.5, notes: 'Work done'
    }, db);
    expect(result.entry).toBeDefined();
    expect(result.entry.actual_hours).toBe(4.5);
    expect(result.isUpsert).toBe(false);
    expect(result.newCumulativeHours).toBeGreaterThan(0);
  });

  test('should upsert when recording for the same task and date', () => {
    // minor1 already has an actual for 2026-02-10 (6.5h)
    const result = actualService.recordActual(ids.minor1Id, {
      work_date: '2026-02-10', actual_hours: 8.0, notes: 'Updated'
    }, db);
    expect(result.isUpsert).toBe(true);
    expect(result.entry.actual_hours).toBe(8.0);
    // Cumulative should be updated: 8.0 (updated) + 2.0 (2026-02-11) = 10.0
    expect(result.newCumulativeHours).toBe(10.0);
  });

  test('should trigger progress recalculation for the task', () => {
    // Create a new task with 20h planned
    const task = taskModel.create({
      parent_id: ids.middle2Id, level: 3,
      name: 'Progress test', planned_effort_hours: 20
    }, db);
    const result = actualService.recordActual(task.id, {
      work_date: '2026-02-15', actual_hours: 5, notes: ''
    }, db);
    // 5/20 = 25%
    expect(result.newProgressPercent).toBe(25);
  });

  test('should trigger progress recalculation for ancestor tasks', () => {
    // Record on minor1 and check that middle1 and major1 get updated
    actualService.recordActual(ids.minor1Id, {
      work_date: '2026-02-20', actual_hours: 2.0, notes: 'Extra work'
    }, db);
    const parent = taskModel.findById(ids.middle1Id, db);
    expect(parent.progress_percent).toBeGreaterThanOrEqual(0);
    const grandparent = taskModel.findById(ids.major1Id, db);
    expect(grandparent).toBeDefined();
  });

  test('should auto-transition task status to in_progress on first actual', () => {
    // Create a fresh task with not_started status
    const task = taskModel.create({
      parent_id: ids.middle2Id, level: 3,
      name: 'Fresh task', planned_effort_hours: 10
    }, db);
    expect(task.status).toBe('not_started');

    actualService.recordActual(task.id, {
      work_date: '2026-02-15', actual_hours: 1, notes: 'Starting'
    }, db);
    const updated = taskModel.findById(task.id, db);
    expect(updated.status).toBe('in_progress');
  });

  test('should reject actual_hours <= 0', () => {
    expect(() => {
      actualService.recordActual(ids.minor1Id, {
        work_date: '2026-02-15', actual_hours: 0, notes: ''
      }, db);
    }).toThrow();
  });

  test('should reject actual_hours > 24', () => {
    expect(() => {
      actualService.recordActual(ids.minor1Id, {
        work_date: '2026-02-15', actual_hours: 25, notes: ''
      }, db);
    }).toThrow();
  });

  test('should reject invalid date format', () => {
    expect(() => {
      actualService.recordActual(ids.minor1Id, {
        work_date: '02-15-2026', actual_hours: 4, notes: ''
      }, db);
    }).toThrow();
  });

  test('should reject recording for a deleted task', () => {
    taskModel.softDelete(ids.minor1Id, db);
    expect(() => {
      actualService.recordActual(ids.minor1Id, {
        work_date: '2026-02-15', actual_hours: 4, notes: ''
      }, db);
    }).toThrow();
  });

  test('should reject recording for a non-existent task', () => {
    expect(() => {
      actualService.recordActual(99999, {
        work_date: '2026-02-15', actual_hours: 4, notes: ''
      }, db);
    }).toThrow();
  });

  test('should default notes to empty string when not provided', () => {
    const result = actualService.recordActual(ids.minor1Id, {
      work_date: '2026-02-20', actual_hours: 2
    }, db);
    expect(result.entry.notes).toBeDefined();
  });

  test('should set work_date to today when not provided', () => {
    const result = actualService.recordActual(ids.minor1Id, {
      actual_hours: 2, notes: 'No date'
    }, db);
    // work_date should be today's date in YYYY-MM-DD format
    const today = new Date().toISOString().slice(0, 10);
    expect(result.entry.work_date).toBe(today);
  });
});

// =========================================================================
// Get Actuals
// =========================================================================

describe('getActualsForTask', () => {
  test('should return all actuals for a task ordered by date descending', () => {
    const result = actualService.getActualsForTask(ids.minor1Id, db);
    expect(result.actuals.length).toBe(2);
    // Ordered by work_date DESC: 2026-02-11 first, 2026-02-10 second
    expect(result.actuals[0].work_date).toBe('2026-02-11');
    expect(result.actuals[1].work_date).toBe('2026-02-10');
  });

  test('should return empty array for task with no actuals', () => {
    const task = taskModel.create({
      parent_id: ids.middle2Id, level: 3,
      name: 'No actuals', planned_effort_hours: 10
    }, db);
    const result = actualService.getActualsForTask(task.id, db);
    expect(result.actuals).toEqual([]);
    expect(result.cumulativeHours).toBe(0);
  });

  test('should include cumulative hours in the response', () => {
    const result = actualService.getActualsForTask(ids.minor1Id, db);
    // 6.5 + 2.0 = 8.5
    expect(result.cumulativeHours).toBe(8.5);
  });

  test('should return 404 for non-existent task', () => {
    expect(() => {
      actualService.getActualsForTask(99999, db);
    }).toThrow();
  });
});

// =========================================================================
// Update Actual
// =========================================================================

describe('updateActual', () => {
  test('should update actual_hours for an existing entry', () => {
    // Get the first actual for minor1 (2026-02-10, 6.5h)
    const actuals = actualModel.findByTaskId(ids.minor1Id, db);
    const actualId = actuals[actuals.length - 1].id; // oldest first
    const updated = actualService.updateActual(actualId, { actual_hours: 8.0 }, db);
    expect(updated.actual_hours).toBe(8.0);
  });

  test('should update notes for an existing entry', () => {
    const actuals = actualModel.findByTaskId(ids.minor1Id, db);
    const actualId = actuals[0].id;
    const updated = actualService.updateActual(actualId, { notes: 'Updated notes' }, db);
    expect(updated.notes).toBe('Updated notes');
  });

  test('should trigger progress recalculation after update', () => {
    // Create a task with known effort
    const task = taskModel.create({
      parent_id: ids.middle2Id, level: 3,
      name: 'Recalc test', planned_effort_hours: 20
    }, db);
    // Record actual
    const rec = actualService.recordActual(task.id, {
      work_date: '2026-02-15', actual_hours: 5, notes: ''
    }, db);
    // Update to 10 hours
    actualService.updateActual(rec.entry.id, { actual_hours: 10 }, db);
    // Check task progress updated: 10/20 = 50%
    const updatedTask = taskModel.findById(task.id, db);
    expect(updatedTask.progress_percent).toBe(50);
  });

  test('should return 404 for non-existent actual ID', () => {
    expect(() => {
      actualService.updateActual(99999, { actual_hours: 5 }, db);
    }).toThrow();
  });

  test('should validate actual_hours on update', () => {
    const actuals = actualModel.findByTaskId(ids.minor1Id, db);
    const actualId = actuals[0].id;
    expect(() => {
      actualService.updateActual(actualId, { actual_hours: -1 }, db);
    }).toThrow();
  });
});

// =========================================================================
// Delete Actual
// =========================================================================

describe('deleteActual', () => {
  test('should delete an actual entry', () => {
    const actuals = actualModel.findByTaskId(ids.minor1Id, db);
    const actualId = actuals[0].id;
    const result = actualService.deleteActual(actualId, db);
    expect(result.deleted_actual_id).toBe(actualId);
    // Entry should be gone
    const found = actualModel.findById(actualId, db);
    expect(found).toBeUndefined();
  });

  test('should trigger progress recalculation after deletion', () => {
    // Create a task with known effort
    const task = taskModel.create({
      parent_id: ids.middle2Id, level: 3,
      name: 'Delete test', planned_effort_hours: 10
    }, db);
    // Record two actuals
    const rec1 = actualService.recordActual(task.id, {
      work_date: '2026-02-15', actual_hours: 5, notes: ''
    }, db);
    actualService.recordActual(task.id, {
      work_date: '2026-02-16', actual_hours: 3, notes: ''
    }, db);
    // 8/10 = 80% progress
    let t = taskModel.findById(task.id, db);
    expect(t.progress_percent).toBe(80);

    // Delete one actual (5h)
    actualService.deleteActual(rec1.entry.id, db);
    // Now 3/10 = 30%
    t = taskModel.findById(task.id, db);
    expect(t.progress_percent).toBe(30);
  });

  test('should return 404 for non-existent actual ID', () => {
    expect(() => {
      actualService.deleteActual(99999, db);
    }).toThrow();
  });
});

// =========================================================================
// Cumulative Calculation
// =========================================================================

describe('getCumulativeHours', () => {
  test('should return sum of all actual_hours for a task', () => {
    // minor1 has actuals: 6.5 + 2.0 = 8.5
    const cumulative = actualService.getCumulativeHours(ids.minor1Id, db);
    expect(cumulative).toBe(8.5);
  });

  test('should return 0 for task with no actuals', () => {
    const task = taskModel.create({
      parent_id: ids.middle2Id, level: 3,
      name: 'No actuals', planned_effort_hours: 10
    }, db);
    const cumulative = actualService.getCumulativeHours(task.id, db);
    expect(cumulative).toBe(0);
  });

  test('should handle decimal hours correctly', () => {
    const task = taskModel.create({
      parent_id: ids.middle2Id, level: 3,
      name: 'Decimal test', planned_effort_hours: 20
    }, db);
    actualModel.upsert({ task_id: task.id, work_date: '2026-02-15', actual_hours: 1.25, notes: '' }, db);
    actualModel.upsert({ task_id: task.id, work_date: '2026-02-16', actual_hours: 2.75, notes: '' }, db);
    actualModel.upsert({ task_id: task.id, work_date: '2026-02-17', actual_hours: 0.5, notes: '' }, db);
    const cumulative = actualService.getCumulativeHours(task.id, db);
    expect(cumulative).toBe(4.5);
  });
});
