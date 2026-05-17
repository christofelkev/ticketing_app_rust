import React from 'react'
import type { Status, Priority, Category } from '../../types'
import { STATUS_CONFIG, PRIORITY_CONFIG, CATEGORY_CONFIG } from '../../lib/constants'
import { cn } from '../../lib/utils'

// ============================================================
// Status Badge
// ============================================================
interface StatusBadgeProps {
  status: Status
  className?: string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const config = STATUS_CONFIG[status]
  return (
    <span className={cn('badge border', config.bg, config.text, config.border, className)}>
      <span className={cn('w-1.5 h-1.5 rounded-full inline-block', config.dot)} />
      {config.label}
    </span>
  )
}

// ============================================================
// Priority Badge
// ============================================================
interface PriorityBadgeProps {
  priority: Priority
  showSla?: boolean
  className?: string
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, showSla, className }) => {
  const config = PRIORITY_CONFIG[priority]
  return (
    <span className={cn('badge', config.bg, config.text, className)}>
      {config.emoji} {config.label}
      {showSla && <span className="text-[10px] opacity-70 ml-0.5">({config.sla_hours}j)</span>}
    </span>
  )
}

// ============================================================
// Category Badge
// ============================================================
interface CategoryBadgeProps {
  category: Category
  className?: string
  showIcon?: boolean
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category, showIcon = true, className }) => {
  const config = CATEGORY_CONFIG[category]
  return (
    <span className={cn('badge', config.bg, config.text, className)}>
      {showIcon && <span>{config.icon}</span>}
      {config.label}
    </span>
  )
}

// ============================================================
// Overdue Badge
// ============================================================
export const OverdueBadge: React.FC<{ className?: string }> = ({ className }) => (
  <span className={cn('badge bg-red-100 text-red-700 border border-red-200', className)}>
    ⚠️ Overdue
  </span>
)

// ============================================================
// User Avatar
// ============================================================
interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const avatarColors = [
  'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-pink-500',
  'bg-teal-500', 'bg-emerald-500', 'bg-amber-500', 'bg-orange-500',
]

export const Avatar: React.FC<AvatarProps> = ({ name, size = 'md', className }) => {
  const initials = name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  const colorIndex = name.charCodeAt(0) % avatarColors.length
  const color = avatarColors[colorIndex]

  const sizeClass = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm',
  }[size]

  return (
    <div className={cn('rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0', color, sizeClass, className)}>
      {initials}
    </div>
  )
}
