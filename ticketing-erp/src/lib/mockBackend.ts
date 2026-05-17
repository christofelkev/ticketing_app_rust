import type {
  User, Ticket, TicketDetail, Comment, ActivityLog, Notification, DashboardStats,
  AuthSession, CreateTicketPayload, CreateUserPayload, UpdateUserPayload,
  TicketFilter, PaginatedResult
} from '../types'
import { calculateSlaDeadline, generateTicketNo } from './utils'

// ============================================================
// Mock Database (in-memory)
// ============================================================

const hashPass = (p: string) => `hashed_${p}` // mock hash

let mockUsers: User[] = [
  { id: 1, username: 'admin', full_name: 'Administrator', role: 'admin', department: 'ALL', is_active: true, created_at: '2026-01-01T08:00:00Z' },
  { id: 2, username: 'manager.it', full_name: 'Budi Santoso', role: 'manager', department: 'IT', is_active: true, created_at: '2026-01-01T08:00:00Z' },
  { id: 3, username: 'manager.mnt', full_name: 'Sari Dewi', role: 'manager', department: 'MNT', is_active: true, created_at: '2026-01-01T08:00:00Z' },
  { id: 4, username: 'staff.it', full_name: 'Ahmad Fauzi', role: 'staff', department: 'IT', is_active: true, created_at: '2026-01-02T08:00:00Z' },
  { id: 5, username: 'staff.mnt', full_name: 'Rudi Hartono', role: 'staff', department: 'MNT', is_active: true, created_at: '2026-01-02T08:00:00Z' },
  { id: 6, username: 'user1', full_name: 'Dewi Rahayu', role: 'requester', department: 'HR', is_active: true, created_at: '2026-01-03T08:00:00Z' },
  { id: 7, username: 'user2', full_name: 'Hendra Wijaya', role: 'requester', department: 'IT', is_active: true, created_at: '2026-01-03T08:00:00Z' },
]

const passwords: Record<number, string> = {
  1: hashPass('admin123'),
  2: hashPass('pass123'),
  3: hashPass('pass123'),
  4: hashPass('pass123'),
  5: hashPass('pass123'),
  6: hashPass('pass123'),
  7: hashPass('pass123'),
}

