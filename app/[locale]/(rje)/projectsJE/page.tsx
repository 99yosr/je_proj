'use client'

import { useEffect, useState, useMemo } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import ProjectsChartCard from '../components/projByYear'
import './style.css'
import FeedbackStatsCard from '../components/AvgNote'
import SearchBar from '../../(admin)/components/SearchBar'

type Project = {
  id: number
  titre: string
  description: string
  statut: string
  dateDebut: string | null
  dateFin: string
  revenu: number | null
  juniorId: number
  createdAt: string
  updatedAt: string
  Junior?: {
    id: number
    name: string
  }
}

type ProjectFormData = {
  titre: string
  description: string
  statut: string
  dateDebut: string
  dateFin: string
}

type User = {
  id: string
  email: string
  name: string
  role: string
  juniorId: number | null
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [formData, setFormData] = useState<ProjectFormData>({
    titre: '',
    description: '',
    statut: 'EN_ATTENTE',
    dateDebut: '',
    dateFin: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Filter projects based on search query
  const filteredProjects = useMemo(() => {
    if (!searchQuery) return projects
    
    const query = searchQuery.toLowerCase()
    return projects.filter(project =>
      project.titre.toLowerCase().includes(query) ||
      project.description.toLowerCase().includes(query) ||
      project.statut.toLowerCase().includes(query)
    )
  }, [projects, searchQuery])

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
        await fetchProjects(userData.juniorId)
      } else {
        setError('You are not associated with any Junior Enterprise')
        setLoading(false)
      }
    } catch (err) {
      setError('Failed to authenticate. Please login.')
      setLoading(false)
    }
  }

  const fetchProjects = async (juniorId: number) => {
    try {
      const res = await fetch(`/api/projects?juniorId=${juniorId}`, {
        credentials: 'include',
      })

      if (!res.ok) {
        throw new Error('Failed to fetch projects')
      }

      const data = await res.json()
      setProjects(data)
    } catch (err) {
      setError('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this project?')) return

    const res = await fetch(`/api/projects/${id}`, {
      method: 'DELETE',
    })

    if (res.ok) {
      setProjects(prev => prev.filter(item => item.id !== id))
    } else {
      alert('Failed to delete project')
    }
  }

  const handleOpenModal = (project?: Project) => {
    if (project) {
      setEditingProject(project)
      setFormData({
        titre: project.titre,
        description: project.description,
        statut: project.statut,
        dateDebut: project.dateDebut ? project.dateDebut.split('T')[0] : '',
        dateFin: project.dateFin.split('T')[0]
      })
    } else {
      setEditingProject(null)
      setFormData({
        titre: '',
        description: '',
        statut: 'EN_ATTENTE',
        dateDebut: '',
        dateFin: ''
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingProject(null)
    setFormData({
      titre: '',
      description: '',
      statut: 'EN_ATTENTE',
      dateDebut: '',
      dateFin: ''
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentUser?.juniorId) {
      alert('No junior enterprise associated with your account')
      return
    }
    
    // Date validation
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const endDate = new Date(formData.dateFin)
    endDate.setHours(0, 0, 0, 0)
    
    if (endDate < today) {
      alert('End date cannot be in the past')
      return
    }
    
    if (formData.dateDebut) {
      const startDate = new Date(formData.dateDebut)
      startDate.setHours(0, 0, 0, 0)
      
      if (endDate < startDate) {
        alert('End date cannot be before start date')
        return
      }
    }
    
    setSubmitting(true)

    try {
      if (editingProject) {
        // Update existing project
        const res = await fetch(`/api/projects/${editingProject.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            titre: formData.titre,
            description: formData.description,
            statut: formData.statut,
            dateDebut: formData.dateDebut || null,
            dateFin: formData.dateFin,
          }),
        })

        if (res.ok) {
          await fetchProjects(currentUser.juniorId)
          handleCloseModal()
        } else {
          alert('Failed to update project')
        }
      } else {
        // Create new project
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            titre: formData.titre,
            description: formData.description,
            statut: formData.statut,
            dateDebut: formData.dateDebut || null,
            dateFin: formData.dateFin,
            juniorId: currentUser.juniorId
          }),
        })

        if (res.ok) {
          await fetchProjects(currentUser.juniorId)
          handleCloseModal()
        } else {
          const errorData = await res.json()
          alert(errorData.error || 'Failed to create project')
        }
      }
    } catch (err) {
      alert('An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadgeClass = (statut: string) => {
    switch (statut) {
      case 'EN_COURS':
        return 'status-in-progress'
      case 'TERMINE':
        return 'status-completed'
      case 'EN_ATTENTE':
      default:
        return 'status-pending'
    }
  }

  const getStatusLabel = (statut: string) => {
    switch (statut) {
      case 'EN_COURS':
        return 'In Progress'
      case 'TERMINE':
        return 'Completed'
      case 'EN_ATTENTE':
        return 'Pending'
      default:
        return statut
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="spinner"></div>
          <p className="loading-text">Loading projects...</p>
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
    <div className="projects-page">
      <div className="projects-container">
        {/* Header */}
        <div className="projects-header">
          <h1 className="projects-title">My Projects</h1>
          <p className="projects-subtitle">
            Manage your Junior Enterprise projects and track their progress
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <SearchBar
            onSearch={setSearchQuery}
            placeholder="Search projects by title, description, or status..."
          />
        </div>

        {/* Table Card */}
        <div className="table-card">
          <div className="table-wrapper">
            <table className="projects-table">
              <thead className="table-head">
                <tr>
                  <th className="table-header">Title</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">End Date</th>
                  <th className="table-header table-header-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="empty-state">
                      {searchQuery ? 'No projects found matching your search.' : 'No projects found. Create your first project!'}
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map(item => (
                    <tr key={item.id} className="table-row">
                      <td className="table-cell">
                        <div className="project-info">
                          <div>
                            <div className="project-title">
                              {item.titre}
                            </div>
                            <div className="project-description-preview">
                              {item.description.substring(0, 80)}
                              {item.description.length > 80 ? '...' : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="table-cell">
                        <span className={`status-badge ${getStatusBadgeClass(item.statut)}`}>
                          {getStatusLabel(item.statut)}
                        </span>
                      </td>

                      <td className="table-cell">
                        <div className="project-date">
                          {formatDate(item.dateFin)}
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
              Total projects: <span className="footer-count">{projects.length}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Floating Add Button */}
      <button 
        className="floating-add-button"
        onClick={() => handleOpenModal()}
        title="Add new project"
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
                {editingProject ? 'Edit Project' : 'Add Project'}
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
                <label className="form-label" htmlFor="titre">
                  Title *
                </label>
                <input
                  id="titre"
                  type="text"
                  className="form-input"
                  value={formData.titre}
                  onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                  required
                  placeholder="Enter project title"
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
                  placeholder="Enter project description"
                  rows={6}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="statut">
                  Status *
                </label>
                <select
                  id="statut"
                  className="form-input"
                  value={formData.statut}
                  onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                  required
                >
                  <option value="EN_ATTENTE">Pending</option>
                  <option value="EN_COURS">In Progress</option>
                  <option value="TERMINE">Completed</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="dateDebut">
                    Start Date
                  </label>
                  <input
                    id="dateDebut"
                    type="date"
                    className="form-input"
                    value={formData.dateDebut}
                    onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="dateFin">
                    End Date *
                  </label>
                  <input
                    id="dateFin"
                    type="date"
                    className="form-input"
                    value={formData.dateFin}
                    onChange={(e) => setFormData({ ...formData, dateFin: e.target.value })}
                    required
                  />
                </div>
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
                  {submitting ? 'Saving...' : editingProject ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
