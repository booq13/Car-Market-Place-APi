import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { Car } from '../types'
import { listCarImages } from '../api/images'
import { useLanguage } from '../i18n/LanguageContext'
import { formatMileage, formatPrice } from '../lib/format'

interface CarCardProps {
  car: Car
  isFavorite?: boolean
  onToggleFavorite?: () => void
  favoriteBusy?: boolean
}

export function CarCard({ car, isFavorite, onToggleFavorite, favoriteBusy }: CarCardProps) {
  const { t, language } = useLanguage()
  const { data: images } = useQuery({
    queryKey: ['car-images', car.id],
    queryFn: () => listCarImages(car.id),
    staleTime: 5 * 60_000,
  })
  const [imageFailed, setImageFailed] = useState(false)

  const cover = images?.find((img) => img.is_main) ?? images?.[0]
  const showCover = cover && !imageFailed

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <Link to={`/cars/${car.id}`} className="block">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
          {showCover ? (
            <img
              src={cover.image_url}
              alt={`${car.brand} ${car.model}`}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              loading="lazy"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-slate-300">
              {car.brand.slice(0, 1)}
              {car.model.slice(0, 1)}
            </div>
          )}
          {car.is_vip && (
            <span className="absolute left-2 top-2 rounded-full bg-amber-400 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-amber-950 shadow">
              VIP
            </span>
          )}
          {!car.is_active && (
            <span className="absolute bottom-2 left-2 rounded-full bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-white">
              {t('common.inactive')}
            </span>
          )}
          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.preventDefault()
                onToggleFavorite()
              }}
              disabled={favoriteBusy}
              aria-label={isFavorite ? t('favorites.remove') : t('favorites.add')}
              className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-lg shadow transition hover:bg-white disabled:opacity-50"
            >
              {isFavorite ? '❤️' : '🤍'}
            </button>
          )}
        </div>
      </Link>

      <Link to={`/cars/${car.id}`} className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="truncate text-base font-semibold text-slate-900">
          {car.brand} {car.model}
        </h3>
        <p className="text-sm text-slate-500">
          {car.year} · {formatMileage(car.mileage, language)}
        </p>
        <p className="mt-2 text-lg font-bold text-indigo-600">{formatPrice(car.price, language)}</p>
        {car.owner && (
          <p className="mt-auto pt-2 text-xs text-slate-400">
            {t('common.sellerLabel')}: {car.owner}
          </p>
        )}
      </Link>
    </div>
  )
}
