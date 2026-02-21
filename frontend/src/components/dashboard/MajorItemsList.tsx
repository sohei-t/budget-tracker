import { memo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Task } from '../../types/index.ts'
import { ProgressBar } from '../ui/ProgressBar.tsx'
import { StatusBadge } from '../ui/StatusBadge.tsx'

interface MajorItemsListProps {
  items: Task[]
}

export const MajorItemsList = memo(function MajorItemsList({ items }: MajorItemsListProps) {
  const navigate = useNavigate()

  const handleClick = useCallback(
    (id: number) => {
      navigate(`/tasks/${id}`)
    },
    [navigate]
  )

  if (items.length === 0) return null

  return (
    <div className="dashboard-section">
      <h3 className="dashboard-section__title">Major Items</h3>
      <div className="major-items">
        {items.map(item => (
          <div
            key={item.id}
            className="major-item"
            onClick={() => handleClick(item.id)}
            role="button"
            tabIndex={0}
            onKeyDown={e => {
              if (e.key === 'Enter') handleClick(item.id)
            }}
          >
            <span className="major-item__name">{item.name}</span>
            <div className="major-item__progress">
              <ProgressBar percent={item.progress_percent} showLabel size="sm" />
            </div>
            <StatusBadge status={item.status} />
          </div>
        ))}
      </div>
    </div>
  )
})
