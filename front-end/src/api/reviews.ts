import { api } from '../lib/api'
import type { Paginated, Review, ReviewPayload } from '../types'

export async function listReviews(sellerId: number, page = 1) {
  const res = await api.get<Paginated<Review>>('/reviews/', {
    params: { seller: sellerId, page },
  })
  return res.data
}

export async function listAllReviews(sellerId: number): Promise<Review[]> {
  const all: Review[] = []
  for (let page = 1; ; page += 1) {
    const data = await listReviews(sellerId, page)
    all.push(...data.results)
    if (!data.next) break
  }
  return all
}

export async function createReview(payload: ReviewPayload) {
  const res = await api.post<Review>('/reviews/', payload)
  return res.data
}

export async function updateReview(id: number, payload: Partial<Pick<ReviewPayload, 'rating' | 'comment'>>) {
  const res = await api.patch<Review>(`/reviews/${id}/`, payload)
  return res.data
}

export async function deleteReview(id: number) {
  await api.delete(`/reviews/${id}/`)
}
