import { memo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { DelayedTask } from '../../types/index.ts'
import { ProgressBar } from '../ui/ProgressBar.tsx'
import { cn } from '../../utils/cn.ts'

interface DelayedTaskListProps {
  tasks: DelayedTask[]
}

export const DelayedTaskList = memo(function DelayedTaskList({ tasks }: DelayedTaskListProps) {
  const navigate = useNavigate()

  const handleClick = useCallback(
    (id: number) => {
      navigate(`/tasks/${id}`)
    },
    [navigate]
  )

  if (tasks.length === 0) return null

  return (
    <div className="dashboard-section">
      <h3 className="dashboard-section__title">Delayed &amp; At-Risk Tasks</h3>
      <div className="delay-list">
        {tasks.map(task => {
          const isRisk = task.delay_status === 'at_risk'
          return (
            <div
              key={task.id}
              className={cn('delay-item', isRisk && 'delay-item--at-risk')}
              onClick={() => handleClick(task.id)}
              role="button"
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter') handleClick(task.id)
              }}
            >
              <div className="delay-item__info">
                <div className="delay-item__name">{task.name}</div>
                <div className="delay-item__meta">
                  Level {task.level} &middot; {task.delay_days ? `${task.delay_days} days overdue` : 'At risk'}
                </div>
              </div>
              <div className="delay-item__status">
                <ProgressBar
                  percent={task.progress_percent}
                  showLabel
                  warning={isRisk ? 'yellow' : 'red'}
                  size="sm"
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})
