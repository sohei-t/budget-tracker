# API_DESIGN.md - Budget Tracker RESTful API Specification

## 1. Overview

- **Protocol:** HTTP (REST)
- **Data Format:** JSON
- **Base URL:** http://localhost:3000/api
- **Authentication:** None (LAN-accessible, single-user / shared access)
- **Content-Type:** application/json

## 2. Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Success Response (List)
```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "total": 45,
    "level": 1
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "details": [
      { "field": "name", "message": "Task name is required" }
    ]
  }
}
```

### Error Codes
| Code | HTTP Status | Usage |
|------|------------|-------|
| VALIDATION_ERROR | 400 | Input validation failures |
| NOT_FOUND | 404 | Resource does not exist or is deleted |
| HIERARCHY_ERROR | 400 | Invalid hierarchy operation |
| DATABASE_ERROR | 500 | Database operation failure |
| SERVER_ERROR | 500 | Unexpected server error |

---

## 3. Task Endpoints

### 3.1 GET /api/tasks

**Description:** List all Level 1 (Major) tasks.

**Query Parameters:** None

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "parent_id": null,
      "level": 1,
      "name": "Design Phase",
      "description": "All design-related work",
      "planned_start_date": "2026-02-10",
      "planned_end_date": "2026-02-20",
      "planned_effort_hours": 40,
      "status": "in_progress",
      "progress_percent": 87.5,
      "progress_mode": "auto",
      "sort_order": 1,
      "created_at": "2026-02-06T10:00:00.000Z",
      "updated_at": "2026-02-12T15:30:00.000Z",
      "delay_status": "on_track",
      "warning_level": "none",
      "children_count": 2
    }
  ],
  "meta": {
    "total": 5,
    "level": 1
  }
}
```

---

### 3.2 GET /api/tasks/:id

**Description:** Get a single task with computed fields.

**Path Parameters:**
- `id` (integer, required) - Task ID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "parent_id": null,
    "level": 1,
    "name": "Design Phase",
    "description": "All design-related work",
    "planned_start_date": "2026-02-10",
    "planned_end_date": "2026-02-20",
    "planned_effort_hours": 40,
    "status": "in_progress",
    "progress_percent": 87.5,
    "progress_mode": "auto",
    "sort_order": 1,
    "created_at": "2026-02-06T10:00:00.000Z",
    "updated_at": "2026-02-12T15:30:00.000Z",
    "delay_status": "on_track",
    "delay_days": 0,
    "warning_level": "none",
    "children_count": 2,
    "cumulative_actual_hours": 35.0
  }
}
```

**Error (404):**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Task not found"
  }
}
```

---

### 3.3 GET /api/tasks/:id/children

**Description:** Get direct children of a task.

**Path Parameters:**
- `id` (integer, required) - Parent task ID

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "parent_id": 1,
      "level": 2,
      "name": "Wireframes",
      "description": "Create wireframes",
      "planned_start_date": "2026-02-10",
      "planned_end_date": "2026-02-12",
      "planned_effort_hours": 15,
      "status": "completed",
      "progress_percent": 100,
      "progress_mode": "auto",
      "sort_order": 1,
      "delay_status": "on_track",
      "warning_level": "none",
      "children_count": 2
    }
  ],
  "meta": {
    "total": 2,
    "parent_id": 1,
    "parent_name": "Design Phase"
  }
}
```

---

### 3.4 POST /api/tasks

**Description:** Create a new task.

**Request Body:**
```json
{
  "parent_id": null,
  "name": "Design Phase",
  "description": "All design-related work",
  "planned_start_date": "2026-02-10",
  "planned_end_date": "2026-02-20",
  "planned_effort_hours": 40
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| parent_id | integer/null | No | Must reference existing non-deleted task; null for Level 1 |
| name | string | **Yes** | 1-200 chars, trimmed, HTML sanitized |
| description | string | No | 0-2000 chars, default "" |
| planned_start_date | string | No | ISO 8601 YYYY-MM-DD or null |
| planned_end_date | string | No | ISO 8601 YYYY-MM-DD, >= start_date |
| planned_effort_hours | number | No | >= 0, default 0 |

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "parent_id": null,
    "level": 1,
    "name": "Design Phase",
    "description": "All design-related work",
    "planned_start_date": "2026-02-10",
    "planned_end_date": "2026-02-20",
    "planned_effort_hours": 40,
    "status": "not_started",
    "progress_percent": 0,
    "progress_mode": "auto",
    "sort_order": 1,
    "created_at": "2026-02-06T10:00:00.000Z",
    "updated_at": "2026-02-06T10:00:00.000Z"
  }
}
```

