import React, { useEffect, useState } from 'react'
import {
  Plus, Pencil, RotateCcw, UserCheck, UserX, Search, Shield
} from 'lucide-react'
import { useUserStore } from '../store/userStore'
import { useUIStore } from '../store/uiStore'
import { Modal } from '../components/ui/Modal'
import { Avatar } from '../components/ui/Badge'
import { ROLE_CONFIG, DEPARTMENT_CONFIG, USER_ROLES, USER_DEPARTMENTS } from '../lib/constants'
import { formatDate, getRoleDisplayText } from '../lib/utils'
import type { User, CreateUserPayload, UpdateUserPayload, Role, Department } from '../types'
import { cn } from '../lib/utils'

export const UserManagement: React.FC = () => {
  const { users, fetchUsers, createUser, updateUser, resetPassword, isLoading } = useUserStore()
  const { addToast } = useUIStore()
  const [search, setSearch] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [resetUser, setResetUser] = useState<User | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const filtered = users.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase())
  )

  const handleToggleActive = async (user: User) => {
    try {
      await updateUser(user.id, { is_active: !user.is_active })
      addToast('success', `User ${user.full_name} berhasil ${user.is_active ? 'dinonaktifkan' : 'diaktifkan'}`)
    } catch (err: any) {
      addToast('error', err.message)
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Manajemen User</h1>
          <p className="text-sm text-text-sub mt-0.5">{users.length} pengguna terdaftar</p>
        </div>
        <button id="add-user-btn" onClick={() => setShowCreateModal(true)} className="btn-primary">
          <Plus className="w-4 h-4" />
          Tambah User
        </button>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            id="user-search"
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama atau username..."
            className="input pl-9"
          />
        </div>
      </div>

      {/* User Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-text-muted text-sm">Memuat...</div>
        ) : (
          <>
            <div className="grid grid-cols-[48px_1fr_140px_120px_100px_120px] px-5 py-3 bg-gray-50 border-b border-border text-xs font-medium text-text-sub uppercase tracking-wide">
              <span></span>
              <span>Pengguna</span>
              <span>Role</span>
              <span>Departemen</span>
              <span>Status</span>
              <span>Aksi</span>
            </div>
            <div className="divide-y divide-border">
              {filtered.map(user => (
                <div key={user.id} className="grid grid-cols-[48px_1fr_140px_120px_100px_120px] px-5 py-4 items-center">
                  <Avatar name={user.full_name} size="md" />
                  <div className="min-w-0 pr-4">
                    <p className="text-sm font-semibold text-text-main">{user.full_name}</p>
                    <p className="text-xs text-text-muted">@{user.username}</p>
                  </div>
                  <div>
                    <span className={cn('text-xs font-medium', ROLE_CONFIG[user.role].color)}>
                      <Shield className="w-3 h-3 inline mr-1" />
                      {ROLE_CONFIG[user.role].label}
                    </span>
                  </div>
                  <span className="text-xs text-text-sub">{DEPARTMENT_CONFIG[user.department].label}</span>
                  <span className={cn(
                    'inline-flex items-center gap-1.5 text-xs font-medium',
                    user.is_active ? 'text-emerald-700' : 'text-gray-400'
                  )}>
                    <span className={cn('w-1.5 h-1.5 rounded-full', user.is_active ? 'bg-emerald-500' : 'bg-gray-300')} />
                    {user.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      title="Edit"
                      onClick={() => setEditUser(user)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-text-sub transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      title="Reset Password"
                      onClick={() => setResetUser(user)}
                      className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      title={user.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      onClick={() => handleToggleActive(user)}
                      className={cn(
                        'p-1.5 rounded-lg transition-colors',
                        user.is_active ? 'hover:bg-red-50 text-red-600' : 'hover:bg-emerald-50 text-emerald-600'
                      )}
                    >
                      {user.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Create Modal */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={async (payload) => {
          setIsSaving(true)
          try {
            await createUser(payload)
            addToast('success', `User ${payload.username} berhasil dibuat`)
            setShowCreateModal(false)
          } catch (err: any) {
            addToast('error', err.message)
          } finally {
            setIsSaving(false)
          }
        }}
        isSaving={isSaving}
      />

      {/* Edit Modal */}
      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSave={async (payload) => {
            setIsSaving(true)
            try {
              await updateUser(editUser.id, payload)
              addToast('success', 'User berhasil diperbarui')
              setEditUser(null)
            } catch (err: any) {
              addToast('error', err.message)
            } finally {
              setIsSaving(false)
            }
          }}
          isSaving={isSaving}
        />
      )}

      {/* Reset Password Modal */}
      {resetUser && (
        <ResetPasswordModal
          user={resetUser}
          onClose={() => setResetUser(null)}
          onSave={async (newPassword) => {
            setIsSaving(true)
            try {
              await resetPassword(resetUser.id, newPassword)
              addToast('success', `Password ${resetUser.full_name} berhasil direset`)
              setResetUser(null)
            } catch (err: any) {
              addToast('error', err.message)
            } finally {
              setIsSaving(false)
            }
          }}
          isSaving={isSaving}
        />
      )}
    </div>
  )
}

