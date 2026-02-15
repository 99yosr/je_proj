'use client'
import { useEffect, useState, useMemo } from 'react'
import { Pencil, Trash2, Star, MessageSquare } from 'lucide-react'
import './style.css'
import ProjectsSortControls, { useSortProjects } from '../components/ProjectsSort'
import { useSearch } from '../components/SearchContext'
import Filter from '../../../components/Filter'

type Project = {
  id: number
  titre: string
  description: string
  image?: string | null
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
    role: string
    city?: string
  }
}

type Junior = {
  id: number
  name: string
  role: string
  city: string
}

type ProjectFormData = {
  titre: string
  description: string
  statut: string
  dateDebut: string
  dateFin: string
  juniorId: string
}

type FileUploadState = {
  file: File | null
  preview: string
  uploading: boolean
}

// Types for feedback data
type FeedbackStats = {
  global: {
    average: number
    count: number
  }
  projects: {
    overallAverage: number
    totalCount: number
    breakdown: Array<{
      id: number
      title: string
      count: number
      average: number
    }>
  }
  events: {
    overallAverage: number
    totalCount: number
    breakdown: Array<{
      id: number
      title: string
      count: number
      average: number
    }>
  }
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [juniors, setJuniors] = useState<Junior[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [formData, setFormData] = useState<ProjectFormData>({
    titre: '',
    description: '',
    statut: 'EN_ATTENTE',
    dateDebut: '',
    dateFin: '',
    juniorId: ''
  })
  const [fileUpload, setFileUpload] = useState<FileUploadState>({
    file: null,
    preview: '',
    uploading: false
  })
  const [submitting, setSubmitting] = useState(false)

  // États pour le filtrage
  const [selectedJuniorFilter, setSelectedJuniorFilter] = useState<number | null>(null)
  const [onlyJuniors, setOnlyJuniors] = useState(false)
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string | null>(null)

  // États pour le modal de feedback
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false)
  const [selectedProjectForFeedback, setSelectedProjectForFeedback] = useState<Project | null>(null)
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats | null>(null)
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [feedbackError, setFeedbackError] = useState<string | null>(null)

  const { searchQuery } = useSearch()

  // Filter projects based on search query AND filters
  const filteredProjects = useMemo(() => {
    let data = projects

    // Filtre par junior sélectionné
    if (selectedJuniorFilter) {
      data = data.filter(p => p.juniorId === selectedJuniorFilter)
    }

    // Filtre par rôle junior (option "junior only")
    if (onlyJuniors) {
      data = data.filter(p => p.Junior?.role === 'junior')
    }

    // Filtre par statut
    if (selectedStatusFilter) {
      data = data.filter(p => p.statut === selectedStatusFilter)
    }

    // Filtre par search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      data = data.filter(project =>
        project.titre.toLowerCase().includes(query) ||
        project.description.toLowerCase().includes(query) ||
        project.statut.toLowerCase().includes(query) ||
        (project.Junior?.name && project.Junior.name.toLowerCase().includes(query))
      )
    }

    return data
  }, [projects, searchQuery, selectedJuniorFilter, onlyJuniors, selectedStatusFilter])

  // Apply sorting to filtered projects
  const { sortedData, sortColumn, sortDirection, handleSort } = useSortProjects(filteredProjects)

  useEffect(() => {
    fetchProjects()
    fetchJuniors()
  }, [])

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects', {
        credentials: 'include',
      })
      if (!res.ok) {
        throw new Error('Failed to fetch projects')
      }
      const data = await res.json()
      setProjects(data)
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
      console.error('Failed to fetch juniors:', err)
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
        dateFin: project.dateFin.split('T')[0],
        juniorId: project.juniorId.toString()
      })
      setFileUpload({
        file: null,
        preview: project.image || '',
        uploading: false
      })
    } else {
      setEditingProject(null)
      setFormData({
        titre: '',
        description: '',
        statut: 'EN_ATTENTE',
        dateDebut: '',
        dateFin: '',
        juniorId: ''
      })
      setFileUpload({
        file: null,
        preview: '',
        uploading: false
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
      dateFin: '',
      juniorId: ''
    })
    setFileUpload({
      file: null,
      preview: '',
      uploading: false
    })
  }

