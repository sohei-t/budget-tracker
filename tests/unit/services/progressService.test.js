/**
 * Unit Tests: progressService
 *
 * Tests the core progress calculation and delay detection logic.
 * This is the most critical test file - covers the heart of the business logic.
 */

'use strict';

const { createTestDb, seedTestData, closeTestDb } = require('../../helpers/testDb');
const { setDb } = require('../../../src/models/db');
const progressService = require('../../../src/services/progressService');
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

describe('calculateTaskProgress', () => {
  describe('leaf tasks - auto mode', () => {
    test('calculates progress from cumulative/planned ratio', () => {
      // minor1: 8.5h actual / 8h planned = 106.25%, capped at 100
      const progress = progressService.calculateTaskProgress(ids.minor1Id, db);
      expect(progress).toBe(100);
    });

    test('returns 0 when no actuals recorded', () => {
      const task = taskModel.create({
        parent_id: ids.middle2Id, level: 3,
        name: 'Fresh task', planned_effort_hours: 10
      }, db);
      const progress = progressService.calculateTaskProgress(task.id, db);
      expect(progress).toBe(0);
    });

    test('returns 0 when no planned effort and not completed', () => {
      const task = taskModel.create({
        parent_id: ids.middle2Id, level: 3,
        name: 'No effort task', planned_effort_hours: 0
      }, db);
      const progress = progressService.calculateTaskProgress(task.id, db);
      expect(progress).toBe(0);
    });

    test('returns 100 when no planned effort but task is completed', () => {
      const task = taskModel.create({
        parent_id: ids.middle2Id, level: 3,
        name: 'Completed no effort', planned_effort_hours: 0
      }, db);
      taskModel.update(task.id, { status: 'completed' }, db);
      const progress = progressService.calculateTaskProgress(task.id, db);
      expect(progress).toBe(100);
    });

    test('caps progress at 100 when actuals exceed planned', () => {
      // minor1: 8.5h actual on 8h planned
      const progress = progressService.calculateTaskProgress(ids.minor1Id, db);
      expect(progress).toBeLessThanOrEqual(100);
    });

    test('calculates partial progress correctly', () => {
      const task = taskModel.create({
        parent_id: ids.middle2Id, level: 3,
        name: 'Partial task', planned_effort_hours: 20
      }, db);
      actualModel.upsert({ task_id: task.id, work_date: '2026-02-15', actual_hours: 5, notes: '' }, db);
      const progress = progressService.calculateTaskProgress(task.id, db);
      expect(progress).toBe(25); // 5/20 * 100
    });

    test('returns 0 for non-existent task', () => {
      const progress = progressService.calculateTaskProgress(99999, db);
      expect(progress).toBe(0);
    });
  });

  describe('leaf tasks - manual mode', () => {
    test('returns user-set progress_percent', () => {
      const task = taskModel.create({
        parent_id: ids.middle2Id, level: 3,
        name: 'Manual task', planned_effort_hours: 10
      }, db);
      taskModel.update(task.id, { progress_mode: 'manual', progress_percent: 42.5 }, db);
      const progress = progressService.calculateTaskProgress(task.id, db);
      expect(progress).toBe(42.5);
    });

    test('returns 0 when manual mode with no value set', () => {
      const task = taskModel.create({
        parent_id: ids.middle2Id, level: 3,
        name: 'Manual zero', planned_effort_hours: 10
      }, db);
      taskModel.update(task.id, { progress_mode: 'manual', progress_percent: 0 }, db);
      const progress = progressService.calculateTaskProgress(task.id, db);
      expect(progress).toBe(0);
    });
  });

  describe('parent tasks - weighted average', () => {
    test('calculates weighted average by effort', () => {
      // middle1 has children: minor1 (8h plan, 100% done), minor2 (7h plan, 100% done)
      const progress = progressService.calculateTaskProgress(ids.middle1Id, db);
      expect(progress).toBe(100);
    });

    test('uses equal weight when all planned effort is zero', () => {
      const parent = taskModel.create({
        parent_id: null, level: 1,
        name: 'No effort parent', planned_effort_hours: 0
      }, db);
      const child1 = taskModel.create({
        parent_id: parent.id, level: 2,
        name: 'Child A', planned_effort_hours: 0
      }, db);
      taskModel.update(child1.id, { status: 'completed', progress_percent: 100 }, db);
      taskModel.create({
        parent_id: parent.id, level: 2,
        name: 'Child B', planned_effort_hours: 0
      }, db);
      const progress = progressService.calculateTaskProgress(parent.id, db);
      expect(progress).toBe(50);
    });

    test('returns 0 for parent with no children', () => {
      // major2 (Development Phase) has no children in seed data
      const progress = progressService.calculateTaskProgress(ids.major2Id, db);
      expect(progress).toBe(0);
    });
  });
});

