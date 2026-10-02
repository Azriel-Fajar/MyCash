import { onValue, ref } from 'firebase/database'
import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'

/** Browser online AND (after first contact) connected to the Realtime Database. */
export function useOnline(): boolean {
  const [browser, setBrowser] = useState(navigator.onLine)
  const [server, setServer] = useState(true)

  useEffect(() => {
    const on = () => setBrowser(true)
    const off = () => setBrowser(false)
    addEventListener('online', on)
    addEventListener('offline', off)
    let seen = false
    // .info/connected starts false before the first handshake; ignore that.
    const unsub = onValue(ref(db, '.info/connected'), (s) => {
      const c = s.val() === true
      if (c) seen = true
      if (seen) setServer(c)
    })
    return () => {
      removeEventListener('online', on)
      removeEventListener('offline', off)
      unsub()
    }
  }, [])

  return browser && server
}
