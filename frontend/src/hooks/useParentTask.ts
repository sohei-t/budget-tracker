import { useState, useEffect } from 'react'
import type { Task } from '../types/index.ts'
import { getTask } from '../api/tasks.ts'

interface UseParentTaskReturn {
  parentTask: Task | null
  loading: boolean
  error: string | null
}

export function useParentTask(parentId: string | null): UseParentTaskReturn {
  const [parentTask, setParentTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(!!parentId)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!parentId) return
    let cancelled = false
    setLoading(true)
    setError(null)

    getTask(parentId)
      .then((res) => {
        if (!cancelled) setParentTask(res.data)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load parent task')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [parentId])

  return { parentTask, loading, error }
}
