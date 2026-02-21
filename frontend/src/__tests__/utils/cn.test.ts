import { describe, it, expect } from 'vitest'
import { cn } from '../../utils/cn.ts'

describe('cn', () => {
  it('joins multiple class names', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c')
  })

  it('filters out falsy values', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b')
  })

  it('returns empty string for no truthy classes', () => {
    expect(cn(false, null, undefined)).toBe('')
  })

  it('handles conditional classes', () => {
    const isActive = true
    const isDisabled = false
    expect(cn('btn', isActive && 'btn--active', isDisabled && 'btn--disabled')).toBe('btn btn--active')
  })
})
