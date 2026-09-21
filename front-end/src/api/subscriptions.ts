import { api } from '../lib/api'
import type { SubscriptionStatus } from '../types'

export async function getSubscriptionStatus() {
  const res = await api.get<SubscriptionStatus>('/subscriptions/status/')
  return res.data
}

export async function createCheckoutSession() {
  const res = await api.post<{ checkout_url: string }>('/subscriptions/create-checkout/')
  return res.data
}

export async function buyDemoSubscription() {
  const res = await api.post<{ detail: string; plan: string; is_premium: boolean }>(
    '/subscriptions/buy/',
  )
  return res.data
}
