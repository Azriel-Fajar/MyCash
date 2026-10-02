import { Check, Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { AmountField } from '@/components/AmountField'
import { LangSwitch } from '@/components/LangSwitch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useI18n } from '@/i18n'
import { seedInitial, type OnboardingWallet } from '@/lib/db'
import { WALLET_PRESETS } from '@/lib/seed'
import { cn } from '@/lib/utils'

interface Row extends OnboardingWallet {
  picked: boolean
}

export default function Onboarding() {
  const { t, lang } = useI18n()
  const [rows, setRows] = useState<Row[]>(() =>
    WALLET_PRESETS.map((p) => ({ ...p, initialBalance: 0, picked: p.name === 'Cash' })),
  )
  const [defaultName, setDefaultName] = useState('Cash')
  const [custom, setCustom] = useState('')
  const [busy, setBusy] = useState(false)

  const patch = (i: number, p: Partial<Row>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...p } : r)))
  const picked = rows.filter((r) => r.picked)

  const addCustom = () => {
    const name = custom.trim()
    if (!name || rows.some((r) => r.name.toLowerCase() === name.toLowerCase())) return
    setRows((rs) => [...rs, { name, type: 'bank', color: '#C9C6F5', initialBalance: 0, picked: true }])
    setCustom('')
  }

  const start = async () => {
    if (!picked.length) return toast.error(t('onboarding.pickOne'))
    const def = Math.max(0, picked.findIndex((r) => r.name === defaultName))
    setBusy(true)
    try {
      await seedInitial(
        picked.map((r) => ({ name: r.name, type: r.type, color: r.color, initialBalance: r.initialBalance })),
        def,
        lang,
      )
    } catch {
      toast.error(t('common.error'))
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto max-w-md px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-32">
      <div className="flex items-center justify-between">
        <span className="num font-semibold">MyCash</span>
        <LangSwitch />
      </div>
      <h1 className="num mt-8 text-3xl font-semibold">{t('onboarding.title')}</h1>
      <p className="mt-2 text-muted-foreground">{t('onboarding.body')}</p>

      <ul className="mt-6 space-y-2">
        {rows.map((r, i) => (
          <li key={r.name} className="rounded-2xl bg-card p-3">
            <button
              type="button"
              aria-pressed={r.picked}
              onClick={() => patch(i, { picked: !r.picked })}
              className="flex w-full items-center gap-3 text-left"
            >
              <span className="size-8 shrink-0 rounded-lg" style={{ background: r.color }} />
              <span className="flex-1 font-medium">{r.name}</span>
              <span
                className={cn(
                  'grid size-6 place-items-center rounded-full border-2',
                  r.picked ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
                )}
              >
                {r.picked && <Check className="size-4" />}
              </span>
            </button>
            {r.picked && (
              <div className="mt-3 space-y-2">
                <AmountField
                  id={`bal-${i}`}
                  label={t('wallets.initial')}
                  value={r.initialBalance}
                  onChange={(n) => patch(i, { initialBalance: n })}
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="default"
                    checked={defaultName === r.name}
                    onChange={() => setDefaultName(r.name)}
                    className="size-4 accent-[var(--primary)]"
                  />
                  {t('onboarding.default')}
                </label>
              </div>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-3 flex gap-2">
        <Input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addCustom()}
          placeholder={t('onboarding.customName')}
          aria-label={t('onboarding.custom')}
          className="h-11 rounded-full bg-card px-4"
        />
        <Button variant="secondary" className="h-11 rounded-full" onClick={addCustom}>
          <Plus /> {t('common.add')}
        </Button>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{t('onboarding.defaultHint')}</p>

      <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-background via-background to-transparent px-5 pt-8 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <Button className="mx-auto flex h-14 w-full max-w-md rounded-full text-base" disabled={busy} onClick={start}>
          {t('onboarding.start')}
        </Button>
      </div>
    </main>
  )
}
