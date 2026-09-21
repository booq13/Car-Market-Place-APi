import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import * as authApi from '../api/auth'
import { AUTH_LOGOUT_EVENT } from '../lib/api'
import { queryClient } from '../lib/queryClient'
import {
  clearTokens,
  getAccessToken,
  getStoredUsername,
  setTokens,
} from '../lib/tokenStorage'

interface AuthState {
  username: string | null
  isAuthenticated: boolean
}

interface AuthContextValue extends AuthState {
  login: (username: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string, password2: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const username = getStoredUsername()
    const hasToken = Boolean(getAccessToken())
    return { username: hasToken ? username : null, isAuthenticated: hasToken }
  })

  const logout = useCallback(() => {
    clearTokens()
    queryClient.clear()
    setState({ username: null, isAuthenticated: false })
  }, [])

  useEffect(() => {
    const handleForcedLogout = () => logout()
    window.addEventListener(AUTH_LOGOUT_EVENT, handleForcedLogout)
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, handleForcedLogout)
  }, [logout])

  const login = useCallback(async (username: string, password: string) => {
    const tokens = await authApi.login({ username, password })
    setTokens(tokens, username)
    setState({ username, isAuthenticated: true })
  }, [])

  const register = useCallback(
    async (username: string, email: string, password: string, password2: string) => {
      await authApi.register({ username, email, password, password2 })
      const tokens = await authApi.login({ username, password })
      setTokens(tokens, username)
      setState({ username, isAuthenticated: true })
    },
    [],
  )

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, login, register, logout }),
    [state, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
