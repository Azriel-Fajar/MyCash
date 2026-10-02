import { signOut } from 'firebase/auth'
import { Copy, LogOut, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Field, selectCls } from '@/components/FormBits'
import { PageHeader } from '@/components/PageHeader'
import { Segmented } from '@/components/Segmented'
import { Button } from '@/components/ui/button'
import { useData } from '@/hooks/data'
import { useOnline } from '@/hooks/useOnline'
import { useI18n } from '@/i18n'
import { recalculateBalances, updateSettings } from '@/lib/db'
import { auth } from '@/lib/firebase'
import { useTheme, type ThemePref } from '@/lib/theme'
import type { Language } from '@/lib/types'

export default function Settings() {
  const { t, lang, setLang } = useI18n()
  const { settings, activeWallets } = useData()
  const { pref, setPref } = useTheme()
  const online = useOnline()
  const [busy, setBusy] = useState(false)
  const user = auth.currentUser

  const pickLang = (l: Language) => {
    setLang(l)
    void updateSettings({ language: l })
  }

  const recalc = async () => {
    setBusy(true)
    try {
      await recalculateBalances()
      toast.success(t('settings.recalcDone'))
    } catch {
      toast.error(t('common.error'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader title={t('more.settings')} back />
      <div className="space-y-6 px-5">
        <Field label={t('settings.language')}>
          <Segmented
            value={lang}
            onChange={pickLang}
            options={[
              { value: 'id', label: 'Bahasa Indonesia' },
              { value: 'en', label: 'English' },
            ]}
          />
        </Field>

        <Field label={t('settings.theme')}>
          <Segmented<ThemePref>
            value={pref}
            onChange={setPref}
            options={(['system', 'light', 'dark'] as const).map((v) => ({ value: v, label: t(`settings.theme.${v}`) }))}
          />
        </Field>

        <Field label={t('settings.defaultWallet')} htmlFor="s-wallet" hint={t('onboarding.defaultHint')}>
          <select
            id="s-wallet"
            value={settings?.defaultWalletId ?? ''}
            onChange={(e) => void updateSettings({ defaultWalletId: e.target.value })}
            className={selectCls}
          >
            {activeWallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label={t('settings.recalc')} hint={t('settings.recalcHint')}>
          <Button variant="secondary" className="h-11 w-full rounded-xl bg-card" disabled={busy || !online} onClick={recalc}>
            <RefreshCw className={busy ? 'animate-spin' : undefined} /> {t('settings.recalc')}
          </Button>
        </Field>

        <Field label={t('settings.account')}>
          <div className="space-y-2 rounded-2xl bg-card p-4">
            <p className="font-medium">{user?.displayName}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <p className="text-xs text-muted-foreground">{t('settings.uid')}</p>
            <div className="flex items-center gap-2">
              <code className="num flex-1 truncate text-xs">{user?.uid}</code>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t('denied.copy')}
                onClick={async () => {
                  await navigator.clipboard.writeText(user?.uid ?? '')
                  toast.success(t('denied.copied'))
                }}
              >
                <Copy />
              </Button>
            </div>
          </div>
        </Field>

        <Button variant="secondary" className="h-12 w-full rounded-full text-destructive" onClick={() => signOut(auth)}>
          <LogOut /> {t('signout')}
        </Button>
      </div>
    </>
  )
}
