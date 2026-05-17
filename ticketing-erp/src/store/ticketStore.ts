import { create } from 'zustand'
import type { Ticket, TicketDetail, TicketFilter, PaginatedResult, CreateTicketPayload, DashboardStats } from '../types'
import { useAuthStore } from './authStore'
import * as backend from '../lib/mockBackend'

interface TicketState {
  tickets: Ticket[]
  currentTicket: TicketDetail | null
  dashboardStats: DashboardStats | null
  total: number
  page: number
  limit: number
  filters: TicketFilter
  isLoading: boolean
  isLoadingDetail: boolean
  error: string | null

  fetchTickets: (page?: number) => Promise<void>
  fetchTicket: (id: number) => Promise<void>
  createTicket: (payload: CreateTicketPayload) => Promise<Ticket>
  updateStatus: (id: number, status: string, comment?: string) => Promise<void>
  assignTicket: (id: number, assigneeId: number) => Promise<void>
  addComment: (ticketId: number, content: string) => Promise<void>
  setFilters: (filters: TicketFilter) => void
  resetFilters: () => void
  fetchDashboard: () => Promise<void>
  clearError: () => void
}

export const useTicketStore = create<TicketState>((set, get) => ({
  tickets: [],
  currentTicket: null,
  dashboardStats: null,
  total: 0,
  page: 1,
  limit: 20,
  filters: {},
  isLoading: false,
  isLoadingDetail: false,
  error: null,

  fetchTickets: async (page = 1) => {
    const user = useAuthStore.getState().user
    if (!user) return
    set({ isLoading: true, error: null })
    try {
      const result: PaginatedResult<Ticket> = await backend.getTickets(get().filters, page, get().limit, user)
      set({ tickets: result.data, total: result.total, page, isLoading: false })
    } catch (err: any) {
      set({ error: err.message, isLoading: false })
    }
  },

  fetchTicket: async (id) => {
    set({ isLoadingDetail: true, error: null, currentTicket: null })
    try {
      const ticket = await backend.getTicket(id)
      set({ currentTicket: ticket, isLoadingDetail: false })
    } catch (err: any) {
      set({ error: err.message, isLoadingDetail: false })
    }
  },

  createTicket: async (payload) => {
    const user = useAuthStore.getState().user
    if (!user) throw new Error('Not authenticated')
    const ticket = await backend.createTicket(payload, user)
    await get().fetchTickets()
    return ticket
  },

  updateStatus: async (id, status, comment) => {
    const user = useAuthStore.getState().user
    if (!user) throw new Error('Not authenticated')
    const updated = await backend.updateTicketStatus(id, status, user, comment)
    set(state => ({
      tickets: state.tickets.map(t => t.id === id ? { ...t, ...updated } : t),
      currentTicket: state.currentTicket?.id === id
        ? { ...state.currentTicket, ...updated } as TicketDetail
        : state.currentTicket,
    }))
  },

  assignTicket: async (id, assigneeId) => {
    const user = useAuthStore.getState().user
    if (!user) throw new Error('Not authenticated')
    const updated = await backend.assignTicket(id, assigneeId, user)
    set(state => ({
      tickets: state.tickets.map(t => t.id === id ? { ...t, ...updated } : t),
      currentTicket: state.currentTicket?.id === id
        ? { ...state.currentTicket, ...updated } as TicketDetail
        : state.currentTicket,
    }))
  },

  addComment: async (ticketId, content) => {
    const user = useAuthStore.getState().user
    if (!user) throw new Error('Not authenticated')
    const comment = await backend.addComment(ticketId, content, user)
    set(state => {
      if (!state.currentTicket || state.currentTicket.id !== ticketId) return state
      return {
        currentTicket: {
          ...state.currentTicket,
          comments: [...state.currentTicket.comments, comment],
          comment_count: state.currentTicket.comment_count + 1,
        }
      }
    })
  },

  setFilters: (filters) => {
    set({ filters })
    get().fetchTickets(1)
  },

  resetFilters: () => {
    set({ filters: {} })
    get().fetchTickets(1)
  },

  fetchDashboard: async () => {
    const user = useAuthStore.getState().user
    if (!user) return
    set({ isLoading: true })
    try {
      const stats = await backend.getDashboardStats(user)
      set({ dashboardStats: stats, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  clearError: () => set({ error: null }),
}))
