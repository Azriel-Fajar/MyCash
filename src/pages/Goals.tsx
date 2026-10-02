import { format, parseISO } from 'date-fns'
import { Check, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { AmountField } from '@/components/AmountField'
import { Field, selectCls, TextInput } from '@/components/FormBits'
import { PageHeader } from '@/components/PageHeader'
import { Sheet } from '@/components/Sheet'
import { Button } from '@/components/ui/button'
import { useData } from '@/hooks/data'
import { useDbList } from '@/hooks/useDb'
import { useI18n } from '@/i18n'
import { todayWIB } from '@/lib/dates'
import { removeAt, saveGoal } from '@/lib/db'
import { goalProgress } from '@/lib/goals'
import { formatIDR } from '@/lib/money'
import type { Goal, WithId } from '@/lib/types'
import { cn } from '@/lib/utils'

export default function Goals() {
  const { t, locale } = useI18n()
  const { walletById } = useData()
  const { items, loading } = useDbList<Goal>('goals')
  const [sheet, setSheet] = useState({ open: false, nonce: 0, goal: null as WithId<Goal> | null })
  const open = (goal: WithId<Goal> | null) => setSheet((s) => ({ open: true, nonce: s.nonce + 1, goal }))
  const today = todayWIB()
  const sorted = [...items].sort((a, b) => Number(a.done) - Number(b.done) || a.createdAt - b.createdAt)

  return (
    <>
      <PageHeader
        title={t('more.goals')}
        back
        action={
          <Button size="icon" className="size-10 rounded-full" onClick={() => open(null)} aria-label={t('goals.new')}>
            <Plus />
          </Button>
        }
      />
      <div className="px-5">
        {!loading && items.length === 0 ? (
          <p className="rounded-2xl bg-card p-6 text-center text-muted-foreground">{t('goals.empty')}</p>
        ) : (
          <ul className="space-y-3">
            {sorted.map((g) => {
              const wallet = walletById[g.walletId]
              const p = goalProgress(wallet?.balance ?? 0, g.target, g.deadline, today)
              return (
                <li key={g.id}>
                  <button
                    type="button"
                    onClick={() => open(g)}
                    className={cn('w-full rounded-2xl bg-card p-4 text-left focus-visible:outline-2 focus-visible:outline-ring', g.done && 'opacity-60')}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="truncate font-medium">{g.name}</span>
                      <span className="num shrink-0 text-sm text-muted-foreground">{Math.round(p.pct * 100)}%</span>
                    </div>
                    <p className="num mt-2 text-xl font-semibold">
                      {formatIDR(Math.max(0, wallet?.balance ?? 0))}
                      <span className="text-sm font-normal text-muted-foreground"> / {formatIDR(g.target)}</span>
                    </p>
                    <div
                      className="mt-3 h-2.5 overflow-hidden rounded-full bg-brand-soft"
                      role="progressbar"
                      aria-valuenow={Math.round(p.pct * 100)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={g.name}
                    >
                      <div className="h-full rounded-full bg-primary" style={{ width: `${p.pct * 100}%` }} />
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {p.reached ? (
                        <span className="inline-flex items-center gap-1 font-medium text-income">
                          <Check className="size-4" /> {t('goals.reached')}
                        </span>
                      ) : p.perMonth !== null && g.deadline ? (
                        t('goals.perMonth', { amount: formatIDR(p.perMonth), date: format(parseISO(g.deadline), 'MMM yyyy', { locale }) })
                      ) : (
                        t('goals.left', { amount: formatIDR(p.left) })
                      )}
                      {wallet ? ` · ${wallet.name}` : ''}
                    </p>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
      <GoalSheet key={sheet.nonce} open={sheet.open} goal={sheet.goal} onOpenChange={(o) => setSheet((s) => ({ ...s, open: o }))} />
    </>
  )
}

function GoalSheet({ open, onOpenChange, goal }: { open: boolean; onOpenChange: (o: boolean) => void; goal: WithId<Goal> | null }) {
  const { t } = useI18n()
  const { activeWallets, wallets } = useData()
  const savings = activeWallets.find((w) => w.type === 'savings')
  const [name, setName] = useState(goal?.name ?? '')
  const [target, setTarget] = useState(goal?.target ?? 0)
  const [deadline, setDeadline] = useState(goal?.deadline ?? '')
  const [walletId, setWalletId] = useState(goal?.walletId ?? savings?.id ?? activeWallets[0]?.id ?? '')
  const list = wallets.filter((w) => !w.archived || w.id === walletId)

  const save = async (done = goal?.done ?? false) => {
    if (!name.trim() || target <= 0 || !walletId) return toast.error(t('goals.invalid'))
    try {
      await saveGoal(goal?.id ?? null, {
        name: name.trim(),
        target,
        deadline: deadline || null,
        walletId,
        createdAt: goal?.createdAt ?? Date.now(),
        done,
      })
      toast.success(t('common.saved'))
      onOpenChange(false)
    } catch {
      toast.error(t('common.error'))
    }
  }

  const remove = async () => {
    if (!goal) return
    await removeAt(`goals/${goal.id}`)
    onOpenChange(false)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={goal ? goal.name : t('goals.new')}
      footer={
        <div className="flex gap-2">
          {goal && (
            <Button variant="secondary" className="size-12 rounded-full text-destructive" aria-label={t('common.delete')} onClick={remove}>
              <Trash2 className="size-5" />
            </Button>
          )}
          {goal && !goal.done && (
            <Button variant="secondary" className="h-12 rounded-full" onClick={() => save(true)}>
              <Check /> {t('goals.done')}
            </Button>
          )}
          <Button className="h-12 flex-1 rounded-full text-base" onClick={() => save()}>
            {t('common.save')}
          </Button>
        </div>
      }
    >
      <Field label={t('common.name')} htmlFor="g-name">
        <TextInput id="g-name" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
      </Field>
      <AmountField id="g-target" label={t('goals.target')} value={target} onChange={setTarget} />
      <Field label={t('goals.deadline')} htmlFor="g-deadline">
        <TextInput id="g-deadline" type="date" value={deadline} min={todayWIB()} onChange={(e) => setDeadline(e.target.value)} className="num" />
      </Field>
      <Field label={t('goals.wallet')} htmlFor="g-wallet" hint={t('goals.walletHint')}>
        <select id="g-wallet" value={walletId} onChange={(e) => setWalletId(e.target.value)} className={selectCls}>
          {list.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </Field>
    </Sheet>
  )
}
