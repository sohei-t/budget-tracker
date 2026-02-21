import { useCallback, useEffect, useRef, useState } from 'react'
import { getTask, getChildren } from '../api/tasks.ts'
import { getActuals } from '../api/actuals.ts'
import type { Task, Actual } from '../types/index.ts'

interface UseTaskReturn {
  task: Task | null
  children: Task[]
  actuals: Actual[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useTask(taskId: string): UseTaskReturn {
  const [task, setTask] = useState<Task | null>(null)
  const [children, setChildren] = useState<Task[]>([])
  const [actuals, setActuals] = useState<Actual[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [taskRes, actualsRes] = await Promise.all([
        getTask(taskId),
        getActuals(taskId).catch(() => ({ data: [] as Actual[] })),
      ])
      if (!mountedRef.current) return

      const taskData = taskRes.data
      setTask(taskData)
      setActuals(actualsRes.data ?? [])

      if (taskData.children_count > 0) {
        try {
          const childRes = await getChildren(taskId)
          if (mountedRef.current) {
            setChildren(childRes.data ?? [])
          }
        } catch {
          // ignore
        }
      } else {
        setChildren([])
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load task')
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [taskId])

  useEffect(() => {
    mountedRef.current = true
    refetch()
    return () => { mountedRef.current = false }
  }, [refetch])

  return { task, children, actuals, loading, error, refetch }
}
