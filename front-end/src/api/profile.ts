import { api } from '../lib/api'
import type { Profile } from '../types'

export async function getProfile() {
  const res = await api.get<Profile>('/profile/')
  return res.data
}

export interface ProfileUpdatePayload {
  phone?: string
  city?: string
  avatar?: File | null
}

export async function updateProfile(payload: ProfileUpdatePayload) {
  if (payload.avatar) {
    const formData = new FormData()
    if (payload.phone !== undefined) formData.append('phone', payload.phone)
    if (payload.city !== undefined) formData.append('city', payload.city)
    formData.append('avatar', payload.avatar)
    // Let the browser set the multipart Content-Type header itself so it
    // includes the boundary — setting it manually breaks the upload.
    const res = await api.put<Profile>('/profile/', formData)
    return res.data
  }

  const res = await api.put<Profile>('/profile/', {
    phone: payload.phone,
    city: payload.city,
  })
  return res.data
}
