import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { AmountField } from '@/components/AmountField'
import { CategoryPicker } from '@/components/CategoryPicker'
import { Field, Row, TextInput } from '@/components/FormBits'
import { IconBubble } from '@/components/IconBubble'
import { PageHeader } from '@/components/PageHeader'
import { Segmented } from '@/components/Segmented'
import { Sheet } from '@/components/Sheet'
import { WalletChips } from '@/components/WalletChips'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useData } from '@/hooks/data'
import { useDbList } from '@/hooks/useDb'
import { useI18n } from '@/i18n'
import { removeAt, saveRecurring } from '@/lib/db'
import { formatIDR } from '@/lib/money'
import type { CategoryType, Recurring as R, WithId } from '@/lib/types'
import { cn } from '@/lib/utils'

export default function Recurring() {
  const { t } = useI18n()
  const { catById, catLabel, walletById } = useData()
  const { items, loading } = useDbList<R>('recurring')
  const [sheet, setSheet] = useState({ open: false, nonce: 0, item: null as WithId<R> | null })
  const open = (item: WithId<R> | null) => setSheet((s) => ({ open: true, nonce: s.nonce + 1, item }))
  const sorted = [...items].sort((a, b) => a.dayOfMonth - b.dayOfMonth)

  return (
    <>
      <PageHeader
        title={t('more.recurring')}
        back
        action={
          <Button size="icon" className="size-10 rounded-full" onClick={() => open(null)} aria-label={t('recurring.new')}>
            <Plus />
          </Button>
        }
      />
      <div className="px-5">
        {!loading && items.length === 0 ? (
          <p className="rounded-2xl bg-card p-6 text-center text-muted-foreground">{t('recurring.empty')}</p>
        ) : (
          <ul className="space-y-2">
            {sorted.map((r) => (
              <li key={r.id}>
                <Row
                  onClick={() => open(r)}
                  muted={!r.active}
                  leading={<IconBubble icon={catById[r.categoryId]?.icon} />}
                  title={r.note || catLabel(r.categoryId)}
                  subtitle={`${t('recurring.everyMonth', { d: r.dayOfMonth })}, ${walletById[r.walletId]?.name ?? '—'}${r.active ? '' : `, ${t('recurring.paused')}`}`}
                  trailing={
                    <span className={cn('num shrink-0 font-semibold', r.type === 'income' && 'text-income')}>
                      {r.type === 'income' ? '+' : '-'}
                      {formatIDR(r.amount)}
                    </span>
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </div>
      <RecurringSheet key={sheet.nonce} open={sheet.open} item={sheet.item} onOpenChange={(o) => setSheet((s) => ({ ...s, open: o }))} />
    </>
  )
}

function RecurringSheet({ open, onOpenChange, item }: { open: boolean; onOpenChange: (o: boolean) => void; item: WithId<R> | null }) {
  const { t } = useI18n()
  const { settings, activeWallets, catById } = useData()
  const [type, setType] = useState<CategoryType>(item?.type ?? 'expense')
  const [amount, setAmount] = useState(item?.amount ?? 0)
  const [categoryId, setCategoryId] = useState<string | null>(item?.categoryId ?? null)
  const [walletId, setWalletId] = useState<string | null>(item?.walletId ?? settings?.defaultWalletId ?? activeWallets[0]?.id ?? null)
  const [day, setDay] = useState(item?.dayOfMonth ?? 1)
  const [note, setNote] = useState(item?.note ?? '')
  const [active, setActive] = useState(item?.active ?? true)

  const save = async () => {
    if (amount <= 0) return toast.error(t('tx.needAmount'))
    if (!categoryId) return toast.error(t('tx.needCategory'))
    if (!walletId) return toast.error(t('tx.needWallets'))
    try {
      await saveRecurring(item?.id ?? null, { type, amount, categoryId, walletId, dayOfMonth: day, note: note.trim(), active }, item)
      toast.success(t('common.saved'))
      onOpenChange(false)
    } catch {
      toast.error(t('common.error'))
    }
  }

  const remove = async () => {
    if (!item) return
    await removeAt(`recurring/${item.id}`)
    onOpenChange(false)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={item ? t('more.recurring') : t('recurring.new')}
      footer={
        <div className="flex gap-2">
          {item && (
            <Button variant="secondary" className="size-12 rounded-full text-destructive" aria-label={t('common.delete')} onClick={remove}>
              <Trash2 className="size-5" />
            </Button>
          )}
          <Button className="h-12 flex-1 rounded-full text-base" onClick={save}>
            {t('common.save')}
          </Button>
        </div>
      }
    >
      <Segmented
        value={type}
        onChange={(v) => {
          setType(v)
          if (categoryId && catById[categoryId]?.type !== v) setCategoryId(null)
        }}
        options={[
          { value: 'expense', label: t('type.expense') },
          { value: 'income', label: t('type.income') },
        ]}
      />
      <AmountField label={t('tx.amount')} value={amount} onChange={setAmount} />
      <CategoryPicker type={type} value={categoryId} onChange={setCategoryId} />
      <WalletChips label={t('tx.wallet')} value={walletId} onChange={setWalletId} />
      <div className="grid grid-cols-[7rem_1fr] gap-3">
        <Field label={t('recurring.day')} htmlFor="r-day">
          <TextInput
            id="r-day"
            type="number"
            inputMode="numeric"
            min={1}
            max={31}
            value={day}
            onChange={(e) => setDay(Math.min(31, Math.max(1, Number(e.target.value) || 1)))}
            className="num"
          />
        </Field>
        <Field label={t('tx.note')} htmlFor="r-note">
          <TextInput id="r-note" value={note} maxLength={100} onChange={(e) => setNote(e.target.value)} placeholder="Netflix" />
        </Field>
      </div>
      <p className="-mt-3 text-xs text-muted-foreground">{t('recurring.dayHint')}</p>
      <label className="flex items-center justify-between rounded-2xl bg-card p-3 text-sm">
        {t('recurring.active')}
        <Switch checked={active} onCheckedChange={setActive} />
      </label>
    </Sheet>
  )
}
