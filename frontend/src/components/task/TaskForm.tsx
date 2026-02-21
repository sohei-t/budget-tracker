import { useCallback } from 'react'
import type { Task, ProgressMode, TaskStatus } from '../../types/index.ts'
import { Breadcrumb } from '../ui/Breadcrumb.tsx'
import type { BreadcrumbItem } from '../../types/index.ts'
import { useTaskForm } from '../../hooks/useTaskForm.ts'
import { toInputDate } from '../../utils/dates.ts'

interface TaskFormProps {
  task?: Task | null
  parentTask?: Task | null
  isEdit: boolean
}

export function TaskForm({ task, parentTask, isEdit }: TaskFormProps) {
  const level = parentTask ? parentTask.level + 1 : 1

  const { fields, nameError, submitting, updateField, handleSubmit } = useTaskForm({
    taskId: task?.id,
    parentId: parentTask?.id,
    isEdit,
    initialValues: task
      ? {
          name: task.name,
          description: task.description ?? '',
          planned_start_date: toInputDate(task.planned_start_date),
          planned_end_date: toInputDate(task.planned_end_date),
          planned_effort_hours: task.planned_effort_hours ? String(task.planned_effort_hours) : '',
          progress_mode: task.progress_mode,
          progress_percent: String(task.progress_percent ?? 0),
          status: task.status,
        }
      : undefined,
  })

  const crumbs: BreadcrumbItem[] = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Tasks', href: '/tasks' },
  ]
  if (isEdit && task) {
    crumbs.push({ label: task.name, href: `/tasks/${task.id}` })
    crumbs.push({ label: 'Edit' })
  } else {
    if (parentTask) {
      crumbs.push({ label: parentTask.name, href: `/tasks/${parentTask.id}` })
    }
    crumbs.push({ label: 'New Task' })
  }

  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      handleSubmit()
    },
    [handleSubmit]
  )

  return (
    <div className="task-form">
      <Breadcrumb items={crumbs} />
      <h2 className="task-form__title">{isEdit ? 'Edit Task' : 'New Task'}</h2>

      {parentTask && (
        <div className="card mb-4">
          <p className="text-sm text-muted">
            Parent: <strong>{parentTask.name}</strong> (Level {parentTask.level})
          </p>
          <p className="text-xs text-muted">This will be a Level {level} task.</p>
        </div>
      )}

      <form onSubmit={onSubmit} noValidate>
        <div className="form-group">
          <label className="form-label" htmlFor="taskName">
            Name <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            id="taskName"
            className={`form-input${nameError ? ' error' : ''}`}
            value={fields.name}
            onChange={e => updateField('name', e.target.value)}
            maxLength={200}
            required
            aria-required="true"
            aria-invalid={!!nameError}
          />
          {nameError && (
            <div className="form-error" role="alert">{nameError}</div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="taskDescription">Description</label>
          <textarea
            id="taskDescription"
            className="form-textarea"
            maxLength={1000}
            value={fields.description}
            onChange={e => updateField('description', e.target.value)}
          />
        </div>

        {isEdit && (
          <div className="form-group">
            <label className="form-label" htmlFor="taskStatus">Status</label>
            <select
              id="taskStatus"
              className="form-select"
              value={fields.status}
              onChange={e => updateField('status', e.target.value as TaskStatus)}
            >
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="taskStartDate">Planned Start Date</label>
            <input
              type="date"
              id="taskStartDate"
              className="form-input"
              value={fields.planned_start_date}
              onChange={e => updateField('planned_start_date', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="taskEndDate">Planned End Date</label>
            <input
              type="date"
              id="taskEndDate"
              className="form-input"
              value={fields.planned_end_date}
              onChange={e => updateField('planned_end_date', e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="taskPlannedHours">Planned Hours</label>
          <input
            type="number"
            id="taskPlannedHours"
            className="form-input"
            value={fields.planned_effort_hours}
            onChange={e => updateField('planned_effort_hours', e.target.value)}
            min="0"
            step="0.5"
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="taskProgressMode">Progress Mode</label>
          <select
            id="taskProgressMode"
            className="form-select"
            value={fields.progress_mode}
            onChange={e => updateField('progress_mode', e.target.value as ProgressMode)}
          >
            <option value="auto">Auto (calculated from actuals)</option>
            <option value="manual">Manual (set percentage manually)</option>
          </select>
        </div>

        {fields.progress_mode === 'manual' && (
          <div className="form-group">
            <label className="form-label" htmlFor="taskProgressPercent">Progress (%)</label>
            <input
              type="number"
              id="taskProgressPercent"
              className="form-input"
              value={fields.progress_percent}
              onChange={e => updateField('progress_percent', e.target.value)}
              min="0"
              max="100"
            />
          </div>
        )}

        <div className="flex gap-4 mt-4">
          <button type="submit" className="btn btn--primary btn--lg" disabled={submitting}>
            {submitting
              ? isEdit ? 'Updating...' : 'Creating...'
              : isEdit ? 'Update Task' : 'Create Task'}
          </button>
          <button
            type="button"
            className="btn btn--secondary btn--lg"
            onClick={() => {
              if (isEdit && task) {
                window.history.back()
              } else if (parentTask) {
                window.history.back()
              } else {
                window.history.back()
              }
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
