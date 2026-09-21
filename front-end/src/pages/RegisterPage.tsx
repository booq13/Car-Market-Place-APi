import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'
import { extractErrorMessage } from '../lib/api'

export function RegisterPage() {
  const { register } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (password !== password2) {
      toast.error(t('auth.passwordMismatch'))
      return
    }
    if (password.length < 8) {
      toast.error(t('auth.passwordTooShort'))
      return
    }
    setSubmitting(true)
    try {
      await register(username, email, password, password2)
      toast.success(t('auth.registerSuccess'))
      navigate('/', { replace: true })
    } catch (error) {
      toast.error(extractErrorMessage(error, t('auth.registerError')))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">{t('auth.registerTitle')}</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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
          {t('auth.emailLabel')}
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            autoComplete="email"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          {t('auth.passwordLabel')}
          <input
            required
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            autoComplete="new-password"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          {t('auth.password2Label')}
          <input
            required
            type="password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            autoComplete="new-password"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
        >
          {submitting ? t('auth.registering') : t('auth.registerButton')}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">
        {t('auth.hasAccount')}{' '}
        <Link to="/login" className="font-medium text-indigo-600 hover:underline">
          {t('auth.loginButton')}
        </Link>
      </p>
    </div>
  )
}
