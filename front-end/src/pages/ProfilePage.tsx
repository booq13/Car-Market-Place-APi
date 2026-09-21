import { type FormEvent, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { updateProfile } from '../api/profile'
import { RatingStars } from '../components/RatingStars'
import { Spinner } from '../components/Spinner'
import { ErrorNotice } from '../components/ErrorNotice'
import { useProfile } from '../hooks/useProfile'
import { useLanguage } from '../i18n/LanguageContext'
import { extractErrorMessage } from '../lib/api'

export function ProfilePage() {
  const { data: profile, isLoading, isError, error, refetch } = useProfile()
  const { t } = useLanguage()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [hydrated, setHydrated] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<{ url: string; name: string } | null>(null)

  if (profile && !hydrated) {
    setPhone(profile.phone ?? '')
    setCity(profile.city ?? '')
    setHydrated(true)
  }

  // Revoke the object URL whenever it's replaced or the component unmounts,
  // so we don't leak memory across repeated selections.
  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview.url)
    }
  }, [avatarPreview])

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(['profile'], data)
      toast.success(t('profile.updateSuccess'))
      setAvatarPreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    },
    onError: (err) => toast.error(extractErrorMessage(err, t('profile.updateError'))),
  })

  function handleAvatarSelected(file: File | undefined) {
    if (!file) {
      setAvatarPreview(null)
      return
    }
    setAvatarPreview({ url: URL.createObjectURL(file), name: file.name })
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const avatar = fileInputRef.current?.files?.[0] ?? null
    mutation.mutate({ phone, city, avatar })
  }

  if (isLoading) return <Spinner label={t('profile.loading')} />
  if (isError || !profile) {
    return <ErrorNotice message={extractErrorMessage(error, t('profile.loadError'))} onRetry={refetch} />
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <h1 className="text-2xl font-bold text-slate-900">{t('profile.title')}</h1>

      <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {avatarPreview || profile.avatar ? (
          <img
            src={avatarPreview?.url ?? profile.avatar ?? undefined}
            alt=""
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-xl font-semibold text-indigo-700">
            {profile.username.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-lg font-semibold text-slate-900">{profile.username}</p>
          <p className="text-sm text-slate-500">{profile.email}</p>
          <div className="mt-1 flex items-center gap-2">
            {profile.is_premium ? (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold uppercase text-amber-700">Premium</span>
            ) : (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">Free</span>
            )}
            {profile.avg_rating != null && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <RatingStars value={profile.avg_rating} /> {profile.avg_rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          {t('profile.phone')}
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+380000000000"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          {t('profile.city')}
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </label>
        <div className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          {t('profile.avatar')}
          <div className="flex items-center gap-3">
            <label className="cursor-pointer self-start rounded-lg bg-slate-100 px-4 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200">
              {avatarPreview ? t('profile.chooseAnotherFile') : t('profile.chooseFile')}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleAvatarSelected(e.target.files?.[0])}
              />
            </label>
            {avatarPreview && <span className="truncate text-xs text-slate-500">{avatarPreview.name}</span>}
          </div>
        </div>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="mt-2 self-start rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          {mutation.isPending ? t('common.saving') : t('common.saveChanges')}
        </button>
      </form>

      <Link
        to="/subscription"
        className="inline-flex items-center gap-1.5 self-start rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
      >
        {t('profile.manageSubscription')}
        <span aria-hidden>→</span>
      </Link>
    </div>
  )
}
