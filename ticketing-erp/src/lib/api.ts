/**
 * api.ts — Universal API layer
 *
 * Auto-detects the runtime environment:
 *  - Inside Tauri desktop app  → uses invoke() to call Rust commands
 *  - Inside browser (dev mode) → uses mockBackend.ts
 *
 * All stores import from this file, NOT from mockBackend directly.
 */

import type {
  User, Ticket, TicketDetail, TicketFilter, CreateTicketPayload,
  UpdateUserPayload, CreateUserPayload, DashboardStats, PaginatedResult,
  Comment, Notification, AuthSession,
} from '../types'

// ─── Runtime Detection ─────────────────────────────────────────────────────

const IS_TAURI = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

// Lazy-load invoke only in Tauri context
let _invoke: ((cmd: string, args?: Record<string, unknown>) => Promise<any>) | null = null

async function getInvoke() {
  if (!_invoke) {
    const mod = await import('@tauri-apps/api/core')
    _invoke = mod.invoke
  }
  return _invoke
}

async function call<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  if (IS_TAURI) {
    const invoke = await getInvoke()
    return invoke(command, args)
  } else {
    // Fallback to mock backend in browser
    const mock = await import('./mockBackend')
    return callMock<T>(mock, command, args)
  }
}

// ─── Mock Backend Adapter ──────────────────────────────────────────────────
// Maps command names to mockBackend functions

function getToken(): string {
  return localStorage.getItem('ticketing-token') || ''
}

async function callMock<T>(mock: any, command: string, args: Record<string, unknown> = {}): Promise<T> {
  switch (command) {
    case 'login':
      return mock.login(args.username, args.password)
    case 'logout':
      return mock.logout(getToken())
    case 'get_current_user':
      return mock.getCurrentUser(getToken())

    case 'get_tickets':
      return mock.getTickets(args.filter, args.page, args.limit)
    case 'get_ticket':
      return mock.getTicket(args.id)
    case 'create_ticket':
      return mock.createTicket(args.payload)
    case 'update_ticket_status':
      return mock.updateTicketStatus(args.id, args.status, args.comment)
    case 'assign_ticket':
      return mock.assignTicket(args.id, args.assignee_id)
    case 'get_staff_by_department':
      return mock.getStaffByDepartment(args.department)
    case 'add_comment':
      return mock.addComment(args.ticket_id, args.content)

    case 'get_users':
      return mock.getUsers()
    case 'create_user':
      return mock.createUser(args.payload)
    case 'update_user':
      return mock.updateUser(args.id, args.payload)
    case 'reset_password':
      return mock.resetPassword(args.user_id, args.new_password)

    case 'get_notifications':
      return mock.getNotifications(args.user_id)
    case 'mark_notification_read':
      return mock.markNotificationRead(args.id)
    case 'mark_all_notifications_read':
      return mock.markAllNotificationsRead(args.user_id)

    case 'get_dashboard_stats':
      return mock.getDashboardStats()

    default:
      throw new Error(`Unknown command: ${command}`)
  }
}

// ─── Public API Functions ──────────────────────────────────────────────────

// Auth
export async function login(username: string, password: string): Promise<AuthSession> {
  const session = await call<AuthSession>('login', { username, password })
  // Persist token for both Tauri and browser mock
  localStorage.setItem('ticketing-token', session.token)
  return session
}

export async function logout(token: string): Promise<void> {
  await call<void>('logout', { token })
  localStorage.removeItem('ticketing-token')
}

export async function getCurrentUser(token: string): Promise<User | null> {
  return call<User | null>('get_current_user', { token })
}

// Tickets
export async function getTickets(
  filter: TicketFilter,
  page: number,
  limit: number
): Promise<PaginatedResult<Ticket>> {
  const token = getToken()
  const result = await call<{ data: Ticket[]; total: number; page: number; limit: number }>(
    'get_tickets',
    { token, filter, page, limit }
  )
  return {
    data: result.data,
    total: result.total,
    page: result.page,
    limit: result.limit,
  }
}

export async function getTicket(id: number): Promise<TicketDetail> {
  const token = getToken()
  return call<TicketDetail>('get_ticket', { token, id })
}

export async function createTicket(payload: CreateTicketPayload): Promise<Ticket> {
  const token = getToken()
  return call<Ticket>('create_ticket', { token, payload })
}

export async function updateTicketStatus(
  id: number,
  status: string,
  comment?: string
): Promise<Ticket> {
  const token = getToken()
  return call<Ticket>('update_ticket_status', { token, id, status, comment: comment ?? null })
}

export async function assignTicket(id: number, assigneeId: number): Promise<Ticket> {
  const token = getToken()
  return call<Ticket>('assign_ticket', { token, id, assignee_id: assigneeId })
}

export async function getStaffByDepartment(department: string): Promise<User[]> {
  const token = getToken()
  return call<User[]>('get_staff_by_department', { token, department })
}

export async function addComment(ticketId: number, content: string): Promise<Comment> {
  const token = getToken()
  return call<Comment>('add_comment', { token, ticket_id: ticketId, content })
}

// Users
export async function getUsers(): Promise<User[]> {
  const token = getToken()
  return call<User[]>('get_users', { token })
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  const token = getToken()
  return call<User>('create_user', { token, payload })
}

export async function updateUser(id: number, payload: UpdateUserPayload): Promise<User> {
  const token = getToken()
  return call<User>('update_user', { token, id, payload })
}

export async function resetPassword(userId: number, newPassword: string): Promise<void> {
  const token = getToken()
  return call<void>('reset_password', { token, user_id: userId, new_password: newPassword })
}

// Notifications
export async function getNotifications(userId: number): Promise<Notification[]> {
  const token = getToken()
  return call<Notification[]>('get_notifications', { token, user_id: userId })
}

export async function markNotificationRead(id: number): Promise<void> {
  const token = getToken()
  return call<void>('mark_notification_read', { token, id })
}

export async function markAllNotificationsRead(userId: number): Promise<void> {
  const token = getToken()
  return call<void>('mark_all_notifications_read', { token, user_id: userId })
}

// Dashboard
export async function getDashboardStats(): Promise<DashboardStats> {
  const token = getToken()
  return call<DashboardStats>('get_dashboard_stats', { token })
}
