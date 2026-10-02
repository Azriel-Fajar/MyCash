import { ChartPie, Ellipsis, History, House, Plus, type LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router'
import { useUi } from '@/hooks/ui'
import { useI18n } from '@/i18n'
import type { DictKey } from '@/i18n/id'
import { cn } from '@/lib/utils'

export const TABS: { to: string; label: DictKey; Icon: LucideIcon; end?: boolean }[] = [
  { to: '/', label: 'nav.home', Icon: House, end: true },
  { to: '/history', label: 'nav.history', Icon: History },
  { to: '/stats', label: 'nav.stats', Icon: ChartPie },
  { to: '/more', label: 'nav.more', Icon: Ellipsis },
]

export function BottomNav({ canAdd }: { canAdd: boolean }) {
  const { t } = useI18n()
  const { openTx } = useUi()
  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto mx-auto flex max-w-md items-center gap-3">
        <div className="flex h-16 flex-1 items-center justify-between rounded-full bg-card px-2 shadow-lg shadow-ink/10 dark:shadow-black/40">
          {TABS.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              aria-label={t(label)}
              className={({ isActive }) =>
                cn(
                  'flex h-12 items-center justify-center gap-2 rounded-full text-sm font-medium transition-[background-color,padding]',
                  'focus-visible:outline-2 focus-visible:outline-ring',
                  isActive ? 'bg-primary px-4 text-primary-foreground' : 'w-12 text-muted-foreground hover:text-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="size-5" aria-hidden />
                  {isActive && <span>{t(label)}</span>}
                </>
              )}
            </NavLink>
          ))}
        </div>
        <button
          type="button"
          onClick={() => openTx()}
          disabled={!canAdd}
          aria-label={t('nav.add')}
          className="grid size-16 shrink-0 place-items-center rounded-full bg-ink text-ink-foreground shadow-lg shadow-ink/20 transition-transform active:scale-95 disabled:opacity-40 dark:bg-primary dark:text-primary-foreground"
        >
          <Plus className="size-6" />
        </button>
      </div>
    </nav>
  )
}
