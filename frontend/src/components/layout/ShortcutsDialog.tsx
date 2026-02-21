import { useEffect } from 'react'

interface ShortcutsDialogProps {
  onClose: () => void
}

export function ShortcutsDialog({ onClose }: ShortcutsDialogProps) {
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal shortcuts-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
        onClick={e => e.stopPropagation()}
      >
        <div className="modal__header">
          <h2 className="modal__title" id="shortcuts-title">Keyboard Shortcuts</h2>
          <button className="btn btn--icon modal__close" aria-label="Close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="modal__body">
          <div className="shortcuts-grid">
            <div className="shortcut-group">
              <h3>Navigation</h3>
              <div className="shortcut-item"><kbd>G</kbd> <kbd>D</kbd> <span>Go to Dashboard</span></div>
              <div className="shortcut-item"><kbd>G</kbd> <kbd>T</kbd> <span>Go to Tasks</span></div>
            </div>
            <div className="shortcut-group">
              <h3>Actions</h3>
              <div className="shortcut-item"><kbd>N</kbd> <span>New Task</span></div>
              <div className="shortcut-item"><kbd>Ctrl</kbd>+<kbd>K</kbd> <span>Search</span></div>
              <div className="shortcut-item"><kbd>Ctrl</kbd>+<kbd>D</kbd> <span>Toggle Dark Mode</span></div>
              <div className="shortcut-item"><kbd>Esc</kbd> <span>Close Modal / Cancel</span></div>
              <div className="shortcut-item"><kbd>?</kbd> <span>Show Shortcuts</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
