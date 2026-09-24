import { Link, Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { LogoMark } from './icons'
import { useLanguage } from '../i18n/LanguageContext'

export function Layout() {
  const { t } = useLanguage()
  const linkClass = 'text-sm text-slate-400 transition hover:text-white'

  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>
      <footer className="mt-10 bg-ink text-slate-300">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 text-lg font-extrabold text-white">
              <LogoMark className="h-8 w-8 text-indigo-600" />
              <span>
                Car<span className="text-indigo-400">Market</span>
              </span>
            </div>
            <p className="mt-3 max-w-sm text-sm text-slate-400">{t('footer.about')}</p>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-white">{t('footer.buyers')}</p>
            <Link to="/" className={linkClass}>
              {t('nav.catalog')}
            </Link>
            <Link to="/favorites" className={linkClass}>
              {t('nav.favorites')}
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-white">{t('footer.sellers')}</p>
            <Link to="/listings/new" className={linkClass}>
              {t('nav.addCar')}
            </Link>
            <Link to="/my-listings" className={linkClass}>
              {t('nav.myListings')}
            </Link>
            <Link to="/subscription" className={linkClass}>
              {t('nav.subscription')}
            </Link>
          </div>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-xs text-slate-500">
          {t('footer.rights', { year: new Date().getFullYear() })} · {t('footer.tagline')}
        </div>
      </footer>
    </div>
  )
}
