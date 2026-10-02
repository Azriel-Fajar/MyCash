import { useI18n } from '@/i18n'
import { updateSettings } from '@/lib/db'
import type { Language } from '@/lib/types'
import { cn } from '@/lib/utils'

/** ID / EN toggle. `persist` also saves to /settings (only when signed in and authorized). */
export function LangSwitch({ persist = false, className }: { persist?: boolean; className?: string }) {
  const { lang, setLang } = useI18n()
  const pick = (l: Language) => {
    setLang(l)
    if (persist) void updateSettings({ language: l })
  }
  return (
    <div className={cn('flex rounded-full bg-secondary p-0.5 text-xs font-medium', className)}>
      {(['id', 'en'] as const).map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={lang === l}
          onClick={() => pick(l)}
          className={cn(
            'num rounded-full px-2.5 py-1 uppercase',
            lang === l ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground',
          )}
        >
          {l}
        </button>
      ))}
    </div>
  )
}
