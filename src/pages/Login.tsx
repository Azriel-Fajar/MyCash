import { useState } from 'react'
import { toast } from 'sonner'
import { LangSwitch } from '@/components/LangSwitch'
import { Rings } from '@/components/Rings'
import { useI18n } from '@/i18n'
import { signInWithGoogle } from '@/lib/firebase'

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path fill="#4285F4" d="M22.6 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8z" />
      <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1-3.7 1-2.8 0-5.3-1.9-6.1-4.5H2.2v2.8A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.9 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.2a11 11 0 0 0 0 9.8l3.7-2.8z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3 .6 4.1 1.6l3.1-3.1A11 11 0 0 0 2.2 7.1l3.7 2.8C6.7 7.3 9.2 5.4 12 5.4z" />
    </svg>
  )
}

/** Two tilted wallet cards — the one decorative moment, echoing the Home carousel. */
function CardStack() {
  return (
    <div aria-hidden className="relative mx-auto h-56 w-full max-w-xs">
      <div className="absolute top-10 left-10 h-40 w-64 rotate-[14deg] overflow-hidden rounded-[1.5rem] bg-primary p-5 shadow-xl">
        <Rings className="text-ink/25" />
      </div>
      <div className="absolute top-0 left-2 h-40 w-64 -rotate-[8deg] overflow-hidden rounded-[1.5rem] bg-lime p-5 text-ink shadow-2xl">
        <Rings className="text-ink/30" />
        <p className="num absolute bottom-5 left-5 text-sm font-semibold">Rp 25.000</p>
        <p className="num absolute right-5 bottom-5 text-xs opacity-70">Cash</p>
      </div>
    </div>
  )
}

export default function Login() {
  const { t } = useI18n()
  const [busy, setBusy] = useState(false)

  const go = async () => {
    setBusy(true)
    try {
      await signInWithGoogle()
    } catch (e) {
      console.error(e)
      const code = (e as { code?: string }).code
      toast.error(t('login.error'), { description: code })
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-between">
        <span className="num text-base font-semibold">MyCash</span>
        <LangSwitch />
      </div>
      <h1 className="num mt-10 text-[2.5rem] leading-[1.1] font-semibold tracking-tight text-balance">{t('login.title')}</h1>
      <p className="mt-4 max-w-[34ch] text-muted-foreground">{t('login.subtitle')}</p>
      <div className="flex flex-1 items-center py-8">
        <CardStack />
      </div>
      <button
        type="button"
        onClick={go}
        disabled={busy}
        className="flex h-14 w-full items-center justify-center gap-3 rounded-full bg-card font-medium shadow-sm transition-transform active:scale-[0.98] disabled:opacity-60"
      >
        <GoogleMark /> {t('login.google')}
      </button>
    </main>
  )
}
