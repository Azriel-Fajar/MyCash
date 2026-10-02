// Wallet balances are stored denormalized. Every tx write goes through buildTxUpdate so the tx
// and the balance increments land in one atomic multi-path update.
// apps-script/Ledger.gs mirrors this file; tests/ledgerCases.ts keeps both in sync.

import type { TxType } from './types'

interface TxLike {
  type: TxType
  amount: number
  walletId: string
  toWalletId?: string | null
}

function effect(tx: TxLike | null): Record<string, number> {
  if (!tx) return {}
  switch (tx.type) {
    case 'expense':
      return { [tx.walletId]: -tx.amount }
    case 'income':
      return { [tx.walletId]: tx.amount }
    case 'transfer':
      return { [tx.walletId]: -tx.amount, [tx.toWalletId as string]: tx.amount }
  }
}

/** Per-wallet balance change caused by replacing oldTx with newTx (null = none). */
export function balanceDeltas(oldTx: TxLike | null, newTx: TxLike | null): Record<string, number> {
  const before = effect(oldTx)
  const after = effect(newTx)
  const out: Record<string, number> = {}
  for (const w of new Set([...Object.keys(before), ...Object.keys(after)])) {
    const d = (after[w] ?? 0) - (before[w] ?? 0)
    if (d !== 0) out[w] = d
  }
  return out
}

/** Multi-path update for RTDB. `increment` is the SDK's increment() or the REST {".sv"} form. */
export function buildTxUpdate<T extends TxLike>(
  id: string,
  oldTx: TxLike | null,
  newTx: T | null,
  increment: (n: number) => unknown,
): Record<string, unknown> {
  const update: Record<string, unknown> = { [`transactions/${id}`]: newTx }
  for (const [w, d] of Object.entries(balanceDeltas(oldTx, newTx))) {
    update[`wallets/${w}/balance`] = increment(d)
  }
  return update
}

export function recalcBalances(
  wallets: Record<string, { initialBalance: number }>,
  txs: TxLike[],
): Record<string, number> {
  const out: Record<string, number> = {}
  for (const [id, w] of Object.entries(wallets)) out[id] = w.initialBalance ?? 0
  for (const tx of txs) {
    for (const [w, d] of Object.entries(effect(tx))) {
      if (w in out) out[w] += d
    }
  }
  return out
}
