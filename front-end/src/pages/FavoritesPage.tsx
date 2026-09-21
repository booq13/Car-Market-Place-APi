import { Link } from 'react-router-dom'
import { useQueries } from '@tanstack/react-query'
import { getCar } from '../api/cars'
import { CarCard } from '../components/CarCard'
import { Spinner } from '../components/Spinner'
import { EmptyState } from '../components/EmptyState'
import { useFavorites } from '../hooks/useFavorites'
import { useLanguage } from '../i18n/LanguageContext'

export function FavoritesPage() {
  const { t } = useLanguage()
  const favorites = useFavorites()
  const carIds = [...favorites.favoriteIdByCarId.keys()]

  const carQueries = useQueries({
    queries: carIds.map((carId) => ({
      queryKey: ['car', carId],
      queryFn: () => getCar(carId),
    })),
  })

  const isLoading = favorites.isLoading || carQueries.some((q) => q.isLoading)
  const cars = carQueries.map((q) => q.data).filter((car) => car !== undefined)

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-slate-900">{t('nav.favorites')}</h1>

      {isLoading ? (
        <Spinner label={t('favorites.loading')} />
      ) : cars.length === 0 ? (
        <EmptyState
          title={t('favorites.emptyTitle')}
          description={t('favorites.emptyDescription')}
          action={
            <Link to="/" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
              {t('favorites.goToCatalog')}
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cars.map((car) => (
            <CarCard
              key={car.id}
              car={car}
              isFavorite
              onToggleFavorite={() => favorites.toggle(car.id)}
              favoriteBusy={favorites.isBusy}
            />
          ))}
        </div>
      )}
    </div>
  )
}
