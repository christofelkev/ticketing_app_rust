import React, { useState, useRef, useEffect } from 'react'
import { Bell, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useUIStore } from '../../store/uiStore'
import { formatRelativeTime } from '../../lib/utils'
import { cn } from '../../lib/utils'
import { Avatar } from '../ui/Badge'

interface TopBarProps {
  breadcrumbs?: { label: string; to?: string }[]
}

export const TopBar: React.FC<TopBarProps> = ({ breadcrumbs = [] }) => {
  const { user, logout } = useAuthStore()
  const { notifications, notifUnreadCount, markNotifRead, markAllNotifRead, fetchNotifications } = useUIStore()
  const navigate = useNavigate()
  const [showNotif, setShowNotif] = useState(false)
  const [showUser, setShowUser] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (user) fetchNotifications(user.id)
  }, [user?.id])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotif(false)
      if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUser(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!user) return null

  return (
    <header className="h-14 bg-white border-b border-border flex items-center justify-between px-6 flex-shrink-0">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm">
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-text-muted" />}
            <span className={cn(
              idx === breadcrumbs.length - 1
                ? 'text-text-main font-medium'
                : 'text-text-muted hover:text-text-sub cursor-pointer'
            )}
              onClick={() => crumb.to && navigate(crumb.to)}
            >
              {crumb.label}
            </span>
          </React.Fragment>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        {/* Notification Bell */}
        <div ref={notifRef} className="relative">
          <button
            id="notif-bell"
            onClick={() => setShowNotif(v => !v)}
            className="relative p-2 rounded-lg text-text-sub hover:bg-gray-100 hover:text-text-main transition-colors"
          >
            <Bell className="w-5 h-5" />
            {notifUnreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {notifUnreadCount > 9 ? '9+' : notifUnreadCount}
              </span>
            )}
          </button>

          {showNotif && (
            <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-border z-50 animate-scale-in overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="font-semibold text-sm text-text-main">Notifikasi</span>
                {notifUnreadCount > 0 && (
                  <button
                    onClick={() => markAllNotifRead(user.id)}
                    className="text-xs text-primary hover:underline"
                  >
                    Tandai semua dibaca
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-border">
                {notifications.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-text-muted text-center">Tidak ada notifikasi</p>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markNotifRead(n.id)
                        if (n.ticket_id) navigate(`/tickets/${n.ticket_id}`)
                        setShowNotif(false)
                      }}
                      className={cn(
                        'px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors',
                        !n.is_read && 'bg-blue-50/50'
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />}
                        <div className={cn(!n.is_read ? '' : 'pl-4')}>
                          <p className="text-xs text-text-main leading-relaxed">{n.message}</p>
                          <p className="text-[11px] text-text-muted mt-0.5">{formatRelativeTime(n.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Dropdown */}
        <div ref={userRef} className="relative">
          <button
            id="user-menu"
            onClick={() => setShowUser(v => !v)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Avatar name={user.full_name} size="sm" />
            <div className="text-left hidden sm:block">
              <p className="text-xs font-medium text-text-main">{user.full_name}</p>
              <p className="text-[10px] text-text-muted capitalize">{user.role}</p>
            </div>
          </button>

          {showUser && (
            <div className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-xl border border-border z-50 animate-scale-in overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-xs font-semibold text-text-main">{user.full_name}</p>
                <p className="text-[11px] text-text-muted">@{user.username}</p>
              </div>
              <button
                onClick={async () => { await logout(); navigate('/login') }}
                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
              >
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
