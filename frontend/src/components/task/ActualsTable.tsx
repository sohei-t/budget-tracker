import { memo, useCallback } from 'react'
import type { Actual } from '../../types/index.ts'
import { formatDate, formatHours } from '../../utils/dates.ts'
import { useModal } from '../../context/ModalContext.tsx'
import { useToast } from '../../context/ToastContext.tsx'
import { deleteActual } from '../../api/actuals.ts'

interface ActualsTableProps {
  actuals: Actual[]
  onRefresh: () => void
}

export const ActualsTable = memo(function ActualsTable({ actuals, onRefresh }: ActualsTableProps) {
  const { showConfirm } = useModal()
  const { showToast } = useToast()

  const handleDelete = useCallback(
    async (actualId: number) => {
      const confirmed = await showConfirm({
        title: 'Delete Entry',
        message: 'Delete this work entry?',
        confirmText: 'Delete',
        danger: true,
      })
      if (confirmed) {
        try {
          await deleteActual(actualId)
          showToast('Entry deleted', 'success')
          onRefresh()
        } catch (err) {
          showToast('Failed to delete: ' + (err instanceof Error ? err.message : 'Unknown error'), 'error')
        }
      }
    },
    [showConfirm, showToast, onRefresh]
  )

  if (actuals.length === 0) {
    return <p className="text-muted text-sm">No work recorded yet.</p>
  }

  return (
    <table className="actuals-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Hours</th>
          <th>Note</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {actuals.map(actual => (
          <tr key={actual.id}>
            <td>{formatDate(actual.work_date)}</td>
            <td>{formatHours(actual.actual_hours)}</td>
            <td className="text-sm text-muted">{actual.notes || '-'}</td>
            <td className="actuals-table__actions">
              <button
                className="btn btn--sm btn--ghost"
                title="Delete"
                onClick={() => handleDelete(actual.id)}
              >
                &#10005;
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
})
