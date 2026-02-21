import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createTask, updateTask } from '../api/tasks.ts'
import type { TaskFormData, TaskStatus, ProgressMode } from '../types/index.ts'
import { useToast } from '../context/ToastContext.tsx'

interface FormFields {
  name: string
  description: string
  planned_start_date: string
  planned_end_date: string
  planned_effort_hours: string
  progress_mode: ProgressMode
  progress_percent: string
  status: TaskStatus
}

interface UseTaskFormReturn {
  fields: FormFields
  nameError: string
  submitting: boolean
  updateField: <K extends keyof FormFields>(key: K, value: FormFields[K]) => void
  handleSubmit: () => Promise<void>
}

export function useTaskForm(options: {
  taskId?: number
  parentId?: number
  initialValues?: Partial<FormFields>
  isEdit: boolean
}): UseTaskFormReturn {
  const { taskId, parentId, initialValues, isEdit } = options
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [fields, setFields] = useState<FormFields>({
    name: initialValues?.name ?? '',
    description: initialValues?.description ?? '',
    planned_start_date: initialValues?.planned_start_date ?? '',
    planned_end_date: initialValues?.planned_end_date ?? '',
    planned_effort_hours: initialValues?.planned_effort_hours ?? '',
    progress_mode: initialValues?.progress_mode ?? 'auto',
    progress_percent: initialValues?.progress_percent ?? '0',
    status: initialValues?.status ?? 'not_started',
  })
  const [nameError, setNameError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const updateField = useCallback(<K extends keyof FormFields>(key: K, value: FormFields[K]) => {
    setFields(prev => ({ ...prev, [key]: value }))
    if (key === 'name') setNameError('')
  }, [])

  const handleSubmit = useCallback(async () => {
    const name = fields.name.trim()
    if (!name) {
      setNameError('Name is required')
      return
    }

    if (fields.planned_start_date && fields.planned_end_date) {
      if (fields.planned_start_date > fields.planned_end_date) {
        showToast('End date must be after start date', 'warning')
        return
      }
    }

    setSubmitting(true)
    const data: TaskFormData = {
      name,
      description: fields.description.trim(),
      planned_start_date: fields.planned_start_date || null,
      planned_end_date: fields.planned_end_date || null,
      planned_effort_hours: parseFloat(fields.planned_effort_hours) || 0,
      progress_mode: fields.progress_mode,
    }

    if (fields.progress_mode === 'manual') {
      data.progress_percent = parseFloat(fields.progress_percent) || 0
    }

    if (isEdit) {
      data.status = fields.status
    } else if (parentId) {
      data.parent_id = parentId
    }

    try {
      if (isEdit && taskId) {
        await updateTask(taskId, data)
        showToast('Task updated', 'success')
        navigate(`/tasks/${taskId}`)
      } else {
        const res = await createTask(data)
        showToast('Task created', 'success')
        navigate(`/tasks/${res.data.id}`)
      }
    } catch (err) {
      showToast('Error: ' + (err instanceof Error ? err.message : 'Unknown error'), 'error')
      setSubmitting(false)
    }
  }, [fields, isEdit, taskId, parentId, navigate, showToast])

  return { fields, nameError, submitting, updateField, handleSubmit }
}
