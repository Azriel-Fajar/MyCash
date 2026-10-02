import type { LucideIcon } from 'lucide-react'
import { iconFor } from '@/lib/icons'
import { cn } from '@/lib/utils'

/** Ink circle with a white icon — the list-row marker from the reference design. */
export function IconBubble({
  icon,
  Icon,
  className,
  size = 'md',
}: {
  icon?: string
  Icon?: LucideIcon
  className?: string
  size?: 'sm' | 'md'
}) {
  const I = Icon ?? iconFor(icon)
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center rounded-full bg-ink text-ink-foreground',
        size === 'md' ? 'size-10' : 'size-8',
        className,
      )}
    >
      <I className={size === 'md' ? 'size-[18px]' : 'size-4'} aria-hidden />
    </span>
  )
}
