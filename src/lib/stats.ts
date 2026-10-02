import { daysInMonth, monthKey, monthRange } from './dates'
import type { CategoryType, TxType } from './types'

interface TxLike {
  type: TxType
  amount: number
  categoryId: string | null
  date: string
}

export function monthSummary(txs: TxLike[]) {
  let income = 0
  let expense = 0
  for (const t of txs) {
    if (t.type === 'income') income += t.amount
    else if (t.type === 'expense') expense += t.amount
  }
  return { income, expense, net: income - expense }
}

export interface CategoryGroup {
  rootId: string
  total: number
  count: number
  /** Fraction of the type's total, 0..1 */
  share: number
  /** Per category id (root id = spent on the root itself), total desc. */
  children: { id: string; total: number; count: number }[]
}

export function groupByCategory(
  txs: TxLike[],
  type: CategoryType,
  rootOf: (id: string | null | undefined) => string | null,
): CategoryGroup[] {
  const roots = new Map<string, Map<string, { total: number; count: number }>>()
  let grand = 0
  for (const t of txs) {
    if (t.type !== type || !t.categoryId) continue
    const root = rootOf(t.categoryId) ?? t.categoryId
    const kids = roots.get(root) ?? new Map()
    roots.set(root, kids)
    const k = kids.get(t.categoryId) ?? { total: 0, count: 0 }
    k.total += t.amount
    k.count += 1
    kids.set(t.categoryId, k)
    grand += t.amount
  }
  const out: CategoryGroup[] = []
  for (const [rootId, kids] of roots) {
    const children = [...kids].map(([id, v]) => ({ id, ...v })).sort((a, b) => b.total - a.total)
    const total = children.reduce((s, c) => s + c.total, 0)
    const count = children.reduce((s, c) => s + c.count, 0)
    out.push({ rootId, total, count, share: grand ? total / grand : 0, children })
  }
  return out.sort((a, b) => b.total - a.total)
}

export function sumBy<T extends TxLike>(txs: T[], type: TxType, key: (t: T) => string): Record<string, number> {
  const out: Record<string, number> = {}
  for (const t of txs) {
    if (t.type !== type) continue
    const k = key(t)
    out[k] = (out[k] ?? 0) + t.amount
  }
  return out
}

/** 0-based 7-day block within the month: days 1–7 → 0, …, 29–31 → 4. */
export function weekOfMonth(date: string): number {
  return Math.floor((Number(date.slice(8, 10)) - 1) / 7)
}

export type BucketMode = 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface Buckets {
  keys: string[]
  keyOf: (tx: { date: string; month: string }) => string
  /** Bucket selected by default: the one containing today, else the latest. */
  initial: string
  /** Inclusive month range to load. */
  from: string
  to: string
}

export function buckets(mode: BucketMode, month: string, today: string): Buckets {
  const isCurrent = monthKey(today) === month
  const last = (keys: string[], current: string) => (isCurrent && keys.includes(current) ? current : keys[keys.length - 1])
  switch (mode) {
    case 'daily': {
      const keys = Array.from({ length: daysInMonth(month) }, (_, i) => String(i + 1).padStart(2, '0'))
      return { keys, keyOf: (t) => t.date.slice(8, 10), initial: last(keys, today.slice(8, 10)), from: month, to: month }
    }
    case 'weekly': {
      const keys = Array.from({ length: Math.ceil(daysInMonth(month) / 7) }, (_, i) => String(i))
      return { keys, keyOf: (t) => String(weekOfMonth(t.date)), initial: last(keys, String(weekOfMonth(today))), from: month, to: month }
    }
    case 'monthly': {
      const keys = monthRange(month, 12)
      return { keys, keyOf: (t) => t.month, initial: month, from: keys[0], to: month }
    }
    case 'yearly': {
      const y = Number(month.slice(0, 4))
      const keys = Array.from({ length: 5 }, (_, i) => String(y - 4 + i))
      return { keys, keyOf: (t) => t.date.slice(0, 4), initial: String(y), from: `${keys[0]}-01`, to: `${y}-12` }
    }
  }
}
