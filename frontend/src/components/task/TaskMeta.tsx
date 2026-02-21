import { memo } from 'react'
import type { Task } from '../../types/index.ts'
import { StatusBadge } from '../ui/StatusBadge.tsx'
import { formatDate, formatHours } from '../../utils/dates.ts'

interface TaskMetaProps {
  task: Task
}

export const TaskMeta = memo(function TaskMeta({ task }: TaskMetaProps) {
  const items: { label: string; value: React.ReactNode }[] = [
    { label: 'Status', value: <StatusBadge status={task.status} /> },
    { label: 'Level', value: `Level ${task.level}` },
    { label: 'Progress Mode', value: task.progress_mode === 'auto' ? 'Automatic' : 'Manual' },
    {
      label: 'Planned Hours',
      value: task.planned_effort_hours ? formatHours(task.planned_effort_hours) : '-',
    },
    { label: 'Start Date', value: formatDate(task.planned_start_date) || '-' },
    { label: 'End Date', value: formatDate(task.planned_end_date) || '-' },
  ]

  if (task.cumulative_actual_hours != null) {
    items.push({ label: 'Actual Hours', value: formatHours(task.cumulative_actual_hours) })
  }

  if (task.delay_days != null && task.delay_days > 0) {
    items.push({ label: 'Delay', value: `${task.delay_days} days overdue` })
  }

  return (
    <div className="task-detail__meta">
      {items.map(item => (
        <div key={item.label} className="meta-item">
          <div className="meta-item__label">{item.label}</div>
          <div className="meta-item__value">{item.value}</div>
        </div>
      ))}
    </div>
  )
})
