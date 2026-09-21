import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { createCar } from '../api/cars'
import { CarForm } from '../components/CarForm'
import { useProfile } from '../hooks/useProfile'
import { useLanguage } from '../i18n/LanguageContext'
import { extractErrorMessage } from '../lib/api'
import type { CarPayload } from '../types'

export function NewListingPage() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { data: profile } = useProfile()

  const mutation = useMutation({
    mutationFn: (payload: CarPayload) => createCar(payload),
    onSuccess: (car) => {
      toast.success(t('listing.createSuccess'))
      navigate(`/listings/${car.id}/edit`)
    },
    onError: (error) => toast.error(extractErrorMessage(error, t('listing.createError'))),
  })

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">{t('listing.newTitle')}</h1>
      <CarForm
        isPremium={profile?.is_premium ?? false}
        submitting={mutation.isPending}
        submitLabel={t('listing.createListing')}
        onSubmit={(payload) => mutation.mutate(payload)}
      />
    </div>
  )
}
