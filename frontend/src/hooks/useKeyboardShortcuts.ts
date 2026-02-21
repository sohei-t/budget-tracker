import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext.tsx'

export function useKeyboardShortcuts(callbacks: {
  onToggleSearch: () => void
  onToggleShortcuts: () => void
}): void {
  const navigate = useNavigate()
  const { toggleTheme } = useTheme()
  const lastKeyRef = useRef<string | null>(null)
  const lastKeyTimeRef = useRef(0)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        if (e.key === 'Escape') {
          ;(e.target as HTMLElement).blur()
        }
        return
      }

      const now = Date.now()
      const isCombo = now - lastKeyTimeRef.current < 800

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'k' || e.key === 'K') {
          e.preventDefault()
          callbacks.onToggleSearch()
          return
        }
        if (e.key === 'd' || e.key === 'D') {
          e.preventDefault()
          toggleTheme()
          return
        }
        return
      }

      if (isCombo && lastKeyRef.current === 'g') {
        if (e.key === 'd') navigate('/dashboard')
        else if (e.key === 't') navigate('/tasks')
        lastKeyRef.current = null
        return
      }

      switch (e.key) {
        case '?':
          e.preventDefault()
          callbacks.onToggleShortcuts()
          break
        case 'n':
        case 'N':
          navigate('/tasks/new')
          break
        case 'Escape':
          // handled by individual components
          break
      }

      lastKeyRef.current = e.key
      lastKeyTimeRef.current = now
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [navigate, toggleTheme, callbacks])
}
