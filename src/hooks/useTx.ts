import type { Tx } from '@/lib/types'
import { useDbList } from './useDb'

export function useMonthTx(month: string) {
  return useDbList<Tx>('transactions', { orderBy: 'month', equalTo: month })
}

/** Inclusive month range, e.g. 2025-11 … 2026-10. */
export function useMonthRangeTx(from: string, to: string) {
  return useDbList<Tx>('transactions', { orderBy: 'month', startAt: from, endAt: to })
}

export function useAllTx(enabled: boolean) {
  return useDbList<Tx>(enabled ? 'transactions' : null)
}
