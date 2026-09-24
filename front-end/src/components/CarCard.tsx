import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { Car } from '../types'
import { listCarImages } from '../api/images'
import { useLanguage } from '../i18n/LanguageContext'
import { formatMileage, formatPrice } from '../lib/format'
import { CalendarIcon, GaugeIcon, HeartIcon, UserIcon } from './icons'

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
    <div
      className={`group relative flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        car.is_vip ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200'
      }`}
    >
      <Link to={`/cars/${car.id}`} className="block">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-200">
          {showCover ? (
            <img
              src={cover.image_url}
              alt={`${car.brand} ${car.model}`}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              loading="lazy"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 text-4xl font-bold tracking-tight text-slate-400">
              {car.brand.slice(0, 1)}
              {car.model.slice(0, 1)}
            </div>
          )}
          {car.is_vip && (
            <span className="absolute left-0 top-3 rounded-r bg-amber-400 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-amber-950 shadow">
              VIP
            </span>
          )}
          {!car.is_active && (
            <span className="absolute bottom-2 left-2 rounded bg-slate-900/80 px-2 py-0.5 text-xs font-medium text-white">
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
              className={`absolute right-2.5 top-2.5 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white shadow transition hover:scale-110 disabled:opacity-50 ${
                isFavorite ? 'text-indigo-600' : 'text-slate-500'
              }`}
            >
              <HeartIcon filled={isFavorite} className="h-5 w-5" />
            </button>
          )}
        </div>
      </Link>

      <Link to={`/cars/${car.id}`} className="flex flex-1 flex-col p-4">
        <p className="text-xl font-extrabold tracking-tight text-slate-900">{formatPrice(car.price, language)}</p>
        <h3 className="mt-1 truncate text-[15px] font-semibold text-slate-800 group-hover:text-indigo-600">
          {car.brand} {car.model}
        </h3>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-slate-100 pt-3 text-[13px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <CalendarIcon className="h-4 w-4 text-slate-400" />
            {car.year}
          </span>
          <span className="flex items-center gap-1.5">
            <GaugeIcon className="h-4 w-4 text-slate-400" />
            {formatMileage(car.mileage, language)}
          </span>
          {car.owner && (
            <span className="flex min-w-0 items-center gap-1.5">
              <UserIcon className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="truncate">{car.owner}</span>
            </span>
          )}
        </div>
      </Link>
    </div>
  )
}
