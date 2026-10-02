import { describe, expect, test } from 'vitest'
import { formatCompact, formatIDR, formatThousands, parseAmountInput } from '../src/lib/money'

describe('formatIDR', () => {
  test('groups thousands with dots and prefixes Rp', () => {
    expect(formatIDR(25000)).toBe('Rp 25.000')
    expect(formatIDR(8000000)).toBe('Rp 8.000.000')
    expect(formatIDR(0)).toBe('Rp 0')
    expect(formatIDR(999)).toBe('Rp 999')
  })

  test('puts minus sign before Rp for negatives', () => {
    expect(formatIDR(-54000)).toBe('-Rp 54.000')
  })

  test('signed option adds plus for positives', () => {
    expect(formatIDR(1500, { signed: true })).toBe('+Rp 1.500')
    expect(formatIDR(-1500, { signed: true })).toBe('-Rp 1.500')
  })
})

describe('formatThousands', () => {
  test('formats digits only, empty for zero', () => {
    expect(formatThousands(1234567)).toBe('1.234.567')
    expect(formatThousands(0)).toBe('')
  })
})

describe('parseAmountInput', () => {
  test('strips everything except digits', () => {
    expect(parseAmountInput('25.000')).toBe(25000)
    expect(parseAmountInput('Rp 1.500.000')).toBe(1500000)
    expect(parseAmountInput('')).toBe(0)
    expect(parseAmountInput('abc')).toBe(0)
  })
})

describe('formatCompact', () => {
  test('uses rb / jt / M suffixes with comma decimals', () => {
    expect(formatCompact(500)).toBe('500')
    expect(formatCompact(25000)).toBe('25rb')
    expect(formatCompact(1500000)).toBe('1,5jt')
    expect(formatCompact(8000000)).toBe('8jt')
    expect(formatCompact(2250000000)).toBe('2,3M')
    expect(formatCompact(-25000)).toBe('-25rb')
  })
})
