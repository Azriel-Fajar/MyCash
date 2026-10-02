import { describe, expect, test } from 'vitest'
import { loadGs } from './gs'

const { parseMessage, mergePhrases } = loadGs(['Parser.gs'], ['parseMessage', 'mergePhrases'])

const ctx = {
  today: '2026-10-02',
  wallets: [
    { id: 'w_cash', name: 'Cash' },
    { id: 'w_bca', name: 'BCA' },
    { id: 'w_gopay', name: 'GoPay' },
  ],
  aliases: { tunai: 'Cash', 'go pay': 'GoPay' },
  defaultWalletId: 'w_cash',
  phrases: {
    kopi: { type: 'expense', categoryId: 'c_coffee' },
    makan: { type: 'expense', categoryId: 'c_meal' },
    'makan siang': { type: 'expense', categoryId: 'c_lunch' },
    bensin: { type: 'expense', categoryId: 'c_fuel' },
    gaji: { type: 'income', categoryId: 'c_salary' },
    jual: { type: 'income', categoryId: 'c_sale' },
    'topup game': { type: 'expense', categoryId: 'c_game' },
  },
}
const parse = (text: string) => parseMessage(text, ctx)

describe('transactions', () => {
  test('expense with phrase, amount suffix and explicit wallet', () => {
    expect(parse('beli kopi 25rb pake gopay')).toMatchObject({
      ok: true, kind: 'tx', type: 'expense', amount: 25000, categoryId: 'c_coffee',
      walletId: 'w_gopay', walletExplicit: true, date: '2026-10-02', note: 'Kopi',
    })
  })

  test('income phrase falls back to default wallet', () => {
    expect(parse('gaji masuk 8jt')).toMatchObject({
      kind: 'tx', type: 'income', amount: 8000000, categoryId: 'c_salary', walletId: 'w_cash', walletExplicit: false,
    })
  })

  test('leading + marks income', () => {
    expect(parse('+500rb jual barang')).toMatchObject({ type: 'income', amount: 500000, categoryId: 'c_sale' })
  })

  test('wallet alias and case-insensitive names', () => {
    expect(parse('makan 20rb tunai').walletId).toBe('w_cash')
    expect(parse('Makan 20rb BCA').walletId).toBe('w_bca')
    expect(parse('makan 20rb go pay').walletId).toBe('w_gopay')
  })

  test('longest phrase wins', () => {
    expect(parse('makan siang 30rb').categoryId).toBe('c_lunch')
  })

  test('phrases match whole words only', () => {
    expect(parse('kopiah 50rb').categoryId).toBeNull()
  })

  test('no amount is not ok', () => {
    expect(parse('halo')).toMatchObject({ ok: false, reason: 'no_amount' })
  })
})

describe('amounts', () => {
  const amount = (s: string) => parse(`makan ${s}`).amount
  test.each([
    ['25rb', 25000],
    ['25 ribu', 25000],
    ['25k', 25000],
    ['25.000', 25000],
    ['25000', 25000],
    ['1,5jt', 1500000],
    ['1.5jt', 1500000],
    ['2juta', 2000000],
    ['1.250.000', 1250000],
    ['2,5k', 2500],
  ])('%s → %i', (s, n) => {
    expect(amount(s)).toBe(n)
  })

  test('suffixed or largest number beats small counts', () => {
    expect(parse('beli 2 kopi 50rb').amount).toBe(50000)
    expect(parse('beli 2 kopi 50000').amount).toBe(50000)
  })
})

describe('dates', () => {
  test('kemarin / yesterday', () => {
    expect(parse('kemarin makan 30rb')).toMatchObject({ date: '2026-10-01', categoryId: 'c_meal', note: 'Makan' })
    expect(parse('yesterday makan 30rb').date).toBe('2026-10-01')
  })

  test('dd/mm uses this year, dd/mm/yyyy explicit', () => {
    expect(parse('bensin 50rb 28/9')).toMatchObject({ date: '2026-09-28', amount: 50000 })
    expect(parse('bensin 50rb 28/9/2025').date).toBe('2025-09-28')
  })

  test('dd/mm in the future means last year', () => {
    expect(parse('bensin 50rb 5/12').date).toBe('2025-12-05')
  })

  test('explicit dd/mm beats kemarin, and both leave the note', () => {
    expect(parse('kemarin bensin 50rb 28/9')).toMatchObject({ date: '2026-09-28', note: 'Bensin', amount: 50000 })
  })

  test('invalid dd/mm is ignored', () => {
    expect(parse('bensin 50rb 31/2').date).toBe('2026-10-02')
  })
})

describe('transfers', () => {
  test('"ke" marks destination', () => {
    expect(parse('tf 100rb bca ke gopay')).toMatchObject({ kind: 'transfer', amount: 100000, fromWalletId: 'w_bca', toWalletId: 'w_gopay' })
  })

  test('"dari" marks source', () => {
    expect(parse('topup gopay 50rb dari bca')).toMatchObject({ kind: 'transfer', fromWalletId: 'w_bca', toWalletId: 'w_gopay' })
  })

  test('topup with one wallet leaves source missing', () => {
    expect(parse('topup gopay 50rb')).toMatchObject({ kind: 'transfer', fromWalletId: null, toWalletId: 'w_gopay' })
  })

  test('a matching phrase beats the transfer keyword when only one wallet is named', () => {
    expect(parse('topup game 50rb pake gopay')).toMatchObject({ kind: 'tx', categoryId: 'c_game', walletId: 'w_gopay' })
  })
})

describe('description', () => {
  const note = (s: string) => parse(s).note
  test.each([
    ['aku jajan bang bang 5k', 'Bang Bang'],
    ['makan nasi padang 25k', 'Nasi Padang'],
    ['beli kopi starbucks 50k', 'Kopi Starbucks'],
    ['tadi jajan bang bang sama temen 5k', 'Bang Bang'],
    ['makan siang 30rb', 'Makan Siang'],
    ['gaji masuk 8jt', 'Gaji'],
    ['beli KFC 40k', 'KFC'],
    ['kopi 20k', 'Kopi'],
    ['makan 20k', 'Makan'],
  ])('%s → %s', (s, d) => {
    expect(note(s)).toBe(d)
  })
})

describe('unmatched phrases', () => {
  test('offers the remaining words to learn', () => {
    expect(parse('parkir 5rb')).toMatchObject({ ok: true, kind: 'tx', categoryId: null, type: null, learnPhrase: 'parkir' })
    expect(parse('bayar parkir motor 5rb pake gopay').learnPhrase).toBe('parkir motor')
  })

  test('forced income with an expense phrase drops the category', () => {
    expect(parse('+50rb kopi')).toMatchObject({ type: 'income', categoryId: null })
  })
})

describe('mergePhrases', () => {
  const cats = { c_coffee: { key: 'food.coffee', type: 'expense' }, c_tea: { key: null, type: 'expense' }, c_salary: { key: 'salary', type: 'income' } }

  test('resolves base keys to ids and lets learned phrases override', () => {
    const merged = mergePhrases({ kopi: 'food.coffee', gaji: 'salary', ghost: 'nope.missing' }, { kopi: { type: 'expense', categoryId: 'c_tea' } }, cats)
    expect(merged).toEqual({
      kopi: { type: 'expense', categoryId: 'c_tea' },
      gaji: { type: 'income', categoryId: 'c_salary' },
    })
  })
})
