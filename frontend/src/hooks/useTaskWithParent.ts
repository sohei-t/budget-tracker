import { useState, useEffect } from 'react'
import type { Task } from '../types/index.ts'
import { getTask } from '../api/tasks.ts'

interface UseTaskWithParentReturn {
  task: Task | null
  parentTask: Task | null
  loading: boolean
  error: string | null
}

export function useTaskWithParent(taskId: string | undefined): UseTaskWithParentReturn {
  const [task, setTask] = useState<Task | null>(null)
  const [parentTask, setParentTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!taskId) {
      setLoading(false)
      setError('Task ID is required')
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)

    getTask(taskId)
      .then(async (res) => {
        if (cancelled) return
        const t = res.data
        setTask(t)
        if (t.parent_id) {
          try {
            const parentRes = await getTask(String(t.parent_id))
            if (!cancelled) setParentTask(parentRes.data)
          } catch {
            // Parent loading is optional
          }
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load task')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [taskId])

  return { task, parentTask, loading, error }
}
