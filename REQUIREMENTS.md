# REQUIREMENTS.md - Budget Tracker (WBS-like Task & Progress Management)

## 1. Project Overview

### 1.1 Summary
A WBS (Work Breakdown Structure)-like task management web application that enables users to register tasks in a 3-level hierarchy (major/middle/minor items), input planned schedules, and record daily actuals. The app provides real-time progress tracking, delay warnings, and clear visual distinction between completed and in-progress work.

### 1.2 Target Users
- Project managers tracking team work progress
- Individual contributors managing personal task schedules
- Small team members on the same LAN who need read access to project status

### 1.3 Core Concept
"Plan it, track it, see it" -- Register tasks with planned schedules, record daily actuals, and immediately visualize progress and delays with an intuitive, simple UI.

### 1.4 Deployment Model
- Local execution (Node.js + Express server)
- LAN-accessible (0.0.0.0 binding)
- SQLite file-based database (zero external dependencies)
- Cost: $0

---

## 2. User Stories

### Essential (Must-Have)

| ID | User Story | Priority |
|----|-----------|----------|
| US-01 | As a project manager, I want to create tasks organized into 3 hierarchical levels (major > middle > minor) so that I can represent a WBS structure. | P0 |
| US-02 | As a user, I want to input planned start/end dates and planned effort (hours) for each task so that I can set baseline schedules. | P0 |
| US-03 | As a user, I want to record daily actual effort/progress for each task so that I can track real performance against plans. | P0 |
| US-04 | As a user, I want to see automatic progress rate calculation (%) for each task and its parent items so that I know how far along we are. | P0 |
| US-05 | As a user, I want to see delay rate indicators so that I can identify tasks that are behind schedule. | P0 |
| US-06 | As a user, I want delayed tasks to display visual warnings (red/yellow indicators) so that I can take corrective action quickly. | P0 |
| US-07 | As a user, I want completed tasks to appear grayed out so that I can visually distinguish completed work from active work at a glance. | P0 |
| US-08 | As a user, I want to edit, update, and delete tasks and their schedules after creation so that I can correct mistakes and adapt to changes. | P0 |
| US-09 | As a user, I want the top page to show all major items, and clicking one drills down to its children (middle/minor items) so that navigation follows the WBS hierarchy. | P0 |
| US-10 | As a team member on the same LAN, I want to view the project status from my own computer so that I stay informed without needing the host machine. | P0 |

### Important (Should-Have)

| ID | User Story | Priority |
|----|-----------|----------|
| US-11 | As a user, I want a dashboard page showing overall project progress summary, total tasks, completed count, and delay overview so that I get a quick snapshot. | P1 |
| US-12 | As a user, I want to filter and search tasks by name, status, or date range so that I can find specific items quickly. | P1 |
| US-13 | As a user, I want color-coded due date indicators (green=on track, yellow=at risk, red=overdue) so that urgency is immediately visible. | P1 |

### Nice-to-Have (Could-Have)

| ID | User Story | Priority |
|----|-----------|----------|
| US-14 | As a user, I want to reorder tasks via drag-and-drop so that I can reorganize priorities intuitively. | P2 |
| US-15 | As a user, I want to see a simple Gantt-chart-style timeline view so that I can visualize schedule overlaps and dependencies. | P2 |

---

## 3. Functional Requirements

### 3.1 Task Hierarchy Management (MUST)

| ID | Requirement | Details |
|----|------------|---------|
| FR-01 | 3-level hierarchy | Major (Level 1) > Middle (Level 2) > Minor (Level 3) items. Each level can be created, edited, deleted independently. |
| FR-02 | Task properties | Name, description (optional), planned start date, planned end date, planned effort (hours), status (not started / in progress / completed), sort order. |
| FR-03 | Cascading status | When all children are completed, the parent automatically shows as completed. |
| FR-04 | Cascading delete | Deleting a parent task prompts confirmation and deletes all children. |

### 3.2 Schedule Input (MUST)

