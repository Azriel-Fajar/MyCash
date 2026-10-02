import { format, parseISO } from 'date-fns'
import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Rectangle, Tooltip, XAxis, YAxis, type TooltipContentProps } from 'recharts'
import { CategoryShare } from '@/components/CategoryShare'
import { MonthSwitcher } from '@/components/MonthSwitcher'
import { PageHeader } from '@/components/PageHeader'
import { Segmented } from '@/components/Segmented'
import { useData } from '@/hooks/data'
import { useMonthRangeTx } from '@/hooks/useTx'
import { useUi } from '@/hooks/ui'
import { useI18n } from '@/i18n'
import { daysInMonth, monthRange, todayWIB } from '@/lib/dates'
import { formatCompact, formatIDR } from '@/lib/money'
import { buckets, groupByCategory, monthSummary, sumBy, type BucketMode } from '@/lib/stats'
import { useTheme } from '@/lib/theme'
import type { CategoryType } from '@/lib/types'
import { cn } from '@/lib/utils'

const MODES: BucketMode[] = ['daily', 'weekly', 'monthly', 'yearly']

/** Chart colors come from CSS tokens so light/dark stay in one place. */
function useChartColors() {
  const { resolved } = useTheme()
  return useMemo(() => {
    const cs = getComputedStyle(document.documentElement)
    const v = (n: string) => cs.getPropertyValue(n).trim()
    return {
      bar: v('--chart-bar'),
      active: v('--brand'),
      in: v('--chart-in'),
      out: v('--chart-out'),
      grid: v('--border'),
      text: v('--muted-foreground'),
      cursor: v('--secondary'),
    }
    // Recompute when the theme flips.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolved])
}

const ym = (k: string) => parseISO(`${k}-01`)

export default function Stats() {
  const { t, locale } = useI18n()
  const { month } = useUi()
  const { rootOf } = useData()
  const colors = useChartColors()
  const [type, setType] = useState<CategoryType>('expense')
  const [mode, setMode] = useState<BucketMode>('monthly')
  const today = todayWIB()
  const b = useMemo(() => buckets(mode, month, today), [mode, month, today])
  const scope = `${mode}|${month}`
  const [pick, setPick] = useState<{ scope: string; key: string } | null>(null)
  const selected = pick?.scope === scope && b.keys.includes(pick.key) ? pick.key : b.initial

  const { items: txs, loading } = useMonthRangeTx(b.from, b.to)
  const totals = sumBy(txs, type, b.keyOf)

  const shortLabel = (k: string) =>
    mode === 'daily' ? String(Number(k)) : mode === 'weekly' ? t('stats.week', { n: Number(k) + 1 }) : mode === 'monthly' ? format(ym(k), 'MMM', { locale }) : k
  const longLabel = (k: string) => {
    if (mode === 'daily') return format(parseISO(`${month}-${k}`), 'EEEE, d MMMM yyyy', { locale })
    if (mode === 'weekly') {
      const start = Number(k) * 7 + 1
      const end = Math.min(start + 6, daysInMonth(month))
      return `${t('stats.week', { n: Number(k) + 1 })}: ${start}–${end} ${format(ym(month), 'MMM yyyy', { locale })}`
    }
    if (mode === 'monthly') return format(ym(k), 'MMMM yyyy', { locale })
    return k
  }

  const data = b.keys.map((k) => ({ key: k, label: shortLabel(k), value: totals[k] ?? 0 }))
  const selIndex = b.keys.indexOf(selected)
  const selTxs = txs.filter((x) => b.keyOf(x) === selected)
  const sel = monthSummary(selTxs)
  const groups = groupByCategory(selTxs, type, rootOf)

  const dailyTicks =
    mode === 'daily' ? [1, 5, 10, 15, 20, 25, b.keys.length].map(String) : undefined

  const inOut = useMemo(() => {
    if (mode !== 'monthly') return []
    const inc = sumBy(txs, 'income', (x) => x.month)
    const exp = sumBy(txs, 'expense', (x) => x.month)
    return monthRange(month, 12).map((m) => ({ label: format(ym(m), 'MMM', { locale }), income: inc[m] ?? 0, expense: exp[m] ?? 0 }))
  }, [mode, txs, month, locale])

  const axisTick = { fill: colors.text, fontSize: 11 }

  return (
    <>
      <PageHeader title={t('nav.stats')} />
      <div className="space-y-5 px-5">
        <Segmented
          value={type}
          onChange={setType}
          options={[
            { value: 'expense', label: t('type.expense') },
            { value: 'income', label: t('type.income') },
          ]}
        />

        <div role="tablist" className="flex justify-between border-b border-border">
          {MODES.map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={cn(
                '-mb-px border-b-2 px-2 pb-2 text-sm transition-colors',
                mode === m ? 'border-primary font-semibold text-foreground' : 'border-transparent text-muted-foreground',
              )}
            >
              {t(`stats.${m}`)}
            </button>
          ))}
        </div>

        <MonthSwitcher />

        <div className="text-center">
          <p className="text-sm text-muted-foreground">{type === 'expense' ? t('stats.spent') : t('stats.earned')}</p>
          <p className="num mt-1 text-[2.25rem] leading-tight font-semibold tracking-tight">{formatIDR(totals[selected] ?? 0)}</p>
          <p className="num mt-1 text-sm font-medium text-brand-strong">{longLabel(selected)}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('home.in')} <span className="num text-foreground">{formatIDR(sel.income)}</span>
            <span className="mx-2" aria-hidden>
              /
            </span>
            {t('home.out')} <span className="num text-foreground">{formatIDR(sel.expense)}</span>
          </p>
        </div>

        <div className="rounded-2xl bg-card p-3 pt-4" aria-busy={loading}>
          <BarChart
            responsive
            style={{ width: '100%', height: 200 }}
            data={data}
            margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
            onClick={(s) => {
              const i = Number(s?.activeTooltipIndex)
              if (Number.isInteger(i) && data[i]) setPick({ scope, key: data[i].key })
            }}
          >
            <CartesianGrid vertical={false} stroke={colors.grid} strokeWidth={1} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axisTick} ticks={dailyTicks} interval={dailyTicks ? 0 : 'preserveStartEnd'} />
            <YAxis tickLine={false} axisLine={false} tick={axisTick} width={44} tickFormatter={(v: number) => formatCompact(v)} allowDecimals={false} />
            <Tooltip cursor={{ fill: colors.cursor, radius: 6 }} content={(p) => <ChartTip {...p} />} />
            <Bar
              dataKey="value"
              maxBarSize={24}
              isAnimationActive={false}
              shape={(p) => <Rectangle {...p} radius={[4, 4, 0, 0]} fill={p.index === selIndex ? colors.active : colors.bar} />}
            />
          </BarChart>
          <table className="sr-only">
            <caption>{t('stats.table')}</caption>
            <tbody>
              {data.map((d) => (
                <tr key={d.key}>
                  <th scope="row">{longLabel(d.key)}</th>
                  <td>{formatIDR(d.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <section>
          <h2 className="num mb-3 font-semibold">{t('stats.byCategory')}</h2>
          {groups.length === 0 ? (
            <p className="rounded-2xl bg-card p-6 text-center text-muted-foreground">{t('stats.noData')}</p>
          ) : (
            <ul className="space-y-2">
              {groups.map((g) => (
                <li key={g.rootId} className="flex items-center gap-3 rounded-2xl bg-card p-3">
                  <CategoryShare group={g} />
                </li>
              ))}
            </ul>
          )}
        </section>

        {mode === 'monthly' && (
          <section>
            <h2 className="num mb-1 font-semibold">{t('stats.inVsOut')}</h2>
            <div className="mb-3 flex gap-4 text-sm text-muted-foreground">
              <Legend color={colors.in} label={t('type.income')} />
              <Legend color={colors.out} label={t('type.expense')} />
            </div>
            <div className="rounded-2xl bg-card p-3 pt-4">
              <BarChart responsive style={{ width: '100%', height: 200 }} data={inOut} barGap={2} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} stroke={colors.grid} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axisTick} interval="preserveStartEnd" />
                <YAxis tickLine={false} axisLine={false} tick={axisTick} width={44} tickFormatter={(v: number) => formatCompact(v)} allowDecimals={false} />
                <Tooltip cursor={{ fill: colors.cursor, radius: 6 }} content={(p) => <ChartTip {...p} />} />
                <Bar dataKey="income" name={t('type.income')} fill={colors.in} maxBarSize={10} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                <Bar dataKey="expense" name={t('type.expense')} fill={colors.out} maxBarSize={10} radius={[4, 4, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </div>
          </section>
        )}
      </div>
    </>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="size-2.5 rounded-sm" style={{ background: color }} aria-hidden />
      {label}
    </span>
  )
}

function ChartTip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl bg-popover px-3 py-2 text-sm text-popover-foreground shadow-lg">
      <p className="text-muted-foreground">{label}</p>
      {payload.map((p) => (
        <p key={String(p.dataKey)} className="flex items-center gap-2">
          {payload.length > 1 && <span className="size-2.5 rounded-sm" style={{ background: p.color }} aria-hidden />}
          {payload.length > 1 && <span>{p.name}</span>}
          <span className="num font-semibold">{formatIDR(Number(p.value))}</span>
        </p>
      ))}
    </div>
  )
}
