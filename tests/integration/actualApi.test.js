/**
 * Integration Tests: Actual API
 *
 * Tests all actual-related API endpoints using Supertest.
 * Each test uses a fresh in-memory database for isolation.
 */

'use strict';

const request = require('supertest');
const app = require('../../src/server');
const { createTestDb, seedTestData, closeTestDb } = require('../helpers/testDb');
const { setDb } = require('../../src/models/db');
const taskModel = require('../../src/models/taskModel');
const actualModel = require('../../src/models/actualModel');

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
// GET /api/tasks/:id/actuals - Get Actuals for Task
// =========================================================================

describe('GET /api/tasks/:id/actuals', () => {
  test('should return all actuals for a task with 200 status', async () => {
    const res = await request(app).get(`/api/tasks/${ids.minor1Id}/actuals`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(2);
  });

  test('should include cumulative_hours in meta', async () => {
    const res = await request(app).get(`/api/tasks/${ids.minor1Id}/actuals`);
    expect(res.body.meta).toBeDefined();
    expect(res.body.meta.cumulative_hours).toBe(8.5); // 6.5 + 2.0
  });

  test('should include planned_effort_hours and entries_count in meta', async () => {
    const res = await request(app).get(`/api/tasks/${ids.minor1Id}/actuals`);
    expect(res.body.meta.planned_effort_hours).toBe(8);
    expect(res.body.meta.entries_count).toBe(2);
    expect(res.body.meta.task_id).toBe(ids.minor1Id);
  });

  test('should return empty array for task with no actuals', async () => {
    // major2 (Development Phase) has no actuals
    const task = taskModel.create({
      parent_id: ids.middle2Id, level: 3,
      name: 'No actuals task', planned_effort_hours: 10
    }, db);
    const res = await request(app).get(`/api/tasks/${task.id}/actuals`);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.meta.cumulative_hours).toBe(0);
  });

  test('should return 404 for non-existent task', async () => {
    const res = await request(app).get('/api/tasks/99999/actuals');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('should return 404 for deleted task', async () => {
    taskModel.softDelete(ids.minor1Id, db);
    const res = await request(app).get(`/api/tasks/${ids.minor1Id}/actuals`);
    expect(res.status).toBe(404);
  });
});

// =========================================================================
// POST /api/tasks/:id/actuals - Record Daily Actual
// =========================================================================

describe('POST /api/tasks/:id/actuals', () => {
  test('should create a new actual entry and return 201', async () => {
    const res = await request(app)
      .post(`/api/tasks/${ids.minor1Id}/actuals`)
      .send({ work_date: '2026-02-15', actual_hours: 4.5, notes: 'Work done' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.actual_hours).toBe(4.5);
    expect(res.body.meta.is_upsert).toBe(false);
  });

  test('should upsert when recording for same task+date and return 200', async () => {
    // minor1 already has an actual for 2026-02-10 (6.5h)
    const res = await request(app)
      .post(`/api/tasks/${ids.minor1Id}/actuals`)
      .send({ work_date: '2026-02-10', actual_hours: 8.0, notes: 'Updated' });
    expect(res.status).toBe(200);
    expect(res.body.meta.is_upsert).toBe(true);
    expect(res.body.data.actual_hours).toBe(8.0);
  });

  test('should include new_cumulative_hours and new_progress_percent in meta', async () => {
    const res = await request(app)
      .post(`/api/tasks/${ids.minor1Id}/actuals`)
      .send({ work_date: '2026-02-20', actual_hours: 1.5, notes: 'More work' });
    expect(res.status).toBe(201);
    expect(res.body.meta.new_cumulative_hours).toBeGreaterThan(0);
    expect(res.body.meta.new_progress_percent).toBeDefined();
  });

  test('should trigger progress recalculation for the task', async () => {
    const task = taskModel.create({
      parent_id: ids.middle2Id, level: 3,
      name: 'Progress test', planned_effort_hours: 20
    }, db);
    const res = await request(app)
      .post(`/api/tasks/${task.id}/actuals`)
      .send({ work_date: '2026-02-15', actual_hours: 5, notes: '' });
    expect(res.status).toBe(201);
    // 5/20 = 25%
    expect(res.body.meta.new_progress_percent).toBe(25);
  });

  test('should auto-transition task status to in_progress', async () => {
    const task = taskModel.create({
      parent_id: ids.middle2Id, level: 3,
      name: 'Fresh task', planned_effort_hours: 10
    }, db);
    expect(task.status).toBe('not_started');

    await request(app)
      .post(`/api/tasks/${task.id}/actuals`)
      .send({ work_date: '2026-02-15', actual_hours: 1, notes: 'Starting' });

    // Verify status changed
    const updated = taskModel.findById(task.id, db);
    expect(updated.status).toBe('in_progress');
  });

  test('should default work_date to today when not provided', async () => {
    const res = await request(app)
      .post(`/api/tasks/${ids.minor1Id}/actuals`)
      .send({ actual_hours: 2, notes: 'No date' });
    expect(res.status).toBe(201);
    const today = new Date().toISOString().slice(0, 10);
    expect(res.body.data.work_date).toBe(today);
  });

  test('should reject invalid date format (400)', async () => {
    const res = await request(app)
      .post(`/api/tasks/${ids.minor1Id}/actuals`)
      .send({ work_date: '02-15-2026', actual_hours: 4, notes: '' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('should reject actual_hours <= 0 (400)', async () => {
    const res = await request(app)
      .post(`/api/tasks/${ids.minor1Id}/actuals`)
      .send({ work_date: '2026-02-15', actual_hours: 0, notes: '' });
    expect(res.status).toBe(400);
  });

  test('should reject actual_hours > 24 (400)', async () => {
    const res = await request(app)
      .post(`/api/tasks/${ids.minor1Id}/actuals`)
      .send({ work_date: '2026-02-15', actual_hours: 25, notes: '' });
    expect(res.status).toBe(400);
  });

  test('should return 404 for non-existent task', async () => {
    const res = await request(app)
      .post('/api/tasks/99999/actuals')
      .send({ work_date: '2026-02-15', actual_hours: 4, notes: '' });
    expect(res.status).toBe(404);
  });

  test('should return 404 for deleted task', async () => {
    taskModel.softDelete(ids.minor1Id, db);
    const res = await request(app)
      .post(`/api/tasks/${ids.minor1Id}/actuals`)
      .send({ work_date: '2026-02-15', actual_hours: 4, notes: '' });
    expect(res.status).toBe(404);
  });

  test('should sanitize HTML in notes (XSS prevention)', async () => {
    const res = await request(app)
      .post(`/api/tasks/${ids.minor1Id}/actuals`)
      .send({
        work_date: '2026-02-20',
        actual_hours: 1,
        notes: '<script>alert("xss")</script>Work notes'
      });
    expect(res.status).toBe(201);
    expect(res.body.data.notes).not.toContain('<script>');
  });

  test('should accept notes with max 1000 characters', async () => {
    const res = await request(app)
      .post(`/api/tasks/${ids.minor1Id}/actuals`)
      .send({
        work_date: '2026-02-20',
        actual_hours: 1,
        notes: 'a'.repeat(1000)
      });
    expect(res.status).toBe(201);
  });

  test('should reject notes exceeding 1000 characters', async () => {
    const res = await request(app)
      .post(`/api/tasks/${ids.minor1Id}/actuals`)
      .send({
        work_date: '2026-02-20',
        actual_hours: 1,
        notes: 'a'.repeat(1001)
      });
    expect(res.status).toBe(400);
  });
});

// =========================================================================
// PUT /api/actuals/:id - Update Actual Entry
// =========================================================================

describe('PUT /api/actuals/:id', () => {
  test('should update actual hours and return 200', async () => {
    const actuals = actualModel.findByTaskId(ids.minor1Id, db);
    const actualId = actuals[0].id;
    const res = await request(app)
      .put(`/api/actuals/${actualId}`)
      .send({ actual_hours: 5.0 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.actual_hours).toBe(5.0);
  });

  test('should update notes and return 200', async () => {
    const actuals = actualModel.findByTaskId(ids.minor1Id, db);
    const actualId = actuals[0].id;
    const res = await request(app)
      .put(`/api/actuals/${actualId}`)
      .send({ notes: 'Updated notes' });
    expect(res.status).toBe(200);
    expect(res.body.data.notes).toBe('Updated notes');
  });

  test('should trigger progress recalculation on update', async () => {
    // Create a task with known effort
    const task = taskModel.create({
      parent_id: ids.middle2Id, level: 3,
      name: 'Recalc test', planned_effort_hours: 20
    }, db);
    // Record an actual
    actualModel.upsert({
      task_id: task.id, work_date: '2026-02-15', actual_hours: 5, notes: ''
    }, db);
    // Update progress first
    const progressService = require('../../src/services/progressService');
    const progress = progressService.calculateTaskProgress(task.id, db);
    taskModel.update(task.id, { progress_percent: progress }, db);

    // Get the actual ID
    const actuals = actualModel.findByTaskId(task.id, db);
    const actualId = actuals[0].id;

    // Update hours to 10
    const res = await request(app)
      .put(`/api/actuals/${actualId}`)
      .send({ actual_hours: 10 });
    expect(res.status).toBe(200);

    // Check task progress updated: 10/20 = 50%
    const updatedTask = taskModel.findById(task.id, db);
    expect(updatedTask.progress_percent).toBe(50);
  });

  test('should return 404 for non-existent actual', async () => {
    const res = await request(app)
      .put('/api/actuals/99999')
      .send({ actual_hours: 5 });
    expect(res.status).toBe(404);
  });

  test('should reject invalid actual_hours (400)', async () => {
    const actuals = actualModel.findByTaskId(ids.minor1Id, db);
    const actualId = actuals[0].id;
    const res = await request(app)
      .put(`/api/actuals/${actualId}`)
      .send({ actual_hours: -1 });
    expect(res.status).toBe(400);
  });
});

// =========================================================================
// DELETE /api/actuals/:id - Delete Actual Entry
// =========================================================================

describe('DELETE /api/actuals/:id', () => {
  test('should delete an actual entry and return 200', async () => {
    const actuals = actualModel.findByTaskId(ids.minor1Id, db);
    const actualId = actuals[0].id;
    const res = await request(app).delete(`/api/actuals/${actualId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.deleted_actual_id).toBe(actualId);
  });

  test('should trigger progress recalculation after deletion', async () => {
    // Create a task with known effort
    const task = taskModel.create({
      parent_id: ids.middle2Id, level: 3,
      name: 'Delete test', planned_effort_hours: 10
    }, db);
    // Record two actuals
    const { entry: entry1 } = actualModel.upsert({
      task_id: task.id, work_date: '2026-02-15', actual_hours: 5, notes: ''
    }, db);
    actualModel.upsert({
      task_id: task.id, work_date: '2026-02-16', actual_hours: 3, notes: ''
    }, db);
    // Set initial progress
    const progressService = require('../../src/services/progressService');
    const initialProgress = progressService.calculateTaskProgress(task.id, db);
    taskModel.update(task.id, { progress_percent: initialProgress }, db);

    // Delete one actual (5h)
    await request(app).delete(`/api/actuals/${entry1.id}`);

    // Now 3/10 = 30%
    const updatedTask = taskModel.findById(task.id, db);
    expect(updatedTask.progress_percent).toBe(30);
  });

  test('should return 404 for non-existent actual', async () => {
    const res = await request(app).delete('/api/actuals/99999');
    expect(res.status).toBe(404);
  });
});
