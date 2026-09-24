import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { deleteCar, getCar } from '../api/cars'
import { listCarImages } from '../api/images'
import { Spinner } from '../components/Spinner'
import { ErrorNotice } from '../components/ErrorNotice'
import { ReviewsSection } from '../components/ReviewsSection'
import { useAuth } from '../context/AuthContext'
import { useFavorites } from '../hooks/useFavorites'
import { useLanguage } from '../i18n/LanguageContext'
import { extractErrorMessage } from '../lib/api'
import { formatMileage, formatPrice } from '../lib/format'
import { CalendarIcon, GaugeIcon, UserIcon } from '../components/icons'

export function CarDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const carId = Number(id)
  const { isAuthenticated, username } = useAuth()
  const { t, language } = useLanguage()
  const favorites = useFavorites()
  const navigate = useNavigate()
  const [activeImage, setActiveImage] = useState(0)
  const [failedImageIds, setFailedImageIds] = useState<Set<number>>(new Set())

  function markImageFailed(imageId: number) {
    setFailedImageIds((prev) => new Set(prev).add(imageId))
  }

  const carQuery = useQuery({
    queryKey: ['car', carId],
    queryFn: () => getCar(carId),
    enabled: Number.isFinite(carId),
  })

  const imagesQuery = useQuery({
    queryKey: ['car-images', carId],
    queryFn: () => listCarImages(carId),
    enabled: Number.isFinite(carId),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteCar(carId),
    onSuccess: () => {
      toast.success(t('carDetails.deleteSuccess'))
      navigate('/my-listings')
    },
    onError: (error) => toast.error(extractErrorMessage(error, t('carDetails.deleteError'))),
  })

  if (carQuery.isLoading) return <Spinner label={t('listing.loading')} />
  if (carQuery.isError || !carQuery.data) {
    return (
      <ErrorNotice
        message={extractErrorMessage(carQuery.error, t('listing.notFound'))}
        onRetry={() => carQuery.refetch()}
      />
    )
  }

  const car = carQuery.data
  const images = (imagesQuery.data ?? []).filter((img) => !failedImageIds.has(img.id))
  const isOwner = isAuthenticated && username === car.owner
  const cover = images[activeImage] ?? images[0]

  return (
    <div className="flex flex-col gap-6">
      <Link to="/" className="text-sm font-medium text-slate-500 hover:text-indigo-600">
        ← {t('nav.catalog')}
      </Link>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div className="aspect-[4/3] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-200 shadow-sm">
            {cover ? (
              <img
                src={cover.image_url}
                alt={`${car.brand} ${car.model}`}
                className="h-full w-full object-cover"
                onError={() => markImageFailed(cover.id)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-5xl font-semibold text-slate-300">
                {car.brand.slice(0, 1)}
                {car.model.slice(0, 1)}
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(idx)}
                  className={`h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 ${
                    idx === activeImage ? 'border-indigo-600' : 'border-transparent'
                  }`}
                >
                  <img
                    src={img.image_url}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={() => markImageFailed(img.id)}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                {car.brand} {car.model}
              </h1>
              {car.is_vip && (
                <span className="rounded-full bg-amber-400 px-2.5 py-1 text-xs font-bold uppercase text-amber-950">
                  VIP
                </span>
              )}
              {!car.is_active && (
                <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600">
                  {t('common.inactive')}
                </span>
              )}
            </div>
          </div>

          <p className="text-4xl font-extrabold tracking-tight text-slate-900">{formatPrice(car.price, language)}</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
              <CalendarIcon className="h-6 w-6 text-indigo-600" />
              <span className="font-semibold text-slate-800">{car.year}</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
              <GaugeIcon className="h-6 w-6 text-indigo-600" />
              <span className="font-semibold text-slate-800">{formatMileage(car.mileage, language)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-slate-500">
                <UserIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">{t('carDetails.sellerLabel')}</p>
                <p className="font-semibold text-slate-800">{car.owner ?? t('common.unknown')}</p>
              </div>
            </div>
            {isAuthenticated && !isOwner && (
              <button
                onClick={() => favorites.toggle(car.id)}
                disabled={favorites.isBusy}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
              >
                {favorites.isFavorite(car.id) ? t('favorites.inFavorites') : t('favorites.addToFavorites')}
              </button>
            )}
          </div>

          <div>
            <h2 className="mb-1 text-sm font-semibold text-slate-700">{t('carDetails.description')}</h2>
            <p className="whitespace-pre-line text-sm text-slate-600">
              {car.description || t('carDetails.noDescription')}
            </p>
          </div>

          {isOwner && (
            <div className="flex gap-2">
              <Link
                to={`/listings/${car.id}/edit`}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                {t('carDetails.editListing')}
              </Link>
              <button
                onClick={() => {
                  if (confirm(t('carDetails.confirmDelete'))) deleteMutation.mutate()
                }}
                disabled={deleteMutation.isPending}
                className="rounded-lg border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60"
              >
                {deleteMutation.isPending ? t('common.deleting') : t('common.delete')}
              </button>
            </div>
          )}
        </div>
      </div>

      {car.owner_id != null ? (
        <ReviewsSection sellerId={car.owner_id} sellerUsername={car.owner} />
      ) : (
        <p className="text-sm text-slate-400">{t('carDetails.noSellerInfo')}</p>
      )}
    </div>
  )
}
