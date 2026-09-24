import { useLanguage } from '../i18n/LanguageContext'

interface PaginationProps {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  const { t } = useLanguage()
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-3 py-8">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {t('pagination.prev')}
      </button>
      <span className="text-sm text-slate-600">{t('pagination.pageOf', { page, total: totalPages })}</span>
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {t('pagination.next')}
      </button>
    </div>
  )
}
