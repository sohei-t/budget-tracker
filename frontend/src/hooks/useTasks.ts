import { useCallback, useState } from 'react'
import { getTasks, getChildren } from '../api/tasks.ts'
import type { Task } from '../types/index.ts'
import { useApi } from './useApi.ts'

export function useTasks(): {
  tasks: Task[]
  expandedIds: Set<string>
  loading: boolean
  error: string | null
  toggleExpand: (id: string) => Promise<void>
  expandAll: () => Promise<void>
  collapseAll: () => void
  refetch: () => Promise<void>
} {
  const { data, loading, error, refetch } = useApi<Task[]>(() => getTasks(), [])
  const [extraTasks, setExtraTasks] = useState<Task[]>([])
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const allTasks = [...(data ?? []), ...extraTasks]

  const loadChildren = useCallback(async (parentId: string, currentTasks: Task[]) => {
    const hasChildren = currentTasks.some(t => String(t.parent_id) === parentId)
    if (!hasChildren) {
      try {
        const res = await getChildren(parentId)
        if (res.data && res.data.length > 0) {
          const existingIds = new Set(currentTasks.map(t => t.id))
          const newTasks = res.data.filter(t => !existingIds.has(t.id))
          if (newTasks.length > 0) {
            setExtraTasks(prev => [...prev, ...newTasks])
          }
          return [...currentTasks, ...newTasks]
        }
      } catch (err) {
        console.error('Failed to load children:', err)
      }
    }
    return currentTasks
  }, [])

  const toggleExpand = useCallback(async (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
    // Load children if expanding and not loaded
    const currentAll = [...(data ?? []), ...extraTasks]
    const hasChildren = currentAll.some(t => String(t.parent_id) === id)
    if (!hasChildren) {
      await loadChildren(id, currentAll)
    }
  }, [data, extraTasks, loadChildren])

  const expandAll = useCallback(async () => {
    let currentAll = [...(data ?? []), ...extraTasks]
    const parentIds = currentAll.filter(t => t.children_count > 0).map(t => String(t.id))
    for (const pid of parentIds) {
      currentAll = await loadChildren(pid, currentAll)
    }
    const allParentIds = new Set(
      currentAll.filter(t => t.children_count > 0).map(t => String(t.id))
    )
    setExpandedIds(allParentIds)
  }, [data, extraTasks, loadChildren])

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set())
  }, [])

  return {
    tasks: allTasks,
    expandedIds,
    loading,
    error,
    toggleExpand,
    expandAll,
    collapseAll,
    refetch,
  }
}
