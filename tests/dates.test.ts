import { describe, expect, test } from 'vitest'
import {
  addDays,
  addMonths,
  daysInMonth,
  effectiveDay,
  monthKey,
  monthRange,
  todayWIB,
} from '../src/lib/dates'

describe('todayWIB', () => {
  test('uses UTC+7, so 17:30 UTC is already the next day', () => {
    expect(todayWIB(new Date('2026-10-02T17:30:00Z'))).toBe('2026-10-03')
    expect(todayWIB(new Date('2026-10-02T16:59:00Z'))).toBe('2026-10-02')
  })
})

describe('month helpers', () => {
  test('monthKey takes YYYY-MM from a date', () => {
    expect(monthKey('2026-10-02')).toBe('2026-10')
  })

  test('addMonths crosses year boundaries both ways', () => {
    expect(addMonths('2026-12', 1)).toBe('2027-01')
    expect(addMonths('2026-01', -1)).toBe('2025-12')
    expect(addMonths('2026-10', -12)).toBe('2025-10')
  })

  test('daysInMonth handles leap years', () => {
    expect(daysInMonth('2026-02')).toBe(28)
    expect(daysInMonth('2028-02')).toBe(29)
    expect(daysInMonth('2026-10')).toBe(31)
  })

  test('effectiveDay clamps day 31 to the last day of short months', () => {
    expect(effectiveDay(31, '2026-02')).toBe(28)
    expect(effectiveDay(31, '2026-04')).toBe(30)
    expect(effectiveDay(15, '2026-02')).toBe(15)
  })

  test('monthRange lists count months ending at end, oldest first', () => {
    expect(monthRange('2026-02', 3)).toEqual(['2025-12', '2026-01', '2026-02'])
  })
})

describe('addDays', () => {
  test('crosses month and year boundaries', () => {
    expect(addDays('2026-10-01', -1)).toBe('2026-09-30')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
  })
})
