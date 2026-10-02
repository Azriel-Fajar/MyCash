import { Archive, ArchiveRestore, List } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { AmountField } from '@/components/AmountField'
import { ColorSwatches, Field, selectCls, TextInput } from '@/components/FormBits'
import { Sheet } from '@/components/Sheet'
import { WalletCard } from '@/components/WalletCard'
import { Button } from '@/components/ui/button'
import { useData } from '@/hooks/data'
import { useI18n } from '@/i18n'
import { saveWallet, setArchived } from '@/lib/db'
import { formatIDR } from '@/lib/money'
import type { Wallet, WalletType, WithId } from '@/lib/types'

const TYPES: WalletType[] = ['cash', 'bank', 'ewallet', 'savings']

/** Wallet details and editor. Mount with a fresh `key` per open so state starts from `wallet`. */
export function WalletSheet({
  open,
  onOpenChange,
  wallet,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  wallet: WithId<Wallet> | null
}) {
  const { t } = useI18n()
  const { wallets, settings } = useData()
  const navigate = useNavigate()
  const [name, setName] = useState(wallet?.name ?? '')
  const [type, setType] = useState<WalletType>(wallet?.type ?? 'bank')
  const [color, setColor] = useState(wallet?.color ?? '#DDF35A')
  const [balance, setBalance] = useState(wallet?.balance ?? 0)
  const isDefault = !!wallet && wallet.id === settings?.defaultWalletId
  // Setting the current balance shifts the starting balance by the same amount; tx history stays intact.
  const initialBalance = wallet ? wallet.initialBalance + balance - wallet.balance : balance

  const save = async () => {
    if (!name.trim()) return
    try {
      const base = wallet ? { order: wallet.order, archived: wallet.archived } : { order: wallets.length, archived: false }
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

  const viewTx = () => {
    if (!wallet) return
    // Replace the sheet's own history entry so back from History returns to the page underneath.
    navigate(`/history?wallet=${wallet.id}`, { replace: true })
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
      <WalletCard
        wallet={{ initialBalance, order: 0, archived: false, name: name || t('wallets.new'), type, color, balance }}
        isDefault={isDefault}
        className="mx-auto w-[min(18rem,78vw)]"
      />
      {wallet && (
        <Button variant="secondary" className="h-11 w-full rounded-full" onClick={viewTx}>
          <List /> {t('wallets.viewTx')}
        </Button>
      )}
      <div>
        <AmountField id="w-balance" label={wallet ? t('wallets.balance') : t('wallets.initial')} value={balance} onChange={setBalance} />
        {wallet && (
          <p className="mt-1 text-xs text-muted-foreground">
            {t('wallets.initial')}: <span className="num">{formatIDR(initialBalance)}</span>
          </p>
        )}
      </div>
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
    </Sheet>
  )
}
