import { useSyncExternalStore } from 'react'

export type ThemePref = 'system' | 'light' | 'dark'
type Resolved = 'light' | 'dark'

const KEY = 'mycash.theme'
const media = matchMedia('(prefers-color-scheme: dark)')
const listeners = new Set<() => void>()

function readPref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'light' || v === 'dark') return v
  } catch {
    /* storage unavailable */
  }
  return 'system'
}

let pref = readPref()

function resolved(): Resolved {
  return pref === 'system' ? (media.matches ? 'dark' : 'light') : pref
}

function apply() {
  const r = resolved()
  document.documentElement.classList.toggle('dark', r === 'dark')
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', r === 'dark' ? '#0F1318' : '#1F2630')
  listeners.forEach((l) => l())
}

media.addEventListener('change', apply)
apply()

export function setThemePref(p: ThemePref) {
  pref = p
  try {
    if (p === 'system') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, p)
  } catch {
    /* storage unavailable */
  }
  apply()
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useTheme() {
  const snap = useSyncExternalStore(subscribe, () => `${pref}:${resolved()}`)
  const [p, r] = snap.split(':') as [ThemePref, Resolved]
  return { pref: p, resolved: r, setPref: setThemePref }
}
