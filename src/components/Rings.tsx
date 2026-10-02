import { cn } from '@/lib/utils'

/** Concentric rings in a card corner — nod to the reference card's emblem. */
export function Rings({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={cn('pointer-events-none absolute -top-6 -right-6 size-32', className)} aria-hidden>
      {[56, 46, 36, 26, 16].map((r) => (
        <circle key={r} cx="60" cy="60" r={r} fill="none" stroke="currentColor" strokeWidth="1.5" />
      ))}
    </svg>
  )
}
