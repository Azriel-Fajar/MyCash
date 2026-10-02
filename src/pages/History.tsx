import { Search, X } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { Chip } from '@/components/CategoryPicker'
import { MonthSwitcher } from '@/components/MonthSwitcher'
import { PageHeader } from '@/components/PageHeader'
import { TxList } from '@/components/TxList'
import { useData } from '@/hooks/data'
import { useAllTx, useMonthTx } from '@/hooks/useTx'
import { useUi } from '@/hooks/ui'
import { useI18n } from '@/i18n'
import type { TxType } from '@/lib/types'

const selectCls = 'h-9 min-w-0 flex-1 rounded-full bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring'

export default function History() {
  const { t } = useI18n()
  const { wallets, categories, catName, catLabel, rootOf, walletById } = useData()
  const { month, openTx } = useUi()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [type, setType] = useState<'all' | TxType>('all')
  const [cat, setCat] = useState('')
  const walletFilter = params.get('wallet') ?? ''

  const query = q.trim().toLowerCase()
  const searching = query.length > 0
  const monthTx = useMonthTx(month)
  const allTx = useAllTx(searching)
  const source = searching ? allTx.items : monthTx.items
  const loading = searching ? allTx.loading : monthTx.loading
  // "25.000" / "25000" also matches amounts.
  const digits = /^[\d.\s]+$/.test(query) ? query.replace(/\D/g, '') : ''

  const txs = source.filter((x) => {
    if (type !== 'all' && x.type !== type) return false
    if (walletFilter && x.walletId !== walletFilter && x.toWalletId !== walletFilter) return false
    if (cat && rootOf(x.categoryId) !== cat) return false
    if (!searching) return true
    const hay = [x.note, catLabel(x.categoryId), walletById[x.walletId]?.name, walletById[x.toWalletId ?? '']?.name]
      .join(' ')
      .toLowerCase()
    return hay.includes(query) || (digits !== '' && String(x.amount).includes(digits))
  })

  const setWallet = (id: string) => {
    const next = new URLSearchParams(params)
    if (id) next.set('wallet', id)
    else next.delete('wallet')
    setParams(next, { replace: true })
  }

  const roots = categories.filter((c) => !c.parentId && (type === 'all' || type === c.type))

  return (
    <>
      <PageHeader title={t('nav.history')} />
      <div className="space-y-4 px-5">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('history.search')}
            aria-label={t('history.search')}
            className="h-12 w-full rounded-full bg-card pr-10 pl-10 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-search-cancel-button]:hidden"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ('')}
              aria-label={t('common.cancel')}
              className="absolute top-1/2 right-3 grid size-7 -translate-y-1/2 place-items-center rounded-full hover:bg-secondary"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none]">
          {(['all', 'expense', 'income', 'transfer'] as const).map((v) => (
            <Chip key={v} active={type === v} onClick={() => setType(v)}>
              {v === 'all' ? t('history.all') : t(`type.${v}`)}
            </Chip>
          ))}
        </div>

        <div className="flex gap-2">
          <select value={walletFilter} onChange={(e) => setWallet(e.target.value)} aria-label={t('tx.wallet')} className={selectCls}>
            <option value="">{t('history.allWallets')}</option>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
          <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label={t('tx.category')} className={selectCls}>
            <option value="">{t('history.allCategories')}</option>
            {roots.map((c) => (
              <option key={c.id} value={c.id}>
                {catName(c)}
              </option>
            ))}
          </select>
        </div>

        {searching ? <p className="text-center text-sm text-muted-foreground">{t('history.searching')}</p> : <MonthSwitcher />}

        {!loading && txs.length === 0 ? (
          <p className="rounded-2xl bg-card p-6 text-center text-muted-foreground">{t('history.empty')}</p>
        ) : (
          <TxList txs={txs} onSelect={(tx) => openTx({ editing: tx })} />
        )}
      </div>
    </>
  )
}
