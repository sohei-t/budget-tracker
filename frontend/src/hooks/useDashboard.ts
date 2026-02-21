import { getDashboardSummary, getDelayedTasks } from '../api/dashboard.ts'
import type { DashboardSummary, DelayedTask } from '../types/index.ts'
import { useApi } from './useApi.ts'

export function useDashboard(): {
  summary: DashboardSummary | null
  delayedTasks: DelayedTask[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
} {
  const summaryApi = useApi<DashboardSummary>(() => getDashboardSummary(), [])
  const delaysApi = useApi<DelayedTask[]>(() => getDelayedTasks(), [])

  return {
    summary: summaryApi.data,
    delayedTasks: delaysApi.data ?? [],
    loading: summaryApi.loading || delaysApi.loading,
    error: summaryApi.error || delaysApi.error,
    refetch: async () => {
      await Promise.all([summaryApi.refetch(), delaysApi.refetch()])
    },
  }
}