let mockTickets: TicketDetail[] = [
  {
    id: 1, ticket_no: 'IT-202605-0001', title: 'Laptop tidak bisa connect WiFi di lantai 3',
    description: 'Sejak kemarin laptop unit Finance tidak bisa terhubung ke WiFi kantor. Sudah coba restart tapi tidak berhasil.',
    category: 'IT', priority: 'P1', status: 'IN_PROGRESS',
    requester: mockUsers[6], assignee: mockUsers[3],
    sla_due: new Date(Date.now() - 2 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 6 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 3600000).toISOString(),
    comment_count: 2, is_overdue: true,
    comments: [
      { id: 1, ticket_id: 1, user: mockUsers[3], content: 'Sudah cek, kemungkinan driver WiFi corrupt. Sedang proses reinstall.', created_at: new Date(Date.now() - 2 * 3600000).toISOString() },
    ],
    attachments: [],
    activity_log: [
      { id: 1, ticket_id: 1, user: mockUsers[1], action: 'ASSIGN', new_value: 'Ahmad Fauzi', created_at: new Date(Date.now() - 5 * 3600000).toISOString() },
      { id: 2, ticket_id: 1, user: mockUsers[3], action: 'STATUS_CHANGE', old_value: 'OPEN', new_value: 'IN_PROGRESS', created_at: new Date(Date.now() - 4 * 3600000).toISOString() },
    ],
  },
  {
    id: 2, ticket_no: 'MNT-202605-0002', title: 'AC ruang meeting lantai 2 mati total',
    description: 'AC di ruang meeting Lantai 2 sudah 2 hari tidak berfungsi. Sangat mengganggu rapat.',
    category: 'MNT', priority: 'P2', status: 'OPEN',
    requester: mockUsers[5], assignee: undefined,
    sla_due: calculateSlaDeadline('P2', new Date(Date.now() - 4 * 3600000).toISOString()),
    created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 3600000).toISOString(),
    comment_count: 0, is_overdue: false,
    comments: [], attachments: [], activity_log: [],
  },
  {
    id: 3, ticket_no: 'HR-202605-0003', title: 'Permohonan Surat Keterangan Kerja',
    description: 'Mohon dibuatkan surat keterangan kerja untuk keperluan KPR.',
    category: 'HR', priority: 'P3', status: 'PENDING',
    requester: mockUsers[5], assignee: mockUsers[6],
    sla_due: calculateSlaDeadline('P3', new Date(Date.now() - 20 * 3600000).toISOString()),
    created_at: new Date(Date.now() - 20 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 3600000).toISOString(),
    comment_count: 1, is_overdue: false,
    comments: [
      { id: 2, ticket_id: 3, user: mockUsers[6], content: 'Mohon lampirkan fotokopi KTP dan slip gaji 3 bulan terakhir.', created_at: new Date(Date.now() - 5 * 3600000).toISOString() },
    ],
    attachments: [], activity_log: [],
  },
  {
    id: 4, ticket_no: 'PRC-202605-0004', title: 'Pengadaan ATK Q2 2026',
    description: 'Permohonan pengadaan alat tulis kantor untuk kebutuhan Q2 2026. Estimasi 500rb.',
    category: 'PRC', priority: 'P4', status: 'RESOLVED',
    requester: mockUsers[1], assignee: mockUsers[1],
    sla_due: calculateSlaDeadline('P4', new Date(Date.now() - 72 * 3600000).toISOString()),
    created_at: new Date(Date.now() - 72 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 3600000).toISOString(),
    resolved_at: new Date(Date.now() - 10 * 3600000).toISOString(),
    comment_count: 3, is_overdue: false,
    comments: [], attachments: [], activity_log: [],
  },
  {
    id: 5, ticket_no: 'IT-202605-0005', title: 'Install software AutoCAD untuk desainer',
    description: 'Tim desainer membutuhkan AutoCAD 2026 untuk project baru. Mohon instalasi di 3 unit laptop.',
    category: 'IT', priority: 'P3', status: 'OPEN',
    requester: mockUsers[6], assignee: undefined,
    sla_due: calculateSlaDeadline('P3', new Date(Date.now() - 2 * 3600000).toISOString()),
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    comment_count: 0, is_overdue: false,
    comments: [], attachments: [], activity_log: [],
  },
  {
    id: 6, ticket_no: 'IT-202605-0006', title: 'Printer kantor tidak bisa print dokumen PDF',
    description: 'Printer di ruang admin tidak bisa mencetak file PDF. Bisa print Word tapi tidak PDF.',
    category: 'IT', priority: 'P2', status: 'CLOSED',
    requester: mockUsers[5], assignee: mockUsers[3],
    sla_due: calculateSlaDeadline('P2', new Date(Date.now() - 48 * 3600000).toISOString()),
    created_at: new Date(Date.now() - 48 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    resolved_at: new Date(Date.now() - 30 * 3600000).toISOString(),
    closed_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    comment_count: 4, is_overdue: false,
    comments: [], attachments: [], activity_log: [],
  },
  {
    id: 7, ticket_no: 'MNT-202605-0007', title: 'Kebocoran air di plafon ruang server',
    description: 'Ditemukan kebocoran air di plafon dekat ruang server. Berpotensi membahayakan perangkat.',
    category: 'MNT', priority: 'P1', status: 'IN_PROGRESS',
    requester: mockUsers[3], assignee: mockUsers[4],
    sla_due: new Date(Date.now() - 24 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 28 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 3600000).toISOString(),
    comment_count: 5, is_overdue: true,
    comments: [], attachments: [], activity_log: [],
  },
  {
    id: 8, ticket_no: 'HR-202605-0008', title: 'Pengajuan Cuti Tahunan - Juni 2026',
    description: 'Permohonan cuti tahunan selama 5 hari kerja pada tanggal 16-20 Juni 2026.',
    category: 'HR', priority: 'P4', status: 'OPEN',
    requester: mockUsers[3], assignee: undefined,
    sla_due: calculateSlaDeadline('P4', new Date(Date.now() - 1 * 3600000).toISOString()),
    created_at: new Date(Date.now() - 1 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 3600000).toISOString(),
    comment_count: 0, is_overdue: false,
    comments: [], attachments: [], activity_log: [],
  },
]

