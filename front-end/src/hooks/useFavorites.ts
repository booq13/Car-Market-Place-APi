import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { addFavorite, listAllFavorites, removeFavorite } from '../api/favorites'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'
import { extractErrorMessage } from '../lib/api'

export function useFavorites() {
  const { isAuthenticated } = useAuth()
  const { t } = useLanguage()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['favorites-all'],
    queryFn: listAllFavorites,
    enabled: isAuthenticated,
    staleTime: 30_000,
  })

  const favoriteIdByCarId = new Map<number, number>()
  for (const fav of query.data ?? []) {
    favoriteIdByCarId.set(fav.car, fav.id)
  }

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['favorites-all'] })

  const addMutation = useMutation({
    mutationFn: addFavorite,
    onSuccess: () => {
      invalidate()
      toast.success(t('favorites.addedToast'))
    },
    onError: (error) => toast.error(extractErrorMessage(error, t('favorites.addError'))),
  })

  const removeMutation = useMutation({
    mutationFn: removeFavorite,
    onSuccess: () => {
      invalidate()
      toast.success(t('favorites.removedToast'))
    },
    onError: (error) => toast.error(extractErrorMessage(error, t('favorites.removeError'))),
  })

  function toggle(carId: number) {
    const favoriteId = favoriteIdByCarId.get(carId)
    if (favoriteId) {
      removeMutation.mutate(favoriteId)
    } else {
      addMutation.mutate(carId)
    }
  }

  return {
    favoriteIdByCarId,
    isFavorite: (carId: number) => favoriteIdByCarId.has(carId),
    toggle,
    isBusy: addMutation.isPending || removeMutation.isPending,
    isLoading: query.isLoading,
  }
}
