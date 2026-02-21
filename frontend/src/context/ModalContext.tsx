import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

interface ModalConfig {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
}

interface ModalState extends ModalConfig {
  isOpen: boolean
}

interface ModalContextValue {
  modalState: ModalState
  showConfirm: (config: ModalConfig) => Promise<boolean>
  closeModal: (result: boolean) => void
}

const ModalContext = createContext<ModalContextValue | null>(null)

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    title: '',
    message: '',
  })
  const resolveRef = useRef<((value: boolean) => void) | null>(null)

  const showConfirm = useCallback((config: ModalConfig): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve
      setModalState({ ...config, isOpen: true })
    })
  }, [])

  const closeModal = useCallback((result: boolean) => {
    setModalState(prev => ({ ...prev, isOpen: false }))
    if (resolveRef.current) {
      resolveRef.current(result)
      resolveRef.current = null
    }
  }, [])

  return (
    <ModalContext.Provider value={{ modalState, showConfirm, closeModal }}>
      {children}
    </ModalContext.Provider>
  )
}

export function useModal(): ModalContextValue {
  const ctx = useContext(ModalContext)
  if (!ctx) throw new Error('useModal must be used within ModalProvider')
  return ctx
}
