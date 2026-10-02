import { Check } from 'lucide-react'
import type { ReactNode } from 'react'
import { formatDMY } from '@/lib/dates'
import { ICONS } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { Input } from './ui/input'

export function Field({ label, htmlFor, hint, children }: { label: string; htmlFor?: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="text-sm text-muted-foreground">
        {label}
      </label>
      <div className="mt-1">{children}</div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

export const inputCls = 'h-11 rounded-xl border-none bg-card'
export const selectCls = 'h-11 w-full rounded-xl bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring'

export function TextInput(props: React.ComponentProps<typeof Input>) {
  return <Input {...props} className={cn(inputCls, props.className)} />
}

/**
 * Native date picker that always shows DD/MM/YYYY. The real input sits invisibly on top so tapping
 * still opens the phone's picker; its own text follows the browser locale (often MM/DD/YYYY).
 */
export function DateInput({
  value,
  onChange,
  className,
  ...props
}: { value: string; onChange: (v: string) => void } & Omit<React.ComponentProps<'input'>, 'value' | 'onChange' | 'type'>) {
  return (
    <div className={cn('relative flex h-11 items-center rounded-xl bg-card px-3 text-sm focus-within:ring-2 focus-within:ring-ring', className)}>
      <span aria-hidden className={cn('num', !value && 'text-muted-foreground')}>
        {value ? formatDMY(value) : 'dd/mm/yyyy'}
      </span>
      <input
        {...props}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => {
          try {
            e.currentTarget.showPicker()
          } catch {
            /* unsupported or already open */
          }
        }}
        className="absolute inset-0 size-full cursor-pointer opacity-0"
      />
    </div>
  )
}

export const SWATCHES = [
  '#E07338', '#DDF35A', '#1F2630', '#4C7EF3', '#8B5CF6', '#E0559B', '#D9534F',
  '#E5A00D', '#2F9E6E', '#14A39A', '#1D9BD1', '#7A7F8A', '#F9E0D2', '#C9C6F5', '#BDEBD4', '#BFDDF7',
]

export function ColorSwatches({ value, onChange, label }: { value: string; onChange: (c: string) => void; label: string }) {
  return (
    <fieldset className="min-w-0">
      <legend className="text-sm text-muted-foreground">{label}</legend>
      <div className="mt-2 grid grid-cols-8 gap-2">
        {SWATCHES.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={c}
            aria-pressed={value.toLowerCase() === c.toLowerCase()}
            onClick={() => onChange(c)}
            className="grid aspect-square place-items-center rounded-full ring-1 ring-black/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            style={{ background: c }}
          >
            {value.toLowerCase() === c.toLowerCase() && <Check className="size-4 text-white mix-blend-difference" />}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

export function IconGrid({ value, onChange, label }: { value: string; onChange: (i: string) => void; label: string }) {
  return (
    <fieldset className="min-w-0">
      <legend className="text-sm text-muted-foreground">{label}</legend>
      <div className="mt-2 grid max-h-48 grid-cols-7 gap-2 overflow-y-auto rounded-xl bg-card p-2">
        {Object.entries(ICONS).map(([name, I]) => (
          <button
            key={name}
            type="button"
            aria-label={name}
            aria-pressed={value === name}
            onClick={() => onChange(name)}
            className={cn(
              'grid aspect-square place-items-center rounded-full',
              value === name ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary',
            )}
          >
            <I className="size-5" />
          </button>
        ))}
      </div>
    </fieldset>
  )
}

/** Card-style list row with icon slot, title, subtitle and trailing content. */
export function Row({
  leading,
  title,
  subtitle,
  trailing,
  onClick,
  muted,
}: {
  leading?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  trailing?: ReactNode
  onClick?: () => void
  muted?: boolean
}) {
  const body = (
    <>
      {leading}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{title}</span>
        {subtitle && <span className="block truncate text-sm text-muted-foreground">{subtitle}</span>}
      </span>
      {trailing}
    </>
  )
  const cls = cn('flex w-full items-center gap-3 rounded-2xl bg-card p-3 text-left', muted && 'opacity-60')
  return onClick ? (
    <button type="button" onClick={onClick} className={cn(cls, 'focus-visible:outline-2 focus-visible:outline-ring')}>
      {body}
    </button>
  ) : (
    <div className={cls}>{body}</div>
  )
}
