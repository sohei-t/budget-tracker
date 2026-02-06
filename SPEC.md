# SPEC.md - Budget Tracker Detailed Specification

## 1. Use Case Details

### UC-001: Task Creation (Major / Middle / Minor)

**Actor:** User (Project Manager or Individual Contributor)

**Preconditions:**
- Application is running and accessible
- For Level 2 tasks: A Level 1 parent task exists
- For Level 3 tasks: A Level 2 parent task exists

**Main Flow:**
1. User navigates to the appropriate level view
2. User clicks "+ Add Task" button
3. System displays a modal dialog with the task creation form
4. User fills in required fields:
   - Name (required, 1-200 characters)
   - Description (optional, max 2000 characters)
   - Planned Start Date (optional, YYYY-MM-DD)
   - Planned End Date (optional, YYYY-MM-DD)
   - Planned Effort Hours (optional, >= 0, default 0)
5. User clicks "Create"
6. System validates inputs (see Validation Rules below)
7. System creates the task with:
   - `level` automatically determined from parent (parent.level + 1, or 1 if no parent)
   - `status` = "not_started"
   - `progress_percent` = 0
   - `progress_mode` = "auto"
   - `sort_order` = max(siblings.sort_order) + 1
8. System returns to the task list, showing the new task

**Alternative Flows:**
- 4a. User clicks "Cancel": Modal closes, no changes
- 6a. Validation fails: Display field-level error messages, form stays open
- 6b. Level 3 task creation attempted under Level 3 parent: System rejects with error "Maximum 3 levels allowed"

**Error Cases:**
- Empty name: "Task name is required"
- Name too long: "Task name must be 200 characters or less"
- End date before start date: "End date must be on or after start date"
- Negative effort: "Planned effort must be 0 or greater"
- Invalid parent_id: "Parent task not found" (404)
- Attempting Level 4: "Maximum hierarchy depth is 3 levels" (400)

---

### UC-002: Schedule Input (Dates, Effort)

**Actor:** User

**Preconditions:**
- Task exists and is not deleted

**Main Flow:**
1. User navigates to a task in the list
2. User clicks on a date or effort field (inline editing)
3. System converts the field to an editable input
4. User enters/modifies the value
5. User presses Enter or clicks away (blur)
6. System validates the input
7. System saves via PUT /api/tasks/:id
8. System shows brief "Saved" confirmation (toast)

**Alternative Flows:**
- 5a. User presses Escape: Reverts to original value, exits edit mode
- 6a. Validation fails: Shows inline error, field stays editable
- 7a. Server error: Shows error toast, reverts to previous value (optimistic UI rollback)

**Validation Rules:**
- `planned_start_date`: Valid ISO date (YYYY-MM-DD) or null
- `planned_end_date`: Valid ISO date, must be >= planned_start_date when both set
- `planned_effort_hours`: Number >= 0, max 99999

**Business Rules:**
- Changing planned effort triggers progress recalculation for the task and all ancestors
- Dates are stored without timezone (date-only, no time component)

---

### UC-003: Daily Actual Recording

**Actor:** User

**Preconditions:**
- Task exists and is not deleted
- Task is a leaf task (Level 3) or any task without children

**Main Flow:**
1. User navigates to a task's detail or actuals section
2. User clicks "+ Record Actual" button
3. System displays the actual entry form with:
   - Work Date (defaults to today, YYYY-MM-DD)
   - Actual Hours (required, > 0)
   - Notes (optional, max 1000 characters)
4. User fills in the form and clicks "Save"
5. System checks if an entry for this task+date already exists:
   - If exists: Update (upsert) the existing entry
   - If not: Create new entry
6. System recalculates progress for the task:
   - cumulative_actual_hours = SUM(all actuals for this task)
   - If progress_mode == 'auto' and planned_effort_hours > 0:
     - progress_percent = MIN(100, (cumulative / planned) * 100)
7. System recalculates progress for all ancestor tasks
8. System updates the display

