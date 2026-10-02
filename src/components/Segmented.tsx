import { cn } from '@/lib/utils'

interface Props<T extends string> {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  className?: string
}

/** Pill segmented control: active option filled with the brand orange. */
export function Segmented<T extends string>({ value, options, onChange, className }: Props<T>) {
  return (
    <div role="radiogroup" className={cn('flex rounded-full bg-secondary p-1', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'h-9 flex-1 rounded-full px-3 text-sm font-medium transition-colors',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
            value === o.value ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
