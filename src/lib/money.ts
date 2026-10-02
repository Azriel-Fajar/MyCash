/** "1234567" -> "1.234.567" (Indonesian grouping). */
function group(n: number): string {
  return String(Math.abs(Math.round(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

export function formatIDR(n: number, opts: { signed?: boolean } = {}): string {
  const sign = n < 0 ? '-' : opts.signed && n > 0 ? '+' : ''
  return `${sign}Rp ${group(n)}`
}

/** Value for the amount input: grouped digits, empty when zero. */
export function formatThousands(n: number): string {
  return n ? group(n) : ''
}

export function parseAmountInput(s: string): number {
  const digits = s.replace(/\D/g, '')
  return digits ? Number(digits) : 0
}

const COMPACT: [number, string][] = [
  [1e9, 'M'],
  [1e6, 'jt'],
  [1e3, 'rb'],
]

/** Short axis/label form: 25rb, 1,5jt, 2,3M. */
export function formatCompact(n: number): string {
  const sign = n < 0 ? '-' : ''
  const abs = Math.abs(n)
  for (const [size, suffix] of COMPACT) {
    if (abs >= size) {
      const v = Math.round((abs / size) * 10) / 10
      return sign + String(v).replace('.', ',') + suffix
    }
  }
  return sign + String(abs)
}
