// All dates are plain strings in WIB (UTC+7, no DST): 'YYYY-MM-DD' and months 'YYYY-MM'.

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000

export function todayWIB(now: Date = new Date()): string {
  return new Date(now.getTime() + WIB_OFFSET_MS).toISOString().slice(0, 10)
}

export function monthKey(date: string): string {
  return date.slice(0, 7)
}

export function currentMonth(now?: Date): string {
  return monthKey(todayWIB(now))
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function addMonths(month: string, n: number): string {
  const [y, m] = month.split('-').map(Number)
  const total = y * 12 + (m - 1) + n
  return `${Math.floor(total / 12)}-${pad((total % 12) + 1)}`
}

export function daysInMonth(month: string): number {
  const [y, m] = month.split('-').map(Number)
  return new Date(Date.UTC(y, m, 0)).getUTCDate()
}

/** Recurring day 31 runs on the last day of shorter months. */
export function effectiveDay(dayOfMonth: number, month: string): number {
  return Math.min(dayOfMonth, daysInMonth(month))
}

/** `count` months ending at `end`, oldest first. */
export function monthRange(end: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => addMonths(end, i - count + 1))
}

export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10)
}

/** 'YYYY-MM-DD' → 'DD/MM/YYYY' (day first, month in the middle). */
export function formatDMY(date: string): string {
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y}`
}
