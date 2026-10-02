import { useEffect, useRef } from 'react'
import { formatThousands, parseAmountInput } from '@/lib/money'
import { cn } from '@/lib/utils'

interface Props {
  value: number
  onChange: (n: number) => void
  label: string
  size?: 'lg' | 'md'
  autoFocus?: boolean
  id?: string
}

/** Rupiah input with live dot grouping. Value is integer rupiah. */
export function AmountField({ value, onChange, label, size = 'md', autoFocus, id = 'amount' }: Props) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    // Plain autoFocus scrolls the sheet body and hides the type selector above.
    if (autoFocus) ref.current?.focus({ preventScroll: true })
  }, [autoFocus])
  return (
    <div>
      <label htmlFor={id} className={cn('text-sm text-muted-foreground', size === 'lg' && 'sr-only')}>
        {label}
      </label>
      <div
        className={cn(
          'flex items-baseline gap-2 rounded-2xl bg-card px-4 focus-within:ring-2 focus-within:ring-ring',
          size === 'lg' ? 'py-3' : 'mt-1 py-2',
        )}
      >
        <span className={cn('num text-muted-foreground', size === 'lg' ? 'text-xl' : 'text-base')}>Rp</span>
        <input
          id={id}
          inputMode="numeric"
          autoComplete="off"
          ref={ref}
          placeholder="0"
          value={formatThousands(value)}
          onChange={(e) => onChange(Math.min(parseAmountInput(e.target.value), 999_999_999_999))}
          className={cn(
            'num w-full min-w-0 bg-transparent font-semibold outline-none placeholder:text-muted-foreground/50',
            size === 'lg' ? 'text-4xl' : 'text-lg',
          )}
        />
      </div>
    </div>
  )
}
