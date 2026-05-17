import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Ticket, Loader2 } from 'lucide-react'
import { useTicketStore } from '../store/ticketStore'
import { useUIStore } from '../store/uiStore'
import { TICKET_CATEGORIES, TICKET_PRIORITIES, CATEGORY_CONFIG, PRIORITY_CONFIG } from '../lib/constants'
import type { Category, Priority } from '../types'

export const TicketCreate: React.FC = () => {
  const navigate = useNavigate()
  const { createTicket } = useTicketStore()
  const { addToast } = useUIStore()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Category | ''>('')
  const [priority, setPriority] = useState<Priority>('P3')
  const [desiredDue, setDesiredDue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!title.trim()) errs.title = 'Judul wajib diisi'
    if (title.trim().length < 10) errs.title = 'Judul minimal 10 karakter'
    if (!category) errs.category = 'Kategori wajib dipilih'
    if (!description.trim()) errs.description = 'Deskripsi wajib diisi'
    if (description.trim().length < 20) errs.description = 'Deskripsi minimal 20 karakter'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate() || !category) return

    setIsLoading(true)
    try {
      const ticket = await createTicket({
        title: title.trim(),
        description: description.trim(),
        category: category as Category,
        priority,
        desired_due: desiredDue || undefined,
      })
      addToast('success', `Ticket ${ticket.ticket_no} berhasil dibuat!`)
      navigate(`/tickets/${ticket.id}`)
    } catch (err: any) {
      addToast('error', err.message || 'Gagal membuat ticket')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-text-sub" />
        </button>
        <div>
          <h1 className="page-title">Buat Ticket Baru</h1>
          <p className="text-sm text-text-sub mt-0.5">Isi form berikut untuk mengajukan permintaan</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        {/* Title */}
        <div className="space-y-1.5">
          <label htmlFor="ticket-title" className="label">
            Judul Permintaan <span className="text-red-500">*</span>
          </label>
          <input
            id="ticket-title"
            type="text"
            value={title}
            onChange={e => { setTitle(e.target.value); setErrors(p => ({ ...p, title: '' })) }}
            placeholder="Jelaskan masalah atau kebutuhan secara singkat"
            className={`input ${errors.title ? 'input-error' : ''}`}
            maxLength={120}
          />
          {errors.title && <p className="text-xs text-red-600">{errors.title}</p>}
          <p className="text-xs text-text-muted text-right">{title.length}/120</p>
        </div>

        {/* Category & Priority */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="ticket-category" className="label">
              Kategori <span className="text-red-500">*</span>
            </label>
            <select
              id="ticket-category"
              value={category}
              onChange={e => { setCategory(e.target.value as Category); setErrors(p => ({ ...p, category: '' })) }}
              className={`input ${errors.category ? 'input-error' : ''}`}
            >
              <option value="">Pilih kategori...</option>
              {TICKET_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {CATEGORY_CONFIG[cat].icon} {CATEGORY_CONFIG[cat].label}
                </option>
              ))}
            </select>
            {errors.category && <p className="text-xs text-red-600">{errors.category}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="ticket-priority" className="label">Prioritas</label>
            <select
              id="ticket-priority"
              value={priority}
              onChange={e => setPriority(e.target.value as Priority)}
              className="input"
            >
              {TICKET_PRIORITIES.map(p => (
                <option key={p} value={p}>
                  {PRIORITY_CONFIG[p].emoji} {PRIORITY_CONFIG[p].label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Priority Preview */}
        {priority && (
          <div className={`flex items-center gap-2 p-3 rounded-lg text-xs ${PRIORITY_CONFIG[priority].bg} ${PRIORITY_CONFIG[priority].text}`}>
            <span>{PRIORITY_CONFIG[priority].emoji}</span>
            <span className="font-medium">{PRIORITY_CONFIG[priority].label}</span>
            <span>— Target SLA: <strong>{PRIORITY_CONFIG[priority].sla_hours} jam</strong></span>
          </div>
        )}

        {/* Description */}
        <div className="space-y-1.5">
          <label htmlFor="ticket-description" className="label">
            Deskripsi <span className="text-red-500">*</span>
          </label>
          <textarea
            id="ticket-description"
            value={description}
            onChange={e => { setDescription(e.target.value); setErrors(p => ({ ...p, description: '' })) }}
            placeholder="Jelaskan masalah atau kebutuhan Anda secara detail. Sertakan lokasi, waktu kejadian, error message, dsb."
            className={`input resize-none ${errors.description ? 'input-error' : ''}`}
            rows={5}
          />
          {errors.description && <p className="text-xs text-red-600">{errors.description}</p>}
        </div>

        {/* Desired Due */}
        <div className="space-y-1.5">
          <label htmlFor="ticket-due" className="label">
            Deadline Diinginkan <span className="text-text-muted text-xs">(opsional)</span>
          </label>
          <input
            id="ticket-due"
            type="date"
            value={desiredDue}
            onChange={e => setDesiredDue(e.target.value)}
            className="input"
            min={new Date().toISOString().split('T')[0]}
          />
          <p className="text-xs text-text-muted">Tanggal SLA akan dihitung otomatis berdasarkan prioritas</p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
            Batalkan
          </button>
          <button
            type="submit"
            id="submit-ticket-btn"
            disabled={isLoading}
            className="btn-primary"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Membuat...
              </>
            ) : (
              <>
                <Ticket className="w-4 h-4" />
                Kirim Ticket
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
