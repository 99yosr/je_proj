'use client'

import { useEffect, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import './style.css'

type Activity = {
  id: number
  nom: string
  description: string
  juniorId: number
  junior: {
    id: number
    name: string
  }
}

type ActivityFormData = {
  nom: string
  description: string
}

type User = {
  id: string
  email: string
  name: string
  role: string
  juniorId: number | null
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [formData, setFormData] = useState<ActivityFormData>({
    nom: '',
    description: ''
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        credentials: 'include',
      })

      if (!res.ok) {
        throw new Error('Not authenticated')
      }

      const userData = await res.json()
      setCurrentUser(userData)

      if (userData.juniorId) {
        await fetchActivities(userData.juniorId)
      } else {
        setError('You are not associated with any Junior Enterprise')
        setLoading(false)
      }
    } catch (err) {
      setError('Failed to authenticate. Please login.')
      setLoading(false)
    }
  }

  const fetchActivities = async (juniorId: number) => {
    try {
      const res = await fetch(`/api/activity?juniorId=${juniorId}`, {
        credentials: 'include',
      })

      if (!res.ok) {
        throw new Error('Failed to fetch activities')
      }

      const data = await res.json()
      setActivities(data)
    } catch (err) {
      setError('Failed to load activities')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this activity?')) return

    const res = await fetch(`/api/activity`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })

    if (res.ok) {
      setActivities(prev => prev.filter(item => item.id !== id))
    } else {
      alert('Failed to delete activity')
    }
  }

  const handleOpenModal = (activity?: Activity) => {
    if (activity) {
      setEditingActivity(activity)
      setFormData({
        nom: activity.nom,
        description: activity.description
      })
    } else {
      setEditingActivity(null)
      setFormData({
        nom: '',
        description: ''
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingActivity(null)
    setFormData({
      nom: '',
      description: ''
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser?.juniorId) {
      alert('No junior enterprise associated with your account')
      return
    }

    setSubmitting(true)

    try {
      if (editingActivity) {
        // Update existing activity
        const res = await fetch('/api/activity', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingActivity.id,
            nom: formData.nom,
            description: formData.description,
            juniorId: currentUser.juniorId
          }),
        })

        if (res.ok) {
          await fetchActivities(currentUser.juniorId)
          handleCloseModal()
        } else {
          alert('Failed to update activity')
        }
      } else {
        // Create new activity
        const res = await fetch('/api/activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nom: formData.nom,
            description: formData.description,
            juniorId: currentUser.juniorId
          }),
        })

        if (res.ok) {
          await fetchActivities(currentUser.juniorId)
          handleCloseModal()
        } else {
          alert('Failed to create activity')
        }
      }
    } catch (err) {
      alert('An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="spinner"></div>
          <p className="loading-text">Loading activities...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-box">
          <p className="error-text">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="activity-page">
      <div className="activity-container">
        {/* Header */}
        <div className="activity-header">
          <h1 className="activity-title">My Activities</h1>
          <p className="activity-subtitle">
            Manage your Junior Enterprise activities
          </p>
        </div>

        {/* Table Card */}
        <div className="table-card">
          <div className="table-wrapper">
            <table className="activity-table">
              <thead className="table-head">
                <tr>
                  <th className="table-header">Activity Name</th>
                  <th className="table-header">Description</th>
                  <th className="table-header table-header-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {activities.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="empty-state">
                      No activities found. Create your first activity!
                    </td>
                  </tr>
                ) : (
                  activities.map(item => (
                    <tr key={item.id} className="table-row">
                      <td className="table-cell">
                        <div className="activity-info">
                          <div>
                            <div className="activity-item-title">
                              {item.nom}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="table-cell">
                        <div className="activity-description">
                          {item.description.substring(0, 100)}
                          {item.description.length > 100 ? '...' : ''}
                        </div>
                      </td>

                      <td className="table-cell actions-cell">
                        <button 
                          className="btn-edit"
                          onClick={() => handleOpenModal(item)}
                          title="Edit"
                        >
                          <Pencil size={18} />
                        </button>
                        <button 
                          className="btn-delete"
                          onClick={() => handleDelete(item.id)}
                          title="Delete"
                        >
                          <Trash2 size={18} />
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
              Total activities: <span className="footer-count">{activities.length}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Floating Add Button */}
      <button 
        className="floating-add-button"
        onClick={() => handleOpenModal()}
        title="Add new activity"
      >
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingActivity ? 'Edit Activity' : 'Add Activity'}
              </h2>
              <button 
                className="modal-close"
                onClick={handleCloseModal}
              >
                <svg 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label className="form-label" htmlFor="nom">
                  Activity Name *
                </label>
                <input
                  id="nom"
                  type="text"
                  className="form-input"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  required
                  placeholder="Enter activity name"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="description">
                  Description *
                </label>
                <textarea
                  id="description"
                  className="form-textarea"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  placeholder="Enter activity description"
                  rows={6}
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={handleCloseModal}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : editingActivity ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