// Fonction pour ouvrir le modal de feedback
const handleOpenFeedbackModal = async (project: Project) => {
  setSelectedProjectForFeedback(project)
  setIsFeedbackModalOpen(true)
  setFeedbackLoading(true)
  setFeedbackError(null)

  try {
    // CORRECT PATH based on your folder structure:
    const res = await fetch(`/api/getFeedback/${project.id}`)

    if (!res.ok) {
      throw new Error('Failed to fetch feedback')
    }
    const data = await res.json()
    setFeedbackStats(data)
  } catch (err) {
    setFeedbackError('Failed to load feedback statistics')
    console.error(err)
  } finally {
    setFeedbackLoading(false)
  }
}

  const handleCloseFeedbackModal = () => {
    setIsFeedbackModalOpen(false)
    setSelectedProjectForFeedback(null)
    setFeedbackStats(null)
    setFeedbackError(null)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }
    const preview = URL.createObjectURL(file)
    setFileUpload({ file, preview, uploading: false })
  }

  const uploadImage = async (file: File): Promise<string | null> => {
    const uploadFormData = new FormData()
    uploadFormData.append('file', file)

    try {
      setFileUpload(prev => ({ ...prev, uploading: true }))
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to upload image')
      }
      const data = await res.json()
      return data.url
    } catch (error: any) {
      alert(error.message || 'Failed to upload image')
      return null
    } finally {
      setFileUpload(prev => ({ ...prev, uploading: false }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

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
      // Upload new image if selected
      let imageUrl = editingProject?.image || null
      if (fileUpload.file) {
        const uploadedUrl = await uploadImage(fileUpload.file)
        if (!uploadedUrl) {
          setSubmitting(false)
          return
        }
        imageUrl = uploadedUrl
      }

      if (editingProject) {
        // Update existing project
        const res = await fetch(`/api/projects/${editingProject.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            titre: formData.titre,
            description: formData.description,
            statut: formData.statut,
            dateDebut: formData.dateDebut || null,
            dateFin: formData.dateFin,
            image: imageUrl
          }),
        })

        if (res.ok) {
          const updatedProject = await res.json()
          setProjects(prev => prev.map(item =>
            item.id === updatedProject.id ? updatedProject : item
          ))
          handleCloseModal()
        } else {
          alert('Failed to update project')
        }
      } else {
        // Create new project
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...formData,
            juniorId: parseInt(formData.juniorId),
            dateDebut: formData.dateDebut || null,
            image: imageUrl
          }),
        })

        if (res.ok) {
          const newProject = await res.json()
          setProjects(prev => [newProject, ...prev])
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

  // Fonction pour afficher les étoiles
  const renderStars = (average: number) => {
    const fullStars = Math.floor(average)
    const hasHalfStar = average % 1 >= 0.5
    const stars = []

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} size={16} fill="currentColor" className="star-filled" />)
    }
    if (hasHalfStar) {
      stars.push(<Star key="half" size={16} fill="currentColor" className="star-half" />)
    }
    const emptyStars = 5 - stars.length
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} size={16} className="star-empty" />)
    }

    return stars
  }

  // Préparer les données pour le filtre des juniors
  const juniorItemsForFilter = juniors.map(j => ({
    id: j.id,
    name: j.name,
    userType: j.role,
    city: j.city
  }))

  // Préparer les données pour le filtre des statuts
  const statusItemsForFilter = [
    { id: 1, name: 'Pending', value: 'EN_ATTENTE' },
    { id: 2, name: 'In Progress', value: 'EN_COURS' },
    { id: 3, name: 'Completed', value: 'TERMINE' }
  ]

  const handleJuniorSelect = (juniorId: number | null) => {
    setSelectedJuniorFilter(juniorId)
  }

  const handleStatusSelect = (statusId: number | null) => {
    if (statusId === null) {
      setSelectedStatusFilter(null)
    } else {
      const status = statusItemsForFilter.find(s => s.id === statusId)
      setSelectedStatusFilter(status?.value || null)
    }
  }

  const clearAllFilters = () => {
    setSelectedJuniorFilter(null)
    setOnlyJuniors(false)
    setSelectedStatusFilter(null)
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
          <h1 className="projects-title">Projects</h1>
          <p className="projects-subtitle">
            Manage your projects and track their progress
          </p>
        </div>

        {/* Section des filtres */}
        <div className="filters-section">
          <div className="filters-grid">
            <Filter
              title="Filter by Junior"
              items={juniorItemsForFilter}
              onSelect={handleJuniorSelect}
              selectedId={selectedJuniorFilter}
              showClearButton={true}
            />
            <Filter
              title="Filter by Status"
              items={statusItemsForFilter.map(s => ({
                id: s.id,
                name: s.name,
                userType: 'Status'
              }))}
              onSelect={handleStatusSelect}
              selectedId={statusItemsForFilter.find(s => s.value === selectedStatusFilter)?.id || null}
              showClearButton={true}
            />
          </div>
          <div className="additional-filters">
            <label className="filter-checkbox">
              <input
                type="checkbox"
                checked={onlyJuniors}
                onChange={(e) => setOnlyJuniors(e.target.checked)}
                className="checkbox-input"
              />
              <span className="checkbox-label">Show only junior projects</span>
            </label>
            {(selectedJuniorFilter || onlyJuniors || selectedStatusFilter) && (
              <button
                className="clear-filters-btn"
                onClick={clearAllFilters}
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>

        {/* Table Card */}
        <div className="table-card">
          <div className="table-wrapper">
            <table className="projects-table">
              <thead className="table-head">
                <tr>
                  <ProjectsSortControls
                    currentSort={sortColumn}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <th className="table-header">Feedback</th>
                </tr>
              </thead>
              <tbody>
                {sortedData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-state">
                      No projects found
                    </td>
                  </tr>
                ) : (
                  sortedData.map(item => (
                    <tr key={item.id} className="table-row">
                      <td className="table-cell">
                        <div className="project-info">
                          <div>
                            <div className="project-title">
                              {item.titre}
                            </div>
                            <div className="project-description-preview">
                              {item.description.substring(0, 60)}
                              {item.description.length > 60 ? '...' : ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="project-junior">
                          {item.Junior?.name || 'N/A'}
                          {item.Junior?.role === 'junior' && (
                            <span className="junior-tag">Junior</span>
                          )}
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
                      <td className="table-cell">
                        <button
                          className="btn-feedback"
                          onClick={() => handleOpenFeedbackModal(item)}
                          title="View Feedback"
                        >
                          <MessageSquare size={18} />
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
              Total projects: <span className="footer-count">{sortedData.length}</span>
              {searchQuery && <span className="filter-indicator"> (filtered from {projects.length})</span>}
              {(selectedJuniorFilter || onlyJuniors || selectedStatusFilter) && (
                <span className="filter-active-indicator">
                  <span className="filter-dot"></span> Filters applied
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
        title="Add new project"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>

      {/* Project Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingProject ? 'Edit Project' : 'Add Project'}
              </h2>
              <button className="modal-close" onClick={handleCloseModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                <label className="form-label" htmlFor="image">
                  Image
                </label>
                <input
                  id="image"
                  type="file"
                  className="form-input"
                  onChange={handleFileChange}
                  accept="image/*"
                />
                {fileUpload.preview && (
                  <div style={{ marginTop: '12px' }}>
                    <img
                      src={fileUpload.preview}
                      alt="Preview"
                      style={{
                        maxWidth: '200px',
                        maxHeight: '200px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db'
                      }}
                    />
                  </div>
                )}
                {fileUpload.uploading && (
                  <p style={{ marginTop: '8px', color: '#6b7280', fontSize: '14px' }}>
                    Uploading...
                  </p>
                )}
              </div>
              {!editingProject && (
                <div className="form-group">
                  <label className="form-label" htmlFor="juniorId">
                    Junior *
                  </label>
                  <select
                    id="juniorId"
                    className="form-input"
                    value={formData.juniorId}
                    onChange={(e) => setFormData({ ...formData, juniorId: e.target.value })}
                    required
                  >
                    <option value="">Select a junior</option>
                    {juniors.map(junior => (
                      <option key={junior.id} value={junior.id}>
                        {junior.name} - {junior.city}
                      </option>
                    ))}
                  </select>
                </div>
              )}
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
                  disabled={submitting || fileUpload.uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={submitting || fileUpload.uploading}
                >
                  {fileUpload.uploading ? 'Uploading...' :
                   submitting ? 'Saving...' :
                   editingProject ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {isFeedbackModalOpen && (
        <div className="modal-overlay" onClick={handleCloseFeedbackModal}>
          <div className="modal-content feedback-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                Feedback for: {selectedProjectForFeedback?.titre}
              </h2>
              <button className="modal-close" onClick={handleCloseFeedbackModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="feedback-content">
              {feedbackLoading ? (
                <div className="feedback-loading">
                  <div className="spinner-small"></div>
                  <p>Loading feedback statistics...</p>
                </div>
              ) : feedbackError ? (
                <div className="feedback-error">
                  <p>{feedbackError}</p>
                </div>
              ) : feedbackStats ? (
                <div className="feedback-stats">
                  {/* Global Statistics */}
                  <div className="stats-card global-stats">
                    <h3>Overall Feedback</h3>
                    <div className="stats-grid">
                      <div className="stat-item">
                        <span className="stat-label">Average Rating</span>
                        <div className="rating-display">
                          <div className="stars-container">
                            {renderStars(feedbackStats.global.average)}
                          </div>
                          <span className="rating-value">{feedbackStats.global.average.toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Total Feedbacks</span>
                        <span className="stat-value">{feedbackStats.global.count}</span>
                      </div>
                    </div>
                  </div>

                  {/* Project-specific statistics */}
                  {feedbackStats.projects.breakdown.length > 0 && (
                    <div className="stats-card">
                      <h3>Project Feedback Details</h3>
                      {feedbackStats.projects.breakdown.map(project => (
                        <div key={project.id} className="breakdown-item">
                          <div className="breakdown-header">
                            <span className="breakdown-title">{project.title}</span>
                            <span className="breakdown-count">{project.count} feedbacks</span>
                          </div>
                          <div className="breakdown-rating">
                            <div className="stars-container">
                              {renderStars(project.average)}
                            </div>
                            <span className="rating-value">{project.average.toFixed(1)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Event statistics related to this junior */}
                  {feedbackStats.events.breakdown.length > 0 && (
                    <div className="stats-card">
                      <h3>Related Events Feedback</h3>
                      <p className="stats-subtitle">Events attended by this junior</p>
                      {feedbackStats.events.breakdown.map(event => (
                        <div key={event.id} className="breakdown-item">
                          <div className="breakdown-header">
                            <span className="breakdown-title">{event.title}</span>
                            <span className="breakdown-count">{event.count} feedbacks</span>
                          </div>
                          <div className="breakdown-rating">
                            <div className="stars-container">
                              {renderStars(event.average)}
                            </div>
                            <span className="rating-value">{event.average.toFixed(1)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {feedbackStats.projects.breakdown.length === 0 &&
                   feedbackStats.events.breakdown.length === 0 && (
                    <div className="no-feedback-message">
                      <p>No feedback available for this project or related events.</p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-cancel"
                onClick={handleCloseFeedbackModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}