**Alternative Flows:**
- 4a. User clicks "Cancel": Form closes, no changes
- 5a. Upsert conflict: Merge by replacing hours and appending notes

**Error Cases:**
- Missing work_date: "Work date is required"
- Invalid date format: "Date must be in YYYY-MM-DD format"
- actual_hours <= 0: "Actual hours must be greater than 0"
- actual_hours > 24: "Actual hours cannot exceed 24 per day"
- Future date beyond +1 day: "Cannot record actuals for future dates"

---

### UC-004: Progress Viewing (Auto-Calculated)

**Actor:** User (including LAN viewers)

**Preconditions:**
- Application is running

**Main Flow:**
1. User views any task list or task detail
2. System automatically calculates and displays:
   - Progress percentage (%) with progress bar
   - Status badge (Not Started / In Progress / Completed)
   - Delay indicator (On Track / At Risk / Overdue)
3. For parent tasks, progress is aggregated from children

**Progress Calculation Logic:**

```
Leaf Task (no children):
  IF progress_mode == 'manual':
    RETURN progress_percent (user-set value)
  IF progress_mode == 'auto':
    cumulative = SUM(actuals.actual_hours WHERE task_id = this.id)
    IF planned_effort_hours > 0:
      RETURN MIN(100, ROUND(cumulative / planned_effort_hours * 100, 1))
    ELSE:
      IF status == 'completed': RETURN 100
      ELSE: RETURN 0

Parent Task:
  children = active children (is_deleted = 0)
  IF children.length == 0: RETURN 0
  total_weighted = SUM(child.progress_percent * child.planned_effort_hours) for each child
  total_effort = SUM(child.planned_effort_hours) for each child
  IF total_effort > 0:
    RETURN ROUND(total_weighted / total_effort, 1)
  ELSE:
    RETURN ROUND(AVG(child.progress_percent), 1)  // Equal weight fallback
```

**Delay Detection Logic:**

```
today = current date (YYYY-MM-DD)

IF planned_end_date IS NULL OR planned_start_date IS NULL:
  delay_status = 'unknown'  // Cannot calculate without dates

ELSE IF today > planned_end_date AND progress_percent < 100:
  delay_status = 'overdue'
  delay_days = today - planned_end_date

ELSE IF today > planned_start_date:
  total_duration = planned_end_date - planned_start_date (in days)
  IF total_duration > 0:
    elapsed_days = today - planned_start_date
    elapsed_ratio = elapsed_days / total_duration
    expected_progress = elapsed_ratio * 100
    IF progress_percent < expected_progress * 0.75:
      delay_status = 'at_risk'
    ELSE:
      delay_status = 'on_track'
  ELSE:
    delay_status = 'on_track'  // Same-day task

ELSE:
  delay_status = 'not_started'  // Before planned start
```

**Warning Thresholds (FR-14):**
- Yellow (at_risk): > 80% of planned duration elapsed with < 60% progress
- Red (overdue): Past due date with < 100% progress

---

### UC-005: Task Edit / Delete

**Actor:** User

**Preconditions:**
- Task exists and is not deleted

**Edit Flow:**
1. User clicks on a task field (inline edit) or clicks "Edit" button
2. System enters edit mode (inline or modal)
3. User modifies fields
4. System validates changes
5. System saves via PUT /api/tasks/:id
6. System recalculates progress if effort or status changed
7. System displays "Saved" confirmation

**Delete Flow:**
1. User clicks "Delete" button on a task
2. System checks if task has children
3. If has children: Display confirmation dialog:
   "Delete '{taskName}' and all {N} sub-tasks? This cannot be undone."
4. User confirms deletion
5. System performs soft-delete (is_deleted = 1) on the task and all descendants
6. System recalculates parent progress (excluding deleted children)
7. Task disappears from the list

**Error Cases:**
- Editing a deleted task: "Task not found" (404)
- Concurrent edit conflict: Last-write-wins (no versioning for simplicity)

