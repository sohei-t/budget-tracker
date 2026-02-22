import { useNavigate, useParams } from 'react-router-dom'
import { TaskForm } from '../components/task/TaskForm.tsx'
import { LoadingSpinner } from '../components/ui/LoadingSpinner.tsx'
import { EmptyState } from '../components/ui/EmptyState.tsx'
import { useTaskWithParent } from '../hooks/useTaskWithParent.ts'

export function TaskEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { task, parentTask, loading, error } = useTaskWithParent(id)

  if (loading) return <LoadingSpinner />

  if (error || !task) {
    return (
      <EmptyState icon="&#9888;" text={error || 'Task not found'}>
        <button className="btn btn--secondary" onClick={() => navigate('/tasks')}>Back to Tasks</button>
      </EmptyState>
    )
  }

  return <TaskForm task={task} parentTask={parentTask} isEdit />
}
