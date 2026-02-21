import { useCallback, useMemo, useState } from 'react'
import type { Task } from '../types/index.ts'
import { useDebounce } from './useDebounce.ts'

interface UseSearchReturn {
  query: string
  setQuery: (q: string) => void
  results: Task[]
  focusIndex: number
  setFocusIndex: (i: number) => void
  moveFocus: (direction: 'up' | 'down') => void
}

export function useSearch(tasks: Task[]): UseSearchReturn {
  const [query, setQuery] = useState('')
  const [focusIndex, setFocusIndex] = useState(-1)
  const debouncedQuery = useDebounce(query, 150)

  const results = useMemo(() => {
    if (!debouncedQuery || debouncedQuery.length < 1) return []
    const q = debouncedQuery.toLowerCase()
    return tasks
      .filter(
        t =>
          t.name.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q))
      )
      .slice(0, 10)
  }, [tasks, debouncedQuery])

  const moveFocus = useCallback(
    (direction: 'up' | 'down') => {
      setFocusIndex(prev => {
        if (direction === 'down') return Math.min(prev + 1, results.length - 1)
        return Math.max(prev - 1, 0)
      })
    },
    [results.length]
  )

  const setQueryWrapped = useCallback((q: string) => {
    setQuery(q)
    setFocusIndex(-1)
  }, [])

  return { query, setQuery: setQueryWrapped, results, focusIndex, setFocusIndex, moveFocus }
}
