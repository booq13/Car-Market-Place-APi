import { type FormEvent, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'
import { extractErrorMessage } from '../lib/api'

export function LoginPage() {
  const { login } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await login(username, password)
      toast.success(t('auth.loginSuccess'))
      const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/'
      navigate(from, { replace: true })
    } catch (error) {
      toast.error(extractErrorMessage(error, t('auth.loginError')))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-md py-6">
      <h1 className="mb-6 text-center text-3xl font-extrabold tracking-tight text-slate-900">{t('auth.loginTitle')}</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl border border-slate-200 border-t-4 border-t-indigo-600 bg-white p-7 shadow-md">
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          {t('auth.usernameLabel')}
          <input
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            autoComplete="username"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          {t('auth.passwordLabel')}
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            autoComplete="current-password"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="mt-2 cursor-pointer rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
        >
          {submitting ? t('auth.loggingIn') : t('auth.loginButton')}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">
        {t('auth.noAccount')}{' '}
        <Link to="/register" className="font-medium text-indigo-600 hover:underline">
          {t('auth.registerButton')}
        </Link>
      </p>
    </div>
  )
}
