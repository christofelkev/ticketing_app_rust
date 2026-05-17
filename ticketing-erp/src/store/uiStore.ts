import { create } from 'zustand'
import type { Notification, User } from '../types'
import * as backend from '../lib/mockBackend'

interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
}

interface UIState {
  sidebarCollapsed: boolean
  notifications: Notification[]
  toasts: Toast[]
  notifUnreadCount: number

  toggleSidebar: () => void
  setSidebarCollapsed: (v: boolean) => void

  fetchNotifications: (userId: number) => Promise<void>
  markNotifRead: (id: number) => Promise<void>
  markAllNotifRead: (userId: number) => Promise<void>

  addToast: (type: Toast['type'], message: string) => void
  dismissToast: (id: string) => void
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarCollapsed: false,
  notifications: [],
  toasts: [],
  notifUnreadCount: 0,

  toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

  fetchNotifications: async (userId) => {
    const notifs = await backend.getNotifications(userId)
    set({
      notifications: notifs,
      notifUnreadCount: notifs.filter(n => !n.is_read).length,
    })
  },

  markNotifRead: async (id) => {
    await backend.markNotificationRead(id)
    set(s => ({
      notifications: s.notifications.map(n => n.id === id ? { ...n, is_read: true } : n),
      notifUnreadCount: Math.max(0, s.notifUnreadCount - 1),
    }))
  },

  markAllNotifRead: async (userId) => {
    await backend.markAllNotificationsRead(userId)
    set(s => ({
      notifications: s.notifications.map(n => ({ ...n, is_read: true })),
      notifUnreadCount: 0,
    }))
  },

  addToast: (type, message) => {
    const id = `toast_${Date.now()}`
    set(s => ({ toasts: [...s.toasts, { id, type, message }] }))
    setTimeout(() => get().dismissToast(id), 4000)
  },

  dismissToast: (id) => {
    set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }))
  },
}))
