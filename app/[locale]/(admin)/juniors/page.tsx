'use client'

import { useEffect, useState, useMemo } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import './style.css'
import JuniorsSortControls, { useSortJuniors } from '../components/JuniorsSort'
import { useSearch } from '../components/SearchContext'
import SearchBar from '../components/SearchBar'

type Junior = {
  id: number
  name: string
  role: string
  city: string
  contact_email: string | null
  logo?: string | null
  created_at: string
}

type JuniorFormData = {
  name: string
  role: string
  city: string
  contact_email: string
}

type FileUploadState = {
  file: File | null
  preview: string
  uploading: boolean
}

export default function JuniorsPage() {
  const [juniors, setJuniors] = useState<Junior[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingJunior, setEditingJunior] = useState<Junior | null>(null)
  const [formData, setFormData] = useState<JuniorFormData>({
    name: '',
    role: '',
    city: '',
    contact_email: ''
  })
  const [fileUpload, setFileUpload] = useState<FileUploadState>({
    file: null,
    preview: '',
    uploading: false
  })
  const [submitting, setSubmitting] = useState(false)
  const { searchQuery, setSearchQuery } = useSearch()

  // Filter juniors based on search query
  const filteredJuniors = useMemo(() => {
    if (!searchQuery) return juniors
    
    const query = searchQuery.toLowerCase()
    return juniors.filter(junior => 
      junior.name.toLowerCase().includes(query) ||
      junior.role.toLowerCase().includes(query) ||
      junior.city.toLowerCase().includes(query) ||
      (junior.contact_email && junior.contact_email.toLowerCase().includes(query))
    )
  }, [juniors, searchQuery])

  // Apply sorting to filtered juniors
  const { sortedData, sortColumn, sortDirection, handleSort } = useSortJuniors(filteredJuniors)

  useEffect(() => {
    fetchJuniors()
  }, [])

  const fetchJuniors = async () => {
    try {
      const res = await fetch('/api/juniors', {
        credentials: 'include',
      })

      if (!res.ok) {
        throw new Error('Failed to fetch juniors')
      }

      const data = await res.json()
      setJuniors(data)
    } catch (err) {
      setError('You are not authorized or something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this junior enterprise?')) return

    const res = await fetch(`/api/juniors`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })

    if (res.ok) {
      setJuniors(prev => prev.filter(item => item.id !== id))
    } else {
      alert('Failed to delete junior')
    }
  }

  const handleOpenModal = (junior?: Junior) => {
    if (junior) {
      setEditingJunior(junior)
      setFormData({
        name: junior.name,
        role: junior.role,
        city: junior.city,
        contact_email: junior.contact_email || ''
      })
      setFileUpload({
        file: null,
        preview: junior.logo || '',
        uploading: false
      })
    } else {
      setEditingJunior(null)
      setFormData({
        name: '',
        role: '',
        city: '',
        contact_email: ''
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
    setEditingJunior(null)
    setFormData({
      name: '',
      role: '',
      city: '',
      contact_email: ''
    })
    setFileUpload({
      file: null,
      preview: '',
      uploading: false
    })
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
    setFileUpload({
      file,
      preview,
      uploading: false
    })
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
    setSubmitting(true)

    try {
      // Upload new logo if selected
      let logoUrl = editingJunior?.logo || null
      if (fileUpload.file) {
        const uploadedUrl = await uploadImage(fileUpload.file)
        if (!uploadedUrl) {
          setSubmitting(false)
          return
        }
        logoUrl = uploadedUrl
      }

      const dataToSubmit = {
        ...formData,
        logo: logoUrl
      }

      if (editingJunior) {
        // Update existing junior
        const res = await fetch('/api/juniors', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingJunior.id,
            ...dataToSubmit
          }),
        })

        if (res.ok) {
          const updatedJuniors = await res.json()
          setJuniors(prev => prev.map(item => 
            item.id === updatedJuniors[0].id ? updatedJuniors[0] : item
          ))
          handleCloseModal()
        } else {
          alert('Failed to update junior')
        }
      } else {
        // Create new junior
        const res = await fetch('/api/juniors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSubmit),
        })

        if (res.ok) {
          const newJuniors = await res.json()
          setJuniors(prev => [newJuniors[0], ...prev])
          handleCloseModal()
        } else {
          alert('Failed to create junior')
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
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="spinner"></div>
          <p className="loading-text">Loading juniors...</p>
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
    <div className="juniors-page">
      <div className="juniors-container">
        {/* Header */}
        <div className="juniors-header">
          <h1 className="juniors-title">Junior Enterprises</h1>
          <p className="juniors-subtitle">
            Manage junior enterprises and their information
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <SearchBar
            onSearch={setSearchQuery}
            placeholder="Search juniors by name, role, city, or email..."
          />
        </div>

        {/* Table Card */}
        <div className="table-card">
          <div className="table-wrapper">
            <table className="juniors-table">
              <thead className="table-head">
                <tr>
                  <JuniorsSortControls 
                    currentSort={sortColumn} 
                    currentDirection={sortDirection} 
                    onSort={handleSort} 
                  />
                </tr>
              </thead>

              <tbody>
                {sortedData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-state">
                      No junior enterprises found
                    </td>
                  </tr>
                ) : (
                  sortedData.map(item => (
                    <tr key={item.id} className="table-row">
                      <td className="table-cell">
                        <div className="junior-info">
                          <div>
                            <div className="junior-item-title">
                              {item.name}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="table-cell">
                        <div className="junior-role">
                          {item.role}
                        </div>
                      </td>

                      <td className="table-cell">
                        <div className="junior-city">
                          {item.city}
                        </div>
                      </td>

                      <td className="table-cell">
                        <div className="junior-contact">
                          {item.contact_email || 'N/A'}
                        </div>
                      </td>

                      <td className="table-cell">
                        <div className="junior-date">
                          {formatDate(item.created_at)}
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
              Total juniors: <span className="footer-count">{sortedData.length}</span>
              {searchQuery && <span className="text-gray-400"> (filtered from {juniors.length})</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Floating Add Button */}
      <button 
        className="floating-add-button"
        onClick={() => handleOpenModal()}
        title="Add new junior"
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
                {editingJunior ? 'Edit Junior Enterprise' : 'Add Junior Enterprise'}
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
                <label className="form-label" htmlFor="name">
                  Name *
                </label>
                <input
                  id="name"
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Enter junior enterprise name"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="role">
                  Role *
                </label>
                <input
                  id="role"
                  type="text"
                  className="form-input"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                  placeholder="Enter role/type"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="city">
                  City *
                </label>
                <input
                  id="city"
                  type="text"
                  className="form-input"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                  placeholder="Enter city"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="contact_email">
                  Contact Email
                </label>
                <input
                  id="contact_email"
                  type="email"
                  className="form-input"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  placeholder="Enter contact email"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="logo">
                  Logo
                </label>
                <input
                  id="logo"
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
                  {fileUpload.uploading ? 'Uploading...' : submitting ? 'Saving...' : editingJunior ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
