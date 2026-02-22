import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import type { ToastType } from '../types/index.ts'

interface ToastItem {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  toasts: ToastItem[]
  showToast: (message: string, type?: ToastType, duration?: number) => void
  removeToast: (id: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(0)

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
    const id = nextId.current++
    setToasts(prev => [...prev, { id, message, type }])
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration)
    }
  }, [removeToast])

  const value = useMemo(() => ({ toasts, showToast, removeToast }), [toasts, showToast, removeToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
