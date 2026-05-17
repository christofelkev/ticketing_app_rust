import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, AuthSession } from '../types'
import * as backend from '../lib/mockBackend'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (username, password) => {
        set({ isLoading: true, error: null })
        try {
          const session: AuthSession = await backend.login(username, password)
          set({ user: session.user, token: session.token, isLoading: false })
        } catch (err: any) {
          set({ error: err.message, isLoading: false })
          throw err
        }
      },

      logout: async () => {
        const token = get().token
        if (token) await backend.logout(token)
        set({ user: null, token: null })
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'ticketing-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
)