| ID | Requirement | Details |
|----|------------|---------|
| FR-05 | Planned schedule entry | Set planned start/end date and planned effort for any task level. |
| FR-06 | Schedule validation | End date must be >= start date. Effort must be >= 0. |
| FR-07 | Inline editing | Users can edit planned values directly in the task list view (click-to-edit). |

### 3.3 Actual/Daily Recording (MUST)

| ID | Requirement | Details |
|----|------------|---------|
| FR-08 | Daily actual input | Record date, actual hours worked, and optional notes per task per day. |
| FR-09 | Cumulative actual tracking | Sum of all daily actuals for a task. |
| FR-10 | Progress manual override | User can manually set progress % if automatic calculation does not match reality. |

### 3.4 Progress & Delay Calculation (MUST)

| ID | Requirement | Details |
|----|------------|---------|
| FR-11 | Progress rate (%) | Auto-calculated: (cumulative actual hours / planned effort) * 100, capped at 100%. Alternatively: manual override or child task completion ratio. |
| FR-12 | Delay rate (%) | (Today - Planned End Date) / (Planned End Date - Planned Start Date) * 100 when overdue. 0% when on time or ahead. |
| FR-13 | Parent aggregation | Parent progress = weighted average of child progresses (by planned effort). |
| FR-14 | Warning thresholds | Yellow warning: >80% of planned duration elapsed with <60% progress. Red warning: past due date with <100% progress. |

### 3.5 Visual Indicators (MUST)

| ID | Requirement | Details |
|----|------------|---------|
| FR-15 | Completed gray-out | Completed tasks have reduced opacity and strikethrough text. |
| FR-16 | Status badges | Color-coded badges: Not Started (gray), In Progress (blue), Completed (green), Delayed (red). |
| FR-17 | Progress bar | Visual progress bar on each task row showing % completion. |

### 3.6 CRUD Operations (MUST)

| ID | Requirement | Details |
|----|------------|---------|
| FR-18 | Create task | Add task at any level via form dialog or inline creation. |
| FR-19 | Read task | View task details including all planned/actual data. |
| FR-20 | Update task | Edit any task property. Changes are saved immediately (auto-save or explicit save). |
| FR-21 | Delete task | Soft-delete with confirmation. Cascades to children. |

### 3.7 Navigation (MUST)

| ID | Requirement | Details |
|----|------------|---------|
| FR-22 | Top page | Lists all major items (Level 1) with summary progress. |
| FR-23 | Drill-down | Click major item to see its middle items, click middle to see minor items. Breadcrumb navigation. |
| FR-24 | Back navigation | Breadcrumb trail and browser back button support. |

### 3.8 LAN Access (MUST)

| ID | Requirement | Details |
|----|------------|---------|
| FR-25 | LAN binding | Server listens on 0.0.0.0 for LAN access. |
| FR-26 | IP display | On startup, display the local IP address and port for LAN users to connect. |

### 3.9 UX Enhancements (SHOULD/COULD)

| ID | Requirement | Priority | Details |
|----|------------|----------|---------|
| FR-27 | Dashboard | P1 | Summary page with total tasks, completion %, delay count, charts. |
| FR-28 | Search/Filter | P1 | Filter by status, search by task name, date range filter. |
| FR-29 | Date color-coding | P1 | Green (on track), Yellow (at risk), Red (overdue). |
| FR-30 | Drag-and-drop reorder | P2 | Reorder tasks within the same level. |
| FR-31 | Gantt timeline view | P2 | Simple horizontal bar chart showing planned vs actual timelines. |
| FR-32 | Bulk operations | P2 | Select multiple tasks and change status or delete in bulk. |
| FR-33 | Responsive design | P1 | Usable on tablets and larger screens. |

---

## 4. Non-Functional Requirements

### 4.1 Performance
| ID | Requirement | Target |
|----|------------|--------|
| NFR-01 | Page load time | < 2 seconds for initial load |
| NFR-02 | API response time | < 200ms for all CRUD operations |
| NFR-03 | Database capacity | Support up to 1,000 tasks without degradation |
| NFR-04 | Concurrent users | Support 5-10 simultaneous LAN viewers |

