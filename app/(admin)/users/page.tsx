'use client'

import { useEffect, useState } from 'react'
import { Edit, Trash2, Plus, X } from 'lucide-react'
import './style.css'

type User = {
  id: string
  name: string | null
  email: string
  role?: string
}

type UserFormData = {
  name: string
  email: string
  role: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState<UserFormData>({ name: '', email: '', role: 'USER' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users', { credentials: 'include' })
        if (!res.ok) throw new Error('Failed to fetch users')
        const data = await res.json()
        setUsers(data)
      } catch {
        setError('You are not authorized or something went wrong')
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  const handleOpenModal = (user: User) => {  // require a user
    setEditingUser(user)
    setFormData({
      name: user.name || '',
      email: user.email,
      role: user.role || 'USER',
    })
    setIsModalOpen(true)
  }


  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingUser(null)
    setFormData({ name: '', email: '', role: 'USER' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editingUser) {
        const res = await fetch('/api/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingUser.id, ...formData }),
        })
        if (res.ok) {
          const updatedUser = await res.json()
          setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u))
          handleCloseModal()
        } else alert('Failed to update user')
      } else {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        if (res.ok) {
          const newUser = await res.json()
          setUsers(prev => [newUser, ...prev])
          handleCloseModal()
        } else alert('Failed to create user')
      }
    } catch {
      alert('An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    const res = await fetch('/api/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) setUsers(prev => prev.filter(u => u.id !== id))
    else alert('Failed to delete user')
  }

  if (loading) return (
    <div className="loading-container">
      <div className="loading-content">
        <div className="spinner"></div>
        <p className="loading-text">Loading users...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="error-container">
      <div className="error-box">
        <p className="error-text">{error}</p>
      </div>
    </div>
  )

  return (
    <div className="users-page">
      <div className="users-container">
        {/* Header */}
        <div className="users-header">
          <h1 className="users-title">Users</h1>
          <p className="users-subtitle">Manage your team members and their account permissions</p>
        </div>

        {/* Table */}
        <div className="table-card">
          <div className="table-wrapper">
            <table className="users-table">
              <thead className="table-head">
                <tr>
                  <th className="table-header">Name</th>
                  <th className="table-header">Email</th>
                  <th className="table-header">Role</th>
                  <th className="table-header table-header-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="empty-state">No users found</td>
                  </tr>
                ) : (
                  users.map(user => (
                    <tr key={user.id} className="table-row">
                      <td className="table-cell">
                        <div className="user-info">
                          <div className="user-avatar">
                            {user.name?.charAt(0).toUpperCase() ?? user.email.charAt(0).toUpperCase()}
                          </div>
                          <div className="user-name">{user.name ?? 'No name'}</div>
                        </div>
                      </td>
                      <td className="table-cell">{user.email}</td>
                      <td className="table-cell">
                        <span className={`role-badge ${user.role === 'ADMIN' ? 'role-admin' : 'role-user'}`}>
                          {user.role ?? 'USER'}
                        </span>
                      </td>
                      <td className="table-cell actions-cell">

                        <button className="btn-icon btn-edit" onClick={() => handleOpenModal(user)} title="Edit user">
                          <Edit size={18} />
                        </button>
                        <button className="btn-icon btn-delete" onClick={() => handleDelete(user.id)} title="Delete user">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="table-footer">
            <p className="footer-text">
              Total users: <span className="footer-count">{users.length}</span>
            </p>
          </div>
        </div>

        {/* Floating Add Button */}


        {/* Modal */}
        {isModalOpen && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">{editingUser ? 'Edit User' : 'Add User'}</h2>
                <button className="modal-close" onClick={handleCloseModal}>
                  <X size={18} />
                </button>
              </div>

              <form className="modal-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label" htmlFor="name">Name</label>
                  <input
                    id="name"
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="email">Email *</label>
                  <input
                    id="email"
                    type="email"
                    className="form-input"
                    value={formData.email}
                    required
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="role">Role</label>
                  <select
                    id="role"
                    className="form-input"
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="USER">RJE</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-cancel" onClick={handleCloseModal} disabled={submitting}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-submit" disabled={submitting}>
                    {submitting ? 'Saving...' : editingUser ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
