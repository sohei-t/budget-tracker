import { Link } from 'react-router-dom'
import { useTasks } from '../hooks/useTasks.ts'
import { LoadingSpinner } from '../components/ui/LoadingSpinner.tsx'
import { EmptyState } from '../components/ui/EmptyState.tsx'
import { TaskTable } from '../components/task/TaskTable.tsx'

export function TaskListPage() {
  const { tasks, expandedIds, loading, error, toggleExpand, expandAll, collapseAll } = useTasks()

  if (loading) return <LoadingSpinner />

  if (error) {
    return (
      <div className="task-list-page">
        <EmptyState icon="&#9888;" text={`Failed to load tasks: ${error}`}>
          <Link to="/tasks" className="btn btn--secondary">Retry</Link>
        </EmptyState>
      </div>
    )
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="task-list-page">
        <div className="task-list-page__header">
          <h2 className="task-list-page__title">Tasks</h2>
          <div className="task-list-page__actions">
            <Link to="/tasks/new" className="btn btn--primary">+ New Task</Link>
          </div>
        </div>
        <EmptyState icon="&#128203;" text="No tasks yet">
          <p className="text-muted mb-4">Create your first task to get started with budget tracking.</p>
          <Link to="/tasks/new" className="btn btn--primary btn--lg">Create Task</Link>
        </EmptyState>
      </div>
    )
  }

  return (
    <div className="task-list-page">
      <div className="task-list-page__header">
        <h2 className="task-list-page__title">Tasks</h2>
        <div className="task-list-page__actions">
          <button className="btn btn--secondary" onClick={expandAll}>Expand All</button>
          <button className="btn btn--secondary" onClick={collapseAll}>Collapse All</button>
          <Link to="/tasks/new" className="btn btn--primary">+ New Task</Link>
        </div>
      </div>
      <TaskTable tasks={tasks} expandedIds={expandedIds} onToggle={toggleExpand} />
    </div>
  )
}
