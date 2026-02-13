'use client'

import { useEffect, useState } from 'react'
import './style.css'

type User = {
  id: string
  name: string | null
  email: string
  role?: string
  nbrmembres?: number
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  useEffect(() => {
    // ... existing fetch logic ...
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users', { credentials: 'include' })
        if (!res.ok) throw new Error('Failed to fetch users')
        const data = await res.json()
        setUsers(data)
      } catch (err) {
        setError('You are not authorized or something went wrong')
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this user?')) return
    const res = await fetch('/api/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      setUsers(prev => prev.filter(user => user.id !== id))
    } else {
      alert('Failed to delete user')
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!editingUser) return

    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingUser),
      })

      if (!res.ok) throw new Error('Failed to update user')

      const updatedUser = await res.json()
      setUsers(prev => prev.map(u => (u.id === updatedUser.id ? updatedUser : u)))
      setEditingUser(null)
    } catch (err) {
      alert('Failed to update user')
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="spinner"></div>
          <p className="loading-text">Loading users...</p>
        </div>
      </div>
    )
  }

  if (error) {
    // ... existing error UI ...
    return (
      <div className="error-container">
        <div className="error-box">
          <p className="error-text">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="users-page">
      <div className="users-container">
        {/* Header */}
        <div className="users-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 className="users-title">Users</h1>
              <p className="users-subtitle">
                Manage your team members and their account permissions
              </p>
            </div>
            <a href="/registerAdmin" className="btn-create">
              Create User
            </a>
          </div>
        </div>

        {/* Table Card */}
        <div className="table-card">
          <div className="table-wrapper">
            <table className="users-table">
              <thead className="table-head">
                <tr>
                  <th className="table-header">Name</th>
                  <th className="table-header">Email</th>
                  <th className="table-header">Members</th>
                  <th className="table-header">Role</th>
                  <th className="table-header table-header-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty-state">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map(user => (
                    <tr key={user.id} className="table-row">
                      <td className="table-cell">
                        <div className="user-info">
                          <div className="user-avatar">
                            <span className="avatar-text">
                              {user.name?.charAt(0).toUpperCase() ??
                                user.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="user-name">
                              {user.name ?? 'No name'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="table-cell">
                        <div className="user-email">{user.email}</div>
                      </td>

                      <td className="table-cell">
                        <div className="user-email">{user.nbrmembres ?? 0}</div>
                      </td>

                      <td className="table-cell">
                        <span className={`role-badge ${user.role === 'ADMIN' ? 'role-admin' : 'role-user'
                          }`}>
                          {user.role ?? 'USER'}
                        </span>
                      </td>

                      <td className="table-cell actions-cell">
                        <button
                          className="btn-edit"
                          onClick={() => setEditingUser(user)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => handleDelete(user.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="table-footer">
            <p className="footer-text">
              Total users: <span className="footer-count">{users.length}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {/* Edit Modal */}
      {editingUser && (
        <div className="modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Edit User</h2>
            <form onSubmit={handleUpdate}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  className="form-input"
                  value={editingUser.name || ''}
                  onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                  placeholder="Full Name"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  type="email"
                  value={editingUser.email}
                  onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                  placeholder="Email Address"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  className="form-input"
                  value={editingUser.role || 'RJE'}
                  onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                >
                  <option value="RJE">RJE</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              {editingUser.role === 'RJE' && (
                <div className="form-group">
                  <label className="form-label">Number of Members</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editingUser.nbrmembres || 0}
                    onChange={e => setEditingUser({ ...editingUser, nbrmembres: Number(e.target.value) })}
                    min="0"
                  />
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setEditingUser(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}