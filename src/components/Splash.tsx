import { useI18n } from '@/i18n'

export function Splash() {
  const { t } = useI18n()
  return (
    <div className="grid min-h-dvh place-items-center bg-ink text-ink-foreground">
      <div className="text-center">
        <p className="num text-2xl font-semibold">MyCash</p>
        <p className="mt-2 text-sm opacity-70 motion-safe:animate-pulse">{t('app.loading')}</p>
      </div>
    </div>
  )
}
