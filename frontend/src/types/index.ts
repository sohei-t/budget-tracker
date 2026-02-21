export type TaskStatus = 'not_started' | 'in_progress' | 'completed' | 'on_hold'

export type ProgressMode = 'auto' | 'manual'

export type WarningLevel = 'none' | 'yellow' | 'red'

export type DelayStatus = 'overdue' | 'at_risk'

export interface Task {
  id: number
  parent_id: number | null
  level: number
  name: string
  description: string | null
  planned_start_date: string | null
  planned_end_date: string | null
  planned_effort_hours: number | null
  status: TaskStatus
  progress_percent: number | null
  progress_mode: ProgressMode
  sort_order: number
  children_count: number
  cumulative_actual_hours: number | null
  delay_days: number | null
  warning_level: WarningLevel
}

export interface DelayedTask extends Task {
  delay_status: DelayStatus
}

export interface Actual {
  id: number
  task_id: number
  work_date: string
  actual_hours: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface DashboardSummary {
  total_tasks: number
  completed_tasks: number
  in_progress_tasks: number
  not_started_tasks: number
  overall_progress_percent: number
  overdue_count: number
  at_risk_count: number
  major_items: Task[]
}

export interface TaskFormData {
  name: string
  description: string
  planned_start_date: string | null
  planned_end_date: string | null
  planned_effort_hours: number
  progress_mode: ProgressMode
  progress_percent?: number
  status?: TaskStatus
  parent_id?: number
}

export interface ActualFormData {
  work_date: string
  actual_hours: number
  notes: string
}

export interface ApiResponse<T> {
  success: boolean
  data: T
}

export interface ApiError {
  code: string
  message: string
  details: string[]
}

export interface BreadcrumbItem {
  label: string
  href?: string
}

export type ToastType = 'success' | 'error' | 'warning' | 'info'
