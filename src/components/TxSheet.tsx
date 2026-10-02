import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useData } from '@/hooks/data'
import type { TxSheetRequest } from '@/hooks/ui'
import { useI18n } from '@/i18n'
import { deleteTx, saveTx } from '@/lib/db'
import { todayWIB } from '@/lib/dates'
import type { Tx, TxType } from '@/lib/types'
import { AmountField } from './AmountField'
import { CategoryPicker } from './CategoryPicker'
import { Segmented } from './Segmented'
import { Sheet } from './Sheet'
import { WalletChips } from './WalletChips'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  request: TxSheetRequest
  online: boolean
}

export function TxSheet({ open, onOpenChange, request, online }: Props) {
  const { t } = useI18n()
  const { settings, activeWallets, catById } = useData()
  const editing = request.editing ?? null

  const fallbackWallet = settings?.defaultWalletId ?? activeWallets[0]?.id ?? null
  const [type, setType] = useState<TxType>(editing?.type ?? request.type ?? 'expense')
  const [amount, setAmount] = useState(editing?.amount ?? 0)
  const [categoryId, setCategoryId] = useState<string | null>(editing?.categoryId ?? null)
  const [walletId, setWalletId] = useState<string | null>(editing?.walletId ?? fallbackWallet)
  const [toWalletId, setToWalletId] = useState<string | null>(
    editing?.toWalletId ?? activeWallets.find((w) => w.id !== fallbackWallet)?.id ?? null,
  )
  const [date, setDate] = useState(editing?.date ?? todayWIB())
  const [note, setNote] = useState(editing?.note ?? '')
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const changeType = (v: TxType) => {
    setType(v)
    if (categoryId && catById[categoryId]?.type !== v) setCategoryId(null)
  }

  const save = async () => {
    if (amount <= 0) return toast.error(t('tx.needAmount'))
    if (type !== 'transfer' && !categoryId) return toast.error(t('tx.needCategory'))
    if (!walletId || (type === 'transfer' && (!toWalletId || toWalletId === walletId))) return toast.error(t('tx.needWallets'))
    setBusy(true)
    try {
      const old: Tx | null = editing ? stripId(editing) : null
      await saveTx(editing?.id ?? null, old, {
        type,
        amount,
        categoryId: type === 'transfer' ? null : categoryId,
        walletId,
        toWalletId: type === 'transfer' ? toWalletId : null,
        date,
        note: note.trim(),
        source: editing?.source ?? 'app',
        recurringId: editing?.recurringId ?? null,
      })
      toast.success(t('tx.saved'))
      onOpenChange(false)
    } catch {
      toast.error(t('common.error'))
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!editing) return
    try {
      await deleteTx(editing.id, stripId(editing))
      toast.success(t('tx.deleted'))
      onOpenChange(false)
    } catch {
      toast.error(t('common.error'))
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? t('tx.edit') : t('tx.new')}
      footer={
        <div className="flex gap-2">
          {editing && (
            <Button
              variant="secondary"
              className="size-12 rounded-full text-destructive"
              aria-label={t('tx.delete')}
              disabled={!online}
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="size-5" />
            </Button>
          )}
          <Button className="h-12 flex-1 rounded-full text-base" disabled={busy || !online} onClick={save}>
            {t('tx.save')}
          </Button>
        </div>
      }
    >
      <Segmented
        value={type}
        onChange={changeType}
        options={(['expense', 'income', 'transfer'] as const).map((v) => ({ value: v, label: t(`type.${v}`) }))}
      />
      <AmountField label={t('tx.amount')} value={amount} onChange={setAmount} size="lg" autoFocus={!editing} />

      {type === 'transfer' ? (
        <>
          <WalletChips label={t('tx.from')} value={walletId} onChange={setWalletId} />
          <WalletChips label={t('tx.to')} value={toWalletId} onChange={setToWalletId} exclude={walletId} />
        </>
      ) : (
        <>
          <CategoryPicker type={type} value={categoryId} onChange={setCategoryId} />
          <WalletChips label={t('tx.wallet')} value={walletId} onChange={setWalletId} />
        </>
      )}

      <div className="grid grid-cols-[auto_1fr] gap-3">
        <div>
          <label htmlFor="tx-date" className="text-sm text-muted-foreground">
            {t('tx.date')}
          </label>
          <Input
            id="tx-date"
            type="date"
            value={date}
            max={todayWIB()}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            className="num mt-1 h-11 rounded-xl border-none bg-card"
          />
        </div>
        <div>
          <label htmlFor="tx-note" className="text-sm text-muted-foreground">
            {t('tx.note')}
          </label>
          <Input
            id="tx-note"
            value={note}
            maxLength={200}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('tx.notePlaceholder')}
            className="mt-1 h-11 rounded-xl border-none bg-card"
          />
        </div>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('tx.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('tx.deleteBody')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('tx.cancel')}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={remove}>
              {t('tx.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  )
}

function stripId<T extends { id: string }>(x: T): Omit<T, 'id'> {
  const { id: _, ...rest } = x
  return rest
}
