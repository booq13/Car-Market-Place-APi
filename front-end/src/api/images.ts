import { api } from '../lib/api'
import type { CarImage } from '../types'

export async function listCarImages(carId: number | string) {
  const res = await api.get<CarImage[]>(`/cars/${carId}/images/`)
  return res.data
}

export async function uploadCarImage(carId: number | string, file: File, isMain = false) {
  const formData = new FormData()
  formData.append('image', file)
  formData.append('is_main', String(isMain))
  // Let the browser set the multipart Content-Type header itself so it
  // includes the boundary — setting it manually breaks the upload.
  const res = await api.post<CarImage>(`/cars/${carId}/images/`, formData)
  return res.data
}

export async function deleteCarImage(carId: number | string, imageId: number) {
  await api.delete(`/cars/${carId}/images/${imageId}/`)
}
