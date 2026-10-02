import { describe, expect, test } from 'vitest'
import { buckets, groupByCategory, monthSummary, sumBy, weekOfMonth } from '../src/lib/stats'

type T = { type: 'expense' | 'income' | 'transfer'; amount: number; categoryId: string | null; date: string; month: string }
const tx = (type: T['type'], amount: number, categoryId: string | null, date = '2026-10-05'): T => ({
  type, amount, categoryId, date, month: date.slice(0, 7),
})

// food (root) > coffee, meal ; transport (root)
const parents: Record<string, string | null> = { food: null, coffee: 'food', meal: 'food', transport: null, salary: null }
const rootOf = (id: string | null | undefined) => (id ? (parents[id] ?? id) : null)

describe('monthSummary', () => {
  test('sums income and expense, ignores transfers', () => {
    const s = monthSummary([tx('income', 8000000, 'salary'), tx('expense', 25000, 'coffee'), tx('expense', 75000, 'meal'), tx('transfer', 500000, null)])
    expect(s).toEqual({ income: 8000000, expense: 100000, net: 7900000 })
  })
})

describe('groupByCategory', () => {
  const txs = [
    tx('expense', 25000, 'coffee'),
    tx('expense', 15000, 'coffee'),
    tx('expense', 60000, 'meal'),
    tx('expense', 10000, 'food'),
    tx('expense', 90000, 'transport'),
    tx('income', 8000000, 'salary'),
  ]

  test('rolls subcategories up into roots, sorted by total desc, with share', () => {
    const g = groupByCategory(txs, 'expense', rootOf)
    expect(g.map((r) => [r.rootId, r.total, r.count])).toEqual([
      ['food', 110000, 4],
      ['transport', 90000, 1],
    ])
    expect(g[0].share).toBeCloseTo(0.55)
    expect(g[1].share).toBeCloseTo(0.45)
  })

  test('keeps per-subcategory breakdown, root-only spending under the root id', () => {
    const food = groupByCategory(txs, 'expense', rootOf)[0]
    expect(food.children).toEqual([
      { id: 'meal', total: 60000, count: 1 },
      { id: 'coffee', total: 40000, count: 2 },
      { id: 'food', total: 10000, count: 1 },
    ])
  })

  test('empty input gives empty list', () => {
    expect(groupByCategory([], 'expense', rootOf)).toEqual([])
  })
})

describe('sumBy', () => {
  test('totals one type per key', () => {
    const txs = [tx('expense', 10, 'food', '2026-10-01'), tx('expense', 5, 'food', '2026-10-01'), tx('expense', 7, 'food', '2026-10-03'), tx('income', 99, 'salary', '2026-10-01')]
    expect(sumBy(txs, 'expense', (t) => t.date)).toEqual({ '2026-10-01': 15, '2026-10-03': 7 })
  })
})

describe('weekOfMonth', () => {
  test('splits a month into 7-day blocks starting at day 1', () => {
    expect(weekOfMonth('2026-10-01')).toBe(0)
    expect(weekOfMonth('2026-10-07')).toBe(0)
    expect(weekOfMonth('2026-10-08')).toBe(1)
    expect(weekOfMonth('2026-10-29')).toBe(4)
    expect(weekOfMonth('2026-10-31')).toBe(4)
  })
})

describe('buckets', () => {
  const at = (date: string) => ({ date, month: date.slice(0, 7) })

  test('daily: one bucket per day, starts on today in the current month', () => {
    const b = buckets('daily', '2026-02', '2026-02-10')
    expect(b.keys).toHaveLength(28)
    expect(b.keys[0]).toBe('01')
    expect(b.keyOf(at('2026-02-09'))).toBe('09')
    expect(b.initial).toBe('10')
    expect([b.from, b.to]).toEqual(['2026-02', '2026-02'])
  })

  test('daily: past month starts on its last day', () => {
    expect(buckets('daily', '2026-01', '2026-02-10').initial).toBe('31')
  })

  test('weekly: 7-day blocks, 5 for a 31-day month, 4 for February', () => {
    expect(buckets('weekly', '2026-10', '2026-10-15').keys).toEqual(['0', '1', '2', '3', '4'])
    expect(buckets('weekly', '2026-02', '2026-10-15').keys).toEqual(['0', '1', '2', '3'])
    expect(buckets('weekly', '2026-10', '2026-10-15').initial).toBe('2')
    expect(buckets('weekly', '2026-10', '2026-10-15').keyOf(at('2026-10-30'))).toBe('4')
  })

  test('monthly: 12 months ending at the selected month', () => {
    const b = buckets('monthly', '2026-10', '2026-10-15')
    expect(b.keys[0]).toBe('2025-11')
    expect(b.keys[11]).toBe('2026-10')
    expect(b.initial).toBe('2026-10')
    expect([b.from, b.to]).toEqual(['2025-11', '2026-10'])
    expect(b.keyOf(at('2026-03-04'))).toBe('2026-03')
  })

  test('yearly: 5 years ending at the selected month’s year', () => {
    const b = buckets('yearly', '2026-10', '2026-10-15')
    expect(b.keys).toEqual(['2022', '2023', '2024', '2025', '2026'])
    expect(b.initial).toBe('2026')
    expect([b.from, b.to]).toEqual(['2022-01', '2026-12'])
    expect(b.keyOf(at('2024-07-01'))).toBe('2024')
  })
})
