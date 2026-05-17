import { create } from 'zustand'
import type { Ticket, TicketDetail, TicketFilter, PaginatedResult, CreateTicketPayload, DashboardStats } from '../types'
import * as api from '../lib/api'

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
    set({ isLoading: true, error: null })
    try {
      const result: PaginatedResult<Ticket> = await api.getTickets(get().filters, page, get().limit)
      set({ tickets: result.data, total: result.total, page, isLoading: false })
    } catch (err: any) {
      set({ error: err.message, isLoading: false })
    }
  },

  fetchTicket: async (id) => {
    set({ isLoadingDetail: true, error: null, currentTicket: null })
    try {
      const ticket = await api.getTicket(id)
      set({ currentTicket: ticket, isLoadingDetail: false })
    } catch (err: any) {
      set({ error: err.message, isLoadingDetail: false })
    }
  },

  createTicket: async (payload) => {
    const ticket = await api.createTicket(payload)
    await get().fetchTickets()
    return ticket
  },

  updateStatus: async (id, status, comment) => {
    const updated = await api.updateTicketStatus(id, status, comment)
    set(state => ({
      tickets: state.tickets.map(t => t.id === id ? { ...t, ...updated } : t),
      currentTicket: state.currentTicket?.id === id
        ? { ...state.currentTicket, ...updated } as TicketDetail
        : state.currentTicket,
    }))
  },

  assignTicket: async (id, assigneeId) => {
    const updated = await api.assignTicket(id, assigneeId)
    set(state => ({
      tickets: state.tickets.map(t => t.id === id ? { ...t, ...updated } : t),
      currentTicket: state.currentTicket?.id === id
        ? { ...state.currentTicket, ...updated } as TicketDetail
        : state.currentTicket,
    }))
  },

  addComment: async (ticketId, content) => {
    const comment = await api.addComment(ticketId, content)
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
    set({ isLoading: true })
    try {
      const stats = await api.getDashboardStats()
      set({ dashboardStats: stats, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  clearError: () => set({ error: null }),
}))
