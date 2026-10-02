import { monthKey } from './dates'

function monthsBetween(from: string, to: string): number {
  const [fy, fm] = from.split('-').map(Number)
  const [ty, tm] = to.split('-').map(Number)
  return (ty - fy) * 12 + (tm - fm)
}

/** Goal progress = linked wallet balance vs target. perMonth counts the current and deadline months. */
export function goalProgress(balance: number, target: number, deadline: string | null, today: string) {
  const saved = Math.max(0, balance)
  const left = Math.max(0, target - saved)
  const months = deadline ? Math.max(1, monthsBetween(monthKey(today), monthKey(deadline)) + 1) : 0
  return {
    pct: target > 0 ? Math.min(1, saved / target) : 1,
    left,
    perMonth: deadline ? Math.ceil(left / months) : null,
    reached: left === 0,
  }
}
