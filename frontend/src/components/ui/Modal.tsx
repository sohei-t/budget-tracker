import { useEffect, useRef } from 'react'
import { useModal } from '../../context/ModalContext.tsx'

export function Modal() {
  const { modalState, closeModal } = useModal()
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (modalState.isOpen && confirmRef.current) {
      confirmRef.current.focus()
    }
  }, [modalState.isOpen])

  useEffect(() => {
    if (!modalState.isOpen) return
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') closeModal(false)
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [modalState.isOpen, closeModal])

  if (!modalState.isOpen) return null

  const { title, message, confirmText = 'Confirm', cancelText = 'Cancel', danger = false } = modalState

  return (
    <div className="modal-overlay" onClick={() => closeModal(false)}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={e => e.stopPropagation()}
      >
        <div className="modal__header">
          <h2 className="modal__title" id="modal-title">{title}</h2>
          <button
            className="btn btn--icon modal__close"
            aria-label="Close"
            onClick={() => closeModal(false)}
          >
            &times;
          </button>
        </div>
        <div className="modal__body">
          <p>{message}</p>
        </div>
        <div className="modal__footer">
          <button className="btn btn--secondary" onClick={() => closeModal(false)}>
            {cancelText}
          </button>
          <button
            ref={confirmRef}
            className={`btn ${danger ? 'btn--danger' : 'btn--primary'}`}
            onClick={() => closeModal(true)}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
