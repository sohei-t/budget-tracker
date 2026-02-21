import { memo } from 'react'
import type { DashboardSummary } from '../../types/index.ts'
import { cn } from '../../utils/cn.ts'

interface StatsGridProps {
  summary: DashboardSummary
}

export const StatsGrid = memo(function StatsGrid({ summary }: StatsGridProps) {
  const { total_tasks, completed_tasks, in_progress_tasks, overdue_count } = summary

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-card__value">{total_tasks || 0}</div>
        <div className="stat-card__label">Total Tasks</div>
      </div>
      <div className="stat-card stat-card--success">
        <div className="stat-card__value">{completed_tasks || 0}</div>
        <div className="stat-card__label">Completed</div>
      </div>
      <div className="stat-card">
        <div className="stat-card__value">{in_progress_tasks || 0}</div>
        <div className="stat-card__label">In Progress</div>
      </div>
      <div className={cn('stat-card', overdue_count > 0 && 'stat-card--danger')}>
        <div className="stat-card__value">{overdue_count || 0}</div>
        <div className="stat-card__label">Overdue</div>
      </div>
    </div>
  )
})
