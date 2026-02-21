import { memo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Task, WarningLevel } from '../../types/index.ts'
import { cn } from '../../utils/cn.ts'
import { formatDate } from '../../utils/dates.ts'
import { ProgressBar } from '../ui/ProgressBar.tsx'
import { StatusBadge } from '../ui/StatusBadge.tsx'

interface TaskRowProps {
  task: Task
  isExpanded: boolean
  onToggle: (id: string) => void
}

function WarningDot({ level }: { level: WarningLevel }) {
  if (level === 'red') {
    return <span className="warning-indicator warning-indicator--red" title="Overdue" />
  }
  if (level === 'yellow') {
    return <span className="warning-indicator warning-indicator--yellow" title="At Risk" />
  }
  return <span className="warning-indicator warning-indicator--none" title="On Track" />
}

export const TaskRow = memo(function TaskRow({ task, isExpanded, onToggle }: TaskRowProps) {
  const navigate = useNavigate()
  const level = task.level || 1
  const hasChildren = task.children_count > 0
  const warning = task.warning_level || 'none'

  const handleRowClick = useCallback(() => {
    navigate(`/tasks/${task.id}`)
  }, [navigate, task.id])

  const handleToggleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onToggle(String(task.id))
    },
    [onToggle, task.id]
  )

  const dateDisplay = task.planned_start_date
    ? `${formatDate(task.planned_start_date)} - ${formatDate(task.planned_end_date)}`
    : '-'

  return (
    <div
      className={cn('task-row', `task-row--level-${level}`)}
      data-task-id={task.id}
      role="row"
      onClick={handleRowClick}
    >
      <div className="task-row__name">
        {hasChildren ? (
          <button
            className={cn('task-row__toggle', isExpanded && 'expanded')}
            aria-label="Toggle children"
            aria-expanded={isExpanded}
            onClick={handleToggleClick}
          >
            &#9654;
          </button>
        ) : (
          <span style={{ width: 24, display: 'inline-block' }} />
        )}
        <span className="task-row__name-text" title={task.name}>{task.name}</span>
      </div>
      <div className="task-row__status">
        <StatusBadge status={task.status} />
      </div>
      <div className="task-row__progress">
        <ProgressBar percent={task.progress_percent} showLabel warning={warning} size="sm" />
      </div>
      <div className="task-row__dates">{dateDisplay}</div>
      <div className="task-row__warning">
        <WarningDot level={warning} />
      </div>
    </div>
  )
})
