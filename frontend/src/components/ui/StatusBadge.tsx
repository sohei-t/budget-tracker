import { memo } from 'react'
import type { TaskStatus } from '../../types/index.ts'
import { STATUS_LABELS, STATUS_BADGE_CLASS } from '../../utils/format.ts'

interface StatusBadgeProps {
  status: TaskStatus
}

export const StatusBadge = memo(function StatusBadge({ status }: StatusBadgeProps) {
  const label = STATUS_LABELS[status] ?? STATUS_LABELS.not_started
  const cls = STATUS_BADGE_CLASS[status] ?? STATUS_BADGE_CLASS.not_started
  return <span className={`badge ${cls}`}>{label}</span>
})
