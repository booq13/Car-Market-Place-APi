import { api } from '../lib/api'
import type { AuthTokens } from '../types'

export interface RegisterPayload {
  username: string
  email: string
  password: string
  password2: string
}

export interface LoginPayload {
  username: string
  password: string
}

export async function register(payload: RegisterPayload) {
  const res = await api.post('/auth/register/', payload)
  return res.data as { username: string; email: string }
}

export async function login(payload: LoginPayload) {
  const res = await api.post<AuthTokens>('/auth/login/', payload)
  return res.data
}