let ticketCounter = mockTickets.length + 1
let userCounter = mockUsers.length + 1

let mockNotifications: Notification[] = [
  { id: 1, user_id: 2, ticket_id: 1, ticket_no: 'IT-202605-0001', message: 'Ticket IT-202605-0001 sudah overdue SLA', is_read: false, created_at: new Date(Date.now() - 30 * 60000).toISOString() },
  { id: 2, user_id: 2, ticket_id: 2, ticket_no: 'MNT-202605-0002', message: 'Ticket baru masuk: AC ruang meeting lantai 2 mati total', is_read: false, created_at: new Date(Date.now() - 4 * 3600000).toISOString() },
  { id: 3, user_id: 4, ticket_id: 1, ticket_no: 'IT-202605-0001', message: 'Ticket IT-202605-0001 di-assign ke Anda', is_read: true, created_at: new Date(Date.now() - 5 * 3600000).toISOString() },
]

let sessionStore: Record<string, User> = {}

// ============================================================
// Auth Commands
// ============================================================

export async function login(username: string, password: string): Promise<AuthSession> {
  await delay(300)
  const user = mockUsers.find(u => u.username === username && u.is_active)
  if (!user) throw new Error('Username atau password salah')
  const expectedHash = hashPass(password)
  if (passwords[user.id] !== expectedHash) throw new Error('Username atau password salah')
  const token = `token_${user.id}_${Date.now()}`
  sessionStore[token] = user
  return { user, token }
}

export async function logout(token: string): Promise<void> {
  await delay(100)
  delete sessionStore[token]
}

export async function getCurrentUser(token: string): Promise<User | null> {
  return sessionStore[token] ?? null
}

// ============================================================
// Ticket Commands
// ============================================================

