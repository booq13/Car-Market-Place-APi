import { useQuery } from '@tanstack/react-query'
import { getProfile } from '../api/profile'
import { useAuth } from '../context/AuthContext'

export function useProfile() {
  const { isAuthenticated } = useAuth()
  return useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
    enabled: isAuthenticated,
    staleTime: 60_000,
  })
}
