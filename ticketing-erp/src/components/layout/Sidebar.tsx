import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Ticket, Users, BarChart3, Settings,
  ChevronLeft, ChevronRight, LogOut, Plus, ClipboardList,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useUIStore } from '../../store/uiStore'
import { cn } from '../../lib/utils'
import { COMPANY_NAME } from '../../lib/constants'
import type { Role } from '../../types'

interface NavItem {
  to: string
  icon: React.ElementType
  label: string
  roles: Role[]
}

const navItems: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'manager', 'staff', 'requester'] },
  { to: '/tickets', icon: Ticket, label: 'Semua Ticket', roles: ['admin', 'manager'] },
  { to: '/tickets', icon: ClipboardList, label: 'Ticket Saya', roles: ['staff'] },
  { to: '/tickets/create', icon: Plus, label: 'Buat Ticket', roles: ['requester'] },
  { to: '/my-tickets', icon: ClipboardList, label: 'Ticket Saya', roles: ['requester'] },
  { to: '/users', icon: Users, label: 'Manajemen User', roles: ['admin'] },
  { to: '/reports', icon: BarChart3, label: 'Laporan', roles: ['admin', 'manager'] },
  { to: '/settings', icon: Settings, label: 'Pengaturan', roles: ['admin'] },
]

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuthStore()
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const navigate = useNavigate()

  if (!user) return null

  const visibleItems = navItems.filter(item => item.roles.includes(user.role))

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <aside
      className={cn(
        'flex flex-col bg-sidebar-bg text-sidebar-text transition-all duration-200 flex-shrink-0 relative',
        sidebarCollapsed ? 'w-[60px]' : 'w-[240px]'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-5 border-b border-slate-700',
        sidebarCollapsed && 'justify-center px-0'
      )}>
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          T
        </div>
        {!sidebarCollapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-white truncate">Ticketing ERP</p>
            <p className="text-[10px] text-slate-400 truncate">{COMPANY_NAME}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto">
        <ul className="space-y-1">
          {visibleItems.map((item, idx) => {
            const Icon = item.icon
            return (
              <li key={idx}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'sidebar-item',
                      isActive && 'active',
                      sidebarCollapsed && 'justify-center px-0'
                    )
                  }
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Bottom: User + Collapse */}
      <div className="border-t border-slate-700 p-2 space-y-1">
        {/* User info */}
        {!sidebarCollapsed && (
          <div className="px-3 py-2 flex items-center gap-3">
            <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
              {user.full_name.split(' ').slice(0, 2).map(n => n[0]).join('')}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-medium text-white truncate">{user.full_name}</p>
              <p className="text-[10px] text-slate-400 capitalize truncate">{user.role}</p>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={cn(
            'sidebar-item w-full text-red-400 hover:bg-red-900/30 hover:text-red-300',
            sidebarCollapsed && 'justify-center px-0'
          )}
          title={sidebarCollapsed ? 'Keluar' : undefined}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!sidebarCollapsed && <span>Keluar</span>}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className={cn(
            'sidebar-item w-full',
            sidebarCollapsed && 'justify-center px-0'
          )}
          title={sidebarCollapsed ? 'Expand' : 'Collapse'}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
