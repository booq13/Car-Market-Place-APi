import { useLanguage } from '../i18n/LanguageContext'

export function ErrorNotice({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useLanguage()
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-6 py-10 text-center text-rose-700">
      <p className="text-sm font-medium">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-lg border border-rose-300 bg-white px-4 py-1.5 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
        >
          {t('common.retry')}
        </button>
      )}
    </div>
  )
}
