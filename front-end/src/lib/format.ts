import type { Language } from '../i18n/translations'

const LOCALES: Record<Language, string> = { uk: 'uk-UA', en: 'en-US' }
const MILEAGE_UNIT: Record<Language, string> = { uk: 'км', en: 'km' }

export function formatPrice(price: string | number, language: Language = 'uk'): string {
  const value = typeof price === 'string' ? Number(price) : price
  if (Number.isNaN(value)) return String(price)
  const formatter = new Intl.NumberFormat(LOCALES[language], { maximumFractionDigits: 0 })
  return `$${formatter.format(value)}`
}

export function formatMileage(mileage: number, language: Language = 'uk'): string {
  const formatter = new Intl.NumberFormat(LOCALES[language])
  return `${formatter.format(mileage)} ${MILEAGE_UNIT[language]}`
}

export function formatDate(iso: string, language: Language = 'uk'): string {
  return new Date(iso).toLocaleDateString(LOCALES[language], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
