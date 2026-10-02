import { useEffect, useRef } from 'react'

/**
 * While `open`, a history entry is pushed so the phone's back button closes the overlay instead of
 * leaving the page. Closing it any other way pops that entry again.
 */
export function useBackClose(open: boolean, close: () => void) {
  const closeRef = useRef(close)
  useEffect(() => {
    closeRef.current = close
  })
  // A ref (not effect cleanup) tracks the entry so StrictMode's effect re-run doesn't push twice.
  const pushed = useRef(false)

  useEffect(() => {
    if (!open) {
      if (pushed.current) {
        pushed.current = false
        if (history.state?.sheet) history.back()
      }
      return
    }
    if (!pushed.current) {
      // Keep the router's state (idx/key) so it sees the extra entry as the same location.
      history.pushState({ ...history.state, sheet: true }, '')
      pushed.current = true
    }
    const onPop = () => {
      pushed.current = false
      closeRef.current()
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [open])
}
