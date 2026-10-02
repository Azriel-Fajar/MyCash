import { format } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useUi } from '@/hooks/ui'
import { useI18n } from '@/i18n'
import { addMonths, currentMonth } from '@/lib/dates'
import { cn } from '@/lib/utils'

function monthLabel(month: string, locale: Parameters<typeof format>[2]) {
  const [y, m] = month.split('-').map(Number)
  return format(new Date(y, m - 1, 1), 'MMMM yyyy', locale)
}

export function MonthSwitcher({ className }: { className?: string }) {
  const { month, setMonth } = useUi()
  const { locale, t } = useI18n()
  const atLatest = month >= currentMonth()
  const btn = 'grid size-9 place-items-center rounded-full hover:bg-secondary disabled:opacity-30'
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <button type="button" className={btn} onClick={() => setMonth(addMonths(month, -1))} aria-label={t('month.prev')}>
        <ChevronLeft className="size-5" />
      </button>
      <span className="num text-sm font-semibold text-brand-strong">{monthLabel(month, { locale })}</span>
      <button
        type="button"
        className={btn}
        disabled={atLatest}
        onClick={() => setMonth(addMonths(month, 1))}
        aria-label={t('month.next')}
      >
        <ChevronRight className="size-5" />
      </button>
    </div>
  )
}