**Business Rules:**
- Soft delete: `is_deleted = 1` rather than physical deletion
- Cascade: All descendant tasks also marked as deleted
- Associated actuals are NOT deleted (preserved for audit trail)
- After deletion, parent task progress is recalculated excluding the deleted subtree

---

### UC-006: Drill-Down Navigation

**Actor:** User

**Preconditions:**
- Application is loaded

**Main Flow:**
1. User is on the top page, seeing all Level 1 (Major) items
2. User clicks on a Level 1 task name
3. System navigates to that task's detail view showing:
   - Task properties (name, dates, effort, progress, status)
   - List of Level 2 (Middle) children
4. User clicks on a Level 2 task name
5. System navigates to that task's detail view showing:
   - Task properties
   - List of Level 3 (Minor) children
6. Breadcrumb shows: Home > Major Item > Middle Item

**Breadcrumb Behavior:**
- Always shows: Home (click to go to root) > [Level 1 name] > [Level 2 name] (if applicable)
- Clicking any breadcrumb segment navigates to that level
- Browser back button also navigates back through the hierarchy

**URL Structure:**
```
/tasks                → Level 1 list (all major items)
/tasks/:id            → Task detail + children list
```

**Client-Side Routing:**
```
#/                    → Dashboard
#/tasks               → Level 1 list
#/tasks/:id           → Task detail with children
```

---

### UC-007: Dashboard Viewing

**Actor:** User

**Preconditions:**
- Application is running

**Main Flow:**
1. User navigates to the dashboard (home page / route)
2. System queries GET /api/dashboard
3. System displays summary widgets:
   - Total Tasks (count of all non-deleted tasks)
   - Completed Tasks (count and percentage)
   - In Progress Tasks (count)
   - Not Started Tasks (count)
   - Overall Progress (weighted average of Level 1 tasks)
   - Delayed Tasks Count (overdue + at_risk)
4. System displays a "Delayed Tasks" panel listing tasks that are overdue or at risk, sorted by severity

**Dashboard Data Structure:**
```json
{
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
    "level_1": { "total": 5, "completed": 1 },
    "level_2": { "total": 15, "completed": 4 },
    "level_3": { "total": 25, "completed": 7 }
  }
}
```

---

### UC-008: Search and Filtering

**Actor:** User

**Preconditions:**
- Application is loaded, tasks exist

**Main Flow:**
1. User types in the search bar at the top of any task list
2. System filters tasks in real-time (client-side) as user types
3. Matching is case-insensitive on task name and description

**Filter Options:**
- **Status filter:** All / Not Started / In Progress / Completed
- **Delay filter:** All / On Track / At Risk / Overdue
- **Date range:** Start date from / to (filters by planned dates)

**Behavior:**
- Filters are combinable (AND logic)
- Clearing the search bar resets to showing all tasks at current level
- Filter state is preserved during the session but not persisted
- Search scope is limited to the current drill-down level (not global)

---

## 2. Screen Specifications

### 2.1 Dashboard Screen (Route: / or #/)

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  Budget Tracker                              [Tasks] [+New] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ Total    │ │ Complete │ │ In       │ │ Delayed  │      │
│  │ Tasks    │ │ Tasks    │ │ Progress │ │ Tasks    │      │
│  │   45     │ │  12 (27%)│ │    8     │ │    3     │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                             │
│  Overall Progress                                           │
│  ████████████░░░░░░░░░░░░░░░░░░░░░░░░ 27%                │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Delayed Tasks                                           ││
│  │ ● [OVERDUE] Design Phase - 5 days behind    [View →]   ││
│  │ ● [AT RISK] Backend Dev  - 60% expected, 30% actual    ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Major Items Summary                                     ││
│  │ ┌─ Design Phase        ████████████████████ 100% ✓     ││
│  │ ├─ Development Phase   ██████████░░░░░░░░░  50%        ││
│  │ ├─ Testing Phase       ███░░░░░░░░░░░░░░░░  15%        ││
│  │ └─ Deployment          ░░░░░░░░░░░░░░░░░░░   0%        ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Elements:**
- Header: Application name, navigation links (Dashboard, Tasks), "+ New Task" button
- Summary Cards: 4 stat cards (total, completed, in progress, delayed)
- Overall Progress Bar: Full-width bar showing weighted overall progress
- Delayed Tasks Panel: List of overdue/at-risk tasks with severity and quick-view link
- Major Items Summary: Mini list of Level 1 tasks with individual progress bars

