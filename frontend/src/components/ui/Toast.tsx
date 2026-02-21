import { useCallback } from 'react'
import { useToast } from '../../context/ToastContext.tsx'

export function ToastContainer() {
  const { toasts, removeToast } = useToast()

  const handleClose = useCallback(
    (id: number) => {
      removeToast(id)
    },
    [removeToast]
  )

  return (
    <div className="toast-container" role="alert" aria-live="polite">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast--${toast.type}`} role="status">
          <span className="toast__message">{toast.message}</span>
          <button
            className="toast__close"
            aria-label="Close notification"
            onClick={() => handleClose(toast.id)}
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  )
}