**Error (400) - Validation:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "field": "name", "message": "Task name is required" },
      { "field": "planned_end_date", "message": "End date must be on or after start date" }
    ]
  }
}
```

**Error (400) - Hierarchy:**
```json
{
  "success": false,
  "error": {
    "code": "HIERARCHY_ERROR",
    "message": "Maximum hierarchy depth is 3 levels"
  }
}
```

---

### 3.5 PUT /api/tasks/:id

**Description:** Update a task's properties.

**Path Parameters:**
- `id` (integer, required) - Task ID

**Request Body:** (all fields optional, only include fields to update)
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "planned_start_date": "2026-02-11",
  "planned_end_date": "2026-02-22",
  "planned_effort_hours": 45,
  "status": "in_progress",
  "progress_mode": "manual",
  "progress_percent": 75
}
```

| Field | Type | Validation |
|-------|------|------------|
| name | string | 1-200 chars |
| description | string | 0-2000 chars |
| planned_start_date | string/null | ISO 8601 YYYY-MM-DD |
| planned_end_date | string/null | >= start_date when both set |
| planned_effort_hours | number | >= 0 |
| status | string | 'not_started' / 'in_progress' / 'completed' |
| progress_mode | string | 'auto' / 'manual' |
| progress_percent | number | 0-100 (only when progress_mode = 'manual') |

**Side Effects:**
- Changing `planned_effort_hours` triggers progress recalculation for task + ancestors
- Changing `status` to 'completed' sets progress to 100% and triggers parent recalculation
- Changing `progress_mode` to 'auto' triggers recalculation from actual hours

**Response (200):** Updated task object (same as GET response)

---

### 3.6 DELETE /api/tasks/:id

**Description:** Soft-delete a task and all descendants.

**Path Parameters:**
- `id` (integer, required) - Task ID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "deleted_task_id": 1,
    "deleted_descendants_count": 4,
    "message": "Task and 4 sub-tasks deleted"
  }
}
```

**Side Effects:**
- Sets is_deleted = 1 on the task and all descendants
- Recalculates parent progress (excluding deleted subtree)
- Associated actuals are NOT deleted (preserved for audit)

---

### 3.7 PUT /api/tasks/:id/reorder

**Description:** Update the sort order of a task.

**Request Body:**
```json
{
  "sort_order": 3
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "sort_order": 3
  }
}
```

---

## 4. Actual Endpoints

### 4.1 GET /api/tasks/:id/actuals

**Description:** Get all actual entries for a task.

**Path Parameters:**
- `id` (integer, required) - Task ID

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "task_id": 5,
      "work_date": "2026-02-12",
      "actual_hours": 5.5,
      "notes": "Finalized wireframes",
      "created_at": "2026-02-12T18:00:00.000Z",
      "updated_at": "2026-02-12T18:00:00.000Z"
    },
    {
      "id": 2,
      "task_id": 5,
      "work_date": "2026-02-11",
      "actual_hours": 7.0,
      "notes": "Created initial drafts",
      "created_at": "2026-02-11T18:00:00.000Z",
      "updated_at": "2026-02-11T18:00:00.000Z"
    }
  ],
  "meta": {
    "task_id": 5,
    "cumulative_hours": 12.5,
    "planned_effort_hours": 15,
    "entries_count": 2
  }
}
```

---

### 4.2 POST /api/tasks/:id/actuals

**Description:** Record a daily actual entry. Upserts if entry for the same task+date exists.

**Path Parameters:**
- `id` (integer, required) - Task ID

