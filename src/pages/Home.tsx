import { ArrowLeftRight, ChevronDown, Minus, Moon, Plus, Sun } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { CategoryShare } from '@/components/CategoryShare'
import { MonthSwitcher } from '@/components/MonthSwitcher'
import { Segmented } from '@/components/Segmented'
import { WalletCard } from '@/components/WalletCard'
import { useData } from '@/hooks/data'
import { useMonthTx } from '@/hooks/useTx'
import { useUi } from '@/hooks/ui'
import { useI18n } from '@/i18n'
import { formatIDR } from '@/lib/money'
import { groupByCategory, monthSummary } from '@/lib/stats'
import { useTheme } from '@/lib/theme'
import type { CategoryType } from '@/lib/types'
import { cn } from '@/lib/utils'

export default function Home() {
  const { t } = useI18n()
  const { activeWallets, settings, catById, catName, rootOf } = useData()
  const { month, openTx } = useUi()
  const { items: txs, loading } = useMonthTx(month)
  const { resolved, setPref } = useTheme()
  const [view, setView] = useState<CategoryType>('expense')
  const [expanded, setExpanded] = useState<string | null>(null)

  const total = activeWallets.reduce((s, w) => s + w.balance, 0)
  const sum = monthSummary(txs)
  const groups = groupByCategory(txs, view, rootOf)

  return (
    <>
      <header className="rounded-b-[2rem] bg-ink px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-28 text-ink-foreground">
        <div className="flex items-center justify-between">
          <span className="num font-semibold">MyCash</span>
          <button
            type="button"
            onClick={() => setPref(resolved === 'dark' ? 'light' : 'dark')}
            aria-label={t('settings.theme')}
            className="grid size-10 place-items-center rounded-full bg-white/10 hover:bg-white/15"
          >
            {resolved === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </button>
        </div>
        <p className="mt-6 text-sm opacity-70">{t('home.total')}</p>
        <p className="num mt-1 text-[2.25rem] leading-tight font-semibold tracking-tight">{formatIDR(total)}</p>
      </header>

      <div className="-mt-24 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-5 pb-4 [scrollbar-width:none]">
        {activeWallets.map((w) => (
          <Link
            key={w.id}
            to={`/history?wallet=${w.id}`}
            className="w-[min(18rem,78vw)] shrink-0 snap-center rounded-[1.5rem] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <WalletCard wallet={w} isDefault={w.id === settings?.defaultWalletId} />
          </Link>
        ))}
      </div>

      <div className="space-y-5 px-5">
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ['expense', Minus],
              ['income', Plus],
              ['transfer', ArrowLeftRight],
            ] as const
          ).map(([type, Icon]) => (
            <button
              key={type}
              type="button"
              onClick={() => openTx({ type })}
              className="flex h-12 items-center justify-center gap-1.5 rounded-full bg-brand-soft text-sm font-medium transition-transform active:scale-[0.97]"
            >
              <Icon className="size-4" aria-hidden /> {t(`type.${type}`)}
            </button>
          ))}
        </div>

        <MonthSwitcher />

        <dl className="grid grid-cols-3 rounded-2xl bg-card p-4">
          <Stat label={t('home.in')} value={sum.income} className="text-income" />
          <Stat label={t('home.out')} value={sum.expense} />
          <Stat label={t('home.net')} value={sum.net} className={sum.net < 0 ? 'text-expense' : undefined} />
        </dl>

        <Segmented
          value={view}
          onChange={(v) => {
            setView(v)
            setExpanded(null)
          }}
          options={[
            { value: 'income', label: t('type.income') },
            { value: 'expense', label: t('type.expense') },
          ]}
        />

        {!loading && groups.length === 0 ? (
          <div className="rounded-2xl bg-card p-6 text-center">
            <p className="text-muted-foreground">{t('home.empty')}</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {groups.map((g) => {
              const isOpen = expanded === g.rootId
              const hasKids = g.children.length > 1 || g.children[0]?.id !== g.rootId
              return (
                <li key={g.rootId} className="rounded-2xl bg-card">
                  <button
                    type="button"
                    aria-expanded={hasKids ? isOpen : undefined}
                    onClick={() => hasKids && setExpanded(isOpen ? null : g.rootId)}
                    className="flex w-full items-center gap-3 p-3 text-left"
                  >
                    <CategoryShare group={g} />
                    {hasKids && (
                      <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
                    )}
                  </button>
                  {isOpen && (
                    <ul className="border-t border-border/60 px-3 py-2">
                      {g.children.map((c) => (
                        <li key={c.id} className="flex items-center justify-between gap-2 py-1.5 pl-[3.25rem] text-sm">
                          <span className="truncate">{c.id === g.rootId ? t('home.parentOnly') : catName(catById[c.id])}</span>
                          <span className="num shrink-0 text-muted-foreground">{formatIDR(c.total)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </>
  )
}

function Stat({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <div className="min-w-0 text-center">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn('num mt-1 truncate text-sm font-semibold', className)}>{formatIDR(value)}</dd>
    </div>
  )
}
