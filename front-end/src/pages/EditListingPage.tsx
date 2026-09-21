import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getCar, updateCar } from '../api/cars'
import { CarForm } from '../components/CarForm'
import { ImageManager } from '../components/ImageManager'
import { Spinner } from '../components/Spinner'
import { ErrorNotice } from '../components/ErrorNotice'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useLanguage } from '../i18n/LanguageContext'
import { extractErrorMessage } from '../lib/api'
import type { CarPayload } from '../types'

export function EditListingPage() {
  const { id } = useParams<{ id: string }>()
  const carId = Number(id)
  const { username } = useAuth()
  const { data: profile } = useProfile()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const carQuery = useQuery({
    queryKey: ['car', carId],
    queryFn: () => getCar(carId),
    enabled: Number.isFinite(carId),
  })

  const mutation = useMutation({
    mutationFn: (payload: CarPayload) => updateCar(carId, payload),
    onSuccess: (car) => {
      queryClient.setQueryData(['car', carId], car)
      toast.success(t('listing.saveSuccess'))
      navigate(`/cars/${carId}`)
    },
    onError: (error) => toast.error(extractErrorMessage(error, t('listing.saveError'))),
  })

  if (carQuery.isLoading) return <Spinner label={t('listing.loading')} />
  if (carQuery.isError || !carQuery.data) {
    return <ErrorNotice message={extractErrorMessage(carQuery.error, t('listing.notFound'))} onRetry={() => carQuery.refetch()} />
  }

  const car = carQuery.data

  if (car.owner !== username) {
    return <ErrorNotice message={t('listing.notOwner')} />
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{t('listing.editTitle')}</h1>
        <Link to={`/cars/${car.id}`} className="text-sm font-medium text-indigo-600 hover:underline">
          {t('listing.viewListing')}
        </Link>
      </div>

      <CarForm
        initial={car}
        isPremium={profile?.is_premium ?? false}
        submitting={mutation.isPending}
        submitLabel={t('common.saveChanges')}
        onSubmit={(payload) => mutation.mutate(payload)}
      />

      <ImageManager carId={car.id} />
    </div>
  )
}
