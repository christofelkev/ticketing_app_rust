import React from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { ToastContainer } from '../ui/Toast'

interface LayoutProps {
  breadcrumbs?: { label: string; to?: string }[]
}

export const Layout: React.FC<LayoutProps> = ({ breadcrumbs }) => {
  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar breadcrumbs={breadcrumbs} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
      <ToastContainer />
    </div>
  )
}
