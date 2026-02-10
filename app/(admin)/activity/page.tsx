'use client'

import { useEffect, useState, useMemo } from 'react'
import { Pencil, Trash2, Search } from 'lucide-react'
import './style.css'
import ActivitySortControls, { useSortActivity } from '../components/ActivitySort'
import { useSearch } from '../components/SearchContext'
import Filter from '../../components/Filter' // Import du filtre

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
  juniorId: string
}

type Junior = {
  id: number
  name: string
  role: string
  city: string
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [juniors, setJuniors] = useState<Junior[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [formData, setFormData] = useState<ActivityFormData>({
    nom: '',
    description: '',
    juniorId: ''
  })
  const [submitting, setSubmitting] = useState(false)

  // États pour le filtrage
  const [selectedJuniorFilter, setSelectedJuniorFilter] = useState<number | null>(null)
  const [localSearchQuery, setLocalSearchQuery] = useState('')

  const { searchQuery, setSearchQuery } = useSearch()

  // Combiner la recherche locale et globale
  const combinedSearchQuery = localSearchQuery || searchQuery

  // Filter activities based on search query and junior filter
  const filteredActivities = useMemo(() => {
    let data = activities

    // Filtre par junior sélectionné
    if (selectedJuniorFilter) {
      data = data.filter(activity => activity.juniorId === selectedJuniorFilter)
    }

    // Filtre par search query
    if (combinedSearchQuery) {
      const query = combinedSearchQuery.toLowerCase()
      data = data.filter(activity =>
        activity.nom.toLowerCase().includes(query) ||
        activity.description.toLowerCase().includes(query) ||
        activity.junior?.name.toLowerCase().includes(query)
      )
    }

    return data
  }, [activities, combinedSearchQuery, selectedJuniorFilter])

  // Apply sorting to filtered activities
  const { sortedData, sortColumn, sortDirection, handleSort } = useSortActivity(filteredActivities)

  useEffect(() => {
    fetchActivities()
    fetchJuniors()
  }, [])

  const fetchActivities = async () => {
    try {
      const res = await fetch('/api/activity', {
        credentials: 'include',
      })

      if (!res.ok) {
        throw new Error('Failed to fetch activities')
      }

      const data = await res.json()
      setActivities(data)
    } catch (err) {
      setError('You are not authorized or something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const fetchJuniors = async () => {
    try {
      const res = await fetch('/api/juniors', {
        credentials: 'include',
      })

      if (res.ok) {
        const data = await res.json()
        setJuniors(data)
      }
    } catch (err) {
      console.error('Failed to fetch juniors')
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
        description: activity.description,
        juniorId: activity.juniorId.toString()
      })
    } else {
      setEditingActivity(null)
      setFormData({
        nom: '',
        description: '',
        juniorId: ''
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingActivity(null)
    setFormData({
      nom: '',
      description: '',
      juniorId: ''
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
            juniorId: Number(formData.juniorId)
          }),
        })

        if (res.ok) {
          const updatedActivity = await res.json()
          // Fetch the junior details for the updated activity
          const junior = juniors.find(j => j.id === updatedActivity.juniorId)
          const activityWithJunior = {
            ...updatedActivity,
            junior: junior || { id: updatedActivity.juniorId, name: 'Unknown' }
          }
          setActivities(prev => prev.map(item =>
            item.id === activityWithJunior.id ? activityWithJunior : item
          ))
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
            juniorId: Number(formData.juniorId)
          }),
        })

        if (res.ok) {
          const newActivity = await res.json()
          // Fetch the junior details for the new activity
          const junior = juniors.find(j => j.id === newActivity.juniorId)
          const activityWithJunior = {
            ...newActivity,
            junior: junior || { id: newActivity.juniorId, name: 'Unknown' }
          }
          setActivities(prev => [activityWithJunior, ...prev])
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

  // Gestionnaires pour les filtres
  const handleJuniorSelect = (juniorId: number | null) => {
    setSelectedJuniorFilter(juniorId)
  }

  const handleSearchChange = (query: string) => {
    setLocalSearchQuery(query)
    // Optionnel: mettre à jour aussi le contexte global
    setSearchQuery(query)
  }

  const handleResetFilters = () => {
    setSelectedJuniorFilter(null)
    setLocalSearchQuery('')
    setSearchQuery('')
  }

  const handleClearSearch = () => {
    setLocalSearchQuery('')
    setSearchQuery('')
  }

  // Préparer les données pour le filtre
  const juniorItemsForFilter = juniors.map(j => ({
    id: j.id,
    name: j.name,
    userType: j.role,
    city: j.city
  }))

  // Vérifier si des filtres sont actifs
  const isAnyFilterActive = selectedJuniorFilter || combinedSearchQuery

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
          <h1 className="activity-title">Activities</h1>
          <p className="activity-subtitle">
            Manage activities for junior enterprises
          </p>
        </div>

        {/* Section de filtrage */}
        <div className="filters-section">
          <div className="filters-row">
            {/* Filtre de recherche */}
            <div className="search-filter-container">
              <div className="filter-label">
                <Search size={16} />
                <span>SEARCH</span>
              </div>
              <div className="search-input-wrapper">

                {combinedSearchQuery && (
                  <button
                    className="clear-search-button"
                    onClick={handleClearSearch}
                    title="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Filtre par junior */}
            <Filter
              title="JUNIOR"
              items={juniorItemsForFilter}
              onSelect={handleJuniorSelect}
              selectedId={selectedJuniorFilter}
              showClearButton={true}
            />
          </div>

          {/* Bouton Reset Filters */}
          {isAnyFilterActive && (
            <div className="filter-actions">
              <button
                className="reset-filters-button"
                onClick={handleResetFilters}
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>

        {/* Table Card */}
        <div className="table-card">
          <div className="table-wrapper">
            <table className="activity-table">
              <thead className="table-head">
                <tr>
                  <ActivitySortControls
                    currentSort={sortColumn}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  />
                </tr>
              </thead>

              <tbody>
                {sortedData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="empty-state">
                      {isAnyFilterActive
                        ? 'No activities match your filters'
                        : 'No activities found'
                      }
                    </td>
                  </tr>
                ) : (
                  sortedData.map(item => (
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
                          {item.description.substring(0, 80)}
                          {item.description.length > 80 ? '...' : ''}
                        </div>
                      </td>

                      <td className="table-cell">
                        <div className="activity-junior">
                          {item.junior?.name || 'N/A'}
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
              Total activities: <span className="footer-count">{sortedData.length}</span>
              {isAnyFilterActive && (
                <span className="filter-indicator">
                  (filtered from {activities.length})
                </span>
              )}
              {isAnyFilterActive && (
                <span className="filter-active-badge">
                  <span className="filter-dot"></span>
                  Filters applied
                </span>
              )}
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

              <div className="form-group">
                <label className="form-label" htmlFor="juniorId">
                  Junior Enterprise *
                </label>
                <select
                  id="juniorId"
                  className="form-input"
                  value={formData.juniorId}
                  onChange={(e) => setFormData({ ...formData, juniorId: e.target.value })}
                  required
                >
                  <option value="">Select a junior enterprise</option>
                  {juniors.map(junior => (
                    <option key={junior.id} value={junior.id}>
                      {junior.name}
                    </option>
                  ))}
                </select>
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