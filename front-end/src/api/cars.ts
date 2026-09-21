import { api } from '../lib/api'
import type { Car, CarPayload, Paginated } from '../types'

export const CARS_PAGE_SIZE = 12

export interface CarListParams {
  search?: string
  brand?: string
  price_min?: number
  price_max?: number
  year_min?: number
  year_max?: number
  ordering?: string
  page?: number
}

function cleanParams(params: CarListParams) {
  const entries = Object.entries(params).filter(
    ([, value]) => value !== undefined && value !== '' && value !== null,
  )
  return Object.fromEntries(entries)
}

export async function listCars(params: CarListParams = {}) {
  const res = await api.get<Paginated<Car>>('/cars/', { params: cleanParams(params) })
  return res.data
}

export async function listAllCars(): Promise<Car[]> {
  const all: Car[] = []
  // The API has no "owner" filter, so listing "my cars" requires walking
  // every page and filtering client-side.
  for (let page = 1; ; page += 1) {
    const data = await listCars({ page })
    all.push(...data.results)
    if (!data.next) break
  }
  return all
}

export async function getCar(id: number | string) {
  const res = await api.get<Car>(`/cars/${id}/`)
  return res.data
}

export async function createCar(payload: CarPayload) {
  const res = await api.post<Car>('/cars/', payload)
  return res.data
}

export async function updateCar(id: number | string, payload: Partial<CarPayload>) {
  const res = await api.patch<Car>(`/cars/${id}/`, payload)
  return res.data
}

export async function deleteCar(id: number | string) {
  await api.delete(`/cars/${id}/`)
}
