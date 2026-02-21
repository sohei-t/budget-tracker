import type { TaskStatus } from '../types/index.ts'

export const STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
  on_hold: 'On Hold',
}

export const STATUS_BADGE_CLASS: Record<TaskStatus, string> = {
  not_started: 'badge--secondary',
  in_progress: 'badge--primary',
  completed: 'badge--success',
  on_hold: 'badge--warning',
}

export function clampPercent(value: number | null | undefined): number {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)))
}
