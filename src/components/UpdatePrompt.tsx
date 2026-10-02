import { useEffect } from 'react'
import { toast } from 'sonner'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useI18n } from '@/i18n'

/** Registers the service worker on first load (before sign-in) and offers reload on updates. */
export function UpdatePrompt() {
  const { t } = useI18n()
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  useEffect(() => {
    if (!needRefresh) return
    toast(t('update.ready'), {
      duration: Infinity,
      action: { label: t('update.reload'), onClick: () => void updateServiceWorker(true) },
    })
  }, [needRefresh, t, updateServiceWorker])

  return null
}
