import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { useOnline } from '@/hooks/useOnline'
import { UiContext, type TxSheetRequest } from '@/hooks/ui'
import { useI18n } from '@/i18n'
import { currentMonth } from '@/lib/dates'
import { BottomNav, TABS } from './BottomNav'
import { TxSheet } from './TxSheet'

export function Layout() {
  const { t } = useI18n()
  const online = useOnline()
  const [month, setMonth] = useState(currentMonth)
  const [sheet, setSheet] = useState<{ open: boolean; nonce: number; req: TxSheetRequest }>({ open: false, nonce: 0, req: {} })
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const swipeRef = useRef<HTMLDivElement>(null)

  // Horizontal swipe on a top-level tab moves to the neighbouring tab.
  useEffect(() => {
    const el = swipeRef.current
    const idx = TABS.findIndex((tab) => tab.to === pathname)
    if (!el || idx < 0) return
    let start: { x: number; y: number; scroller: Element | null; left: number } | null = null
    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return void (start = null)
      const scroller = hScroller(e.target)
      start = { x: e.touches[0].clientX, y: e.touches[0].clientY, scroller, left: scroller?.scrollLeft ?? 0 }
    }
    const onEnd = (e: TouchEvent) => {
      if (!start) return
      const dx = e.changedTouches[0].clientX - start.x
      const dy = e.changedTouches[0].clientY - start.y
      const moved = start.scroller && Math.abs(start.scroller.scrollLeft - start.left) > 1
      start = null
      // The swipe scrolled a carousel or chip row instead; only switch tabs when it was already at its edge.
      if (moved) return
      if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 2) return
      const next = TABS[idx + (dx < 0 ? 1 : -1)]
      if (next) navigate(next.to)
    }
    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchend', onEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchend', onEnd)
    }
  }, [pathname, navigate])

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
      <div ref={swipeRef} className="mx-auto min-h-dvh max-w-lg pb-32">
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

/** Nearest ancestor that scrolls sideways (e.g. carousels, chip rows), if any. */
function hScroller(target: EventTarget | null) {
  for (let n = target instanceof Element ? target : null; n; n = n.parentElement) {
    if (n.scrollWidth > n.clientWidth && /auto|scroll/.test(getComputedStyle(n).overflowX)) return n
  }
  return null
}
