import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { Layout } from './components/layout/Layout'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { TicketList } from './pages/TicketList'
import { TicketDetail } from './pages/TicketDetail'
import { TicketCreate } from './pages/TicketCreate'
import { UserManagement } from './pages/UserManagement'
import { PlaceholderPage } from './pages/PlaceholderPage'
import type { Role } from './types'

// ============================================================
// Protected Route
// ============================================================
interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: Role[]
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }
  return <>{children}</>
}

// ============================================================
// App Router
// ============================================================
const App: React.FC = () => {
  const { user } = useAuthStore()

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />

      {/* Protected app shell */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />

        <Route path="dashboard" element={<Dashboard />} />

        {/* Tickets */}
        <Route path="tickets" element={<TicketList />} />
        <Route path="tickets/create" element={<TicketCreate />} />
        <Route path="tickets/:id" element={<TicketDetail />} />
        <Route path="my-tickets" element={<TicketList />} />

        {/* Admin only */}
        <Route
          path="users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UserManagement />
            </ProtectedRoute>
          }
        />

        {/* Reports */}
        <Route
          path="reports"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <PlaceholderPage title="Laporan" description="Fitur export laporan ke Excel akan tersedia di v1.1" />
            </ProtectedRoute>
          }
        />

        {/* Settings */}
        <Route
          path="settings"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <PlaceholderPage title="Pengaturan" description="Konfigurasi sistem dan SLA akan tersedia segera" />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>

      {/* Root redirect */}
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
  )
}

export default App
