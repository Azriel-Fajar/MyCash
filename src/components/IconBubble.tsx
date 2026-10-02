import type { LucideIcon } from 'lucide-react'
import { isLight } from '@/lib/color'
import { iconFor } from '@/lib/icons'
import { cn } from '@/lib/utils'

/** Ink (or category-colored) circle with an icon — the list-row marker from the reference design. */
export function IconBubble({
  icon,
  Icon,
  className,
  size = 'md',
  color,
}: {
  icon?: string
  Icon?: LucideIcon
  className?: string
  size?: 'sm' | 'md'
  /** Background color; falls back to ink. */
  color?: string
}) {
  const I = Icon ?? iconFor(icon)
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center rounded-full bg-ink text-ink-foreground',
        size === 'md' ? 'size-10' : 'size-8',
        color && (isLight(color) ? 'text-ink' : 'text-white'),
        className,
      )}
      style={color ? { background: color } : undefined}
    >
      <I className={size === 'md' ? 'size-[18px]' : 'size-4'} aria-hidden />
    </span>
  )
}
