import { describe, expect, test } from 'vitest'
import { balanceDeltas, buildTxUpdate, recalcBalances } from '../src/lib/ledger'
import { LEDGER_CASES, type TxLike } from './ledgerCases'

describe('balanceDeltas', () => {
  for (const c of LEDGER_CASES) {
    test(c.name, () => {
      expect(balanceDeltas(c.oldTx, c.newTx)).toEqual(c.expected)
    })
  }
})

describe('buildTxUpdate', () => {
  const inc = (n: number) => ({ inc: n })
  const expense: TxLike = { type: 'expense', amount: 25000, walletId: 'cash' }

  test('writes the tx and increments each affected wallet', () => {
    expect(buildTxUpdate('t1', null, expense, inc)).toEqual({
      'transactions/t1': expense,
      'wallets/cash/balance': { inc: -25000 },
    })
  })

  test('delete writes null and reverses the balance', () => {
    expect(buildTxUpdate('t1', expense, null, inc)).toEqual({
      'transactions/t1': null,
      'wallets/cash/balance': { inc: 25000 },
    })
  })

  test('edit without balance change only writes the tx', () => {
    const renamed = { ...expense, note: 'kopi' }
    expect(buildTxUpdate('t1', expense, renamed, inc)).toEqual({ 'transactions/t1': renamed })
  })
})

describe('recalcBalances', () => {
  test('starts from initialBalance and replays every tx', () => {
    const wallets = { cash: { initialBalance: 100000 }, bca: { initialBalance: 1000000 }, gopay: { initialBalance: 0 } }
    const txs: TxLike[] = [
      { type: 'expense', amount: 25000, walletId: 'cash' },
      { type: 'income', amount: 500000, walletId: 'bca' },
      { type: 'transfer', amount: 100000, walletId: 'bca', toWalletId: 'gopay' },
    ]
    expect(recalcBalances(wallets, txs)).toEqual({ cash: 75000, bca: 1400000, gopay: 100000 })
  })

  test('ignores tx pointing at unknown wallets', () => {
    expect(recalcBalances({ cash: { initialBalance: 0 } }, [{ type: 'income', amount: 5, walletId: 'gone' }])).toEqual({ cash: 0 })
  })
})
