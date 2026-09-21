import { api } from '../lib/api'
import type { Favorite, Paginated } from '../types'

export async function listFavorites(page = 1) {
  const res = await api.get<Paginated<Favorite>>('/favorites/', { params: { page } })
  return res.data
}

export async function listAllFavorites(): Promise<Favorite[]> {
  const all: Favorite[] = []
  // Favorites are paginated server-side; walk every page so the client
  // always has the full "is this car favorited" picture.
  for (let page = 1; ; page += 1) {
    const data = await listFavorites(page)
    all.push(...data.results)
    if (!data.next) break
  }
  return all
}

export async function addFavorite(carId: number) {
  const res = await api.post<Favorite>('/favorites/', { car: carId })
  return res.data
}

export async function removeFavorite(favoriteId: number) {
  await api.delete(`/favorites/${favoriteId}/`)
}
