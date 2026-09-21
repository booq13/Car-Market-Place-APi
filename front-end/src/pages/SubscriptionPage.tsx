import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { buyDemoSubscription, createCheckoutSession } from '../api/subscriptions'
import { Spinner } from '../components/Spinner'
import { ErrorNotice } from '../components/ErrorNotice'
import { useSubscriptionStatus } from '../hooks/useSubscriptionStatus'
import { useLanguage } from '../i18n/LanguageContext'
import { extractErrorMessage } from '../lib/api'
import { formatDate } from '../lib/format'

const STATUS_KEYS: Record<string, string> = {
  active: 'subscription.statusActive',
  cancelled: 'subscription.statusCancelled',
}

export function SubscriptionPage() {
  const { data: status, isLoading, isError, error, refetch } = useSubscriptionStatus()
  const { t, language } = useLanguage()
  const queryClient = useQueryClient()

  const refreshAfterChange = () => {
    queryClient.invalidateQueries({ queryKey: ['subscription-status'] })
    queryClient.invalidateQueries({ queryKey: ['profile'] })
  }

  const checkoutMutation = useMutation({
    mutationFn: createCheckoutSession,
    onSuccess: (data) => {
      window.location.href = data.checkout_url
    },
    onError: (err) => toast.error(extractErrorMessage(err, t('subscription.stripeNotConfigured'))),
  })

  const demoMutation = useMutation({
    mutationFn: buyDemoSubscription,
    onSuccess: (data) => {
      toast.success(data.detail)
      refreshAfterChange()
    },
    onError: (err) => toast.error(extractErrorMessage(err, t('subscription.activateError'))),
  })

  if (isLoading) return <Spinner label={t('subscription.loading')} />
  if (isError || !status) {
    return <ErrorNotice message={extractErrorMessage(error, t('subscription.loadError'))} onRetry={refetch} />
  }

  const statusLabel = STATUS_KEYS[status.status] ? t(STATUS_KEYS[status.status]) : status.status

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <h1 className="text-2xl font-bold text-slate-900">{t('subscription.title')}</h1>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">{t('subscription.currentPlan')}</p>
            <p className="text-xl font-bold text-slate-900">
              {status.plan === 'premium' ? 'Premium' : 'Free'}
            </p>
          </div>
          {status.plan === 'premium' && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase text-amber-700">Premium</span>
          )}
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-slate-400">{t('subscription.status')}</dt>
            <dd className="font-medium text-slate-700">{statusLabel}</dd>
          </div>
          <div>
            <dt className="text-slate-400">{t('subscription.expiresAt')}</dt>
            <dd className="font-medium text-slate-700">
              {status.expires_at ? formatDate(status.expires_at, language) : t('subscription.noExpiry')}
            </dd>
          </div>
          <div>
            <dt className="text-slate-400">{t('subscription.activeListings')}</dt>
            <dd className="font-medium text-slate-700">{status.active_listings_count}</dd>
          </div>
          <div>
            <dt className="text-slate-400">{t('subscription.listingLimit')}</dt>
            <dd className="font-medium text-slate-700">
              {status.max_active_listings != null ? status.max_active_listings : t('subscription.noLimit')}
            </dd>
          </div>
        </dl>
      </div>

      {status.plan !== 'premium' && (
        <div className="flex flex-col gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 p-6">
          <h2 className="text-lg font-semibold text-indigo-900">{t('subscription.upgradeTitle')}</h2>
          <ul className="list-inside list-disc text-sm text-indigo-800">
            <li>{t('subscription.benefitUnlimited')}</li>
            <li>{t('subscription.benefitVip')}</li>
          </ul>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => checkoutMutation.mutate()}
              disabled={checkoutMutation.isPending}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {checkoutMutation.isPending ? t('subscription.creatingSession') : t('subscription.payWithStripe')}
            </button>
            <button
              onClick={() => demoMutation.mutate()}
              disabled={demoMutation.isPending}
              className="rounded-lg border border-indigo-300 bg-white px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-60"
            >
              {demoMutation.isPending ? t('subscription.activating') : t('subscription.demoActivate')}
            </button>
          </div>
          <p className="text-xs text-indigo-500">{t('subscription.demoNote')}</p>
        </div>
      )}
    </div>
  )
}
