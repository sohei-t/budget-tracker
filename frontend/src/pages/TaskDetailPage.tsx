import { useCallback } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTask } from '../hooks/useTask.ts'
import { useModal } from '../context/ModalContext.tsx'
import { useToast } from '../context/ToastContext.tsx'
import { deleteTask } from '../api/tasks.ts'
import { LoadingSpinner } from '../components/ui/LoadingSpinner.tsx'
import { EmptyState } from '../components/ui/EmptyState.tsx'
import { Breadcrumb } from '../components/ui/Breadcrumb.tsx'
import { ProgressBar } from '../components/ui/ProgressBar.tsx'
import { TaskMeta } from '../components/task/TaskMeta.tsx'
import { ChildTaskList } from '../components/task/ChildTaskList.tsx'
import { ActualForm } from '../components/task/ActualForm.tsx'
import { ActualsTable } from '../components/task/ActualsTable.tsx'
import type { BreadcrumbItem } from '../types/index.ts'

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { task, children, actuals, loading, error, refetch } = useTask(id ?? '')
  const { showConfirm } = useModal()
  const { showToast } = useToast()

  const handleDelete = useCallback(async () => {
    if (!task) return
    const confirmed = await showConfirm({
      title: 'Delete Task',
      message: `Are you sure you want to delete "${task.name}"? This will also delete all child tasks.`,
      confirmText: 'Delete',
      danger: true,
    })
    if (confirmed) {
      try {
        await deleteTask(task.id)
        showToast('Task deleted', 'success')
        navigate('/tasks')
      } catch (err) {
        showToast('Failed to delete: ' + (err instanceof Error ? err.message : 'Unknown error'), 'error')
      }
    }
  }, [task, showConfirm, showToast, navigate])

  if (loading) return <LoadingSpinner />

  if (error || !task) {
    return (
      <EmptyState icon="&#9888;" text={error || 'Task not found'}>
        <div className="flex gap-4">
          <button className="btn btn--secondary" onClick={() => refetch()}>Retry</button>
          <Link to="/tasks" className="btn btn--secondary">Back to Tasks</Link>
        </div>
      </EmptyState>
    )
  }

  const isLeaf = task.children_count === 0
  const warning = task.warning_level || 'none'
  const progress = task.progress_percent ?? 0

  const crumbs: BreadcrumbItem[] = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Tasks', href: '/tasks' },
  ]
  if (task.parent_id) {
    crumbs.push({ label: 'Parent', href: `/tasks/${task.parent_id}` })
  }
  crumbs.push({ label: task.name })

  return (
    <div className="task-detail">
      <Breadcrumb items={crumbs} />

      <div className="task-detail__header">
        <div className="task-detail__title-section">
          <h2 className="task-detail__title">{task.name}</h2>
          {task.description && <p className="text-muted">{task.description}</p>}
        </div>
        <div className="task-detail__actions">
          <Link to={`/tasks/${task.id}/edit`} className="btn btn--secondary">Edit</Link>
          <button className="btn btn--danger" onClick={handleDelete}>Delete</button>
        </div>
      </div>

      <div className="card mb-4">
        <div className="mb-4">
          <ProgressBar percent={progress} size="lg" showLabel warning={warning} />
        </div>
        <TaskMeta task={task} />
      </div>

      <ChildTaskList children={children} parentTask={task} />

      {isLeaf && (
        <div className="task-detail__section">
          <h3 className="task-detail__section-title">Work Actuals</h3>
          <div className="card mb-4">
            <ActualForm taskId={task.id} onSuccess={refetch} />
          </div>
          <ActualsTable actuals={actuals} onRefresh={refetch} />
        </div>
      )}
    </div>
  )
}
