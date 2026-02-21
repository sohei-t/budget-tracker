import { useCallback, useState } from 'react'
import { recordActual } from '../api/actuals.ts'
import { today } from '../utils/dates.ts'
import { useToast } from '../context/ToastContext.tsx'

interface ActualFields {
  work_date: string
  actual_hours: string
  notes: string
}

interface UseActualFormReturn {
  fields: ActualFields
  submitting: boolean
  updateField: <K extends keyof ActualFields>(key: K, value: ActualFields[K]) => void
  handleSubmit: () => Promise<void>
}

export function useActualForm(taskId: number, onSuccess: () => void): UseActualFormReturn {
  const { showToast } = useToast()
  const [fields, setFields] = useState<ActualFields>({
    work_date: today(),
    actual_hours: '',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const updateField = useCallback(<K extends keyof ActualFields>(key: K, value: ActualFields[K]) => {
    setFields(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleSubmit = useCallback(async () => {
    const hours = parseFloat(fields.actual_hours)
    if (!hours || hours <= 0) {
      showToast('Please enter valid hours', 'warning')
      return
    }

    setSubmitting(true)
    try {
      await recordActual(taskId, {
        work_date: fields.work_date,
        actual_hours: hours,
        notes: fields.notes.trim(),
      })
      showToast('Work recorded', 'success')
      setFields({ work_date: today(), actual_hours: '', notes: '' })
      onSuccess()
    } catch (err) {
      showToast('Failed to record: ' + (err instanceof Error ? err.message : 'Unknown error'), 'error')
    } finally {
      setSubmitting(false)
    }
  }, [fields, taskId, showToast, onSuccess])

  return { fields, submitting, updateField, handleSubmit }
}
