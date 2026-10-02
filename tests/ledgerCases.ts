// Shared cases: run against src/lib/ledger.ts AND apps-script/Ledger.gs so both stay identical.

export interface TxLike {
  type: 'expense' | 'income' | 'transfer'
  amount: number
  walletId: string
  toWalletId?: string | null
  note?: string
}

export interface LedgerCase {
  name: string
  oldTx: TxLike | null
  newTx: TxLike | null
  expected: Record<string, number>
}

const expense: TxLike = { type: 'expense', amount: 25000, walletId: 'cash' }
const income: TxLike = { type: 'income', amount: 8000000, walletId: 'bca' }
const transfer: TxLike = { type: 'transfer', amount: 100000, walletId: 'bca', toWalletId: 'gopay' }

export const LEDGER_CASES: LedgerCase[] = [
  { name: 'create expense debits wallet', oldTx: null, newTx: expense, expected: { cash: -25000 } },
  { name: 'create income credits wallet', oldTx: null, newTx: income, expected: { bca: 8000000 } },
  { name: 'create transfer moves money', oldTx: null, newTx: transfer, expected: { bca: -100000, gopay: 100000 } },
  { name: 'delete expense refunds wallet', oldTx: expense, newTx: null, expected: { cash: 25000 } },
  { name: 'delete transfer reverses both sides', oldTx: transfer, newTx: null, expected: { bca: 100000, gopay: -100000 } },
  { name: 'amount change applies difference only', oldTx: expense, newTx: { ...expense, amount: 30000 }, expected: { cash: -5000 } },
  {
    name: 'wallet change moves debit between wallets',
    oldTx: expense,
    newTx: { ...expense, walletId: 'gopay' },
    expected: { cash: 25000, gopay: -25000 },
  },
  {
    name: 'expense to income flips sign',
    oldTx: expense,
    newTx: { ...expense, type: 'income', toWalletId: null },
    expected: { cash: 50000 },
  },
  {
    name: 'expense to transfer keeps source debit, credits destination',
    oldTx: expense,
    newTx: { ...expense, type: 'transfer', toWalletId: 'bca' },
    expected: { bca: 25000 },
  },
  {
    name: 'transfer to income removes destination credit',
    oldTx: transfer,
    newTx: { ...transfer, type: 'income', toWalletId: null },
    expected: { bca: 200000, gopay: -100000 },
  },
  { name: 'note-only edit changes nothing', oldTx: expense, newTx: { ...expense, note: 'kopi' }, expected: {} },
]