**Request Body:**
```json
{
  "work_date": "2026-02-15",
  "actual_hours": 6.5,
  "notes": "Completed wireframes for main dashboard"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| work_date | string | **Yes** | ISO 8601 YYYY-MM-DD |
| actual_hours | number | **Yes** | > 0, <= 24 |
| notes | string | No | 0-1000 chars, default "" |

**Side Effects:**
- If task status is 'not_started', auto-transitions to 'in_progress'
- Triggers progress recalculation for task + all ancestors
- If entry for same task+date exists, updates instead of creating

**Response (201 for new, 200 for upsert):**
```json
{
  "success": true,
  "data": {
    "id": 3,
    "task_id": 5,
    "work_date": "2026-02-15",
    "actual_hours": 6.5,
    "notes": "Completed wireframes for main dashboard",
    "created_at": "2026-02-15T18:00:00.000Z",
    "updated_at": "2026-02-15T18:00:00.000Z"
  },
  "meta": {
    "is_upsert": false,
    "new_cumulative_hours": 19.0,
    "new_progress_percent": 95.0
  }
}
```

---

### 4.3 PUT /api/actuals/:id

**Description:** Update an existing actual entry.

**Path Parameters:**
- `id` (integer, required) - Actual entry ID

**Request Body:**
```json
{
  "actual_hours": 7.0,
  "notes": "Updated notes"
}
```

**Side Effects:**
- Triggers progress recalculation for associated task + ancestors

**Response (200):** Updated actual object

---

### 4.4 DELETE /api/actuals/:id

**Description:** Delete an actual entry.

**Path Parameters:**
- `id` (integer, required) - Actual entry ID

**Side Effects:**
- Triggers progress recalculation for associated task + ancestors

**Response (200):**
```json
{
  "success": true,
  "data": {
    "deleted_actual_id": 3,
    "message": "Actual entry deleted"
  }
}
```

---

## 5. Dashboard Endpoints

### 5.1 GET /api/dashboard

**Description:** Get overall project summary statistics.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "total_tasks": 45,
    "completed_tasks": 12,
    "in_progress_tasks": 8,
    "not_started_tasks": 25,
    "overall_progress_percent": 26.7,
    "delayed_tasks_count": 3,
    "on_track_count": 42,
    "at_risk_count": 2,
    "overdue_count": 1,
    "by_level": {
      "level_1": { "total": 5, "completed": 1, "in_progress": 2, "not_started": 2 },
      "level_2": { "total": 15, "completed": 4, "in_progress": 3, "not_started": 8 },
      "level_3": { "total": 25, "completed": 7, "in_progress": 3, "not_started": 15 }
    },
    "major_items": [
      {
        "id": 1,
        "name": "Design Phase",
        "progress_percent": 87.5,
        "status": "in_progress",
        "delay_status": "on_track"
      }
    ]
  }
}
```

---

### 5.2 GET /api/dashboard/delays

**Description:** Get list of tasks that are overdue or at risk.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 7,
      "name": "Backend Development",
      "level": 1,
      "planned_end_date": "2026-02-01",
      "progress_percent": 30.0,
      "delay_status": "overdue",
      "delay_days": 5,
      "expected_progress": 100,
      "warning_level": "red"
    },
    {
      "id": 12,
      "name": "API Integration",
      "level": 2,
      "planned_end_date": "2026-02-20",
      "progress_percent": 25.0,
      "delay_status": "at_risk",
      "delay_days": 0,
      "expected_progress": 65.0,
      "warning_level": "yellow"
    }
  ],
  "meta": {
    "overdue_count": 1,
    "at_risk_count": 1,
    "total_delayed": 2
  }
}
```

---

## 6. Page Routes (Server-Side Rendered)

These routes serve HTML pages (EJS templates) rather than JSON.

| Method | Path | Description | Template |
|--------|------|-------------|----------|
| GET | / | Dashboard home page | views/index.ejs |
| GET | /tasks | Major items list (Level 1) | views/tasks.ejs |
| GET | /tasks/:id | Task detail with children | views/tasks.ejs |

The server-rendered pages provide the initial HTML shell. Client-side JavaScript then takes over for dynamic updates via the API endpoints above.
