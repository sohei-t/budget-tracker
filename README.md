# Budget Tracker -- WBS Task & Progress Management

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Test Coverage](https://img.shields.io/badge/Coverage-97.92%25-brightgreen)]()
[![Tests](https://img.shields.io/badge/Tests-270%20passing-brightgreen)]()

A professional **WBS (Work Breakdown Structure)** based task and progress management web application. Organize work into a clear 3-tier hierarchy of major, middle, and minor tasks while tracking planned versus actual effort in real time. Built with a modern React + TypeScript frontend and a robust Express.js + SQLite backend, the application runs entirely on your local network with zero cloud dependencies.

---

## Screenshots

> Screenshots are planned for a future release.

<!-- Replace the line above with actual screenshot images when available:
![Dashboard](docs/screenshots/dashboard.png)
![Task List](docs/screenshots/task-list.png)
![Dark Mode](docs/screenshots/dark-mode.png)
-->

---

## Features

### Task Management
- **3-tier WBS hierarchy** -- Major items, middle items, and minor items organized in a tree structure
- **Schedule planning** -- Set start date, end date, and planned effort (hours) for each task
- **Actual effort recording** -- Log daily work hours with optional notes; supports upsert per date
- **Automatic progress calculation** -- Progress percentage derived from actual vs. planned hours
- **Delay detection** -- Tasks are flagged as "at risk" or "overdue" based on schedule and progress
- **Drag-and-drop reordering** -- Change task display order within the same level
- **Soft delete** -- Safely remove tasks without losing historical data

### Dashboard
- **Project health metrics** -- Total tasks, completed, in-progress, and not-started counts
- **Overall progress** -- Aggregated progress percentage across the entire project
- **Delayed tasks panel** -- At-a-glance view of overdue and at-risk items with severity indicators
- **Major items overview** -- Top-level task summaries with inline progress bars

### UI / UX
- **Dark mode** -- Follows system preference with a manual toggle; persisted in LocalStorage
- **Responsive design** -- Fully functional on mobile, tablet, and desktop viewports
- **Keyboard shortcuts** -- Navigate and operate the app without touching the mouse
- **Incremental search** -- Filter tasks instantly as you type with debounced queries
- **Toast notifications** -- Non-intrusive feedback for create, update, and delete operations
- **Modal dialogs** -- Contextual forms for task creation, editing, and actual recording
- **Breadcrumb navigation** -- Always know where you are in the task hierarchy

### Performance
- **SQLite WAL mode** -- Concurrent reads and writes without lock contention
- **Optimized queries** -- Parent-child joins eliminate N+1 patterns
- **Gzip compression** -- Reduced payload sizes over the network
- **ETag caching** -- Conditional responses for unchanged data
- **LAN-accessible** -- Binds to `0.0.0.0` so any device on the same network can connect

---

## Architecture

The application follows an **MVC (Model-View-Controller)** pattern on the backend with a clear separation of concerns. The frontend uses a component-based architecture powered by React 19, with custom hooks and context providers for state management.

```
+------------------------------------------------------+
|                     Client (Browser)                  |
|                                                       |
|   React 19 + TypeScript 5.9 + Vite 7  (Modern SPA)   |
|   +-----------+  +--------+  +----------+  +------+  |
|   | Pages     |  | Hooks  |  | Context  |  | API  |  |
|   | Dashboard |  | useApi |  | Theme    |  | tasks|  |
|   | TaskList  |  | useTask|  | Modal    |  | dash |  |
|   | TaskNew   |  | useDash|  | Toast    |  | actls|  |
|   | TaskEdit  |  | useKbd |  |          |  |      |  |
|   | TaskDetail|  | useSrch|  |          |  |      |  |
|   +-----------+  +--------+  +----------+  +------+  |
|                                                       |
|   Legacy Vanilla JS SPA (public/)  -- fallback UI     |
+---------------------------+---------------------------+
                            | HTTP / REST API
                            v
+---------------------------+---------------------------+
|                     Server (Node.js)                  |
|                                                       |
|   Express.js 4.x  +  Middleware Stack                 |
|   +----------+  +------------+  +------------------+  |
|   | Helmet   |  | Compression|  | CORS | Morgan    |  |
|   +----------+  +------------+  +------------------+  |
|                                                       |
|   Routes          Controllers       Services          |
|   +-----------+   +------------+   +--------------+   |
|   | /tasks    |-->| taskCtrl   |-->| taskService  |   |
|   | /actuals  |-->| actualCtrl |-->| actualService|   |
|   | /dashboard|-->| dashCtrl   |-->| dashService  |   |
|   +-----------+   +------------+   | progressSvc  |   |
|                                    +--------------+   |
|                                          |            |
|   Models                                 v            |
|   +-----------+   +-------------------------------+   |
|   | taskModel |<--| better-sqlite3 (WAL mode)     |   |
|   | actualMdl |   | data/budget-tracker.db        |   |
|   | db.js     |   +-------------------------------+   |
|   +-----------+                                       |
+-------------------------------------------------------+
```

### Request Flow

```
Client Request
    |
    v
Express Router  -->  Controller  -->  Service  -->  Model  -->  SQLite
    |                    |               |              |
    v                    v               v              v
Route matching     Validation     Business logic   SQL queries
                   HTTP response  Error handling    Prepared stmts
```

---

## Tech Stack

### Backend

| Layer | Technology | Purpose |
|---|---|---|
| Runtime | Node.js 18+ | Server-side JavaScript |
| Framework | Express.js 4.x | HTTP routing and middleware |
| Database | SQLite (better-sqlite3) | Embedded relational database (WAL mode) |
| Security | Helmet 7.x | HTTP security headers |
| CORS | cors 2.x | Cross-origin resource sharing |
| Compression | compression 1.x | Gzip response compression |
| Logging | Morgan 1.x | HTTP request logging |

### Frontend (Modern)

| Layer | Technology | Purpose |
|---|---|---|
| UI Library | React 19 | Component-based UI |
| Language | TypeScript 5.9 | Static type safety |
| Build Tool | Vite 7.x | Fast HMR and bundling |
| Routing | React Router DOM 7.x | Client-side page navigation |
| Styling | CSS Variables + Custom CSS | Theming and dark mode |
| State | React Context + Custom Hooks | Application state management |

### Frontend (Legacy Fallback)

| Layer | Technology | Purpose |
|---|---|---|
| Language | Vanilla JavaScript (ES2020+) | Framework-free SPA |
| Routing | Hash-based router | Client-side navigation |
| State | Custom store + LocalStorage | Lightweight state management |

### Testing

| Tool | Version | Purpose |
|---|---|---|
| Jest | 29.x | Backend test runner and assertions |
| Supertest | 6.x | HTTP integration testing |
| Vitest | 4.x | Frontend test runner (Vite-native) |
| React Testing Library | 16.x | Component behavior testing |
| Testing Library User Event | 14.x | Simulated user interactions |

---

## Getting Started

### Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** 8.0.0 or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/sohei-t/budget-tracker.git
cd budget-tracker

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### Running the Application

#### Production Mode (Legacy UI)

```bash
npm start
```

The server starts on port 3000, serving the legacy vanilla JS frontend from `public/`.

#### Development Mode (Modern React UI)

In one terminal, start the backend with auto-reload:

```bash
npm run dev
```

In another terminal, start the Vite dev server for the React frontend:

```bash
cd frontend
npm run dev
```

#### Building the React Frontend

```bash
cd frontend
npm run build
```

The production build outputs to `frontend/dist/`. When this directory exists, the Express server automatically serves it instead of the legacy `public/` folder.

#### Access

| Location | URL |
|---|---|
| Local | `http://localhost:3000` |
| LAN (any device) | `http://<your-ip>:3000` |

---

## API Reference

All API responses follow a consistent envelope format:

```json
{
  "success": true,
  "data": { ... },
  "meta": { ... }
}
```

### Tasks

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/tasks` | List all top-level (Level 1) tasks |
| `GET` | `/api/tasks/:id` | Get a single task by ID |
| `GET` | `/api/tasks/:id/children` | Get all child tasks of a parent |
| `POST` | `/api/tasks` | Create a new task |
| `PUT` | `/api/tasks/:id` | Update an existing task |
| `DELETE` | `/api/tasks/:id` | Soft-delete a task |
| `PUT` | `/api/tasks/:id/reorder` | Update a task's sort order |

#### Create / Update Task -- Request Body

```json
{
  "name": "Design Phase",
  "description": "UI/UX design tasks",
  "parent_id": null,
  "planned_start_date": "2025-01-01",
  "planned_end_date": "2025-01-31",
  "planned_effort_hours": 80,
  "progress_mode": "auto",
  "status": "in_progress"
}
```

### Actuals (Work Logs)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/tasks/:id/actuals` | Get all actual entries for a task |
| `POST` | `/api/tasks/:id/actuals` | Record a daily actual (upsert by date) |
| `PUT` | `/api/actuals/:id` | Update an actual entry |
| `DELETE` | `/api/actuals/:id` | Delete an actual entry |

#### Record Actual -- Request Body

```json
{
  "work_date": "2025-01-15",
  "actual_hours": 6.5,
  "notes": "Completed wireframes for dashboard"
}
```

### Dashboard

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard` | Get overall project summary and metrics |
| `GET` | `/api/dashboard/delays` | Get list of delayed and at-risk tasks |

#### Dashboard Summary -- Response Example

```json
{
  "success": true,
  "data": {
    "total_tasks": 42,
    "completed_tasks": 15,
    "in_progress_tasks": 20,
    "not_started_tasks": 7,
    "overall_progress_percent": 48.5,
    "overdue_count": 3,
    "at_risk_count": 5,
    "major_items": [ ... ]
  }
}
```

---

## Testing

### Backend Tests (Jest + Supertest)

```bash
# Run all backend tests
npm test

# Run with coverage report
npm run test:coverage

# Run in watch mode during development
npm run test:watch
```

### Frontend Tests (Vitest + React Testing Library)

```bash
cd frontend

# Run all frontend tests
npm test

# Run in watch mode
npm run test:watch
```

### Coverage Summary

| Metric | Coverage |
|---|---|
| Statements | 97.92% |
| Branches | 94.05% |
| Functions | 100% |
| Lines | 97.92% |
| **Total Tests** | **270 passing** |

Test suites span unit tests (models, services, controllers, middleware, utilities) and integration tests (full API round-trips with Supertest).

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `G` then `D` | Navigate to Dashboard |
| `G` then `T` | Navigate to Tasks |
| `N` | Create a new task |
| `Ctrl + K` | Open search |
| `Ctrl + D` | Toggle dark mode |
| `?` | Show keyboard shortcuts dialog |

All shortcuts are disabled when an input field or text area is focused to avoid interference with typing.

---

## Project Structure

```
budget-tracker/
|-- src/                        # Backend (Node.js + Express)
|   |-- server.js               # Application entry point
|   |-- routes/
|   |   |-- taskRoutes.js       # /api/tasks endpoints
|   |   |-- actualRoutes.js     # /api/actuals endpoints
|   |   +-- dashboardRoutes.js  # /api/dashboard endpoints
|   |-- controllers/
|   |   |-- taskController.js   # Task request handlers
|   |   |-- actualController.js # Actual request handlers
|   |   +-- dashboardController.js
|   |-- services/
|   |   |-- taskService.js      # Task business logic
|   |   |-- actualService.js    # Actual business logic
|   |   |-- dashboardService.js # Dashboard aggregation
|   |   +-- progressService.js  # Progress calculation engine
|   |-- models/
|   |   |-- db.js               # SQLite connection (WAL mode)
|   |   |-- taskModel.js        # Task data access
|   |   +-- actualModel.js      # Actual data access
|   |-- middleware/
|   |   +-- errorHandler.js     # Centralized error handling
|   +-- utils/
|       +-- networkUtils.js     # LAN IP detection
|
|-- frontend/                   # Modern React frontend
|   |-- src/
|   |   |-- main.tsx            # React entry point
|   |   |-- App.tsx             # Root component with routing
|   |   |-- pages/              # Page-level components
|   |   |   |-- DashboardPage.tsx
|   |   |   |-- TaskListPage.tsx
|   |   |   |-- TaskNewPage.tsx
|   |   |   |-- TaskEditPage.tsx
|   |   |   +-- TaskDetailPage.tsx
|   |   |-- components/         # Reusable UI components
|   |   |   |-- dashboard/      # Dashboard-specific components
|   |   |   |-- task/           # Task-specific components
|   |   |   |-- layout/         # Header, Nav, Shortcuts dialog
|   |   |   |-- search/         # Search bar and results
|   |   |   +-- ui/             # Generic UI primitives
|   |   |-- hooks/              # Custom React hooks
|   |   |-- context/            # Theme, Modal, Toast providers
|   |   |-- api/                # API client modules
|   |   |-- types/              # TypeScript type definitions
|   |   +-- styles/             # CSS modules and variables
|   |-- vite.config.ts
|   +-- tsconfig.json
|
|-- public/                     # Legacy vanilla JS frontend (fallback)
|   |-- index.html
|   |-- css/main.css
|   +-- js/
|       |-- app.js
|       |-- router.js
|       |-- store.js
|       |-- api.js
|       |-- components/
|       +-- utils/
|
|-- tests/                      # Backend test suites (Jest)
|   |-- unit/
|   |   |-- models/
|   |   |-- services/
|   |   |-- controllers/
|   |   |-- middleware/
|   |   +-- utils/
|   |-- integration/
|   +-- helpers/
|
|-- data/                       # SQLite database files
|   +-- budget-tracker.db
|
|-- package.json
+-- README.md
```

---

## Security

| Measure | Implementation |
|---|---|
| HTTP Security Headers | Helmet.js with strict CSP directives |
| Cross-Origin Control | CORS middleware with configurable allowed origins |
| SQL Injection Prevention | Prepared statements via better-sqlite3 (parameterized queries only) |
| XSS Protection | Input sanitization and HTML entity escaping; CSP `script-src 'self'` |
| Input Validation | Server-side validation on all endpoints with typed error responses |
| Request Size Limits | JSON body parser limited to 256 KB |
| Content Security Policy | `default-src 'self'`; restricted script, style, image, and font sources |

---

## Contributing

Contributions are welcome. To get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Write tests for your changes and ensure all 270 existing tests pass
4. Maintain or improve the current 97.92% test coverage
5. Commit your changes with descriptive messages
6. Push to your fork and open a Pull Request

Please follow the existing code style:
- Backend: CommonJS modules, JSDoc comments, strict mode
- Frontend: TypeScript with strict mode, functional React components, custom hooks

---

## License

This project is licensed under the [MIT License](LICENSE).

```
MIT License

Copyright (c) 2024 AI Agent Development System

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
