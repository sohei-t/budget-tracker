import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from '../../hooks/useDebounce.ts'

describe('useDebounce', () => {
  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 300))
    expect(result.current).toBe('hello')
  })

  it('debounces value changes', async () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 300 } }
    )

    expect(result.current).toBe('initial')

    rerender({ value: 'changed', delay: 300 })
    expect(result.current).toBe('initial')

    act(() => { vi.advanceTimersByTime(300) })
    expect(result.current).toBe('changed')

    vi.useRealTimers()
  })

  it('resets timer on rapid changes', () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'a', delay: 200 } }
    )

    rerender({ value: 'b', delay: 200 })
    act(() => { vi.advanceTimersByTime(100) })
    expect(result.current).toBe('a')

    rerender({ value: 'c', delay: 200 })
    act(() => { vi.advanceTimersByTime(100) })
    expect(result.current).toBe('a')

    act(() => { vi.advanceTimersByTime(200) })
    expect(result.current).toBe('c')

    vi.useRealTimers()
  })
})
