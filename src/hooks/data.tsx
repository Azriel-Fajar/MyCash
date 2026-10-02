import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { useI18n } from '@/i18n'
import type { DictKey } from '@/i18n/id'
import type { Category, Settings, Wallet, WithId } from '@/lib/types'
import { toList, useDbValue } from './useDb'

interface Data {
  settings: Settings | null
  /** All wallets incl. archived, ordered. */
  wallets: WithId<Wallet>[]
  activeWallets: WithId<Wallet>[]
  walletById: Record<string, WithId<Wallet>>
  categories: WithId<Category>[]
  catById: Record<string, WithId<Category>>
  catName: (c: Category | undefined) => string
  /** "Makanan › Kopi & minuman" */
  catLabel: (id: string | null | undefined) => string
  /** Parent id for a subcategory, itself for a root. */
  rootOf: (id: string | null | undefined) => string | null
  loading: boolean
  error: Error | null
}

const Ctx = createContext<Data | null>(null)

const byOrder = <T extends { order: number }>(a: T, b: T) => a.order - b.order

export function DataProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const { t, lang, setLang } = useI18n()
  const settings = useDbValue<Settings>(enabled ? 'settings' : null)
  const wallets = useDbValue<Record<string, Wallet>>(enabled ? 'wallets' : null)
  const categories = useDbValue<Record<string, Category>>(enabled ? 'categories' : null)

  const remoteLang = settings.data?.language
  useEffect(() => {
    if (remoteLang && remoteLang !== lang) setLang(remoteLang)
    // Only follow changes coming from the database.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remoteLang])

  const value = useMemo<Data>(() => {
    const ws = toList(wallets.data).sort(byOrder)
    const cs = toList(categories.data).sort(byOrder)
    const walletById = Object.fromEntries(ws.map((w) => [w.id, w]))
    const catById = Object.fromEntries(cs.map((c) => [c.id, c]))
    const catName = (c: Category | undefined) =>
      !c ? '—' : c.name || (c.key ? t(`cat.${c.key}` as DictKey) : '—')
    return {
      settings: settings.data,
      wallets: ws,
      activeWallets: ws.filter((w) => !w.archived),
      walletById,
      categories: cs,
      catById,
      catName,
      catLabel: (id) => {
        const c = id ? catById[id] : undefined
        if (!c) return '—'
        const parent = c.parentId ? catById[c.parentId] : undefined
        return parent ? `${catName(parent)} › ${catName(c)}` : catName(c)
      },
      rootOf: (id) => {
        const c = id ? catById[id] : undefined
        return c ? (c.parentId ?? id ?? null) : null
      },
      loading: settings.loading || wallets.loading || categories.loading,
      error: settings.error || wallets.error || categories.error,
    }
  }, [settings, wallets, categories, t])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useData(): Data {
  const v = useContext(Ctx)
  if (!v) throw new Error('useData outside DataProvider')
  return v
}
