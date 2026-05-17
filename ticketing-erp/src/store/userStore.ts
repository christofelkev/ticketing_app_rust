import { create } from 'zustand'
import type { User, CreateUserPayload, UpdateUserPayload } from '../types'
import * as backend from '../lib/mockBackend'

interface UserState {
  users: User[]
  isLoading: boolean
  error: string | null
  fetchUsers: () => Promise<void>
  createUser: (payload: CreateUserPayload) => Promise<User>
  updateUser: (id: number, payload: UpdateUserPayload) => Promise<User>
  resetPassword: (userId: number, newPassword: string) => Promise<void>
  clearError: () => void
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  isLoading: false,
  error: null,

  fetchUsers: async () => {
    set({ isLoading: true, error: null })
    try {
      const users = await backend.getUsers()
      set({ users, isLoading: false })
    } catch (err: any) {
      set({ error: err.message, isLoading: false })
    }
  },

  createUser: async (payload) => {
    const user = await backend.createUser(payload)
    set(s => ({ users: [...s.users, user] }))
    return user
  },

  updateUser: async (id, payload) => {
    const user = await backend.updateUser(id, payload)
    set(s => ({ users: s.users.map(u => u.id === id ? user : u) }))
    return user
  },

  resetPassword: async (userId, newPassword) => {
    await backend.resetPassword(userId, newPassword)
  },

  clearError: () => set({ error: null }),
}))
