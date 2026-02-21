import { useCallback } from 'react'
import { useActualForm } from '../../hooks/useActualForm.ts'

interface ActualFormProps {
  taskId: number
  onSuccess: () => void
}

export function ActualForm({ taskId, onSuccess }: ActualFormProps) {
  const { fields, submitting, updateField, handleSubmit } = useActualForm(taskId, onSuccess)

  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      handleSubmit()
    },
    [handleSubmit]
  )

  return (
    <form onSubmit={onSubmit} className="flex gap-4 items-center" style={{ flexWrap: 'wrap' }}>
      <div className="form-group" style={{ marginBottom: 0, flex: '0 0 auto' }}>
        <label className="form-label" htmlFor="actualDate">Date</label>
        <input
          type="date"
          id="actualDate"
          className="form-input"
          value={fields.work_date}
          onChange={e => updateField('work_date', e.target.value)}
          style={{ width: 160 }}
        />
      </div>
      <div className="form-group" style={{ marginBottom: 0, flex: '0 0 auto' }}>
        <label className="form-label" htmlFor="actualHours">Hours</label>
        <input
          type="number"
          id="actualHours"
          className="form-input"
          min="0.5"
          max="24"
          step="0.5"
          placeholder="0.0"
          value={fields.actual_hours}
          onChange={e => updateField('actual_hours', e.target.value)}
          style={{ width: 100 }}
          required
        />
      </div>
      <div className="form-group" style={{ marginBottom: 0, flex: '1 1 auto', minWidth: 150 }}>
        <label className="form-label" htmlFor="actualNote">Note</label>
        <input
          type="text"
          id="actualNote"
          className="form-input"
          maxLength={500}
          placeholder="What did you work on?"
          value={fields.notes}
          onChange={e => updateField('notes', e.target.value)}
        />
      </div>
      <div style={{ paddingTop: 20 }}>
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Recording...' : 'Record'}
        </button>
      </div>
    </form>
  )
}