---

### 2.2 Task List Screen (Route: /tasks or #/tasks)

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  Budget Tracker                              [Home] [+New]  │
├─────────────────────────────────────────────────────────────┤
│  Home > Tasks                                               │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Search: [________________]  Status: [All ▼]  Date: [...] ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌──────┬──────────────┬───────────┬─────────┬────────┬───┐│
│  │ #    │ Task Name    │ Schedule  │ Progress│ Status │   ││
│  ├──────┼──────────────┼───────────┼─────────┼────────┼───┤│
│  │ 1    │ Design Phase │ 02/10-20  │ ████ 100│ ✓ Done │ ⋮ ││
│  │      │              │ 40h plan  │         │        │   ││
│  ├──────┼──────────────┼───────────┼─────────┼────────┼───┤│
│  │ 2    │ Development  │ 02/15-28  │ ██░░ 50%│ ● Prog │ ⋮ ││
│  │      │ Phase        │ 120h plan │         │ ⚠ Risk │   ││
│  ├──────┼──────────────┼───────────┼─────────┼────────┼───┤│
│  │ 3    │ Testing      │ 03/01-05  │ █░░░ 15%│ ● Prog │ ⋮ ││
│  │      │ Phase        │ 60h plan  │         │        │   ││
│  └──────┴──────────────┴───────────┴─────────┴────────┴───┘│
│                                                             │
│  Showing 3 of 3 major items                                 │
└─────────────────────────────────────────────────────────────┘
```

**Elements:**
- Breadcrumb: Shows navigation path
- Search/Filter Bar: Text search, status dropdown, date range
- Task Table: Sortable columns
  - Row number / sort handle
  - Task Name (clickable for drill-down)
  - Schedule (planned dates + effort summary)
  - Progress (visual bar + percentage)
  - Status (badge + delay indicator)
  - Actions menu (edit, delete, record actual)
- Completed tasks: Entire row has reduced opacity (0.55), name has strikethrough

**Row Interactions:**
- Click task name: Navigate to drill-down (children view)
- Click date/effort cell: Inline edit
- Click "..." menu: Show actions (Edit, Delete, Record Actual)

---

### 2.3 Task Detail / Children Screen (Route: /tasks/:id or #/tasks/:id)

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  Budget Tracker                              [Home] [+New]  │
├─────────────────────────────────────────────────────────────┤
│  Home > Design Phase                                        │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Design Phase                          [Edit] [Delete]   ││
│  │                                                         ││
│  │ Description: All design-related work                    ││
│  │ Schedule: 2026-02-10 ~ 2026-02-20  (40h planned)       ││
│  │ Actual: 35h recorded                                    ││
│  │ Progress: ██████████████████████████████████ 87.5%      ││
│  │ Status: ● In Progress    Delay: ✓ On Track             ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  Sub-Tasks (3)                              [+ Add Sub-Task]│
│  ┌──────┬──────────────┬───────────┬─────────┬────────┬───┐│
│  │ #    │ Task Name    │ Schedule  │ Progress│ Status │   ││
│  ├──────┼──────────────┼───────────┼─────────┼────────┼───┤│
│  │ 1    │ Wireframes   │ 02/10-12  │ ████100%│ ✓ Done │ ⋮ ││
│  │ 2    │ UI Design    │ 02/12-17  │ ██░░ 70%│ ● Prog │ ⋮ ││
│  │ 3    │ Review       │ 02/18-20  │ ░░░░  0%│ ○ Wait │ ⋮ ││
│  └──────┴──────────────┴───────────┴─────────┴────────┴───┘│
│                                                             │
│  Actuals History                            [+ Record]      │
│  ┌────────────┬─────────┬──────────────────────────────────┐│
│  │ 2026-02-10 │  6.5h   │ Completed wireframe drafts       ││
│  │ 2026-02-11 │  7.0h   │ UI mockups v1                    ││
│  │ 2026-02-12 │  5.5h   │ Stakeholder feedback round       ││
│  └────────────┴─────────┴──────────────────────────────────┘│
│  Cumulative: 19.0h / 40.0h planned                          │
└─────────────────────────────────────────────────────────────┘
```

