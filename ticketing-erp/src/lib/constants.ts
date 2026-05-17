import type { Category, Priority, Status, Role, Department } from '../types'

// ============================================================
// Status Config
// ============================================================

export const STATUS_CONFIG: Record<Status, {
  label: string
  color: string
  bg: string
  text: string
  border: string
  dot: string
}> = {
  OPEN: {
    label: 'Open',
    color: '#3B82F6',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    color: '#F59E0B',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  PENDING: {
    label: 'Pending',
    color: '#8B5CF6',
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    border: 'border-violet-200',
    dot: 'bg-violet-500',
  },
  RESOLVED: {
    label: 'Resolved',
    color: '#10B981',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  CLOSED: {
    label: 'Closed',
    color: '#6B7280',
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    border: 'border-gray-200',
    dot: 'bg-gray-400',
  },
}

// ============================================================
// Priority Config
// ============================================================

export const PRIORITY_CONFIG: Record<Priority, {
  label: string
  emoji: string
  color: string
  bg: string
  text: string
  sla_hours: number
}> = {
  P1: {
    label: 'Critical',
    emoji: '🔴',
    color: '#EF4444',
    bg: 'bg-red-50',
    text: 'text-red-700',
    sla_hours: 4,
  },
  P2: {
    label: 'High',
    emoji: '🟠',
    color: '#F97316',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    sla_hours: 8,
  },
  P3: {
    label: 'Medium',
    emoji: '🟡',
    color: '#EAB308',
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    sla_hours: 24,
  },
  P4: {
    label: 'Low',
    emoji: '🟢',
    color: '#22C55E',
    bg: 'bg-green-50',
    text: 'text-green-700',
    sla_hours: 72,
  },
}

// ============================================================
// Category Config
// ============================================================

export const CATEGORY_CONFIG: Record<Category, {
  label: string
  icon: string
  code: string
  color: string
  bg: string
  text: string
}> = {
  IT: {
    label: 'IT Support',
    icon: '💻',
    code: 'IT',
    color: '#6366F1',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
  },
  MNT: {
    label: 'Maintenance',
    icon: '🔧',
    code: 'MNT',
    color: '#14B8A6',
    bg: 'bg-teal-50',
    text: 'text-teal-700',
  },
  HR: {
    label: 'HR Request',
    icon: '👥',
    code: 'HR',
    color: '#EC4899',
    bg: 'bg-pink-50',
    text: 'text-pink-700',
  },
  PRC: {
    label: 'Procurement',
    icon: '🛒',
    code: 'PRC',
    color: '#F59E0B',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
  },
}

// ============================================================
// Role Config
// ============================================================

export const ROLE_CONFIG: Record<Role, { label: string; color: string }> = {
  admin: { label: 'Admin / IT', color: 'text-violet-700' },
  manager: { label: 'Manager', color: 'text-blue-700' },
  staff: { label: 'Staff / Teknisi', color: 'text-teal-700' },
  requester: { label: 'Requester', color: 'text-gray-700' },
}

export const DEPARTMENT_CONFIG: Record<Department, { label: string }> = {
  IT: { label: 'IT / Teknologi' },
  MNT: { label: 'Maintenance / Fasilitas' },
  HR: { label: 'HR / SDM' },
  PRC: { label: 'Procurement / Pengadaan' },
  ALL: { label: 'Semua Departemen' },
}

// ============================================================
// Status Transitions (per role)
// ============================================================

export const STATUS_TRANSITIONS: Record<Status, Status[]> = {
  OPEN: ['IN_PROGRESS'],
  IN_PROGRESS: ['PENDING', 'RESOLVED'],
  PENDING: ['IN_PROGRESS', 'RESOLVED'],
  RESOLVED: ['CLOSED', 'IN_PROGRESS'],
  CLOSED: [],
}

export const COMPANY_NAME = 'PT SEKAI ID'
export const APP_VERSION = '1.0.0'

export const TICKET_CATEGORIES: Category[] = ['IT', 'MNT', 'HR', 'PRC']
export const TICKET_PRIORITIES: Priority[] = ['P1', 'P2', 'P3', 'P4']
export const TICKET_STATUSES: Status[] = ['OPEN', 'IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED']
export const USER_ROLES: Role[] = ['admin', 'manager', 'staff', 'requester']
export const USER_DEPARTMENTS: Department[] = ['IT', 'MNT', 'HR', 'PRC', 'ALL']

export const CATEGORY_CHART_COLORS = ['#6366F1', '#14B8A6', '#EC4899', '#F59E0B']
