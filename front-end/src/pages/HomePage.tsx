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
import { CheckIcon, SearchIcon } from '../components/icons'
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
  const [filtersOpen, setFiltersOpen] = useState(false)

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

  const inputClass =
    'w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25'
  const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500'

  return (
    <div className="flex flex-col gap-6">
      <section className="hero-bg -mx-4 -mt-6 px-4 pb-14 pt-10 text-white sm:mx-0 sm:mt-0 sm:rounded-2xl sm:px-10 sm:pt-14">
        <h1 className="max-w-2xl text-3xl font-extrabold tracking-tight sm:text-5xl">{t('home.heroTitle')}</h1>
        <p className="mt-3 max-w-xl text-base text-slate-300">{t('home.heroSubtitle')}</p>
        <div className="relative mt-7 max-w-2xl">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            aria-label={t('home.searchPlaceholder')}
            placeholder={t('home.searchPlaceholder')}
            value={search}
            onChange={(e) => resetPageAnd(setSearch)(e.target.value)}
            className="w-full rounded-xl border-0 bg-white py-4 pl-12 pr-4 text-base text-slate-900 shadow-lg placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/40"
          />
        </div>
        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-300">
          {['home.perks1', 'home.perks2', 'home.perks3'].map((key) => (
            <li key={key} className="flex items-center gap-1.5">
              <CheckIcon className="h-4 w-4 text-indigo-400" />
              {t(key)}
            </li>
          ))}
        </ul>
      </section>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-20">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              aria-expanded={filtersOpen}
              className="flex flex-1 items-center justify-between text-left text-base font-bold text-slate-900 lg:pointer-events-none"
            >
              {t('home.filters')}
              <span aria-hidden className="mr-3 text-slate-400 lg:hidden">{filtersOpen ? '−' : '+'}</span>
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="cursor-pointer text-xs font-semibold text-indigo-600 hover:underline"
              >
                {t('home.clearFilters')}
              </button>
            )}
          </div>
          <div className={`${filtersOpen ? 'flex' : 'hidden'} flex-col gap-4 lg:flex`}>
          <div>
            <label className={labelClass}>{t('home.brandPlaceholder')}</label>
            <input
              value={brand}
              onChange={(e) => resetPageAnd(setBrand)(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <span className={labelClass}>{t('home.priceRange')}</span>
            <div className="grid grid-cols-2 gap-2">
              <input
                aria-label={t('home.priceMinPlaceholder')}
                placeholder={t('home.priceMinPlaceholder')}
                type="number"
                min={0}
                value={priceMin}
                onChange={(e) => resetPageAnd(setPriceMin)(e.target.value)}
                className={inputClass}
              />
              <input
                aria-label={t('home.priceMaxPlaceholder')}
                placeholder={t('home.priceMaxPlaceholder')}
                type="number"
                min={0}
                value={priceMax}
                onChange={(e) => resetPageAnd(setPriceMax)(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <span className={labelClass}>{t('home.yearRange')}</span>
            <div className="grid grid-cols-2 gap-2">
              <input
                aria-label={t('home.yearMinPlaceholder')}
                placeholder={t('home.yearMinPlaceholder')}
                type="number"
                min={0}
                value={yearMin}
                onChange={(e) => resetPageAnd(setYearMin)(e.target.value)}
                className={inputClass}
              />
              <input
                aria-label={t('home.yearMaxPlaceholder')}
                placeholder={t('home.yearMaxPlaceholder')}
                type="number"
                min={0}
                value={yearMax}
                onChange={(e) => resetPageAnd(setYearMax)(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          </div>
        </aside>

        <section className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-600">
              {data ? t('home.resultsCount', { count: data.count }) : t('home.title')}
            </p>
            <label className="flex items-center gap-2 text-sm text-slate-500">
              {t('home.sortBy')}
              <select
                value={ordering}
                onChange={(e) => resetPageAnd(setOrdering)(e.target.value)}
                className="cursor-pointer rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-8 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
              >
                {ORDERING_VALUES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {t(opt.labelKey)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {isLoading ? (
            <Spinner label={t('home.loading')} />
          ) : isError ? (
            <ErrorNotice message={extractErrorMessage(error, t('home.loadError'))} onRetry={refetch} />
          ) : !data || data.results.length === 0 ? (
            <EmptyState title={t('home.emptyTitle')} description={t('home.emptyDescription')} />
          ) : (
            <>
              <div
                className={`grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 ${isFetching ? 'opacity-60' : ''}`}
              >
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
        </section>
      </div>
    </div>
  )
}
