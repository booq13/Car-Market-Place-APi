import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listAllCars } from '../api/cars'
import { CarCard } from '../components/CarCard'
import { Spinner } from '../components/Spinner'
import { ErrorNotice } from '../components/ErrorNotice'
import { EmptyState } from '../components/EmptyState'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'
import { useSubscriptionStatus } from '../hooks/useSubscriptionStatus'
import { extractErrorMessage } from '../lib/api'

export function MyListingsPage() {
  const { username } = useAuth()
  const { t } = useLanguage()
  const carsQuery = useQuery({ queryKey: ['cars-all'], queryFn: listAllCars })
  const { data: status } = useSubscriptionStatus()

  if (carsQuery.isLoading) return <Spinner label={t('myListings.loading')} />
  if (carsQuery.isError) {
    return <ErrorNotice message={extractErrorMessage(carsQuery.error, t('common.genericError'))} onRetry={() => carsQuery.refetch()} />
  }

  const myCars = (carsQuery.data ?? []).filter((car) => car.owner === username)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{t('myListings.title')}</h1>
          {status && (
            <p className="text-sm text-slate-500">
              {t('myListings.activeCount', { count: status.active_listings_count })}
              {status.max_active_listings != null
                ? t('myListings.ofMax', { max: status.max_active_listings })
                : t('myListings.unlimitedPremium')}
            </p>
          )}
        </div>
        <Link
          to="/listings/new"
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
        >
          {t('nav.addCar')}
        </Link>
      </div>

      {myCars.length === 0 ? (
        <EmptyState
          title={t('myListings.emptyTitle')}
          description={t('myListings.emptyDescription')}
          action={
            <Link to="/listings/new" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
              {t('listing.createListing')}
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {myCars.map((car) => (
            <CarCard key={car.id} car={car} />
          ))}
        </div>
      )}
    </div>
  )
}
