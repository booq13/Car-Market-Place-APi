import { useLanguage } from '../i18n/LanguageContext'

interface RatingStarsProps {
  value: number
  size?: 'sm' | 'md'
}

export function RatingStars({ value, size = 'sm' }: RatingStarsProps) {
  const { t } = useLanguage()
  const rounded = Math.round(value)
  const starClass = size === 'sm' ? 'text-sm' : 'text-lg'

  return (
    <span
      className={`inline-flex items-center gap-0.5 ${starClass}`}
      aria-label={t('reviews.starAriaLabel', { n: value.toFixed(1) })}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < rounded ? 'text-amber-400' : 'text-slate-300'}>
          ★
        </span>
      ))}
    </span>
  )
}
