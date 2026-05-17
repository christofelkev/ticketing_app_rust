import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, SlidersHorizontal, X, AlertTriangle } from 'lucide-react'
import { useTicketStore } from '../store/ticketStore'
import { useAuthStore } from '../store/authStore'
import { StatusBadge, PriorityBadge, CategoryBadge, OverdueBadge } from '../components/ui/Badge'
import {
  TICKET_CATEGORIES, TICKET_STATUSES, TICKET_PRIORITIES,
  CATEGORY_CONFIG, STATUS_CONFIG, PRIORITY_CONFIG
} from '../lib/constants'
import { formatRelativeTime } from '../lib/utils'
import type { TicketFilter } from '../types'

export const TicketList: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { tickets, total, page, limit, filters, isLoading, fetchTickets, setFilters, resetFilters } = useTicketStore()
  const [search, setSearch] = useState(filters.search || '')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchTickets(1)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setFilters({ ...filters, search: search.trim() || undefined })
  }

  const handleFilterChange = (key: keyof TicketFilter, value: string) => {
    setFilters({ ...filters, [key]: value || undefined })
  }

  const hasActiveFilters = !!(filters.category || filters.status || filters.priority || filters.search)
  const totalPages = Math.ceil(total / limit)

  const canCreateTicket = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'staff' || user?.role === 'requester'

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">
            {user?.role === 'staff' ? 'Ticket Saya' : user?.role === 'requester' ? 'Ticket Saya' : 'Semua Ticket'}
          </h1>
          <p className="text-sm text-text-sub mt-0.5">
            {total} ticket ditemukan
          </p>
        </div>
        {canCreateTicket && (
          <button
            id="create-ticket-btn"
            onClick={() => navigate('/tickets/create')}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            Buat Ticket
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center gap-3">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              id="ticket-search"
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari ticket (judul, ID, deskripsi)..."
              className="input pl-9 pr-4"
            />
          </form>
          <button
            id="filter-toggle"
            onClick={() => setShowFilters(v => !v)}
            className={`btn-secondary flex items-center gap-2 flex-shrink-0 ${showFilters ? 'ring-2 ring-primary' : ''}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filter
            {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-primary" />}
          </button>
          {hasActiveFilters && (
            <button
              onClick={() => { resetFilters(); setSearch('') }}
              className="btn-ghost btn-sm flex items-center gap-1.5 text-red-600 hover:bg-red-50"
            >
              <X className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border animate-fade-in">
            <div>
              <label className="label">Kategori</label>
              <select
                id="filter-category"
                className="input"
                value={filters.category || ''}
                onChange={e => handleFilterChange('category', e.target.value)}
              >
                <option value="">Semua Kategori</option>
                {TICKET_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{CATEGORY_CONFIG[cat].icon} {CATEGORY_CONFIG[cat].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select
                id="filter-status"
                className="input"
                value={filters.status || ''}
                onChange={e => handleFilterChange('status', e.target.value)}
              >
                <option value="">Semua Status</option>
                {TICKET_STATUSES.map(s => (
                  <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Prioritas</label>
              <select
                id="filter-priority"
                className="input"
                value={filters.priority || ''}
                onChange={e => handleFilterChange('priority', e.target.value)}
              >
                <option value="">Semua Prioritas</option>
                {TICKET_PRIORITIES.map(p => (
                  <option key={p} value={p}>{PRIORITY_CONFIG[p].emoji} {PRIORITY_CONFIG[p].label}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Ticket Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-border">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-5 py-4 flex items-center gap-4 animate-pulse">
                <div className="h-4 w-28 bg-gray-200 rounded" />
                <div className="flex-1 h-4 bg-gray-200 rounded" />
                <div className="h-5 w-16 bg-gray-200 rounded-full" />
                <div className="h-5 w-16 bg-gray-200 rounded-full" />
              </div>
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6 text-text-muted" />
            </div>
            <p className="text-sm font-medium text-text-sub">Tidak ada ticket ditemukan</p>
            <p className="text-xs text-text-muted mt-1">Coba ubah filter atau kata kunci pencarian</p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="grid grid-cols-[140px_1fr_100px_100px_110px_110px] px-5 py-3 bg-gray-50 border-b border-border text-xs font-medium text-text-sub uppercase tracking-wide">
              <span>ID Ticket</span>
              <span>Judul</span>
              <span>Kategori</span>
              <span>Prioritas</span>
              <span>Status</span>
              <span>Dibuat</span>
            </div>

            <div className="divide-y divide-border">
              {tickets.map(ticket => (
                <div
                  key={ticket.id}
                  id={`ticket-row-${ticket.id}`}
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                  className={`grid grid-cols-[140px_1fr_100px_100px_110px_110px] px-5 py-4 items-center gap-4 cursor-pointer transition-colors hover:bg-gray-50 group ${ticket.is_overdue ? 'bg-red-50/30 hover:bg-red-50' : ''}`}
                >
                  <div className="flex items-center gap-1.5">
                    {ticket.is_overdue && <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />}
                    <span className="ticket-id text-primary group-hover:text-primary-dark truncate">
                      {ticket.ticket_no}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-text-main truncate font-medium">{ticket.title}</p>
                    {ticket.assignee && (
                      <p className="text-xs text-text-muted mt-0.5">→ {ticket.assignee.full_name}</p>
                    )}
                  </div>
                  <CategoryBadge category={ticket.category} showIcon={false} />
                  <PriorityBadge priority={ticket.priority} />
                  <StatusBadge status={ticket.status} />
                  <span className="text-xs text-text-muted">{formatRelativeTime(ticket.created_at)}</span>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-5 py-4 border-t border-border flex items-center justify-between">
                <p className="text-xs text-text-muted">
                  Menampilkan {(page - 1) * limit + 1}–{Math.min(page * limit, total)} dari {total} ticket
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => fetchTickets(page - 1)}
                    disabled={page === 1}
                    className="btn-secondary btn-sm disabled:opacity-50"
                  >
                    &lt;
                  </button>
                  {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                    const p = i + 1
                    return (
                      <button
                        key={p}
                        onClick={() => fetchTickets(p)}
                        className={`btn-sm px-3 py-1.5 rounded-lg text-xs ${p === page ? 'bg-primary text-white' : 'btn-secondary'}`}
                      >
                        {p}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => fetchTickets(page + 1)}
                    disabled={page === totalPages}
                    className="btn-secondary btn-sm disabled:opacity-50"
                  >
                    &gt;
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
