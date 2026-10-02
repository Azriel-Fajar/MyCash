import { format, parseISO } from 'date-fns'
import { ArrowLeftRight } from 'lucide-react'
import { useData } from '@/hooks/data'
import { useI18n } from '@/i18n'
import { addDays, todayWIB } from '@/lib/dates'
import { formatIDR } from '@/lib/money'
import type { Tx, WithId } from '@/lib/types'
import { cn } from '@/lib/utils'
import { IconBubble } from './IconBubble'

export function TxList({ txs, onSelect }: { txs: WithId<Tx>[]; onSelect: (tx: WithId<Tx>) => void }) {
  const { t, locale } = useI18n()
  const today = todayWIB()
  const yesterday = addDays(today, -1)

  const sorted = [...txs].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
  const groups: { date: string; items: WithId<Tx>[] }[] = []
  for (const tx of sorted) {
    const g = groups[groups.length - 1]
    if (g?.date === tx.date) g.items.push(tx)
    else groups.push({ date: tx.date, items: [tx] })
  }

  const dayLabel = (d: string) =>
    d === today ? t('history.today') : d === yesterday ? t('history.yesterday') : format(parseISO(d), 'EEE, d MMM yyyy', { locale })

  return (
    <div className="space-y-5">
      {groups.map((g) => {
        const net = g.items.reduce((s, x) => s + (x.type === 'income' ? x.amount : x.type === 'expense' ? -x.amount : 0), 0)
        return (
          <section key={g.date}>
            <h3 className="mb-2 flex justify-between px-1 text-sm text-muted-foreground">
              <span>{dayLabel(g.date)}</span>
              <span className="num">{net ? formatIDR(net, { signed: true }) : ''}</span>
            </h3>
            <ul className="space-y-2">
              {g.items.map((tx) => (
                <li key={tx.id}>
                  <TxRow tx={tx} onClick={() => onSelect(tx)} />
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

function TxRow({ tx, onClick }: { tx: WithId<Tx>; onClick: () => void }) {
  const { t } = useI18n()
  const { catById, catLabel, catColor, walletById } = useData()
  const wallet = walletById[tx.walletId]?.name ?? '—'
  const isTransfer = tx.type === 'transfer'
  const title = isTransfer ? `${wallet} → ${walletById[tx.toWalletId ?? '']?.name ?? '—'}` : catLabel(tx.categoryId)
  const meta = [tx.note, isTransfer ? null : wallet, tx.source !== 'app' ? t(`tx.source.${tx.source}`) : null]
    .filter(Boolean)
    .join(' · ')

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl bg-card p-3 text-left transition-colors hover:bg-card/70 focus-visible:outline-2 focus-visible:outline-ring"
    >
      {isTransfer ? <IconBubble Icon={ArrowLeftRight} /> : <IconBubble icon={catById[tx.categoryId ?? '']?.icon} color={catColor(tx.categoryId)} />}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{title}</span>
        {meta && <span className="block truncate text-sm text-muted-foreground">{meta}</span>}
      </span>
      <span
        className={cn(
          'num shrink-0 font-semibold',
          tx.type === 'income' && 'text-income',
          tx.type === 'transfer' && 'text-muted-foreground',
        )}
      >
        {tx.type === 'expense' ? '-' : tx.type === 'income' ? '+' : ''}
        {formatIDR(tx.amount)}
      </span>
    </button>
  )
}
