import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'
import { User } from '../types'
import * as api from '../lib/api'

interface AuthState {
  user: User | null
  isLoading: boolean
  isInitialized: boolean
  setUser: (user: User | null) => void
  initialize: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isInitialized: false,

  setUser: (user) => set({ user, isLoading: false }),

  initialize: async () => {
    try {
      const { user } = await api.getSession()
      set({ user, isLoading: false, isInitialized: true })
    } catch {
      set({ user: null, isLoading: false, isInitialized: true })
    }
  },

  login: async (email, password) => {
    set({ isLoading: true })
    try {
      const { user } = await api.login(email, password)
      set({ user, isLoading: false })
    } catch (err) {
      set({ isLoading: false })
      throw err
    }
  },

  logout: async () => {
    await api.logout()
    set({ user: null })
  },
}))
