import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CARS_PAGE_SIZE, listCars } from '../api/cars'
import { CarCard } from '../components/CarCard'
import { Spinner } from '../components/Spinner'
import { ErrorNotice } from '../components/ErrorNotice'
import { EmptyState } from '../components/EmptyState'
import { Pagination } from '../components/Pagination'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useFavorites } from '../hooks/useFavorites'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'
import { extractErrorMessage } from '../lib/api'

const ORDERING_VALUES = [
  { value: '', labelKey: 'home.ordering.default' },
  { value: '-id', labelKey: 'home.ordering.newest' },
  { value: 'id', labelKey: 'home.ordering.oldest' },
  { value: 'price', labelKey: 'home.ordering.priceAsc' },
  { value: '-price', labelKey: 'home.ordering.priceDesc' },
  { value: '-year', labelKey: 'home.ordering.yearDesc' },
  { value: 'year', labelKey: 'home.ordering.yearAsc' },
] as const

export function HomePage() {
  const { isAuthenticated } = useAuth()
  const { t } = useLanguage()
  const favorites = useFavorites()

  const [search, setSearch] = useState('')
  const [brand, setBrand] = useState('')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [yearMin, setYearMin] = useState('')
  const [yearMax, setYearMax] = useState('')
  const [ordering, setOrdering] = useState('')
  const [page, setPage] = useState(1)

  const debouncedSearch = useDebouncedValue(search)
  const debouncedBrand = useDebouncedValue(brand)
  const debouncedPriceMin = useDebouncedValue(priceMin)
  const debouncedPriceMax = useDebouncedValue(priceMax)
  const debouncedYearMin = useDebouncedValue(yearMin)
  const debouncedYearMax = useDebouncedValue(yearMax)

  const filters = {
    search: debouncedSearch || undefined,
    brand: debouncedBrand || undefined,
    price_min: debouncedPriceMin ? Number(debouncedPriceMin) : undefined,
    price_max: debouncedPriceMax ? Number(debouncedPriceMax) : undefined,
    year_min: debouncedYearMin ? Number(debouncedYearMin) : undefined,
    year_max: debouncedYearMax ? Number(debouncedYearMax) : undefined,
    ordering: ordering || undefined,
  }

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['cars', filters, page],
    queryFn: () => listCars({ ...filters, page }),
    placeholderData: (prev) => prev,
  })

  function resetPageAnd<T>(setter: (v: T) => void) {
    return (v: T) => {
      setPage(1)
      setter(v)
    }
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.count / CARS_PAGE_SIZE)) : 1
  const hasActiveFilters = Boolean(
    search || brand || priceMin || priceMax || yearMin || yearMax || ordering,
  )

  function clearFilters() {
    setSearch('')
    setBrand('')
    setPriceMin('')
    setPriceMax('')
    setYearMin('')
    setYearMax('')
    setOrdering('')
    setPage(1)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('home.title')}</h1>
        <p className="text-sm text-slate-500">{t('home.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <input
          placeholder={t('home.searchPlaceholder')}
          value={search}
          onChange={(e) => resetPageAnd(setSearch)(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 lg:col-span-2"
        />
        <input
          placeholder={t('home.brandPlaceholder')}
          value={brand}
          onChange={(e) => resetPageAnd(setBrand)(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <select
          value={ordering}
          onChange={(e) => resetPageAnd(setOrdering)(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {ORDERING_VALUES.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {t(opt.labelKey)}
            </option>
          ))}
        </select>
        <input
          placeholder={t('home.priceMinPlaceholder')}
          type="number"
          min={0}
          value={priceMin}
          onChange={(e) => resetPageAnd(setPriceMin)(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <input
          placeholder={t('home.priceMaxPlaceholder')}
          type="number"
          min={0}
          value={priceMax}
          onChange={(e) => resetPageAnd(setPriceMax)(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <input
          placeholder={t('home.yearMinPlaceholder')}
          type="number"
          min={0}
          value={yearMin}
          onChange={(e) => resetPageAnd(setYearMin)(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <input
          placeholder={t('home.yearMaxPlaceholder')}
          type="number"
          min={0}
          value={yearMax}
          onChange={(e) => resetPageAnd(setYearMax)(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            {t('home.clearFilters')}
          </button>
        )}
      </div>

      {isLoading ? (
        <Spinner label={t('home.loading')} />
      ) : isError ? (
        <ErrorNotice message={extractErrorMessage(error, t('home.loadError'))} onRetry={refetch} />
      ) : !data || data.results.length === 0 ? (
        <EmptyState title={t('home.emptyTitle')} description={t('home.emptyDescription')} />
      ) : (
        <>
          <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${isFetching ? 'opacity-60' : ''}`}>
            {data.results.map((car) => (
              <CarCard
                key={car.id}
                car={car}
                isFavorite={isAuthenticated ? favorites.isFavorite(car.id) : undefined}
                onToggleFavorite={isAuthenticated ? () => favorites.toggle(car.id) : undefined}
                favoriteBusy={favorites.isBusy}
              />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </div>
  )
}