export async function getTickets(
  filter: TicketFilter,
  page: number,
  limit: number,
  currentUser: User
): Promise<PaginatedResult<Ticket>> {
  await delay(200)

  let filtered = [...mockTickets] as Ticket[]

  // Role-based filtering
  if (currentUser.role === 'staff') {
    filtered = filtered.filter(t => t.assignee?.id === currentUser.id)
  } else if (currentUser.role === 'requester') {
    filtered = filtered.filter(t => t.requester.id === currentUser.id)
  } else if (currentUser.role === 'manager') {
    filtered = filtered.filter(t => t.category === currentUser.department)
  }

  if (filter.category) filtered = filtered.filter(t => t.category === filter.category)
  if (filter.status) filtered = filtered.filter(t => t.status === filter.status)
  if (filter.priority) filtered = filtered.filter(t => t.priority === filter.priority)
  if (filter.assignee_id) filtered = filtered.filter(t => t.assignee?.id === filter.assignee_id)
  if (filter.requester_id) filtered = filtered.filter(t => t.requester.id === filter.requester_id)
  if (filter.search) {
    const q = filter.search.toLowerCase()
    filtered = filtered.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.ticket_no.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q)
    )
  }

  // Sort: overdue first, then by created_at desc
  filtered.sort((a, b) => {
    if (a.is_overdue && !b.is_overdue) return -1
    if (!a.is_overdue && b.is_overdue) return 1
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const total = filtered.length
  const data = filtered.slice((page - 1) * limit, page * limit)
  return { data, total, page, limit }
}

export async function getTicket(id: number): Promise<TicketDetail> {
  await delay(150)
  const ticket = mockTickets.find(t => t.id === id)
  if (!ticket) throw new Error('Ticket tidak ditemukan')
  return { ...ticket }
}

export async function createTicket(payload: CreateTicketPayload, requester: User): Promise<Ticket> {
  await delay(400)
  const catCount = mockTickets.filter(t => t.category === payload.category).length + 1
  const ticket_no = generateTicketNo(payload.category, ticketCounter++)
  const now = new Date().toISOString()
  const newTicket: TicketDetail = {
    id: mockTickets.length + 1,
    ticket_no,
    title: payload.title,
    description: payload.description,
    category: payload.category,
    priority: payload.priority,
    status: 'OPEN',
    requester,
    assignee: undefined,
    sla_due: calculateSlaDeadline(payload.priority),
    desired_due: payload.desired_due,
    created_at: now,
    updated_at: now,
    comment_count: 0,
    is_overdue: false,
    comments: [],
    attachments: [],
    activity_log: [
      { id: Date.now(), ticket_id: mockTickets.length + 1, user: requester, action: 'CREATE', new_value: ticket_no, created_at: now }
    ],
  }
  mockTickets.unshift(newTicket)

  // Add notification to managers of that dept
  const managers = mockUsers.filter(u => u.role === 'manager' && (u.department === payload.category || u.department === 'ALL'))
  managers.forEach(m => {
    mockNotifications.unshift({
      id: Date.now() + m.id,
      user_id: m.id,
      ticket_id: newTicket.id,
      ticket_no: newTicket.ticket_no,
      message: `Ticket baru masuk: ${newTicket.title}`,
      is_read: false,
      created_at: now,
    })
  })

  return newTicket
}

export async function updateTicketStatus(
  id: number, status: string, actor: User, comment?: string
): Promise<Ticket> {
  await delay(300)
  const idx = mockTickets.findIndex(t => t.id === id)
  if (idx === -1) throw new Error('Ticket tidak ditemukan')
  const ticket = mockTickets[idx]
  const now = new Date().toISOString()
  const oldStatus = ticket.status

  mockTickets[idx] = {
    ...ticket,
    status: status as any,
    updated_at: now,
    resolved_at: status === 'RESOLVED' ? now : ticket.resolved_at,
    closed_at: status === 'CLOSED' ? now : ticket.closed_at,
    is_overdue: ticket.sla_due ? new Date() > new Date(ticket.sla_due) : false,
    activity_log: [
      ...ticket.activity_log,
      { id: Date.now(), ticket_id: id, user: actor, action: 'STATUS_CHANGE', old_value: oldStatus, new_value: status, created_at: now },
    ],
    comments: comment ? [
      ...ticket.comments,
      { id: Date.now(), ticket_id: id, user: actor, content: comment, created_at: now }
    ] : ticket.comments,
    comment_count: comment ? ticket.comment_count + 1 : ticket.comment_count,
  }

  return mockTickets[idx]
}

export async function assignTicket(id: number, assigneeId: number, actor: User): Promise<Ticket> {
  await delay(300)
  const idx = mockTickets.findIndex(t => t.id === id)
  if (idx === -1) throw new Error('Ticket tidak ditemukan')
  const assignee = mockUsers.find(u => u.id === assigneeId)
  if (!assignee) throw new Error('User tidak ditemukan')
  const now = new Date().toISOString()

  mockTickets[idx] = {
    ...mockTickets[idx],
    assignee,
    updated_at: now,
    activity_log: [
      ...mockTickets[idx].activity_log,
      { id: Date.now(), ticket_id: id, user: actor, action: 'ASSIGN', new_value: assignee.full_name, created_at: now },
    ],
  }

  // Notification to assignee
  mockNotifications.unshift({
    id: Date.now(),
    user_id: assigneeId,
    ticket_id: id,
    ticket_no: mockTickets[idx].ticket_no,
    message: `Ticket ${mockTickets[idx].ticket_no} di-assign ke Anda`,
    is_read: false,
    created_at: now,
  })

  return mockTickets[idx]
}

export async function addComment(ticketId: number, content: string, user: User): Promise<Comment> {
  await delay(200)
  const idx = mockTickets.findIndex(t => t.id === ticketId)
  if (idx === -1) throw new Error('Ticket tidak ditemukan')
  const now = new Date().toISOString()
  const comment: Comment = { id: Date.now(), ticket_id: ticketId, user, content, created_at: now }
  mockTickets[idx] = {
    ...mockTickets[idx],
    comments: [...mockTickets[idx].comments, comment],
    comment_count: mockTickets[idx].comment_count + 1,
    updated_at: now,
  }
  return comment
}

// ============================================================
// User Commands
// ============================================================

export async function getUsers(): Promise<User[]> {
  await delay(200)
  return [...mockUsers]
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  await delay(400)
  if (mockUsers.find(u => u.username === payload.username)) {
    throw new Error('Username sudah digunakan')
  }
  const newUser: User = {
    id: userCounter++,
    username: payload.username,
    full_name: payload.full_name,
    role: payload.role,
    department: payload.department,
    is_active: true,
    created_at: new Date().toISOString(),
  }
  passwords[newUser.id] = hashPass(payload.password)
  mockUsers.push(newUser)
  return newUser
}

export async function updateUser(id: number, payload: UpdateUserPayload): Promise<User> {
  await delay(300)
  const idx = mockUsers.findIndex(u => u.id === id)
  if (idx === -1) throw new Error('User tidak ditemukan')
  mockUsers[idx] = { ...mockUsers[idx], ...payload }
  return mockUsers[idx]
}

export async function resetPassword(userId: number, newPassword: string): Promise<void> {
  await delay(300)
  const user = mockUsers.find(u => u.id === userId)
  if (!user) throw new Error('User tidak ditemukan')
  passwords[userId] = hashPass(newPassword)
}

// ============================================================
// Dashboard
// ============================================================

export async function getDashboardStats(currentUser: User): Promise<DashboardStats> {
  await delay(300)

  let relevantTickets = [...mockTickets]
  if (currentUser.role === 'manager') {
    relevantTickets = relevantTickets.filter(t => t.category === currentUser.department)
  }

  const now = new Date()
  const thisMonth = now.getMonth()
  const thisYear = now.getFullYear()

  const totalOpen = relevantTickets.filter(t => t.status === 'OPEN').length
  const totalInProgress = relevantTickets.filter(t => t.status === 'IN_PROGRESS').length
  const totalOverdue = relevantTickets.filter(t => t.is_overdue && t.status !== 'CLOSED' && t.status !== 'RESOLVED').length
  const totalResolvedThisMonth = relevantTickets.filter(t => {
    if (!t.resolved_at) return false
    const d = new Date(t.resolved_at)
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear
  }).length

  const byCategory = (['IT', 'MNT', 'HR', 'PRC'] as const).map(cat => ({
    category: cat,
    count: relevantTickets.filter(t => t.category === cat).length,
  }))

  // Weekly trend (last 4 weeks)
  const trend_weekly = Array.from({ length: 4 }, (_, i) => {
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - (3 - i) * 7)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)
    const count = relevantTickets.filter(t => {
      const d = new Date(t.created_at)
      return d >= weekStart && d < weekEnd
    }).length
    return { week: `W${i + 1}`, count }
  })

  const overdueTickets = relevantTickets
    .filter(t => t.is_overdue && t.status !== 'CLOSED')
    .slice(0, 5)

  const topUnresolved = relevantTickets
    .filter(t => t.status !== 'CLOSED' && t.status !== 'RESOLVED')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .slice(0, 5)

  return {
    total_open: totalOpen,
    total_in_progress: totalInProgress,
    total_overdue: totalOverdue,
    total_resolved_this_month: totalResolvedThisMonth,
    by_category: byCategory,
    trend_weekly,
    overdue_tickets: overdueTickets,
    top_unresolved: topUnresolved,
  }
}

// ============================================================
// Notifications
// ============================================================

export async function getNotifications(userId: number): Promise<Notification[]> {
  await delay(100)
  return mockNotifications.filter(n => n.user_id === userId).slice(0, 20)
}

export async function markNotificationRead(id: number): Promise<void> {
  await delay(100)
  const n = mockNotifications.find(n => n.id === id)
  if (n) n.is_read = true
}

export async function markAllNotificationsRead(userId: number): Promise<void> {
  await delay(100)
  mockNotifications.filter(n => n.user_id === userId).forEach(n => { n.is_read = true })
}

// ============================================================
// Helpers
// ============================================================

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function getStaffByDepartment(dept: string): User[] {
  return mockUsers.filter(u => (u.department === dept || u.department === 'ALL') && u.role === 'staff' && u.is_active)
}
