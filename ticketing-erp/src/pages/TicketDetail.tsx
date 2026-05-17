import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, MessageSquare, Clock, User2, AlertTriangle,
  Send, ChevronDown, UserCheck, Loader2
} from 'lucide-react'
import { useTicketStore } from '../store/ticketStore'
import { useAuthStore } from '../store/authStore'
import { useUIStore } from '../store/uiStore'
import { StatusBadge, PriorityBadge, CategoryBadge, OverdueBadge, Avatar } from '../components/ui/Badge'
import { STATUS_TRANSITIONS, CATEGORY_CONFIG } from '../lib/constants'
import { formatDateTime, formatRelativeTime } from '../lib/utils'
import type { Status } from '../types'
import * as api from '../lib/api'

export const TicketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { currentTicket, fetchTicket, isLoadingDetail, updateStatus, assignTicket, addComment } = useTicketStore()
  const { addToast } = useUIStore()
  const [comment, setComment] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [isChangingStatus, setIsChangingStatus] = useState(false)
  const [showAssign, setShowAssign] = useState(false)
  const [staffList, setStaffList] = useState<any[]>([])
  const [isAssigning, setIsAssigning] = useState(false)

  useEffect(() => {
    if (id) fetchTicket(Number(id))
  }, [id])

  useEffect(() => {
    if (currentTicket) {
      api.getStaffByDepartment(currentTicket.category).then(setStaffList).catch(() => {})
    }
  }, [currentTicket?.category])

  if (!user) return null

  if (isLoadingDetail) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  if (!currentTicket) {
    return (
      <div className="text-center py-16">
        <p className="text-text-muted">Ticket tidak ditemukan</p>
        <button onClick={() => navigate('/tickets')} className="btn-secondary btn-sm mt-4">
          Kembali
        </button>
      </div>
    )
  }

  const ticket = currentTicket
  const catConfig = CATEGORY_CONFIG[ticket.category]
  const availableStatuses = STATUS_TRANSITIONS[ticket.status]

  const canChangeStatus = user.role === 'admin' || user.role === 'manager' ||
    (user.role === 'staff' && ticket.assignee?.id === user.id)
  const canAssign = user.role === 'admin' || user.role === 'manager'
  const canClose = (user.role === 'admin' || user.role === 'manager') && ticket.status === 'RESOLVED'

  const handleStatusChange = async (newStatus: Status) => {
    setIsChangingStatus(true)
    try {
      await updateStatus(ticket.id, newStatus)
      addToast('success', `Status diubah ke ${newStatus.replace('_', ' ')}`)
    } catch (err: any) {
      addToast('error', err.message)
    } finally {
      setIsChangingStatus(false)
    }
  }

  const handleAssign = async (assigneeId: number) => {
    setIsAssigning(true)
    try {
      await assignTicket(ticket.id, assigneeId)
      setShowAssign(false)
      addToast('success', 'Ticket berhasil di-assign')
    } catch (err: any) {
      addToast('error', err.message)
    } finally {
      setIsAssigning(false)
    }
  }

  const handleComment = async () => {
    if (!comment.trim()) return
    setIsSubmittingComment(true)
    try {
      await addComment(ticket.id, comment.trim())
      setComment('')
      addToast('success', 'Komentar berhasil ditambahkan')
    } catch (err: any) {
      addToast('error', err.message)
    } finally {
      setIsSubmittingComment(false)
    }
  }

  return (
    <div className="space-y-5 animate-fade-in max-w-6xl">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-text-sub hover:text-text-main transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali
      </button>

      {/* Ticket Header */}
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="ticket-id text-primary text-sm">{ticket.ticket_no}</span>
              {ticket.is_overdue && <OverdueBadge />}
            </div>
            <h1 className="text-xl font-bold text-text-main">{ticket.title}</h1>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <StatusBadge status={ticket.status} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Description + Comments */}
        <div className="lg:col-span-2 space-y-5">
          {/* Description */}
          <div className="card p-6">
            <h2 className="section-title mb-4">Deskripsi</h2>
            <p className="text-sm text-text-main leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
          </div>

          {/* Activity + Comments */}
          <div className="card p-6">
            <h2 className="section-title mb-5 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Komentar & Aktivitas
            </h2>

            <div className="space-y-4 mb-6">
              {/* Activity logs */}
              {ticket.activity_log.map(log => (
                <div key={log.id} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-text-muted" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-text-sub">
                      <span className="font-medium text-text-main">{log.user.full_name}</span>
                      {log.action === 'STATUS_CHANGE' && <> mengubah status dari <span className="font-medium">{log.old_value}</span> → <span className="font-medium">{log.new_value}</span></>}
                      {log.action === 'ASSIGN' && <> assign ticket ke <span className="font-medium">{log.new_value}</span></>}
                      {log.action === 'CREATE' && <> membuat ticket ini</>}
                    </p>
                    <p className="text-[11px] text-text-muted mt-0.5">{formatRelativeTime(log.created_at)}</p>
                  </div>
                </div>
              ))}

              {/* Comments */}
              {ticket.comments.map(c => (
                <div key={c.id} className="flex items-start gap-3">
                  <Avatar name={c.user.full_name} size="sm" className="flex-shrink-0 mt-0.5" />
                  <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-text-main">{c.user.full_name}</span>
                      <span className="text-[11px] text-text-muted">{formatRelativeTime(c.created_at)}</span>
                    </div>
                    <p className="text-sm text-text-main leading-relaxed">{c.content}</p>
                  </div>
                </div>
              ))}

              {ticket.activity_log.length === 0 && ticket.comments.length === 0 && (
                <p className="text-sm text-text-muted text-center py-4">Belum ada aktivitas</p>
              )}
            </div>

            {/* Comment Input */}
            <div className="flex items-start gap-3 pt-4 border-t border-border">
              <Avatar name={user.full_name} size="sm" className="flex-shrink-0 mt-1" />
              <div className="flex-1">
                <textarea
                  id="comment-input"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Tulis komentar..."
                  className="input resize-none"
                  rows={3}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && e.ctrlKey) handleComment()
                  }}
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-[11px] text-text-muted">Ctrl+Enter untuk kirim</span>
                  <button
                    id="submit-comment"
                    onClick={handleComment}
                    disabled={!comment.trim() || isSubmittingComment}
                    className="btn-primary btn-sm"
                  >
                    {isSubmittingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Kirim
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Ticket Info Sidebar */}
        <div className="space-y-4">
          <div className="card p-5 space-y-4">
            <h2 className="section-title">Informasi Ticket</h2>

            <dl className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <dt className="text-text-sub">Status</dt>
                <dd><StatusBadge status={ticket.status} /></dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-text-sub">Prioritas</dt>
                <dd><PriorityBadge priority={ticket.priority} /></dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-text-sub">Kategori</dt>
                <dd><CategoryBadge category={ticket.category} /></dd>
              </div>
              <div className="pt-2 border-t border-border space-y-3">
                <div>
                  <dt className="text-text-sub mb-1">Requester</dt>
                  <dd className="flex items-center gap-2">
                    <Avatar name={ticket.requester.full_name} size="sm" />
                    <span className="text-text-main font-medium text-xs">{ticket.requester.full_name}</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-text-sub mb-1">Assignee</dt>
                  <dd className="flex items-center gap-2">
                    {ticket.assignee ? (
                      <>
                        <Avatar name={ticket.assignee.full_name} size="sm" />
                        <span className="text-text-main font-medium text-xs">{ticket.assignee.full_name}</span>
                      </>
                    ) : (
                      <span className="text-text-muted text-xs italic">Belum di-assign</span>
                    )}
                  </dd>
                </div>
              </div>
              <div className="pt-2 border-t border-border space-y-2">
                <div className="flex justify-between">
                  <dt className="text-text-sub text-xs">Dibuat</dt>
                  <dd className="text-text-main text-xs">{formatDateTime(ticket.created_at)}</dd>
                </div>
                {ticket.sla_due && (
                  <div className="flex justify-between">
                    <dt className="text-text-sub text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" /> SLA Due
                    </dt>
                    <dd className={`text-xs font-medium ${ticket.is_overdue ? 'text-red-600' : 'text-text-main'}`}>
                      {formatDateTime(ticket.sla_due)}
                    </dd>
                  </div>
                )}
                {ticket.resolved_at && (
                  <div className="flex justify-between">
                    <dt className="text-text-sub text-xs">Diselesaikan</dt>
                    <dd className="text-text-main text-xs">{formatDateTime(ticket.resolved_at)}</dd>
                  </div>
                )}
              </div>
            </dl>
          </div>

          {/* Actions */}
          {(canChangeStatus || canAssign) && (
            <div className="card p-5 space-y-3">
              <h2 className="section-title">Aksi</h2>

              {/* Status Change */}
              {canChangeStatus && availableStatuses.length > 0 && (
                <div>
                  <p className="label">Ubah Status</p>
                  <div className="flex flex-col gap-2">
                    {availableStatuses.map(s => (
                      <button
                        key={s}
                        id={`status-btn-${s}`}
                        onClick={() => handleStatusChange(s)}
                        disabled={isChangingStatus}
                        className="btn-secondary btn-sm justify-start text-left"
                      >
                        {isChangingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                        → {s.replace('_', ' ')}
                      </button>
                    ))}
                    {canClose && (
                      <button
                        id="close-ticket-btn"
                        onClick={() => handleStatusChange('CLOSED')}
                        disabled={isChangingStatus}
                        className="btn-danger btn-sm justify-start"
                      >
                        Tutup Ticket
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Assign */}
              {canAssign && (
                <div>
                  <p className="label">Assign ke</p>
                  <div className="relative">
                    <button
                      id="assign-btn"
                      onClick={() => setShowAssign(v => !v)}
                      className="btn-secondary btn-sm w-full justify-between"
                    >
                      <span className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5" />
                        {ticket.assignee?.full_name ?? 'Pilih Staff...'}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    {showAssign && (
                      <div className="absolute right-0 top-10 w-full bg-white rounded-xl shadow-xl border border-border z-20 overflow-hidden animate-scale-in">
                        {staffList.length === 0 ? (
                          <p className="px-4 py-3 text-xs text-text-muted">Tidak ada staff tersedia</p>
                        ) : staffList.map(s => (
                          <button
                            key={s.id}
                            onClick={() => handleAssign(s.id)}
                            disabled={isAssigning}
                            className="w-full text-left px-4 py-2.5 text-xs hover:bg-blue-50 flex items-center gap-2 transition-colors"
                          >
                            <Avatar name={s.full_name} size="sm" />
                            {s.full_name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
