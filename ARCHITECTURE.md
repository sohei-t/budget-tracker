# ARCHITECTURE.md - Budget Tracker (Conservative Architecture)

## 1. Architecture Overview

### 1.1 Architecture Style: Monolithic MVC
A single Node.js + Express application using a classic Model-View-Controller pattern. This is chosen for:
- Proven reliability and simplicity
- Easy debugging and deployment
- Single process = single SQLite connection = data consistency
- Minimal operational complexity

### 1.2 System Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Client (Browser)                      │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ Dashboard │  │ Task List│  │ Task     │             │
│  │ Page      │  │ Page     │  │ Detail   │             │
│  └──────────┘  └──────────┘  └──────────┘             │
│         │              │             │                   │
│         └──────────────┼─────────────┘                  │
│                        │                                │
│              ┌─────────┴─────────┐                     │
│              │  Vanilla JS + CSS  │                     │
│              │  (fetch API calls) │                     │
│              └─────────┬─────────┘                     │
└────────────────────────┼────────────────────────────────┘
                         │ HTTP (REST API)
                         │ LAN: 0.0.0.0:3000
┌────────────────────────┼────────────────────────────────┐
│                  Express Server                          │
│                                                         │
│  ┌─────────────────────┴────────────────────┐          │
│  │              Router Layer                 │          │
│  │  /api/tasks  /api/actuals  /api/dashboard│          │
│  └─────────────────────┬────────────────────┘          │
│                        │                                │
│  ┌─────────────────────┴────────────────────┐          │
│  │           Controller Layer                │          │
│  │  taskController  actualController         │          │
│  │  dashboardController                      │          │
│  └─────────────────────┬────────────────────┘          │
│                        │                                │
│  ┌─────────────────────┴────────────────────┐          │
│  │            Service Layer                  │          │
│  │  taskService  actualService               │          │
│  │  progressService  dashboardService        │          │
│  └─────────────────────┬────────────────────┘          │
│                        │                                │
│  ┌─────────────────────┴────────────────────┐          │
│  │             Model Layer                   │          │
│  │  Task  Actual  (SQLite via better-sqlite3)│          │
│  └─────────────────────┬────────────────────┘          │
│                        │                                │
└────────────────────────┼────────────────────────────────┘
                         │
                   ┌─────┴─────┐
                   │  SQLite   │
                   │  (WAL)    │
                   │  data.db  │
                   └───────────┘
```

### 1.3 Technology Stack

| Layer | Technology | Version | Reason |
|-------|-----------|---------|--------|
| Runtime | Node.js | 18+ LTS | Stable, widely supported |
| Framework | Express | 4.x | Industry standard, minimal overhead |
| Database | SQLite3 | via better-sqlite3 | Synchronous API, faster than node-sqlite3, no native compilation issues |
| Template | EJS | 3.x | Server-side rendering for initial page, simple syntax |
| Frontend JS | Vanilla JS | ES2020+ | No build step, no framework overhead |
| CSS | Custom CSS | - | No CSS framework dependency, simple and maintainable |
| Testing | Jest + Supertest | 29.x | Standard Node.js testing stack |

### 1.4 NPM Dependencies (Minimal)

**Production (< 10):**
```json
{
  "express": "^4.18.0",
  "better-sqlite3": "^9.0.0",
  "ejs": "^3.1.0",
  "helmet": "^7.0.0",
  "compression": "^1.7.0",
  "morgan": "^1.10.0",
  "cors": "^2.8.0"
}
```

**Development:**
```json
{
  "jest": "^29.0.0",
  "supertest": "^6.0.0",
  "nodemon": "^3.0.0"
}
```

---

## 2. Database Schema Design

### 2.1 Entity Relationship

```
tasks (1) ──────< actuals (N)
  │
  │ parent_id (self-referencing)
  │
