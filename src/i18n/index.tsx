import { enUS, id as idLocale, type Locale } from 'date-fns/locale'
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Language } from '@/lib/types'
import { en } from './en'
import { id, type DictKey } from './id'

const dicts: Record<Language, Record<DictKey, string>> = { id, en }
const locales: Record<Language, Locale> = { id: idLocale, en: enUS }
const STORAGE_KEY = 'mycash.lang'

export type TFn = (key: DictKey, vars?: Record<string, string | number>) => string

interface I18n {
  lang: Language
  setLang: (l: Language) => void
  t: TFn
  locale: Locale
}

const Ctx = createContext<I18n | null>(null)

function storedLang(): Language {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'id' || v === 'en') return v
  } catch {
    /* storage unavailable */
  }
  return navigator.language.startsWith('en') ? 'en' : 'id'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(storedLang)

  const setLang = useCallback((l: Language) => {
    setLangState(l)
    document.documentElement.lang = l
    try {
      localStorage.setItem(STORAGE_KEY, l)
    } catch {
      /* storage unavailable */
    }
  }, [])

  const value = useMemo<I18n>(() => {
    const dict = dicts[lang]
    const t: TFn = (key, vars) => {
      let s = dict[key] ?? key
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v))
      return s
    }
    return { lang, setLang, t, locale: locales[lang] }
  }, [lang, setLang])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useI18n(): I18n {
  const v = useContext(Ctx)
  if (!v) throw new Error('useI18n outside I18nProvider')
  return v
}