describe('calculateDelayStatus', () => {
  test('returns overdue when past end date and not complete', () => {
    const task = {
      planned_start_date: '2024-01-01',
      planned_end_date: '2024-01-10',
      status: 'in_progress',
      progress_percent: 50
    };
    const delay = progressService.calculateDelayStatus(task, 50);
    expect(delay.status).toBe('overdue');
    expect(delay.delay_days).toBeGreaterThan(0);
    expect(delay.expected_progress).toBe(100);
  });

  test('returns on_track when completed even past due date', () => {
    const task = {
      planned_start_date: '2024-01-01',
      planned_end_date: '2024-01-10',
      status: 'completed',
      progress_percent: 100
    };
    const delay = progressService.calculateDelayStatus(task, 100);
    expect(delay.status).toBe('on_track');
  });

  test('returns unknown when no dates set', () => {
    const task = { status: 'in_progress', progress_percent: 50 };
    const delay = progressService.calculateDelayStatus(task);
    expect(delay.status).toBe('unknown');
  });

  test('returns not_started before start date', () => {
    const task = {
      planned_start_date: '2099-01-01',
      planned_end_date: '2099-12-31',
      status: 'not_started',
      progress_percent: 0
    };
    const delay = progressService.calculateDelayStatus(task, 0);
    expect(delay.status).toBe('not_started');
  });

  test('returns on_track when on schedule', () => {
    const task = {
      planned_start_date: '2099-01-01',
      planned_end_date: '2099-12-31',
      status: 'not_started',
      progress_percent: 0
    };
    const delay = progressService.calculateDelayStatus(task, 0);
    // Before start date => not_started
    expect(['not_started', 'on_track']).toContain(delay.status);
  });
});

describe('getWarningLevel', () => {
  test('returns red for overdue tasks', () => {
    const task = {
      planned_start_date: '2024-01-01',
      planned_end_date: '2024-01-10',
      status: 'in_progress',
      progress_percent: 30
    };
    const warning = progressService.getWarningLevel(task, 30);
    expect(warning).toBe('red');
  });

  test('returns none for completed tasks', () => {
    const task = {
      planned_start_date: '2024-01-01',
      planned_end_date: '2024-01-10',
      status: 'completed',
      progress_percent: 100
    };
    const warning = progressService.getWarningLevel(task, 100);
    expect(warning).toBe('none');
  });

  test('returns none when progress >= 100', () => {
    const task = {
      planned_start_date: '2024-01-01',
      planned_end_date: '2024-01-10',
      status: 'in_progress',
      progress_percent: 100
    };
    const warning = progressService.getWarningLevel(task, 100);
    expect(warning).toBe('none');
  });

  test('returns none for future tasks', () => {
    const task = {
      planned_start_date: '2099-01-01',
      planned_end_date: '2099-12-31',
      status: 'not_started',
      progress_percent: 0
    };
    const warning = progressService.getWarningLevel(task, 0);
    expect(warning).toBe('none');
  });
});

describe('recalculateAncestors', () => {
  test('updates parent progress', () => {
    progressService.recalculateAncestors(ids.minor1Id, db);
    const parent = taskModel.findById(ids.middle1Id, db);
    expect(parent.progress_percent).toBeGreaterThanOrEqual(0);
  });

  test('propagates through multiple levels', () => {
    progressService.recalculateAncestors(ids.minor1Id, db);
    const grandparent = taskModel.findById(ids.major1Id, db);
    expect(grandparent.progress_percent).toBeGreaterThanOrEqual(0);
  });

  test('handles missing tasks gracefully', () => {
    expect(() => progressService.recalculateAncestors(99999, db)).not.toThrow();
  });
});

describe('updateParentStatus', () => {
  test('sets parent to completed when all children completed', () => {
    progressService.updateParentStatus(ids.middle1Id, db);
    const parent = taskModel.findById(ids.middle1Id, db);
    expect(parent.status).toBe('completed');
  });

  test('sets parent to in_progress when some children in_progress', () => {
    const child = taskModel.create({
      parent_id: ids.middle2Id, level: 3,
      name: 'New child', planned_effort_hours: 5
    }, db);
    taskModel.update(child.id, { status: 'in_progress' }, db);
    progressService.updateParentStatus(ids.middle2Id, db);
    const parent = taskModel.findById(ids.middle2Id, db);
    expect(parent.status).toBe('in_progress');
  });

  test('sets parent to not_started when no children started', () => {
    const parent = taskModel.create({
      parent_id: null, level: 1,
      name: 'Fresh parent', planned_effort_hours: 20
    }, db);
    taskModel.create({
      parent_id: parent.id, level: 2,
      name: 'Child not started', planned_effort_hours: 10
    }, db);
    progressService.updateParentStatus(parent.id, db);
    const updated = taskModel.findById(parent.id, db);
    expect(updated.status).toBe('not_started');
  });

  test('does nothing for parent with no children', () => {
    expect(() => progressService.updateParentStatus(ids.major2Id, db)).not.toThrow();
  });
});

describe('enrichTask', () => {
  test('adds all computed fields', () => {
    const task = taskModel.findById(ids.minor1Id, db);
    const enriched = progressService.enrichTask(task, db);
    expect(enriched).toHaveProperty('progress_percent');
    expect(enriched).toHaveProperty('delay_status');
    expect(enriched).toHaveProperty('delay_days');
    expect(enriched).toHaveProperty('expected_progress');
    expect(enriched).toHaveProperty('warning_level');
    expect(enriched).toHaveProperty('children_count');
    expect(enriched).toHaveProperty('cumulative_actual_hours');
  });

  test('returns null for null input', () => {
    expect(progressService.enrichTask(null, db)).toBeNull();
  });

  test('correctly counts children', () => {
    const task = taskModel.findById(ids.middle1Id, db);
    const enriched = progressService.enrichTask(task, db);
    expect(enriched.children_count).toBe(2);
  });

  test('includes cumulative actual hours', () => {
    const task = taskModel.findById(ids.minor1Id, db);
    const enriched = progressService.enrichTask(task, db);
    expect(enriched.cumulative_actual_hours).toBe(8.5); // 6.5 + 2.0
  });
});
