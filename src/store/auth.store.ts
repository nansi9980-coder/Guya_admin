import { create } from 'zustand'
import { authApi } from '@/api'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  isInitialized: boolean
  error: string | null
  login: (credentials: { email: string; password: string }) => Promise<void>
  logout: () => Promise<void>
  initialize: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: localStorage.getItem('accessToken'),
  isAuthenticated: !!localStorage.getItem('accessToken'),
  isLoading: false,
  isInitialized: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null })
    try {
      const { accessToken, refreshToken, user } = await authApi.login(credentials)
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      set({ user, accessToken, isAuthenticated: true, isLoading: false })
    } catch (err: any) {
      const message = err.response?.data?.message || 'Email ou mot de passe incorrect'
      set({ error: message, isLoading: false })
      throw err
    }
  },

  logout: async () => {
    try { await authApi.logout() } catch {}
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    set({ user: null, accessToken: null, isAuthenticated: false })
  },

  initialize: async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      set({ isInitialized: true, isAuthenticated: false })
      return
    }
    try {
      const user = await authApi.me()
      set({ user, isAuthenticated: true, isInitialized: true })
    } catch {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      set({ isAuthenticated: false, isInitialized: true })
    }
  },

  clearError: () => set({ error: null }),
}))