**Elements:**
- Breadcrumb: Full path
- Task Header Card: Name, description, schedule, progress bar, status, delay indicator
- Sub-Tasks Table: Same format as task list, showing children
- Actuals History: Chronological list of daily recordings with date, hours, notes
- Cumulative summary: Total actual vs planned

---

### 2.4 Task Create/Edit Modal

**Layout:**
```
┌─────────────────────────────────────────────┐
│  Create New Task                     [X]    │
├─────────────────────────────────────────────┤
│                                             │
│  Task Name *                                │
│  [________________________________]         │
│                                             │
│  Description                                │
│  [________________________________]         │
│  [________________________________]         │
│                                             │
│  Planned Start Date     Planned End Date    │
│  [YYYY-MM-DD    ]      [YYYY-MM-DD    ]    │
│                                             │
│  Planned Effort (hours)                     │
│  [________]                                 │
│                                             │
│  Status                  Progress Mode      │
│  [Not Started ▼]        [Auto ▼]           │
│                                             │
│  (Edit only:)                               │
│  Progress % (manual mode only)              │
│  [___] %                                    │
│                                             │
│         [Cancel]  [Create / Save]           │
└─────────────────────────────────────────────┘
```

**Form Fields:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| name | text | Yes | 1-200 chars |
| description | textarea | No | 0-2000 chars |
| planned_start_date | date | No | Valid date |
| planned_end_date | date | No | >= start_date |
| planned_effort_hours | number | No | >= 0 |
| status | select | No (edit) | not_started / in_progress / completed |
| progress_mode | select | No (edit) | auto / manual |
| progress_percent | number | No (manual mode) | 0-100 |

**Behavior:**
- Create mode: Only name, description, dates, effort shown
- Edit mode: Status, progress_mode, and progress_percent (if manual) also shown
- When status is changed to "completed", progress_percent is set to 100
- When progress_mode changes to "auto", progress_percent is recalculated from actuals

---

### 2.5 Actual Recording Form

**Layout:**
```
┌─────────────────────────────────────────────┐
│  Record Daily Actual                 [X]    │
│  Task: UI Design                            │
├─────────────────────────────────────────────┤
│                                             │
│  Work Date *                                │
│  [2026-02-10    ]  (defaults to today)      │
│                                             │
│  Hours Worked *                             │
│  [____] hours                               │
│                                             │
│  Notes                                      │
│  [________________________________]         │
│  [________________________________]         │
│                                             │
│  ℹ Existing record for this date will be    │
│    updated with new values.                 │
│                                             │
│         [Cancel]  [Save]                    │
└─────────────────────────────────────────────┘
```

---

## 3. Data Model Details

### 3.1 Task Entity

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | auto | Unique identifier |
| parent_id | INTEGER | FOREIGN KEY -> tasks(id), NULLABLE | NULL | Parent task ID (NULL for Level 1) |
| level | INTEGER | CHECK (1-3) | - | Hierarchy level |
| name | TEXT | NOT NULL, 1-200 chars | - | Task name |
| description | TEXT | 0-2000 chars | '' | Optional description |
| planned_start_date | TEXT | ISO 8601 YYYY-MM-DD | NULL | Planned start |
| planned_end_date | TEXT | ISO 8601 YYYY-MM-DD | NULL | Planned end |
| planned_effort_hours | REAL | >= 0 | 0 | Total planned hours |
| status | TEXT | IN ('not_started','in_progress','completed') | 'not_started' | Current status |
| progress_percent | REAL | 0-100 | 0 | Calculated or manual progress |
| progress_mode | TEXT | IN ('auto','manual') | 'auto' | Calculation mode |
| sort_order | INTEGER | >= 0 | 0 | Display order within siblings |
| is_deleted | INTEGER | 0 or 1 | 0 | Soft delete flag |
| created_at | TEXT | ISO 8601 datetime | datetime('now') | Creation timestamp |
| updated_at | TEXT | ISO 8601 datetime | datetime('now') | Last update timestamp |

