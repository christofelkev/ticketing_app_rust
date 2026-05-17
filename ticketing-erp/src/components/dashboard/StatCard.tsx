import React from 'react'
import { cn } from '../../lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  trend?: string
  isAlert?: boolean
  className?: string
}

export const StatCard: React.FC<StatCardProps> = ({
  title, value, icon: Icon, iconColor = 'text-primary', iconBg = 'bg-primary/10',
  trend, isAlert, className
}) => {
  return (
    <div className={cn(
      'stat-card transition-shadow hover:shadow-md',
      isAlert && 'border-red-200 bg-red-50',
      className
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-text-sub uppercase tracking-wide">{title}</p>
          <p className={cn('text-3xl font-bold mt-1', isAlert ? 'text-red-600' : 'text-text-main')}>
            {value}
          </p>
          {trend && (
            <p className="text-xs text-text-muted mt-1">{trend}</p>
          )}
        </div>
        <div className={cn('p-3 rounded-xl', isAlert ? 'bg-red-100' : iconBg)}>
          <Icon className={cn('w-6 h-6', isAlert ? 'text-red-600' : iconColor)} />
        </div>
      </div>
    </div>
  )
}

export const StatCardSkeleton: React.FC = () => (
  <div className="stat-card animate-pulse">
    <div className="flex items-start justify-between">
      <div className="space-y-2">
        <div className="h-3 w-24 bg-gray-200 rounded" />
        <div className="h-8 w-16 bg-gray-200 rounded" />
      </div>
      <div className="w-12 h-12 bg-gray-200 rounded-xl" />
    </div>
  </div>
)
