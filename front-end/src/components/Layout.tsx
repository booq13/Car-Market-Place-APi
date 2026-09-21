import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { useLanguage } from '../i18n/LanguageContext'

export function Layout() {
  const { t } = useLanguage()
  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-400">
        {t('footer.tagline')}
      </footer>
    </div>
  )
}
