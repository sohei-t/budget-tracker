import { describe, it, expect } from 'vitest'
import { clampPercent, STATUS_LABELS, STATUS_BADGE_CLASS } from '../../utils/format.ts'

describe('clampPercent', () => {
  it('clamps value to 0-100 range', () => {
    expect(clampPercent(50)).toBe(50)
    expect(clampPercent(-10)).toBe(0)
    expect(clampPercent(150)).toBe(100)
  })

  it('rounds to nearest integer', () => {
    expect(clampPercent(33.7)).toBe(34)
    expect(clampPercent(33.3)).toBe(33)
  })

  it('handles null and undefined', () => {
    expect(clampPercent(null)).toBe(0)
    expect(clampPercent(undefined)).toBe(0)
  })
})

describe('STATUS_LABELS', () => {
  it('has labels for all statuses', () => {
    expect(STATUS_LABELS.not_started).toBe('Not Started')
    expect(STATUS_LABELS.in_progress).toBe('In Progress')
    expect(STATUS_LABELS.completed).toBe('Completed')
    expect(STATUS_LABELS.on_hold).toBe('On Hold')
  })
})

describe('STATUS_BADGE_CLASS', () => {
  it('has badge classes for all statuses', () => {
    expect(STATUS_BADGE_CLASS.not_started).toBe('badge--secondary')
    expect(STATUS_BADGE_CLASS.in_progress).toBe('badge--primary')
    expect(STATUS_BADGE_CLASS.completed).toBe('badge--success')
    expect(STATUS_BADGE_CLASS.on_hold).toBe('badge--warning')
  })
})
