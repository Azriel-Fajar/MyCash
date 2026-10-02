import { Suspense, useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { useOnline } from '@/hooks/useOnline'
import { UiContext, type TxSheetRequest } from '@/hooks/ui'
import { useI18n } from '@/i18n'
import { currentMonth } from '@/lib/dates'
import { BottomNav } from './BottomNav'
import { TxSheet } from './TxSheet'

export function Layout() {
  const { t } = useI18n()
  const online = useOnline()
  const [month, setMonth] = useState(currentMonth)
  const [sheet, setSheet] = useState<{ open: boolean; nonce: number; req: TxSheetRequest }>({ open: false, nonce: 0, req: {} })
  const { pathname } = useLocation()

  useEffect(() => {
    // Block body: newer browsers return a Promise from scrollTo, which React would treat as cleanup.
    window.scrollTo(0, 0)
  }, [pathname])

  const ui = useMemo(
    () => ({
      month,
      setMonth,
      openTx: (req: TxSheetRequest = {}) => setSheet((s) => ({ open: true, nonce: s.nonce + 1, req })),
    }),
    [month],
  )

  return (
    <UiContext.Provider value={ui}>
      {!online && (
        <div role="status" className="fixed inset-x-0 top-0 z-50 bg-ink px-4 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 text-center text-sm text-ink-foreground">
          {t('offline')}
        </div>
      )}
      <div className="mx-auto min-h-dvh max-w-lg pb-32">
        <Suspense>
          <Outlet />
        </Suspense>
      </div>
      <BottomNav canAdd={online} />
      <TxSheet
        key={sheet.nonce}
        open={sheet.open}
        request={sheet.req}
        online={online}
        onOpenChange={(open) => setSheet((s) => ({ ...s, open }))}
      />
    </UiContext.Provider>
  )
}
