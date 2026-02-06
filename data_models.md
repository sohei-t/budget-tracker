# Data Models - Budget Tracker

## 1. Entity Relationship Diagram (Text)

```
┌──────────────────────────────────┐
│            tasks                 │
├──────────────────────────────────┤
│ PK  id              INTEGER     │
│ FK  parent_id       INTEGER     │──┐ self-referencing
│     level           INTEGER     │  │ (parent-child)
│     name            TEXT        │<─┘
│     description     TEXT        │
│     planned_start_date TEXT     │
│     planned_end_date   TEXT     │
│     planned_effort_hours REAL   │
│     status          TEXT        │
│     progress_percent REAL       │
│     progress_mode   TEXT        │
│     sort_order      INTEGER     │
│     is_deleted      INTEGER     │
│     created_at      TEXT        │
│     updated_at      TEXT        │
└──────────┬───────────────────────┘
           │ 1:N (task_id)
           │
┌──────────▼───────────────────────┐
│           actuals                │
├──────────────────────────────────┤
│ PK  id              INTEGER     │
│ FK  task_id         INTEGER     │
│     work_date       TEXT        │
│     actual_hours    REAL        │
│     notes           TEXT        │
│     created_at      TEXT        │
│     updated_at      TEXT        │
│                                  │
│ UQ  (task_id, work_date)        │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│       schema_version             │
├──────────────────────────────────┤
│ PK  version         INTEGER     │
│     applied_at      TEXT        │
└──────────────────────────────────┘
```

## 2. Task Hierarchy Rules

| Rule | Description |
|------|-------------|
| Level 1 (Major) | parent_id = NULL. Top-level items visible on the task list page. |
| Level 2 (Middle) | parent_id references a Level 1 task. Visible when drilling down into a Level 1 item. |
| Level 3 (Minor) | parent_id references a Level 2 task. Leaf-level tasks where actual work is recorded. |
| Max Depth | 3 levels only. Attempting to create a child under Level 3 returns an error. |
| Cascade Delete | Soft-deleting a parent cascades is_deleted to all descendants. |
| Cascade Status | Parent status is auto-computed from children's statuses. |

## 3. Status Values

| Value | Description | Visual |
|-------|-------------|--------|
| `not_started` | Task has not begun. No actuals, no progress. | Gray badge |
| `in_progress` | Work has started. Actuals exist or status was manually set. | Blue badge |
| `completed` | All work is done. Progress = 100%. | Green badge, gray-out row |

## 4. Progress Mode Values

| Value | Description |
|-------|-------------|
| `auto` | Progress is calculated automatically from cumulative actual hours / planned effort. For parents, it is the weighted average of children. |
| `manual` | Progress is set by the user directly. The value in progress_percent is used as-is. |

## 5. Computed Fields (Not Stored, Calculated at Runtime)

| Field | Calculation | Scope |
|-------|-------------|-------|
| `cumulative_actual_hours` | SUM(actuals.actual_hours) for this task | Per task |
| `delay_status` | Derived from dates and progress (see SPEC.md UC-004) | Per task |
| `delay_days` | today - planned_end_date (when overdue) | Per task |
| `warning_level` | 'red' / 'yellow' / 'none' based on delay thresholds | Per task |
| `children_count` | COUNT of non-deleted direct children | Per task |

## 6. Index Strategy

| Index | Columns | Purpose |
|-------|---------|---------|
| idx_tasks_parent | parent_id | Fast hierarchy queries (find children) |
| idx_tasks_level | level | Filter by hierarchy level |
| idx_tasks_status | status | Filter by task status |
| idx_tasks_deleted | is_deleted | Exclude deleted tasks efficiently |
| idx_actuals_task | task_id | Find all actuals for a task |
| idx_actuals_date | work_date | Date-based queries and sorting |

## 7. Data Integrity Constraints

| Constraint | Table | Rule |
|-----------|-------|------|
| Level range | tasks | CHECK (level BETWEEN 1 AND 3) |
| Status enum | tasks | CHECK (status IN ('not_started', 'in_progress', 'completed')) |
| Progress range | tasks | CHECK (progress_percent BETWEEN 0 AND 100) |
| Progress mode enum | tasks | CHECK (progress_mode IN ('auto', 'manual')) |
| Hours non-negative | actuals | CHECK (actual_hours >= 0) |
| Unique daily entry | actuals | UNIQUE(task_id, work_date) |
| Foreign key tasks | tasks | parent_id REFERENCES tasks(id) ON DELETE CASCADE |
| Foreign key actuals | actuals | task_id REFERENCES tasks(id) ON DELETE CASCADE |
