import { useCallback, useEffect, useRef, useState } from 'react'

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

interface UseApiReturn<T> extends UseApiState<T> {
  refetch: () => Promise<void>
}

export function useApi<T>(fetcher: () => Promise<{ data: T }>, deps: unknown[] = []): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
  })
  const mountedRef = useRef(true)

  const refetch = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const res = await fetcher()
      if (mountedRef.current) {
        setState({ data: res.data, loading: false, error: null })
      }
    } catch (err) {
      if (mountedRef.current) {
        setState({ data: null, loading: false, error: err instanceof Error ? err.message : 'Unknown error' })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    mountedRef.current = true
    refetch()
    return () => { mountedRef.current = false }
  }, [refetch])

  return { ...state, refetch }
}
