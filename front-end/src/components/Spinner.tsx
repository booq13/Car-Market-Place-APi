import { useLanguage } from '../i18n/LanguageContext'

export function Spinner({ label }: { label?: string }) {
  const { t } = useLanguage()
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
      <p className="text-sm">{label ?? t('common.loading')}</p>
    </div>
  )
}
