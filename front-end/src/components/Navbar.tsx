import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useLanguage } from '../i18n/LanguageContext'
import { LANGUAGES } from '../i18n/translations'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
  }`

function LanguageSwitch() {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="flex shrink-0 items-center rounded-full border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLanguage(lang.code)}
          aria-pressed={language === lang.code}
          className={`rounded-full px-2 py-1 transition sm:px-2.5 ${
            language === lang.code ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  )
}

export function Navbar() {
  const { isAuthenticated, username, logout } = useAuth()
  const { data: profile } = useProfile()
  const { t } = useLanguage()
  const [menuOpen, setMenuOpen] = useState(false)

  function handleLogout() {
    // No explicit navigation here: on a protected page, ProtectedRoute's
    // own redirect to /login takes over once isAuthenticated flips to
    // false; on a public page the user simply stays put, now logged out.
    logout()
    setMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-4">
        <Link to="/" className="flex shrink-0 items-center gap-2 text-lg font-bold text-slate-900">
          <span className="text-xl">🚗</span> <span className="hidden sm:inline">Car Marketplace</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <NavLink to="/" end className={linkClass}>
            {t('nav.catalog')}
          </NavLink>
          {isAuthenticated && (
            <>
              <NavLink to="/my-listings" className={linkClass}>
                {t('nav.myListings')}
              </NavLink>
              <NavLink to="/favorites" className={linkClass}>
                {t('nav.favorites')}
              </NavLink>
              <NavLink to="/listings/new" className={linkClass}>
                {t('nav.addCar')}
              </NavLink>
            </>
          )}
        </nav>

        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <LanguageSwitch />

          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {profile?.avatar ? (
                  <img src={profile.avatar} alt="" className="h-6 w-6 rounded-full object-cover" />
                ) : (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                    {username?.slice(0, 1).toUpperCase()}
                  </span>
                )}
                {username}
                {profile?.is_premium && (
                  <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-700">
                    Premium
                  </span>
                )}
              </button>

              {menuOpen && (
                <>
                  <button
                    className="fixed inset-0 z-10 cursor-default"
                    aria-label={t('nav.closeMenu')}
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                    <Link
                      to="/my-listings"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 md:hidden"
                    >
                      {t('nav.myListings')}
                    </Link>
                    <Link
                      to="/favorites"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 md:hidden"
                    >
                      {t('nav.favorites')}
                    </Link>
                    <Link
                      to="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      {t('nav.profile')}
                    </Link>
                    <Link
                      to="/subscription"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      {t('nav.subscription')}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
                    >
                      {t('nav.logout')}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link
                to="/login"
                className="whitespace-nowrap rounded-lg px-2 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 sm:px-3"
              >
                {t('nav.login')}
              </Link>
              <Link
                to="/register"
                className="whitespace-nowrap rounded-lg bg-indigo-600 px-2 py-2 text-sm font-medium text-white hover:bg-indigo-500 sm:px-3"
              >
                {t('nav.register')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