### 3.2 Actual Entity

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | auto | Unique identifier |
| task_id | INTEGER | FOREIGN KEY -> tasks(id), NOT NULL | - | Associated task |
| work_date | TEXT | ISO 8601 YYYY-MM-DD, NOT NULL | - | Date of work |
| actual_hours | REAL | >= 0, NOT NULL | 0 | Hours worked |
| notes | TEXT | 0-1000 chars | '' | Optional work notes |
| created_at | TEXT | ISO 8601 datetime | datetime('now') | Creation timestamp |
| updated_at | TEXT | ISO 8601 datetime | datetime('now') | Last update timestamp |

**Unique Constraint:** (task_id, work_date) -- One entry per task per day

### 3.3 Schema Version Entity

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| version | INTEGER | PRIMARY KEY | - | Schema version number |
| applied_at | TEXT | ISO 8601 datetime | datetime('now') | Migration timestamp |

### 3.4 Validation Rules

#### Server-Side (middleware/validator.js)

**Task Creation:**
```javascript
{
  name: { required: true, type: 'string', minLength: 1, maxLength: 200, trim: true },
  description: { required: false, type: 'string', maxLength: 2000, default: '' },
  parent_id: { required: false, type: 'integer', min: 1, nullable: true },
  planned_start_date: { required: false, type: 'date', format: 'YYYY-MM-DD', nullable: true },
  planned_end_date: { required: false, type: 'date', format: 'YYYY-MM-DD', nullable: true },
  planned_effort_hours: { required: false, type: 'number', min: 0, max: 99999, default: 0 }
}
```

**Cross-Field Validation:**
- If both dates provided: `planned_end_date >= planned_start_date`
- If parent_id provided: Parent must exist, parent.is_deleted == 0, parent.level < 3

**Task Update:**
- Same as creation plus:
  - status: { type: 'string', enum: ['not_started', 'in_progress', 'completed'] }
  - progress_mode: { type: 'string', enum: ['auto', 'manual'] }
  - progress_percent: { type: 'number', min: 0, max: 100 } (only when progress_mode == 'manual')

**Actual Recording:**
```javascript
{
  work_date: { required: true, type: 'date', format: 'YYYY-MM-DD' },
  actual_hours: { required: true, type: 'number', min: 0.1, max: 24 },
  notes: { required: false, type: 'string', maxLength: 1000, default: '' }
}
```

#### Client-Side (public/js/utils/validation.js)
- Mirrors server-side rules for immediate feedback
- HTML5 required/pattern attributes for basic validation
- Custom JavaScript validation before fetch() calls

### 3.5 Business Rules

#### Progress Calculation

1. **Leaf Task (auto mode):**
   `progress = MIN(100, ROUND(cumulative_actual / planned_effort * 100, 1))`
   - If planned_effort == 0: progress = (status == 'completed') ? 100 : 0

2. **Leaf Task (manual mode):**
   `progress = user-set progress_percent`

3. **Parent Task (always auto-aggregated):**
   `progress = ROUND(SUM(child.progress * child.effort) / SUM(child.effort), 1)`
   - If all children have effort == 0: use equal-weight average
   - Only non-deleted children are included

4. **Status Auto-Update for Parents:**
   - All children completed -> parent status = 'completed', progress = 100
   - Any child in_progress or has actuals -> parent status = 'in_progress'
   - All children not_started -> parent status = 'not_started'

