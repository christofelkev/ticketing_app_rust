import { format, formatDistanceToNow, parseISO, isAfter, isBefore } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import type { Category, Priority } from '../types'

// ============================================================
// Date & Time Utils
// ============================================================

export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'd MMM yyyy', { locale: idLocale })
  } catch {
    return dateStr
  }
}

export function formatDateTime(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'd MMM yyyy HH:mm', { locale: idLocale })
  } catch {
    return dateStr
  }
}

export function formatRelativeTime(dateStr: string): string {
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true, locale: idLocale })
  } catch {
    return dateStr
  }
}

export function isOverdue(slaDeadline: string): boolean {
  try {
    return isAfter(new Date(), parseISO(slaDeadline))
  } catch {
    return false
  }
}

export function isSoonDue(slaDeadline: string, hoursThreshold = 4): boolean {
  try {
    const deadline = parseISO(slaDeadline)
    const threshold = new Date(Date.now() + hoursThreshold * 60 * 60 * 1000)
    return isBefore(deadline, threshold) && !isOverdue(slaDeadline)
  } catch {
    return false
  }
}

export function getSlaProgress(createdAt: string, slaDue: string): number {
  try {
    const created = parseISO(createdAt).getTime()
    const due = parseISO(slaDue).getTime()
    const now = Date.now()
    const total = due - created
    const elapsed = now - created
    return Math.min(Math.max((elapsed / total) * 100, 0), 100)
  } catch {
    return 0
  }
}

// ============================================================
// Ticket Number Generation
// ============================================================

export function generateTicketNo(category: Category, counter: number): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const num = String(counter).padStart(4, '0')
  return `${category}-${year}${month}-${num}`
}

// ============================================================
// SLA Deadline Calculation
// ============================================================

export function calculateSlaDeadline(priority: Priority, createdAt?: string): string {
  const slaHours: Record<Priority, number> = {
    P1: 4,
    P2: 8,
    P3: 24,
    P4: 72,
  }
  const base = createdAt ? parseISO(createdAt) : new Date()
  const deadline = new Date(base.getTime() + slaHours[priority] * 60 * 60 * 1000)
  return deadline.toISOString()
}

// ============================================================
// General Utils
// ============================================================

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + '...'
}

export function getRoleDisplayText(role: string): string {
  const map: Record<string, string> = {
    admin: 'Admin / IT',
    manager: 'Manager',
    staff: 'Staff / Teknisi',
    requester: 'Requester',
  }
  return map[role] || role
}

export function getInitials(fullName: string): string {
  return fullName
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()
}

export function generateAvatarColor(name: string): string {
  const colors = [
    'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-pink-500',
    'bg-teal-500', 'bg-emerald-500', 'bg-amber-500', 'bg-orange-500',
  ]
  const index = name.charCodeAt(0) % colors.length
  return colors[index]
}
