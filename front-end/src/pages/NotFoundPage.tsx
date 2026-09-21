import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'

export function NotFoundPage() {
  const { t } = useLanguage()
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <p className="text-6xl font-bold text-slate-200">404</p>
      <p className="text-lg font-semibold text-slate-700">{t('notFound.title')}</p>
      <Link to="/" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
        {t('notFound.backHome')}
      </Link>
    </div>
  )
}
