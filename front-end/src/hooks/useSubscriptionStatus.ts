import { useQuery } from '@tanstack/react-query'
import { getSubscriptionStatus } from '../api/subscriptions'
import { useAuth } from '../context/AuthContext'

export function useSubscriptionStatus() {
  const { isAuthenticated } = useAuth()
  return useQuery({
    queryKey: ['subscription-status'],
    queryFn: getSubscriptionStatus,
    enabled: isAuthenticated,
    staleTime: 30_000,
  })
}
