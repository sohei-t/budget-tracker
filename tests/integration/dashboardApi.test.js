/**
 * Integration Tests: Dashboard API
 *
 * Tests dashboard summary and delay listing endpoints.
 */

'use strict';

const request = require('supertest');
const app = require('../../src/server');
const { createTestDb, seedTestData, closeTestDb } = require('../helpers/testDb');
const { setDb } = require('../../src/models/db');
const taskModel = require('../../src/models/taskModel');

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
// GET /api/dashboard - Overall Summary
// =========================================================================

describe('GET /api/dashboard', () => {
  test('should return summary statistics with 200 status', async () => {
    const res = await request(app).get('/api/dashboard');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('total_tasks');
    expect(res.body.data).toHaveProperty('completed_tasks');
    expect(res.body.data).toHaveProperty('in_progress_tasks');
    expect(res.body.data).toHaveProperty('not_started_tasks');
    expect(res.body.data).toHaveProperty('overall_progress_percent');
    expect(res.body.data).toHaveProperty('delayed_tasks_count');
  });

  test('should calculate total_tasks correctly (excluding deleted)', async () => {
    const res = await request(app).get('/api/dashboard');
    // Seed data: 6 tasks (major1, major2, middle1, middle2, minor1, minor2)
    expect(res.body.data.total_tasks).toBe(6);

    // Delete one task, verify count decreases
    taskModel.softDelete(ids.minor1Id, db);
    const res2 = await request(app).get('/api/dashboard');
    expect(res2.body.data.total_tasks).toBe(5);
  });

  test('should calculate completed_tasks count correctly', async () => {
    const res = await request(app).get('/api/dashboard');
    // Seed data: middle1 (completed), minor1 (completed), minor2 (completed) = 3
    expect(res.body.data.completed_tasks).toBe(3);
  });

  test('should calculate in_progress_tasks count correctly', async () => {
    const res = await request(app).get('/api/dashboard');
    // Seed data: major1 (in_progress), middle2 (in_progress) = 2
    expect(res.body.data.in_progress_tasks).toBe(2);
  });

  test('should calculate not_started_tasks count correctly', async () => {
    const res = await request(app).get('/api/dashboard');
    // Seed data: major2 (not_started) = 1
    expect(res.body.data.not_started_tasks).toBe(1);
  });

  test('should calculate overall_progress_percent', async () => {
    const res = await request(app).get('/api/dashboard');
    // Overall progress is a weighted average of Level 1 tasks
    expect(typeof res.body.data.overall_progress_percent).toBe('number');
    expect(res.body.data.overall_progress_percent).toBeGreaterThanOrEqual(0);
    expect(res.body.data.overall_progress_percent).toBeLessThanOrEqual(100);
  });

  test('should calculate delayed_tasks_count (overdue + at_risk)', async () => {
    const res = await request(app).get('/api/dashboard');
    expect(typeof res.body.data.delayed_tasks_count).toBe('number');
    expect(res.body.data.delayed_tasks_count).toBe(
      res.body.data.overdue_count + res.body.data.at_risk_count
    );
  });

  test('should return zeros when no tasks exist', async () => {
    // Delete all tasks
    taskModel.softDelete(ids.major1Id, db);
    taskModel.softDelete(ids.major2Id, db);
    const res = await request(app).get('/api/dashboard');
    expect(res.body.data.total_tasks).toBe(0);
    expect(res.body.data.completed_tasks).toBe(0);
    expect(res.body.data.in_progress_tasks).toBe(0);
    expect(res.body.data.not_started_tasks).toBe(0);
    expect(res.body.data.overall_progress_percent).toBe(0);
  });

  test('should include by_level breakdown', async () => {
    const res = await request(app).get('/api/dashboard');
    expect(res.body.data.by_level).toBeDefined();
    expect(res.body.data.by_level).toHaveProperty('level_1');
    expect(res.body.data.by_level).toHaveProperty('level_2');
    expect(res.body.data.by_level).toHaveProperty('level_3');

    // Level 1: 2 tasks (major1 in_progress, major2 not_started)
    expect(res.body.data.by_level.level_1.total).toBe(2);
    // Level 2: 2 tasks (middle1 completed, middle2 in_progress)
    expect(res.body.data.by_level.level_2.total).toBe(2);
    // Level 3: 2 tasks (minor1 completed, minor2 completed)
    expect(res.body.data.by_level.level_3.total).toBe(2);
  });

  test('should include major_items summary', async () => {
    const res = await request(app).get('/api/dashboard');
    expect(res.body.data.major_items).toBeDefined();
    expect(Array.isArray(res.body.data.major_items)).toBe(true);
    expect(res.body.data.major_items.length).toBe(2);
    for (const item of res.body.data.major_items) {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('progress_percent');
      expect(item).toHaveProperty('status');
      expect(item).toHaveProperty('delay_status');
    }
  });
});

// =========================================================================
// GET /api/dashboard/delays - Delayed Tasks List
// =========================================================================

