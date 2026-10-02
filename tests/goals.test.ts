import { expect, test } from 'vitest'
import { goalProgress } from '../src/lib/goals'

test('progress from wallet balance, capped at 100%', () => {
  expect(goalProgress(5_000_000, 15_000_000, null, '2026-10-02')).toEqual({ pct: 1 / 3, left: 10_000_000, perMonth: null, reached: false })
  expect(goalProgress(20_000_000, 15_000_000, null, '2026-10-02')).toMatchObject({ pct: 1, left: 0, reached: true })
})

test('negative balance counts as zero progress', () => {
  expect(goalProgress(-50_000, 1_000_000, null, '2026-10-02')).toMatchObject({ pct: 0, left: 1_000_000 })
})

test('perMonth spreads the remainder over months left, including the deadline month', () => {
  // Oct, Nov, Dec 2026, Jan, Feb, Mar 2027 = 6 months
  expect(goalProgress(3_000_000, 15_000_000, '2027-03-31', '2026-10-02').perMonth).toBe(2_000_000)
})

test('deadline this month or past asks for everything now', () => {
  expect(goalProgress(0, 900_000, '2026-10-20', '2026-10-02').perMonth).toBe(900_000)
  expect(goalProgress(0, 900_000, '2026-01-01', '2026-10-02').perMonth).toBe(900_000)
})

test('perMonth rounds up to whole rupiah', () => {
  expect(goalProgress(0, 1_000_000, '2026-12-01', '2026-10-02').perMonth).toBe(333_334)
})
