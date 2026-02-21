# API Client Layer

Type-safe HTTP client for the Budget Tracker Express backend.

## Modules

### `client.ts`
Base fetch wrapper with error handling. All requests go through `apiClient.get()`, `apiClient.post()`, etc.

### `tasks.ts`
- `getTasks()` - Get all top-level tasks
- `getTask(id)` - Get task by ID with computed fields
- `getChildren(parentId)` - Get child tasks
- `createTask(data)` - Create new task
- `updateTask(id, data)` - Update existing task
- `deleteTask(id)` - Soft delete task
- `reorderTask(id, newOrder)` - Update sort order

### `actuals.ts`
- `getActuals(taskId)` - Get work entries for task
- `recordActual(taskId, data)` - Record daily hours (upsert)
- `updateActual(id, data)` - Update entry
- `deleteActual(id)` - Delete entry

### `dashboard.ts`
- `getDashboardSummary()` - Get stats overview
- `getDelayedTasks()` - Get at-risk/overdue tasks

## Error Handling
All methods throw `ApiError` on non-2xx responses with parsed error message.
