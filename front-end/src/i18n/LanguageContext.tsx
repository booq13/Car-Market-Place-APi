import { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { translations, type Language } from './translations'

const STORAGE_KEY = 'carmarket.lang'

function getInitialLanguage(): Language {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'en' || stored === 'uk' ? stored : 'uk'
}

function resolve(obj: unknown, path: string[]): unknown {
  let current = obj
  for (const key of path) {
    if (typeof current !== 'object' || current === null) return undefined
    current = (current as Record<string, unknown>)[key]
  }
  return current
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, name) => {
    const value = vars[name]
    return value === undefined ? match : String(value)
  })
}

interface LanguageContextValue {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage)

  const setLanguage = (lang: Language) => {
    localStorage.setItem(STORAGE_KEY, lang)
    setLanguageState(lang)
  }

  const t = useMemo(() => {
    return (key: string, vars?: Record<string, string | number>) => {
      const path = key.split('.')
      const value = resolve(translations[language], path) ?? resolve(translations.uk, path)
      if (typeof value !== 'string') return key
      return interpolate(value, vars)
    }
  }, [language])

  const value = useMemo(() => ({ language, setLanguage, t }), [language, t])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
