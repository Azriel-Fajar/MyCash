import { describe, expect, test } from 'vitest'
import { id as dict } from '../src/i18n/id'
import { CATEGORY_TREE, WALLET_PRESETS } from '../src/lib/seed'
import { loadGs } from './gs'
import { LEDGER_CASES } from './ledgerCases'

const L = loadGs(['Ledger.gs'], ['balanceDeltas', 'buildTxUpdate', 'newPushId'])
const U = loadGs(['Util.gs'], ['formatIDR', 'addMonths', 'effectiveDay', 'isRecurringDue', 'summarize', 'todayWIB', 'progressBar'])
const C = loadGs(['Config.gs'], ['PHRASES', 'WALLET_ALIASES', 'CAT_NAMES'])

describe('Ledger.gs mirrors src/lib/ledger.ts', () => {
  for (const c of LEDGER_CASES) {
    test(c.name, () => {
      expect({ ...L.balanceDeltas(c.oldTx, c.newTx) }).toEqual(c.expected)
    })
  }

  test('buildTxUpdate uses REST server increments', () => {
    const tx = { type: 'transfer', amount: 5, walletId: 'a', toWalletId: 'b' }
    expect(JSON.parse(JSON.stringify(L.buildTxUpdate('t1', null, tx)))).toEqual({
      'transactions/t1': tx,
      'wallets/a/balance': { '.sv': { increment: -5 } },
      'wallets/b/balance': { '.sv': { increment: 5 } },
    })
  })

  test('newPushId: 20 chars, Firebase alphabet, sorts by time', () => {
    const a = L.newPushId(1_700_000_000_000)
    const b = L.newPushId(1_700_000_000_001)
    expect(a).toMatch(/^[-0-9A-Z_a-z]{20}$/)
    expect(a < b).toBe(true)
  })
})

describe('Util.gs', () => {
  test('formatIDR matches the app', () => {
    expect(U.formatIDR(25000)).toBe('Rp 25.000')
    expect(U.formatIDR(-54000)).toBe('-Rp 54.000')
    expect(U.formatIDR(1500, true)).toBe('+Rp 1.500')
  })

  test('todayWIB is UTC+7', () => {
    expect(U.todayWIB(new Date('2026-10-02T17:30:00Z'))).toBe('2026-10-03')
  })

  test('addMonths / effectiveDay', () => {
    expect(U.addMonths('2026-01', -1)).toBe('2025-12')
    expect(U.effectiveDay(31, '2026-02')).toBe(28)
  })

  describe('isRecurringDue', () => {
    const r = { active: true, dayOfMonth: 25, lastRunMonth: '2026-09' }
    test('due on its day when not yet run this month', () => {
      expect(U.isRecurringDue(r, '2026-10-25')).toBe(true)
    })
    test('catches up after a missed day', () => {
      expect(U.isRecurringDue(r, '2026-10-27')).toBe(true)
    })
    test('not before its day, not twice, not when paused', () => {
      expect(U.isRecurringDue(r, '2026-10-24')).toBe(false)
      expect(U.isRecurringDue({ ...r, lastRunMonth: '2026-10' }, '2026-10-26')).toBe(false)
      expect(U.isRecurringDue({ ...r, active: false }, '2026-10-26')).toBe(false)
    })
    test('day 31 runs on Feb 28', () => {
      expect(U.isRecurringDue({ ...r, dayOfMonth: 31 }, '2026-02-28')).toBe(true)
    })
  })

  test('summarize totals and top expense roots', () => {
    const rootOf = (id: string) => ({ coffee: 'food', meal: 'food' } as Record<string, string>)[id] ?? id
    const s = U.summarize(
      [
        { type: 'expense', amount: 30, categoryId: 'coffee' },
        { type: 'expense', amount: 50, categoryId: 'meal' },
        { type: 'expense', amount: 20, categoryId: 'fuel' },
        { type: 'income', amount: 500, categoryId: 'salary' },
        { type: 'transfer', amount: 99, categoryId: null },
      ],
      rootOf,
    )
    expect(JSON.parse(JSON.stringify(s))).toEqual({
      income: 500, expense: 100, net: 400, count: 5,
      top: [{ rootId: 'food', total: 80 }, { rootId: 'fuel', total: 20 }],
    })
  })

  test('progressBar', () => {
    expect(U.progressBar(0.5, 10)).toBe('▓▓▓▓▓░░░░░')
    expect(U.progressBar(2, 4)).toBe('▓▓▓▓')
  })
})

describe('Config.gs stays in sync with the app', () => {
  const keys = new Set(CATEGORY_TREE.flatMap((r) => [r.key, ...(r.children ?? []).map((c) => c.key)]))

  test('every base phrase points at a seeded category key', () => {
    const bad = Object.entries(C.PHRASES as Record<string, string>).filter(([, k]) => !keys.has(k))
    expect(bad).toEqual([])
  })

  test('bot category names match the Indonesian dictionary', () => {
    for (const k of keys) expect(C.CAT_NAMES[k], k).toBe(dict[`cat.${k}` as keyof typeof dict])
  })

  test('wallet aliases point at preset wallet names', () => {
    const names = new Set(WALLET_PRESETS.map((w) => w.name))
    for (const [alias, name] of Object.entries(C.WALLET_ALIASES as Record<string, string>)) expect(names.has(name), alias).toBe(true)
  })
})

describe('phraseKey parity', () => {
  const P = loadGs(['Parser.gs'], ['phraseKey'])
  test.each(['  Parkir   Motor ', 'a.b#c$d[e]f/g', 'Kopi'])('%s', async (s) => {
    const { phraseKey } = await import('../src/lib/phrase')
    expect(P.phraseKey(s)).toBe(phraseKey(s))
  })
})
