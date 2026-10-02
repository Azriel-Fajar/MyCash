import { Archive, ArchiveRestore, Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { AmountField } from '@/components/AmountField'
import { ColorSwatches, Field, Row, selectCls, TextInput } from '@/components/FormBits'
import { PageHeader } from '@/components/PageHeader'
import { Sheet } from '@/components/Sheet'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useData } from '@/hooks/data'
import { useI18n } from '@/i18n'
import { isLight } from '@/lib/color'
import { saveWallet, setArchived } from '@/lib/db'
import { iconFor } from '@/lib/icons'
import { formatIDR } from '@/lib/money'
import { WALLET_TYPE_ICON } from '@/lib/seed'
import type { Wallet, WalletType, WithId } from '@/lib/types'

const TYPES: WalletType[] = ['cash', 'bank', 'ewallet', 'savings']

export default function Wallets() {
  const { t } = useI18n()
  const { wallets, settings } = useData()
  const [showArchived, setShowArchived] = useState(false)
  const [sheet, setSheet] = useState({ open: false, nonce: 0, wallet: null as WithId<Wallet> | null })
  const open = (wallet: WithId<Wallet> | null) => setSheet((s) => ({ open: true, nonce: s.nonce + 1, wallet }))
  const list = wallets.filter((w) => showArchived || !w.archived)

  return (
    <>
      <PageHeader
        title={t('more.wallets')}
        back
        action={
          <Button size="icon" className="size-10 rounded-full" onClick={() => open(null)} aria-label={t('wallets.new')}>
            <Plus />
          </Button>
        }
      />
      <div className="space-y-4 px-5">
        <ul className="space-y-2">
          {list.map((w) => {
            const Icon = iconFor(WALLET_TYPE_ICON[w.type])
            return (
              <li key={w.id}>
                <Row
                  onClick={() => open(w)}
                  muted={w.archived}
                  leading={
                    <span
                      className={`grid size-10 shrink-0 place-items-center rounded-xl ${isLight(w.color) ? 'text-ink' : 'text-white'}`}
                      style={{ background: w.color }}
                    >
                      <Icon className="size-[18px]" aria-hidden />
                    </span>
                  }
                  title={w.name}
                  subtitle={[t(`wallets.type.${w.type}`), w.id === settings?.defaultWalletId ? t('wallets.default') : null, w.archived ? t('common.archived') : null]
                    .filter(Boolean)
                    .join(', ')}
                  trailing={<span className="num shrink-0 font-semibold">{formatIDR(w.balance)}</span>}
                />
              </li>
            )
          })}
        </ul>
        {wallets.some((w) => w.archived) && (
          <label className="flex items-center justify-between rounded-2xl bg-card p-3 text-sm">
            {t('common.showArchived')}
            <Switch checked={showArchived} onCheckedChange={setShowArchived} />
          </label>
        )}
      </div>
      <WalletSheet
        key={sheet.nonce}
        open={sheet.open}
        onOpenChange={(o) => setSheet((s) => ({ ...s, open: o }))}
        wallet={sheet.wallet}
        nextOrder={wallets.length}
        isDefault={sheet.wallet?.id === settings?.defaultWalletId}
      />
    </>
  )
}

function WalletSheet({
  open,
  onOpenChange,
  wallet,
  nextOrder,
  isDefault,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  wallet: WithId<Wallet> | null
  nextOrder: number
  isDefault: boolean
}) {
  const { t } = useI18n()
  const [name, setName] = useState(wallet?.name ?? '')
  const [type, setType] = useState<WalletType>(wallet?.type ?? 'bank')
  const [color, setColor] = useState(wallet?.color ?? '#DDF35A')
  const [initialBalance, setInitial] = useState(wallet?.initialBalance ?? 0)

  const save = async () => {
    if (!name.trim()) return
    try {
      const base = wallet ? { order: wallet.order, archived: wallet.archived } : { order: nextOrder, archived: false }
      await saveWallet(wallet?.id ?? null, wallet, { ...base, name: name.trim(), type, color, initialBalance })
      toast.success(t('common.saved'))
      onOpenChange(false)
    } catch {
      toast.error(t('common.error'))
    }
  }

  const toggleArchive = async () => {
    if (!wallet) return
    await setArchived('wallets', wallet.id, !wallet.archived)
    onOpenChange(false)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={wallet ? wallet.name : t('wallets.new')}
      footer={
        <div className="flex gap-2">
          {wallet && !isDefault && (
            <Button variant="secondary" className="h-12 rounded-full" onClick={toggleArchive}>
              {wallet.archived ? <ArchiveRestore /> : <Archive />}
              {wallet.archived ? t('common.unarchive') : t('common.archive')}
            </Button>
          )}
          <Button className="h-12 flex-1 rounded-full text-base" disabled={!name.trim()} onClick={save}>
            {t('common.save')}
          </Button>
        </div>
      }
    >
      <Field label={t('common.name')} htmlFor="w-name">
        <TextInput id="w-name" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label={t('common.type')} htmlFor="w-type">
        <select id="w-type" value={type} onChange={(e) => setType(e.target.value as WalletType)} className={selectCls}>
          {TYPES.map((v) => (
            <option key={v} value={v}>
              {t(`wallets.type.${v}`)}
            </option>
          ))}
        </select>
      </Field>
      <ColorSwatches label={t('common.color')} value={color} onChange={setColor} />
      <AmountField id="w-initial" label={t('wallets.initial')} value={initialBalance} onChange={setInitial} />
      {wallet && (
        <p className="text-sm text-muted-foreground">
          {t('wallets.balance')}: <span className="num text-foreground">{formatIDR(wallet.balance + initialBalance - wallet.initialBalance)}</span>
        </p>
      )}
    </Sheet>
  )
}