5. **Cascading Progress Recalculation:**
   - When a child's progress changes, recalculate all ancestors up to Level 1
   - This happens on: actual recording, status change, effort change, task deletion

---

## 4. State Transitions

### 4.1 Task Status State Machine

```
                  ┌───────────────┐
                  │  not_started  │ (initial)
                  └───────┬───────┘
                          │ First actual recorded
                          │ OR manual status change
                          ▼
                  ┌───────────────┐
               ┌─>│  in_progress  │<──┐
               │  └───────┬───────┘   │
               │          │           │
               │          │ progress  │ Re-opened
               │          │ reaches   │ (child un-completed
               │          │ 100%      │  or manual change)
               │          │ OR manual │
               │          ▼           │
               │  ┌───────────────┐   │
               │  │   completed   │───┘
               │  └───────────────┘
               │
               └── Reverted (manual change or child un-completed)
```

**Transition Rules:**
| From | To | Trigger |
|------|----|---------|
| not_started | in_progress | First actual recorded for task; or manual status change |
| not_started | completed | Manual status change (edge case) |
| in_progress | completed | Progress reaches 100%; or all children completed; or manual change |
| in_progress | not_started | All actuals deleted (edge case); manual revert |
| completed | in_progress | Manual status change; or child un-completed |

### 4.2 Parent Auto-Status Rules

When any child status changes, the parent status is recalculated:

```
children = non-deleted children of this parent
completed_count = children.filter(c => c.status == 'completed').length
in_progress_count = children.filter(c => c.status == 'in_progress').length

IF completed_count == children.length:
  parent.status = 'completed'
  parent.progress_percent = 100
ELSE IF in_progress_count > 0 OR completed_count > 0:
  parent.status = 'in_progress'
  parent.progress_percent = calculated from children
ELSE:
  parent.status = 'not_started'
  parent.progress_percent = 0
```

### 4.3 Delay Status Transitions

```
┌──────────────┐
│  not_started │ (before planned_start_date)
└──────┬───────┘
       │ today >= planned_start_date
       ▼
┌──────────────┐  progress < expected * 0.75   ┌──────────────┐
│   on_track   │ ───────────────────────────>  │   at_risk    │
└──────────────┘  <───────────────────────────  └──────────────┘
                  progress catches up                  │
                                              today > planned_end
                                              AND progress < 100
                                                       ▼
                                               ┌──────────────┐
                                               │   overdue    │
                                               └──────────────┘
```

---

## 5. API Response Format Standards

### 5.1 Success Response

```json
{
  "success": true,
  "data": { ... }
}
```

For list endpoints:
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

### 5.2 Error Response

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

### 5.3 Error Codes

| Code | HTTP Status | Description |
|------|------------|-------------|
| VALIDATION_ERROR | 400 | Input validation failed |
| NOT_FOUND | 404 | Resource not found |
| HIERARCHY_ERROR | 400 | Invalid hierarchy operation (e.g., Level 4) |
| DATABASE_ERROR | 500 | Database operation failed |
| SERVER_ERROR | 500 | Unexpected server error |

---

## 6. Performance Requirements

| Metric | Target | Measurement Method |
|--------|--------|--------------------|
| Initial page load | < 2 seconds | First Contentful Paint |
| API response (CRUD) | < 200ms | Server-side timing |
| Progress recalculation | < 100ms | For up to 100 tasks in subtree |
| Dashboard aggregation | < 500ms | For up to 1000 total tasks |
| Client-side filtering | < 50ms | For up to 100 visible tasks |

---

## 7. Accessibility Requirements (WCAG 2.1 AA)

- Color contrast ratio >= 4.5:1 for all text
- All interactive elements focusable via Tab key
- Enter/Space to activate buttons and links
- Escape to close modals and cancel inline edits
- ARIA labels on progress bars, status badges, and icons
- Screen reader announces status changes (aria-live regions)
- Focus trap within modal dialogs
