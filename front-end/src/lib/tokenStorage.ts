import type { AuthTokens } from '../types'

const ACCESS_KEY = 'carmarket.access'
const REFRESH_KEY = 'carmarket.refresh'
const USERNAME_KEY = 'carmarket.username'

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY)
}

export function getStoredUsername(): string | null {
  return localStorage.getItem(USERNAME_KEY)
}

export function setTokens(tokens: AuthTokens, username: string) {
  localStorage.setItem(ACCESS_KEY, tokens.access)
  localStorage.setItem(REFRESH_KEY, tokens.refresh)
  localStorage.setItem(USERNAME_KEY, username)
}

export function setAccessToken(access: string) {
  localStorage.setItem(ACCESS_KEY, access)
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(USERNAME_KEY)
}