tasks (parent) ──────< tasks (children)
```

### 2.2 Tables

#### tasks
```sql
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id INTEGER DEFAULT NULL,
  level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 3),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  planned_start_date TEXT DEFAULT NULL,    -- ISO 8601: YYYY-MM-DD
  planned_end_date TEXT DEFAULT NULL,      -- ISO 8601: YYYY-MM-DD
  planned_effort_hours REAL DEFAULT 0,     -- Planned total hours
  status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'in_progress', 'completed')),
  progress_percent REAL DEFAULT 0
    CHECK (progress_percent BETWEEN 0 AND 100),
  progress_mode TEXT NOT NULL DEFAULT 'auto'
    CHECK (progress_mode IN ('auto', 'manual')),
  sort_order INTEGER DEFAULT 0,
  is_deleted INTEGER DEFAULT 0,            -- Soft delete flag
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (parent_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE INDEX idx_tasks_parent ON tasks(parent_id);
CREATE INDEX idx_tasks_level ON tasks(level);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_deleted ON tasks(is_deleted);
```

#### actuals
```sql
CREATE TABLE actuals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  work_date TEXT NOT NULL,                 -- ISO 8601: YYYY-MM-DD
  actual_hours REAL NOT NULL DEFAULT 0
    CHECK (actual_hours >= 0),
  notes TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  UNIQUE(task_id, work_date)               -- One entry per task per day
);

CREATE INDEX idx_actuals_task ON actuals(task_id);
CREATE INDEX idx_actuals_date ON actuals(work_date);
```

### 2.3 Seed Data / Initial Setup

Database is auto-created on first launch if not present. Schema migration is handled via a simple versioning table:

```sql
CREATE TABLE schema_version (
  version INTEGER PRIMARY KEY,
  applied_at TEXT DEFAULT (datetime('now'))
);
```

---

## 3. API Design (RESTful)

### 3.1 Task Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/tasks | List top-level (Level 1) tasks |
| GET | /api/tasks/:id | Get single task with children |
| GET | /api/tasks/:id/children | Get direct children of a task |
| POST | /api/tasks | Create new task |
| PUT | /api/tasks/:id | Update task properties |
| DELETE | /api/tasks/:id | Soft-delete task (cascades) |
| PUT | /api/tasks/:id/reorder | Update sort order |

### 3.2 Actual Recording Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/tasks/:id/actuals | Get all actuals for a task |
| POST | /api/tasks/:id/actuals | Record daily actual (upsert by date) |
| PUT | /api/actuals/:id | Update an actual entry |
| DELETE | /api/actuals/:id | Delete an actual entry |

### 3.3 Dashboard Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/dashboard | Get overall project summary stats |
| GET | /api/dashboard/delays | Get list of delayed tasks |

### 3.4 Page Routes (Server-Side Rendered)

| Method | Path | Description |
|--------|------|-------------|
| GET | / | Dashboard / Home page |
| GET | /tasks | Major items list (Level 1) |
| GET | /tasks/:id | Task detail with children drill-down |

### 3.5 Request/Response Examples

**POST /api/tasks**
```json
// Request
{
  "parent_id": null,
  "name": "Design Phase",
  "description": "All design-related work",
  "planned_start_date": "2026-02-10",
  "planned_end_date": "2026-02-20",
  "planned_effort_hours": 40
}

// Response (201)
{
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
  "sort_order": 0,
  "created_at": "2026-02-06T10:00:00.000Z",
  "updated_at": "2026-02-06T10:00:00.000Z"
}
```

**POST /api/tasks/:id/actuals**
```json
// Request
{
  "work_date": "2026-02-10",
  "actual_hours": 6.5,
  "notes": "Completed wireframes for main dashboard"
}

