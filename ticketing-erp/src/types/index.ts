// ============================================================
// Core Domain Types
// ============================================================

export type Role = 'admin' | 'manager' | 'staff' | 'requester'
export type Department = 'IT' | 'MNT' | 'HR' | 'PRC' | 'ALL'
export type Category = 'IT' | 'MNT' | 'HR' | 'PRC'
export type Priority = 'P1' | 'P2' | 'P3' | 'P4'
export type Status = 'OPEN' | 'IN_PROGRESS' | 'PENDING' | 'RESOLVED' | 'CLOSED'

export interface User {
  id: number
  username: string
  full_name: string
  role: Role
  department: Department
  is_active: boolean
  created_at: string
}

export interface Ticket {
  id: number
  ticket_no: string
  title: string
  description: string
  category: Category
  priority: Priority
  status: Status
  requester: User
  assignee?: User
  sla_due?: string
  desired_due?: string
  resolved_at?: string
  closed_at?: string
  created_at: string
  updated_at: string
  comment_count: number
  is_overdue: boolean
}

export interface TicketDetail extends Ticket {
  comments: Comment[]
  attachments: Attachment[]
  activity_log: ActivityLog[]
}

export interface Comment {
  id: number
  ticket_id: number
  user: User
  content: string
  created_at: string
}

export interface Attachment {
  id: number
  ticket_id: number
  filename: string
  filepath: string
  filesize: number
  uploaded_by: User
  uploaded_at: string
}

export interface ActivityLog {
  id: number
  ticket_id: number
  user: User
  action: 'STATUS_CHANGE' | 'ASSIGN' | 'COMMENT' | 'CREATE' | 'CLOSE' | 'REOPEN'
  old_value?: string
  new_value?: string
  created_at: string
}

export interface Notification {
  id: number
  user_id: number
  ticket_id?: number
  ticket_no?: string
  message: string
  is_read: boolean
  created_at: string
}

// ============================================================
// Filter & Payload Types
// ============================================================

export interface TicketFilter {
  category?: Category
  status?: Status
  priority?: Priority
  assignee_id?: number
  requester_id?: number
  search?: string
  date_from?: string
  date_to?: string
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export interface CreateTicketPayload {
  title: string
  description: string
  category: Category
  priority: Priority
  desired_due?: string
}

export interface CreateUserPayload {
  username: string
  password: string
  full_name: string
  role: Role
  department: Department
}

export interface UpdateUserPayload {
  full_name?: string
  role?: Role
  department?: Department
  is_active?: boolean
}

// ============================================================
// Auth Types
// ============================================================

export interface AuthSession {
  user: User
  token: string
}

// ============================================================
// Dashboard Types
// ============================================================

export interface DashboardStats {
  total_open: number
  total_in_progress: number
  total_overdue: number
  total_resolved_this_month: number
  by_category: { category: Category; count: number }[]
  trend_weekly: { week: string; count: number }[]
  overdue_tickets: Ticket[]
  top_unresolved: Ticket[]
}