// ---- Sub-components ----

const CreateUserModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  onSave: (p: CreateUserPayload) => Promise<void>
  isSaving: boolean
}> = ({ isOpen, onClose, onSave, isSaving }) => {
  const [form, setForm] = useState<CreateUserPayload>({
    username: '', password: '', full_name: '', role: 'requester', department: 'IT'
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.username.trim()) e.username = 'Wajib diisi'
    if (form.username.length < 3) e.username = 'Minimal 3 karakter'
    if (!form.full_name.trim()) e.full_name = 'Wajib diisi'
    if (!form.password) e.password = 'Wajib diisi'
    if (form.password.length < 6) e.password = 'Minimal 6 karakter'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    await onSave(form)
    setForm({ username: '', password: '', full_name: '', role: 'requester', department: 'IT' })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tambah User Baru" size="md"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Batal</button>
          <button onClick={handleSave} disabled={isSaving} className="btn-primary">
            {isSaving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="label">Nama Lengkap *</label>
          <input className={`input ${errors.full_name ? 'input-error' : ''}`} value={form.full_name}
            onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} placeholder="John Doe" />
          {errors.full_name && <p className="text-xs text-red-600">{errors.full_name}</p>}
        </div>
        <div className="space-y-1">
          <label className="label">Username *</label>
          <input className={`input ${errors.username ? 'input-error' : ''}`} value={form.username}
            onChange={e => setForm(p => ({ ...p, username: e.target.value }))} placeholder="john.doe" />
          {errors.username && <p className="text-xs text-red-600">{errors.username}</p>}
        </div>
        <div className="space-y-1">
          <label className="label">Password *</label>
          <input type="password" className={`input ${errors.password ? 'input-error' : ''}`} value={form.password}
            onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Min. 6 karakter" />
          {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="label">Role</label>
            <select className="input" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value as Role }))}>
              {USER_ROLES.map(r => <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="label">Departemen</label>
            <select className="input" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value as Department }))}>
              {USER_DEPARTMENTS.map(d => <option key={d} value={d}>{DEPARTMENT_CONFIG[d].label}</option>)}
            </select>
          </div>
        </div>
      </div>
    </Modal>
  )
}

const EditUserModal: React.FC<{
  user: User
  onClose: () => void
  onSave: (p: UpdateUserPayload) => Promise<void>
  isSaving: boolean
}> = ({ user, onClose, onSave, isSaving }) => {
  const [form, setForm] = useState({ full_name: user.full_name, role: user.role, department: user.department })

  return (
    <Modal isOpen={true} onClose={onClose} title={`Edit User: ${user.username}`} size="md"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Batal</button>
          <button onClick={() => onSave(form)} disabled={isSaving} className="btn-primary">
            {isSaving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="label">Nama Lengkap</label>
          <input className="input" value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="label">Role</label>
            <select className="input" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value as Role }))}>
              {USER_ROLES.map(r => <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="label">Departemen</label>
            <select className="input" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value as Department }))}>
              {USER_DEPARTMENTS.map(d => <option key={d} value={d}>{DEPARTMENT_CONFIG[d].label}</option>)}
            </select>
          </div>
        </div>
      </div>
    </Modal>
  )
}

const ResetPasswordModal: React.FC<{
  user: User
  onClose: () => void
  onSave: (pw: string) => Promise<void>
  isSaving: boolean
}> = ({ user, onClose, onSave, isSaving }) => {
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (newPassword.length < 6) { setError('Password minimal 6 karakter'); return }
    if (newPassword !== confirm) { setError('Password tidak cocok'); return }
    await onSave(newPassword)
  }

  return (
    <Modal isOpen={true} onClose={onClose} title={`Reset Password: ${user.full_name}`} size="sm"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Batal</button>
          <button onClick={handleSave} disabled={isSaving} className="btn-primary">
            {isSaving ? 'Menyimpan...' : 'Reset Password'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="label">Password Baru</label>
          <input type="password" className="input" value={newPassword}
            onChange={e => { setNewPassword(e.target.value); setError('') }} placeholder="Min. 6 karakter" />
        </div>
        <div className="space-y-1">
          <label className="label">Konfirmasi Password</label>
          <input type="password" className="input" value={confirm}
            onChange={e => { setConfirm(e.target.value); setError('') }} placeholder="Ulangi password baru" />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </Modal>
  )
}
