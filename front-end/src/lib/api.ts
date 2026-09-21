import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
} from './tokenStorage'

export const AUTH_LOGOUT_EVENT = 'carmarket:auth-logout'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api',
})

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken()
  if (!refresh) return null

  if (!refreshPromise) {
    refreshPromise = axios
      .post<{ access: string }>(
        `${api.defaults.baseURL}/auth/refresh/`,
        { refresh },
      )
      .then((res) => {
        setAccessToken(res.data.access)
        return res.data.access
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined
    const status = error.response?.status
    const url = config?.url ?? ''

    const isAuthEndpoint = url.includes('/auth/login/') || url.includes('/auth/refresh/')

    if (status === 401 && config && !config._retry && !isAuthEndpoint) {
      config._retry = true
      const newAccess = await refreshAccessToken()
      if (newAccess) {
        config.headers = config.headers ?? {}
        config.headers.Authorization = `Bearer ${newAccess}`
        return api(config)
      }
      clearTokens()
      window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT))
    }

    return Promise.reject(error)
  },
)

export function extractErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data
    if (data) {
      if (typeof data.detail === 'string') return data.detail
      if (typeof data.error === 'string') return data.error
      if (typeof data === 'string') return data
      const firstField = Object.keys(data)[0]
      if (firstField) {
        const value = (data as Record<string, unknown>)[firstField]
        const message = Array.isArray(value) ? value[0] : value
        if (typeof message === 'string') {
          return firstField === 'non_field_errors' ? message : `${firstField}: ${message}`
        }
      }
    }
    if (error.message) return error.message
  }
  return fallback
}
