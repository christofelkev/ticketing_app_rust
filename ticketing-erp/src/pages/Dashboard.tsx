import React, { useEffect } from 'react'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import {
  Inbox, Loader2, AlertTriangle, CheckCircle, TrendingUp, Clock, ArrowRight
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useTicketStore } from '../store/ticketStore'
import { StatCard, StatCardSkeleton } from '../components/dashboard/StatCard'
import { CategoryChart } from '../components/dashboard/CategoryChart'
import { TrendChart } from '../components/dashboard/TrendChart'
import { StatusBadge } from '../components/ui/Badge'
import { PriorityBadge } from '../components/ui/Badge'
import { CategoryBadge } from '../components/ui/Badge'
import { formatRelativeTime } from '../lib/utils'

export const Dashboard: React.FC = () => {
  const { user } = useAuthStore()
  const { dashboardStats, fetchDashboard, isLoading } = useTicketStore()
  const navigate = useNavigate()

  useEffect(() => {
    fetchDashboard()
  }, [])

  const today = format(new Date(), 'EEEE, d MMMM yyyy', { locale: idLocale })

  if (!user) return null

  // Role-specific dashboards
  if (user.role === 'requester') {
    return <RequesterDashboard navigate={navigate} />
  }

  if (user.role === 'staff') {
    return <StaffDashboard navigate={navigate} />
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-sm text-text-sub mt-0.5">{today}</p>
        </div>
        <button
          onClick={() => fetchDashboard()}
          className="btn-secondary btn-sm flex items-center gap-1.5"
        >
          <TrendingUp className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : dashboardStats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Ticket Open"
            value={dashboardStats.total_open}
            icon={Inbox}
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
          />
          <StatCard
            title="Sedang Dikerjakan"
            value={dashboardStats.total_in_progress}
            icon={Loader2}
            iconColor="text-amber-600"
            iconBg="bg-amber-50"
          />
          <StatCard
            title="Overdue SLA"
            value={dashboardStats.total_overdue}
            icon={AlertTriangle}
            isAlert={dashboardStats.total_overdue > 0}
          />
          <StatCard
            title="Selesai Bulan Ini"
            value={dashboardStats.total_resolved_this_month}
            icon={CheckCircle}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50"
          />
        </div>
      ) : null}

      {/* Charts */}
      {dashboardStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CategoryChart data={dashboardStats.by_category} />
          <TrendChart data={dashboardStats.trend_weekly} />
        </div>
      )}

      {/* Overdue Tickets */}
      {dashboardStats && dashboardStats.overdue_tickets.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <h3 className="text-sm font-semibold text-text-main">Ticket Overdue SLA</h3>
              <span className="badge bg-red-100 text-red-700">{dashboardStats.overdue_tickets.length}</span>
            </div>
          </div>
          <div className="divide-y divide-border">
            {dashboardStats.overdue_tickets.map(ticket => (
              <div
                key={ticket.id}
                onClick={() => navigate(`/tickets/${ticket.id}`)}
                className="px-5 py-3.5 flex items-center gap-4 hover:bg-red-50/50 cursor-pointer transition-colors group"
              >
                <span className="ticket-id text-primary w-32 flex-shrink-0">{ticket.ticket_no}</span>
                <span className="flex-1 text-sm text-text-main truncate">{ticket.title}</span>
                <CategoryBadge category={ticket.category} />
                <PriorityBadge priority={ticket.priority} />
                <span className="text-xs text-red-600 font-medium flex-shrink-0">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {ticket.assignee?.full_name ?? 'Belum di-assign'}
                </span>
                <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Unresolved */}
      {dashboardStats && dashboardStats.top_unresolved.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="text-sm font-semibold text-text-main">Ticket Terlama Belum Selesai</h3>
          </div>
          <div className="divide-y divide-border">
            {dashboardStats.top_unresolved.map(ticket => (
              <div
                key={ticket.id}
                onClick={() => navigate(`/tickets/${ticket.id}`)}
                className="px-5 py-3.5 flex items-center gap-4 hover:bg-gray-50 cursor-pointer transition-colors group"
              >
                <span className="ticket-id text-primary w-32 flex-shrink-0">{ticket.ticket_no}</span>
                <span className="flex-1 text-sm text-text-main truncate">{ticket.title}</span>
                <StatusBadge status={ticket.status} />
                <span className="text-xs text-text-muted flex-shrink-0">{formatRelativeTime(ticket.created_at)}</span>
                <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Staff Dashboard
const StaffDashboard: React.FC<{ navigate: any }> = ({ navigate }) => {
  const { tickets, fetchTickets, isLoading } = useTicketStore()

  useEffect(() => {
    fetchTickets()
  }, [])

  const myOpen = tickets.filter(t => t.status === 'OPEN').length
  const myInProgress = tickets.filter(t => t.status === 'IN_PROGRESS').length
  const myOverdue = tickets.filter(t => t.is_overdue).length

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="page-title">Dashboard Saya</h1>
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Ticket Ditugaskan" value={myOpen} icon={Inbox} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard title="Sedang Dikerjakan" value={myInProgress} icon={Loader2} iconColor="text-amber-600" iconBg="bg-amber-50" />
        <StatCard title="Overdue" value={myOverdue} icon={AlertTriangle} isAlert={myOverdue > 0} />
      </div>
      <div className="card">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-text-main">Ticket Saya</h3>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-text-muted text-sm">Memuat...</div>
        ) : tickets.length === 0 ? (
          <div className="p-8 text-center text-text-muted text-sm">Belum ada ticket yang ditugaskan</div>
        ) : (
          <div className="divide-y divide-border">
            {tickets.slice(0, 10).map(ticket => (
              <div key={ticket.id} onClick={() => navigate(`/tickets/${ticket.id}`)}
                className="px-5 py-3.5 flex items-center gap-4 hover:bg-gray-50 cursor-pointer transition-colors">
                <span className="ticket-id text-primary w-32 flex-shrink-0">{ticket.ticket_no}</span>
                <span className="flex-1 text-sm text-text-main truncate">{ticket.title}</span>
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Requester Dashboard
const RequesterDashboard: React.FC<{ navigate: any }> = ({ navigate }) => {
  const { tickets, fetchTickets, isLoading } = useTicketStore()

  useEffect(() => {
    fetchTickets()
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Ticket Saya</h1>
        <button onClick={() => navigate('/tickets/create')} className="btn-primary btn-sm">
          + Buat Ticket
        </button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Total Ticket" value={tickets.length} icon={Inbox} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard title="Sedang Diproses" value={tickets.filter(t => t.status === 'IN_PROGRESS').length} icon={Loader2} iconColor="text-amber-600" iconBg="bg-amber-50" />
        <StatCard title="Selesai" value={tickets.filter(t => t.status === 'CLOSED' || t.status === 'RESOLVED').length} icon={CheckCircle} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
      </div>
      <div className="card">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-text-main">Daftar Ticket</h3>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-text-muted text-sm">Memuat...</div>
        ) : tickets.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <p className="text-text-muted text-sm">Belum ada ticket</p>
            <button onClick={() => navigate('/tickets/create')} className="btn-primary btn-sm">Buat Ticket Pertama</button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {tickets.map(ticket => (
              <div key={ticket.id} onClick={() => navigate(`/tickets/${ticket.id}`)}
                className="px-5 py-3.5 flex items-center gap-4 hover:bg-gray-50 cursor-pointer transition-colors">
                <span className="ticket-id text-primary w-32 flex-shrink-0">{ticket.ticket_no}</span>
                <span className="flex-1 text-sm text-text-main truncate">{ticket.title}</span>
                <StatusBadge status={ticket.status} />
                <span className="text-xs text-text-muted">{formatRelativeTime(ticket.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
