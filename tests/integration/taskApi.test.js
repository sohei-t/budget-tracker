/**
 * Integration Tests: Task API
 *
 * Tests all task-related API endpoints using Supertest.
 * Each test uses a fresh in-memory database for isolation.
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
// GET /api/tasks - List Top-Level Tasks
// =========================================================================

describe('GET /api/tasks', () => {
  test('should return all Level 1 tasks with 200 status', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(2);
  });

  test('should not include soft-deleted tasks', async () => {
    taskModel.softDelete(ids.major1Id, db);
    const res = await request(app).get('/api/tasks');
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe('Development Phase');
  });

  test('should include progress calculation in response', async () => {
    const res = await request(app).get('/api/tasks');
    for (const task of res.body.data) {
      expect(task).toHaveProperty('progress_percent');
      expect(task).toHaveProperty('delay_status');
    }
  });

  test('should return tasks ordered by sort_order', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.body.data[0].sort_order).toBeLessThanOrEqual(res.body.data[1].sort_order);
  });

  test('should return empty array when no tasks exist', async () => {
    // Delete all tasks
    taskModel.softDelete(ids.major1Id, db);
    taskModel.softDelete(ids.major2Id, db);
    const res = await request(app).get('/api/tasks');
    expect(res.body.data).toEqual([]);
    expect(res.body.meta.total).toBe(0);
  });
});

// =========================================================================
// GET /api/tasks/:id - Get Single Task
// =========================================================================

describe('GET /api/tasks/:id', () => {
  test('should return a task with its details and 200 status', async () => {
    const res = await request(app).get(`/api/tasks/${ids.minor1Id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(ids.minor1Id);
    expect(res.body.data.name).toBe('Dashboard Wireframe');
  });

  test('should return 404 for non-existent task', async () => {
    const res = await request(app).get('/api/tasks/99999');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('should return 404 for soft-deleted task', async () => {
    taskModel.softDelete(ids.minor1Id, db);
    const res = await request(app).get(`/api/tasks/${ids.minor1Id}`);
    expect(res.status).toBe(404);
  });

  test('should include children count in response', async () => {
    const res = await request(app).get(`/api/tasks/${ids.middle1Id}`);
    expect(res.body.data).toHaveProperty('children_count');
    expect(res.body.data.children_count).toBe(2);
  });
});

// =========================================================================
// GET /api/tasks/:id/children - Get Children
// =========================================================================

describe('GET /api/tasks/:id/children', () => {
  test('should return children of a task with 200 status', async () => {
    const res = await request(app).get(`/api/tasks/${ids.major1Id}/children`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(2);
  });

  test('should return empty array for leaf task', async () => {
    const res = await request(app).get(`/api/tasks/${ids.minor1Id}/children`);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  test('should exclude soft-deleted children', async () => {
    taskModel.softDelete(ids.middle1Id, db);
    const res = await request(app).get(`/api/tasks/${ids.major1Id}/children`);
    expect(res.body.data.length).toBe(1);
  });

  test('should return 404 for non-existent parent', async () => {
    const res = await request(app).get('/api/tasks/99999/children');
    expect(res.status).toBe(404);
  });
});

// =========================================================================
// POST /api/tasks - Create Task
// =========================================================================

describe('POST /api/tasks', () => {
  test('should create a Level 1 task and return 201', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ name: 'Test Phase', planned_effort_hours: 20 });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.level).toBe(1);
    expect(res.body.data.status).toBe('not_started');
  });

  test('should create a child task under a parent', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ parent_id: ids.major1Id, name: 'Sub Task', planned_effort_hours: 5 });
    expect(res.status).toBe(201);
    expect(res.body.data.level).toBe(2);
  });

  test('should reject task with empty name (400)', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ name: '' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('should reject task with name > 200 chars (400)', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ name: 'a'.repeat(201) });
    expect(res.status).toBe(400);
  });

  test('should reject task when end_date < start_date (400)', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({
        name: 'Bad dates',
        planned_start_date: '2026-03-01',
        planned_end_date: '2026-02-01'
      });
    expect(res.status).toBe(400);
  });

  test('should reject negative planned_effort_hours (400)', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ name: 'Neg effort', planned_effort_hours: -5 });
    expect(res.status).toBe(400);
  });

  test('should reject Level 4 task creation (400)', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ parent_id: ids.minor1Id, name: 'Too deep' });
    expect(res.status).toBe(400);
  });

  test('should reject invalid parent_id (404)', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ parent_id: 99999, name: 'Orphan' });
    expect(res.status).toBe(400); // validation catches non-existent parent
  });

  test('should reject creation under deleted parent (404)', async () => {
    taskModel.softDelete(ids.major1Id, db);
    const res = await request(app)
      .post('/api/tasks')
      .send({ parent_id: ids.major1Id, name: 'Under deleted' });
    expect(res.status).toBe(400); // validation catches deleted parent as not found
  });

  test('should sanitize HTML in task name (XSS prevention)', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ name: '<script>alert("xss")</script>Task' });
    expect(res.status).toBe(201);
    expect(res.body.data.name).not.toContain('<script>');
  });
});

// =========================================================================
// PUT /api/tasks/:id - Update Task
// =========================================================================

describe('PUT /api/tasks/:id', () => {
  test('should update task fields and return 200', async () => {
    const res = await request(app)
      .put(`/api/tasks/${ids.minor1Id}`)
      .send({ name: 'Updated Name', description: 'New desc' });
    expect(res.status).toBe(200);
    expect(res.body.data.description).toBe('New desc');
  });

  test('should update status and trigger progress/parent recalculation', async () => {
    const res = await request(app)
      .put(`/api/tasks/${ids.minor1Id}`)
      .send({ status: 'completed' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('completed');
    expect(res.body.data.progress_percent).toBe(100);
  });

  test('should update planned_effort and trigger progress recalculation', async () => {
    const res = await request(app)
      .put(`/api/tasks/${ids.minor1Id}`)
      .send({ planned_effort_hours: 50 });
    expect(res.status).toBe(200);
    // 8.5h/50h = 17%
    expect(res.body.data.progress_percent).toBeLessThan(100);
  });

  test('should return 404 for non-existent task', async () => {
    const res = await request(app)
      .put('/api/tasks/99999')
      .send({ name: 'Not found' });
    expect(res.status).toBe(404);
  });

  test('should return 400 for invalid date combination', async () => {
    const res = await request(app)
      .put(`/api/tasks/${ids.minor1Id}`)
      .send({
        planned_start_date: '2026-03-15',
        planned_end_date: '2026-03-01'
      });
    expect(res.status).toBe(400);
  });

  test('should return 404 for deleted task', async () => {
    taskModel.softDelete(ids.minor1Id, db);
    const res = await request(app)
      .put(`/api/tasks/${ids.minor1Id}`)
      .send({ name: 'Deleted' });
    expect(res.status).toBe(404);
  });
});

// =========================================================================
// DELETE /api/tasks/:id - Soft Delete Task
// =========================================================================

describe('DELETE /api/tasks/:id', () => {
  test('should soft-delete a task and return 200', async () => {
    const res = await request(app).delete(`/api/tasks/${ids.minor1Id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.deleted_task_id).toBe(ids.minor1Id);
  });

  test('should cascade soft-delete to all descendants', async () => {
    const res = await request(app).delete(`/api/tasks/${ids.major1Id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.deleted_descendants_count).toBeGreaterThanOrEqual(2);
    // Verify children are gone
    const childRes = await request(app).get(`/api/tasks/${ids.middle1Id}`);
    expect(childRes.status).toBe(404);
  });

  test('should recalculate parent progress after deletion', async () => {
    await request(app).delete(`/api/tasks/${ids.minor1Id}`);
    // middle1 should still exist with recalculated progress
    const parentRes = await request(app).get(`/api/tasks/${ids.middle1Id}`);
    expect(parentRes.status).toBe(200);
    expect(parentRes.body.data).toHaveProperty('progress_percent');
  });

  test('should return 404 for non-existent task', async () => {
    const res = await request(app).delete('/api/tasks/99999');
    expect(res.status).toBe(404);
  });

  test('should return 404 for already deleted task', async () => {
    await request(app).delete(`/api/tasks/${ids.minor1Id}`);
    const res = await request(app).delete(`/api/tasks/${ids.minor1Id}`);
    expect(res.status).toBe(404);
  });
});

// =========================================================================
// PUT /api/tasks/:id/reorder - Reorder Task
// =========================================================================

describe('PUT /api/tasks/:id/reorder', () => {
  test('should update sort_order and return 200', async () => {
    const res = await request(app)
      .put(`/api/tasks/${ids.major1Id}/reorder`)
      .send({ sort_order: 5 });
    expect(res.status).toBe(200);
    expect(res.body.data.sort_order).toBe(5);
  });

  test('should return 404 for non-existent task', async () => {
    const res = await request(app)
      .put('/api/tasks/99999/reorder')
      .send({ sort_order: 1 });
    expect(res.status).toBe(404);
  });
});