// Response (201)
{
  "id": 1,
  "task_id": 3,
  "work_date": "2026-02-10",
  "actual_hours": 6.5,
  "notes": "Completed wireframes for main dashboard",
  "created_at": "2026-02-10T18:00:00.000Z"
}
```

**GET /api/dashboard**
```json
// Response
{
  "total_tasks": 45,
  "completed_tasks": 12,
  "in_progress_tasks": 8,
  "not_started_tasks": 25,
  "overall_progress_percent": 26.7,
  "delayed_tasks_count": 3,
  "on_track_count": 42,
  "at_risk_count": 5
}
```

---

## 4. Frontend Architecture

### 4.1 Page Structure

```
/                          → Dashboard (summary stats, charts)
/tasks                     → Major items list (Level 1 grid)
/tasks/:id                 → Task detail + children list (drill-down)
```

### 4.2 Component Structure (Vanilla JS Modules)

```
public/
├── index.html             → Main SPA shell (EJS template)
├── css/
│   ├── main.css           → Global styles, variables, layout
│   ├── components.css     → Reusable component styles
│   └── responsive.css     → Media queries for tablet support
├── js/
│   ├── app.js             → Main application entry point
│   ├── api.js             → API client (fetch wrapper)
│   ├── router.js          → Simple client-side hash router
│   ├── components/
│   │   ├── taskList.js    → Task list rendering
│   │   ├── taskForm.js    → Task create/edit form
│   │   ├── taskRow.js     → Individual task row with progress bar
│   │   ├── actualForm.js  → Daily actual input form
│   │   ├── breadcrumb.js  → Breadcrumb navigation
│   │   ├── dashboard.js   → Dashboard summary widgets
│   │   ├── searchBar.js   → Search and filter UI
│   │   └── progressBar.js → Reusable progress bar component
│   └── utils/
│       ├── dates.js       → Date formatting/comparison helpers
│       ├── dom.js         → DOM manipulation helpers
│       └── validation.js  → Client-side validation
└── assets/
    └── icons/             → SVG icons (minimal set)
```

### 4.3 CSS Design System

```css
:root {
  /* Status Colors */
  --color-not-started: #9e9e9e;
  --color-in-progress: #2196f3;
  --color-completed: #4caf50;
  --color-delayed: #f44336;
  --color-at-risk: #ff9800;

  /* Progress Bar */
  --progress-bg: #e0e0e0;
  --progress-fill: #4caf50;

  /* Completed Task Overlay */
  --completed-opacity: 0.55;

  /* Layout */
  --max-width: 1200px;
  --sidebar-width: 0; /* No sidebar, simple layout */
}
```

### 4.4 Interaction Patterns

1. **Inline Editing**: Click task name or dates to edit in-place. Escape to cancel, Enter/blur to save.
2. **Modal Dialogs**: New task creation and actual entry use lightweight modal dialogs.
3. **Optimistic UI**: Updates shown immediately, reverted on server error.
4. **Auto-save**: Changes debounced (300ms) and auto-saved.

---

## 5. Directory Structure

```
project/
├── public/                    → Static assets (served by Express)
│   ├── css/
│   ├── js/
│   └── assets/
├── views/                     → EJS templates
│   ├── layout.ejs
│   ├── index.ejs              → Dashboard
│   ├── tasks.ejs              → Task list
│   └── partials/
│       ├── header.ejs
│       ├── breadcrumb.ejs
│       └── taskRow.ejs
├── src/
│   ├── server.js              → Express app setup + LAN binding
│   ├── routes/
│   │   ├── taskRoutes.js
│   │   ├── actualRoutes.js
│   │   └── dashboardRoutes.js
│   ├── controllers/
│   │   ├── taskController.js
│   │   ├── actualController.js
│   │   └── dashboardController.js
│   ├── services/
│   │   ├── taskService.js
│   │   ├── actualService.js
│   │   ├── progressService.js → Progress/delay calculation engine
│   │   └── dashboardService.js
│   ├── models/
│   │   ├── db.js              → SQLite connection + initialization
│   │   ├── taskModel.js
│   │   └── actualModel.js
│   ├── middleware/
│   │   ├── errorHandler.js
│   │   ├── validator.js       → Input validation middleware
│   │   └── sanitizer.js       → XSS sanitization
│   └── utils/
│       ├── dateUtils.js
│       └── networkUtils.js    → LAN IP detection
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   │   ├── taskService.test.js
│   │   │   ├── progressService.test.js
│   │   │   └── actualService.test.js
│   │   └── models/
│   │       ├── taskModel.test.js
│   │       └── actualModel.test.js
│   ├── integration/
│   │   ├── taskApi.test.js
│   │   ├── actualApi.test.js
│   │   └── dashboardApi.test.js
│   └── helpers/
│       └── testDb.js          → In-memory SQLite for tests
├── data/                      → SQLite database file location
│   └── .gitkeep
├── package.json
├── launch_app.command
└── README.md
```

---

## 6. Progress & Delay Calculation Logic

### 6.1 Progress Calculation (progressService.js)

```
For leaf tasks (no children):
  if progress_mode == 'manual':
    return progress_percent (user-set value)
  if progress_mode == 'auto':
    if planned_effort_hours > 0:
      return min(100, (cumulative_actual_hours / planned_effort_hours) * 100)
    else:
      return status == 'completed' ? 100 : 0

