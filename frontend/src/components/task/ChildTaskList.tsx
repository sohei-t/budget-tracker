import { memo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Task } from '../../types/index.ts'
import { StatusBadge } from '../ui/StatusBadge.tsx'
import { ProgressBar } from '../ui/ProgressBar.tsx'
import { formatDate } from '../../utils/dates.ts'

interface ChildTaskListProps {
  children: Task[]
  parentTask: Task
}

export const ChildTaskList = memo(function ChildTaskList({
  children,
  parentTask,
}: ChildTaskListProps) {
  const navigate = useNavigate()
  const canAddChild = parentTask.level < 3

  const handleChildClick = useCallback(
    (id: number) => {
      navigate(`/tasks/${id}`)
    },
    [navigate]
  )

  if (children.length === 0 && !canAddChild) return null

  return (
    <div className="task-detail__section">
      {children.length > 0 ? (
        <>
          <div className="flex justify-between items-center mb-4">
            <h3 className="task-detail__section-title" style={{ marginBottom: 0, borderBottom: 'none' }}>
              Child Tasks ({children.length})
            </h3>
            {canAddChild && (
              <Link to={`/tasks/new?parent=${parentTask.id}`} className="btn btn--sm btn--secondary">
                + Add Child
              </Link>
            )}
          </div>
          <div className="children-list">
            {children.map(child => (
              <div
                key={child.id}
                className="child-item"
                onClick={() => handleChildClick(child.id)}
                role="button"
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleChildClick(child.id)
                }}
              >
                <span>{child.name}</span>
                <span><StatusBadge status={child.status} /></span>
                <span><ProgressBar percent={child.progress_percent} showLabel size="sm" /></span>
                <span className="text-xs text-muted">{formatDate(child.planned_end_date) || '-'}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <h3 className="task-detail__section-title">Child Tasks</h3>
          <div className="empty-state" style={{ padding: 'var(--space-6)' }}>
            <p className="text-muted mb-4">No child tasks yet.</p>
            <Link to={`/tasks/new?parent=${parentTask.id}`} className="btn btn--sm btn--secondary">
              + Add Child Task
            </Link>
          </div>
        </>
      )}
    </div>
  )
})
