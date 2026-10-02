import { get, increment, push, ref, remove, set, update } from 'firebase/database'
import { currentMonth, effectiveDay, monthKey, todayWIB } from './dates'
import { db } from './firebase'
import { buildTxUpdate, recalcBalances } from './ledger'
import { phraseKey } from './phrase'
import { buildCategorySeed } from './seed'
import type { Category, Goal, Language, Phrase, Recurring, Settings, Tx, Wallet } from './types'

export function newId(path: string): string {
  return push(ref(db, path)).key as string
}

export type TxInput = Omit<Tx, 'month' | 'createdAt' | 'updatedAt'>

/** Create (oldTx null) or edit a transaction, adjusting wallet balances atomically. */
export function saveTx(id: string | null, oldTx: Tx | null, input: TxInput) {
  const now = Date.now()
  const tx: Tx = {
    ...input,
    toWalletId: input.type === 'transfer' ? input.toWalletId ?? null : null,
    categoryId: input.type === 'transfer' ? null : input.categoryId,
    recurringId: input.recurringId ?? null,
    month: monthKey(input.date),
    createdAt: oldTx?.createdAt ?? now,
    updatedAt: now,
  }
  return update(ref(db), buildTxUpdate(id ?? newId('transactions'), oldTx, tx, increment))
}

export function deleteTx(id: string, oldTx: Tx) {
  return update(ref(db), buildTxUpdate(id, oldTx, null, increment))
}

export interface OnboardingWallet {
  name: string
  type: Wallet['type']
  color: string
  initialBalance: number
}

export function seedInitial(wallets: OnboardingWallet[], defaultIndex: number, language: Language) {
  const updates: Record<string, unknown> = {}
  for (const [id, cat] of Object.entries(buildCategorySeed(() => newId('categories')))) {
    updates[`categories/${id}`] = cat
  }
  let defaultWalletId: string | null = null
  wallets.forEach((w, i) => {
    const id = newId('wallets')
    if (i === defaultIndex) defaultWalletId = id
    updates[`wallets/${id}`] = { ...w, balance: w.initialBalance, order: i, archived: false } satisfies Wallet
  })
  updates.settings = { language, defaultWalletId } satisfies Settings
  return update(ref(db), updates)
}

export function updateSettings(patch: Partial<Settings>) {
  return update(ref(db, 'settings'), patch)
}

/** Changing initialBalance shifts the live balance by the same amount. */
export function saveWallet(id: string | null, old: Wallet | null, w: Omit<Wallet, 'balance'>) {
  if (!id || !old) {
    return set(ref(db, `wallets/${newId('wallets')}`), { ...w, balance: w.initialBalance })
  }
  const diff = w.initialBalance - old.initialBalance
  return update(ref(db, `wallets/${id}`), { ...w, balance: diff ? increment(diff) : old.balance })
}

export function saveCategory(id: string | null, c: Category) {
  return set(ref(db, `categories/${id ?? newId('categories')}`), c)
}

export function setArchived(path: 'wallets' | 'categories', id: string, archived: boolean) {
  return update(ref(db, `${path}/${id}`), { archived })
}

/** A new item whose day already passed this month starts next month. */
export function saveRecurring(id: string | null, r: Omit<Recurring, 'lastRunMonth'>, old: Recurring | null) {
  const month = currentMonth()
  const today = Number(todayWIB().slice(8, 10))
  const lastRunMonth = old ? old.lastRunMonth : today >= effectiveDay(r.dayOfMonth, month) ? month : null
  return set(ref(db, `recurring/${id ?? newId('recurring')}`), { ...r, lastRunMonth })
}

export function saveGoal(id: string | null, g: Goal) {
  return set(ref(db, `goals/${id ?? newId('goals')}`), g)
}

export function savePhrase(phrase: string, p: Phrase, oldPhrase?: string) {
  const updates: Record<string, unknown> = { [`phrases/${phraseKey(phrase)}`]: p }
  if (oldPhrase && phraseKey(oldPhrase) !== phraseKey(phrase)) updates[`phrases/${phraseKey(oldPhrase)}`] = null
  return update(ref(db), updates)
}

export function removeAt(path: string) {
  return remove(ref(db, path))
}

export async function recalculateBalances() {
  const [ws, ts] = await Promise.all([get(ref(db, 'wallets')), get(ref(db, 'transactions'))])
  const wallets = (ws.val() ?? {}) as Record<string, Wallet>
  const txs = Object.values((ts.val() ?? {}) as Record<string, Tx>)
  const balances = recalcBalances(wallets, txs)
  const updates: Record<string, number> = {}
  for (const [id, b] of Object.entries(balances)) updates[`wallets/${id}/balance`] = b
  await update(ref(db), updates)
  return balances
}