For parent tasks:
  children_progress = sum(child.progress * child.planned_effort_hours)
                    / sum(child.planned_effort_hours)
  return children_progress
  (If no planned effort on children, use equal weight)
```

### 6.2 Delay Detection

```
delay_status = 'on_track'

if today > planned_end_date AND progress < 100:
  delay_status = 'overdue'   → RED warning
  delay_days = today - planned_end_date

elif today > planned_start_date:
  elapsed_ratio = (today - planned_start_date) / (planned_end_date - planned_start_date)
  expected_progress = elapsed_ratio * 100
  if progress < expected_progress * 0.75:
    delay_status = 'at_risk'  → YELLOW warning
```

---

## 7. Error Handling Strategy

### 7.1 Server-Side
- All database operations wrapped in try-catch
- Custom AppError class with status codes
- Global error handler middleware returns JSON for API, HTML for pages
- Validation errors return 400 with field-level messages
- Database errors return 500 with generic user message (details logged)

### 7.2 Client-Side
- Toast notifications for success/error feedback
- Form validation before submission
- Network error retry (1 attempt) with user notification
- Graceful degradation if JS fails (server-rendered fallback)

---

## 8. Security Measures

| Measure | Implementation |
|---------|---------------|
| XSS Prevention | HTML escaping in EJS, DOMPurify for dynamic content |
| SQL Injection | Parameterized queries via better-sqlite3 |
| CORS | Restricted to same-origin + configurable LAN range |
| Helmet | HTTP security headers (CSP, X-Frame-Options, etc.) |
| Input Validation | express-validator or custom middleware |
| Rate Limiting | Not needed for LAN-only (optional) |

---

## 9. LAN Access Implementation

```javascript
// server.js
const os = require('os');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIP();
  console.log(`Server running at:`);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Network: http://${ip}:${PORT}`);
});
```

---

## 10. Design Decisions & Tradeoffs

| Decision | Chosen | Alternative | Reason |
|----------|--------|------------|--------|
| Database | better-sqlite3 (sync) | node-sqlite3 (async) | Simpler code, no callback/promise complexity, faster for local use |
| Frontend | Vanilla JS | React/Vue | No build step, smaller bundle, easier to maintain |
| Rendering | Hybrid (SSR + client JS) | Full SPA | Better initial load, SEO-friendly, progressive enhancement |
| CSS | Custom | Tailwind/Bootstrap | Fewer dependencies, full control, smaller payload |
| State Management | Server as source of truth | Client-side store | Simplicity, multi-tab consistency, LAN user consistency |
| Task hierarchy | Self-referencing table | Separate tables per level | Flexible, supports dynamic depth, simpler queries |
