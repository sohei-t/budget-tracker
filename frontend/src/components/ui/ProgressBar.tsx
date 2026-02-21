import { memo } from 'react'
import { cn } from '../../utils/cn.ts'
import { clampPercent } from '../../utils/format.ts'
import type { WarningLevel } from '../../types/index.ts'

interface ProgressBarProps {
  percent: number | null | undefined
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  warning?: WarningLevel
}

function fillClass(warning: WarningLevel, clamped: number): string {
  if (warning === 'red') return 'progress-bar__fill--danger'
  if (warning === 'yellow') return 'progress-bar__fill--warning'
  if (clamped >= 100) return 'progress-bar__fill--success'
  return ''
}

export const ProgressBar = memo(function ProgressBar({
  percent,
  size = 'md',
  showLabel = true,
  warning = 'none',
}: ProgressBarProps) {
  const clamped = clampPercent(percent)

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn('progress-bar', size === 'lg' && 'progress-bar--lg')}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progress: ${clamped}%`}
      >
        <div
          className={cn('progress-bar__fill', fillClass(warning, clamped))}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && <span className="progress-text">{clamped}%</span>}
    </div>
  )
})