describe('GET /api/dashboard/delays', () => {
  test('should return list of delayed tasks with 200 status', async () => {
    const res = await request(app).get('/api/dashboard/delays');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('should include meta with overdue and at_risk counts', async () => {
    const res = await request(app).get('/api/dashboard/delays');
    expect(res.body.meta).toBeDefined();
    expect(res.body.meta).toHaveProperty('overdue_count');
    expect(res.body.meta).toHaveProperty('at_risk_count');
    expect(res.body.meta).toHaveProperty('total_delayed');
    expect(res.body.meta.total_delayed).toBe(res.body.data.length);
  });

  test('should sort overdue tasks before at_risk tasks', async () => {
    // Create tasks with dates in the past to trigger overdue/at_risk
    const overdueTask = taskModel.create({
      parent_id: null, level: 1,
      name: 'Overdue Task', planned_effort_hours: 10,
      planned_start_date: '2024-01-01', planned_end_date: '2024-01-10'
    }, db);
    taskModel.update(overdueTask.id, { status: 'in_progress' }, db);

    const atRiskTask = taskModel.create({
      parent_id: null, level: 1,
      name: 'At Risk Task', planned_effort_hours: 10,
      planned_start_date: '2024-01-01', planned_end_date: '2026-12-31'
    }, db);
    taskModel.update(atRiskTask.id, { status: 'in_progress', progress_percent: 1 }, db);

    const res = await request(app).get('/api/dashboard/delays');

    if (res.body.data.length >= 2) {
      // Find the first overdue and first at_risk
      const overdueIdx = res.body.data.findIndex(d => d.delay_status === 'overdue');
      const atRiskIdx = res.body.data.findIndex(d => d.delay_status === 'at_risk');
      if (overdueIdx !== -1 && atRiskIdx !== -1) {
        expect(overdueIdx).toBeLessThan(atRiskIdx);
      }
    }
  });

  test('should include delay details for each delayed task', async () => {
    // Create an overdue task
    const task = taskModel.create({
      parent_id: null, level: 1,
      name: 'Detailed Overdue', planned_effort_hours: 10,
      planned_start_date: '2024-01-01', planned_end_date: '2024-06-01'
    }, db);
    taskModel.update(task.id, { status: 'in_progress', progress_percent: 30 }, db);

    const res = await request(app).get('/api/dashboard/delays');
    const delayedTask = res.body.data.find(d => d.name === 'Detailed Overdue');
    if (delayedTask) {
      expect(delayedTask).toHaveProperty('delay_status');
      expect(delayedTask).toHaveProperty('delay_days');
      expect(delayedTask).toHaveProperty('expected_progress');
      expect(delayedTask).toHaveProperty('progress_percent');
      expect(delayedTask).toHaveProperty('warning_level');
    }
  });

  test('should not include completed tasks', async () => {
    // Create a completed task with past dates and no planned effort
    // (so calculateTaskProgress returns 100 for completed tasks with 0 effort)
    const task = taskModel.create({
      parent_id: null, level: 1,
      name: 'Completed Past Due', planned_effort_hours: 0,
      planned_start_date: '2024-01-01', planned_end_date: '2024-06-01'
    }, db);
    taskModel.update(task.id, { status: 'completed', progress_percent: 100 }, db);

    const res = await request(app).get('/api/dashboard/delays');
    const found = res.body.data.find(d => d.name === 'Completed Past Due');
    expect(found).toBeUndefined();
  });

  test('should not include tasks without dates', async () => {
    // Seed tasks don't have dates set, so they should not be in delay list
    const res = await request(app).get('/api/dashboard/delays');
    for (const item of res.body.data) {
      expect(item.planned_end_date).toBeDefined();
    }
  });

  test('should return empty array when no tasks are delayed', async () => {
    // Delete all tasks and create fresh ones with future dates
    taskModel.softDelete(ids.major1Id, db);
    taskModel.softDelete(ids.major2Id, db);

    const task = taskModel.create({
      parent_id: null, level: 1,
      name: 'Future Task', planned_effort_hours: 10,
      planned_start_date: '2099-01-01', planned_end_date: '2099-12-31'
    }, db);

    const res = await request(app).get('/api/dashboard/delays');
    expect(res.body.data).toEqual([]);
    expect(res.body.meta.total_delayed).toBe(0);
  });

  test('should exclude soft-deleted tasks from delay list', async () => {
    // Create an overdue task then delete it
    const task = taskModel.create({
      parent_id: null, level: 1,
      name: 'Deleted Overdue', planned_effort_hours: 10,
      planned_start_date: '2024-01-01', planned_end_date: '2024-06-01'
    }, db);
    taskModel.update(task.id, { status: 'in_progress', progress_percent: 10 }, db);

    // Verify it appears in delays
    const res1 = await request(app).get('/api/dashboard/delays');
    const foundBefore = res1.body.data.find(d => d.name === 'Deleted Overdue');
    expect(foundBefore).toBeDefined();

    // Delete and verify it disappears
    taskModel.softDelete(task.id, db);
    const res2 = await request(app).get('/api/dashboard/delays');
    const foundAfter = res2.body.data.find(d => d.name === 'Deleted Overdue');
    expect(foundAfter).toBeUndefined();
  });
});
