import { describe, it, expect } from 'vitest'
import { formatDate, toInputDate, today, daysBetween, formatHours } from '../../utils/dates.ts'

describe('formatDate', () => {
  it('formats a valid date string to YYYY/MM/DD', () => {
    expect(formatDate('2024-03-15')).toBe('2024/03/15')
  })

  it('formats ISO date string', () => {
    expect(formatDate('2024-01-01T00:00:00Z')).toBe('2024/01/01')
  })

  it('returns empty string for null', () => {
    expect(formatDate(null)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(formatDate(undefined)).toBe('')
  })

  it('returns empty string for invalid date', () => {
    expect(formatDate('not-a-date')).toBe('')
  })

  it('pads single digit months and days', () => {
    expect(formatDate('2024-01-05')).toBe('2024/01/05')
  })
})

describe('toInputDate', () => {
  it('formats a date for input[type=date]', () => {
    expect(toInputDate('2024-03-15')).toBe('2024-03-15')
  })

  it('returns empty string for null', () => {
    expect(toInputDate(null)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(toInputDate(undefined)).toBe('')
  })

  it('returns empty string for invalid date', () => {
    expect(toInputDate('invalid')).toBe('')
  })
})

describe('today', () => {
  it('returns a date string in YYYY-MM-DD format', () => {
    const result = today()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('daysBetween', () => {
  it('calculates positive days between two dates', () => {
    expect(daysBetween('2024-01-01', '2024-01-10')).toBe(9)
  })

  it('calculates negative days when first date is later', () => {
    expect(daysBetween('2024-01-10', '2024-01-01')).toBe(-9)
  })

  it('returns 0 for same date', () => {
    expect(daysBetween('2024-06-15', '2024-06-15')).toBe(0)
  })
})

describe('formatHours', () => {
  it('formats hours with one decimal', () => {
    expect(formatHours(12.5)).toBe('12.5h')
  })

  it('formats integer hours', () => {
    expect(formatHours(8)).toBe('8.0h')
  })

  it('returns 0h for null', () => {
    expect(formatHours(null)).toBe('0h')
  })

  it('returns 0h for undefined', () => {
    expect(formatHours(undefined)).toBe('0h')
  })
})