### 4.2 Reliability & Stability (Conservative Priority)
| ID | Requirement | Target |
|----|------------|--------|
| NFR-05 | Data persistence | SQLite with WAL mode for reliable writes |
| NFR-06 | Error handling | Graceful error messages, no data loss on errors |
| NFR-07 | Input validation | Server-side validation for all inputs |
| NFR-08 | Backup-friendly | Single .sqlite file, easy to copy/backup |

### 4.3 Maintainability (Conservative Priority)
| ID | Requirement | Target |
|----|------------|--------|
| NFR-09 | Code structure | Clear MVC separation |
| NFR-10 | Code readability | JSDoc comments on all public functions |
| NFR-11 | Dependency count | Minimal dependencies (< 10 npm packages) |
| NFR-12 | Test coverage | 80%+ for business logic |

### 4.4 Usability
| ID | Requirement | Target |
|----|------------|--------|
| NFR-13 | Learning curve | Usable without documentation within 5 minutes |
| NFR-14 | Keyboard navigation | Tab/Enter for common actions |
| NFR-15 | Accessibility | WCAG 2.1 AA color contrast compliance |

### 4.5 Security
| ID | Requirement | Target |
|----|------------|--------|
| NFR-16 | Input sanitization | XSS prevention on all user inputs |
| NFR-17 | SQL injection | Parameterized queries only |
| NFR-18 | CORS policy | Restrict to same-origin and LAN |

---

## 5. Technical Constraints

| Constraint | Value | Reason |
|-----------|-------|--------|
| Cost | $0 | DEFAULT_POLICY: no external API costs |
| Database | SQLite | File-based, zero setup, portable |
| Server | Node.js + Express | Proven, lightweight, easy LAN hosting |
| Frontend | Vanilla JS + minimal library | Keep dependencies minimal, no build step |
| External APIs | None | $0 policy compliance |
| Hosting | Local machine | launch_app.command for easy startup |

---

## 6. UX Enhancement Proposals (Simplicity-First Approach)

The following features enhance UX while maintaining simplicity. Complexity is handled through automation, not user-facing complexity.

### 6.1 Implemented via Automation (User sees simplicity)
- **Auto-progress calculation**: Progress % computed automatically from child tasks and actual hours. User does not need to calculate.
- **Auto-delay detection**: System automatically flags delays based on schedule vs. actual. No manual monitoring needed.
- **Cascading updates**: Parent status auto-updates when children change. User only updates leaf tasks.

### 6.2 Visual UX Improvements
- **Color-coded due dates**: Green/Yellow/Red at a glance (FR-29)
- **Progress bars on every row**: Immediate visual feedback (FR-17)
- **Gray-out completed tasks**: Visual declutter (FR-15)
- **Breadcrumb navigation**: Never get lost in the hierarchy (FR-24)

### 6.3 Interaction UX Improvements
- **Inline editing**: Click-to-edit without opening separate forms (FR-07)
- **Search and filter**: Find tasks fast (FR-28)
- **Responsive layout**: Works on tablets in meetings (FR-33)

### 6.4 Deferred (P2 - implement if time permits)
- Drag-and-drop reorder
- Gantt chart timeline
- Bulk operations
- Data export (CSV)

---

## 7. Out of Scope

- Multi-user authentication/authorization (single-user or shared LAN access)
- Cloud deployment or hosting
- Real-time collaboration (WebSocket live sync between users)
- Mobile-native app
- Email/notification system
- Resource allocation / cost tracking
- File attachments on tasks

---

## 8. Acceptance Criteria Summary

| Category | Criteria |
|----------|---------|
| Task Management | 3-level CRUD with cascading operations |
| Schedule | Planned input + daily actual recording |
| Progress | Auto-calculated %, manual override available |
| Delays | Auto-detected with visual warnings |
| Visual | Gray-out completed, color-coded status/dates |
| Navigation | Top page > drill-down > breadcrumb back |
| LAN | Accessible from same-segment computers |
| Performance | < 2s load, < 200ms API, 1000 tasks capacity |
| Quality | 80%+ test coverage, input validation, XSS prevention |
