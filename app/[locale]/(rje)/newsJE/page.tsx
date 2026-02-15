'use client'

import { useEffect, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import './style.css'

type News = {
  id: number
  title: string
  content: string
  author: string | null
  image: string | null
  createdAt: string
  updatedAt: string
  juniorId: number
  Junior?: {
    id: number
    name: string
  }
}

type NewsFormData = {
  title: string
  content: string
  author: string
  image: string
}

type User = {
  id: string
  email: string
  name: string
  role: string
  juniorId: number | null
}

type FileUploadState = {
  file: File | null
  preview: string
  uploading: boolean
}

export default function NewsJEPage() {
  const [news, setNews] = useState<News[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingNews, setEditingNews] = useState<News | null>(null)
  const [formData, setFormData] = useState<NewsFormData>({
    title: '',
    content: '',
    author: '',
    image: ''
  })
  const [fileUpload, setFileUpload] = useState<FileUploadState>({
    file: null,
    preview: '',
    uploading: false
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
        await fetchNews(userData.juniorId)
      } else {
        setError('You are not associated with any Junior Enterprise')
        setLoading(false)
      }
    } catch (err) {
      setError('Failed to authenticate. Please login.')
      setLoading(false)
    }
  }

  const fetchNews = async (juniorId: number) => {
    try {
      const res = await fetch(`/api/news?juniorId=${juniorId}`, {
        credentials: 'include',
      })

      if (!res.ok) {
        throw new Error('Failed to fetch news')
      }

      const data = await res.json()
      setNews(data)
    } catch (err) {
      setError('Failed to load news')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this news article?')) return

    const res = await fetch(`/api/news?id=${id}`, {
      method: 'DELETE',
    })

    if (res.ok) {
      setNews(prev => prev.filter(item => item.id !== id))
    } else {
      alert('Failed to delete news')
    }
  }

  const handleOpenModal = (newsItem?: News) => {
    if (newsItem) {
      setEditingNews(newsItem)
      setFormData({
        title: newsItem.title,
        content: newsItem.content,
        author: newsItem.author || '',
        image: newsItem.image || ''
      })
      setFileUpload({
        file: null,
        preview: newsItem.image || '',
        uploading: false
      })
    } else {
      setEditingNews(null)
      setFormData({
        title: '',
        content: '',
        author: '',
        image: ''
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
    setEditingNews(null)
    setFormData({
      title: '',
      content: '',
      author: '',
      image: ''
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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    // Create preview
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

    if (!currentUser?.juniorId) {
      alert('No junior enterprise associated with your account')
      return
    }

    setSubmitting(true)

    try {
      let imageUrl = formData.image

      // Upload new image if selected
      if (fileUpload.file) {
        const uploadedUrl = await uploadImage(fileUpload.file)
        if (!uploadedUrl) {
          setSubmitting(false)
          return
        }
        imageUrl = uploadedUrl
      }

      if (editingNews) {
        // Update existing news
        const res = await fetch('/api/news', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingNews.id,
            title: formData.title,
            content: formData.content,
            author: formData.author || null,
            image: imageUrl || null,
          }),
        })

        if (res.ok) {
          await fetchNews(currentUser.juniorId)
          handleCloseModal()
        } else {
          alert('Failed to update news')
        }
      } else {
        // Create new news
        const res = await fetch('/api/news', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formData.title,
            content: formData.content,
            author: formData.author || null,
            image: imageUrl || null,
            juniorId: currentUser.juniorId
          }),
        })

        if (res.ok) {
          await fetchNews(currentUser.juniorId)
          handleCloseModal()
        } else {
          alert('Failed to create news')
        }
      }
    } catch (err) {
      alert('An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading news...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">My News & Updates</h1>
          <p className="page-subtitle">Manage your junior enterprise news</p>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>Published</th>
              <th className="actions-column">Actions</th>
            </tr>
          </thead>
          <tbody>
            {news.length === 0 ? (
              <tr>
                <td colSpan={4} className="empty-state">
                  <p>No news articles yet. Create your first one!</p>
                </td>
              </tr>
            ) : (
              news.map((item) => (
                <tr key={item.id}>
                  <td className="title-cell">{item.title}</td>
                  <td>{item.author || 'Anonymous'}</td>
                  <td>{formatDate(item.createdAt)}</td>
                  <td className="actions-cell">
                    <button
                      className="btn-icon btn-edit"
                      onClick={() => handleOpenModal(item)}
                      title="Edit"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="btn-icon btn-delete"
                      onClick={() => handleDelete(item.id)}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Floating Add Button */}
      <button
        className="floating-add-button"
        onClick={() => handleOpenModal()}
        title="Add News"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingNews ? 'Edit News' : 'Create News'}
              </h2>
              <button className="modal-close" onClick={handleCloseModal}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label" htmlFor="title">
                    Title *
                  </label>
                  <input
                    id="title"
                    type="text"
                    className="form-input"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="Enter news title"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="author">
                    Author
                  </label>
                  <input
                    id="author"
                    type="text"
                    className="form-input"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="Enter author name"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="content">
                    Content *
                  </label>
                  <textarea
                    id="content"
                    className="form-textarea"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    required
                    rows={8}
                    placeholder="Enter news content"
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
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  {fileUpload.preview && (
                    <div className="image-preview">
                      <img src={fileUpload.preview} alt="Preview" />
                    </div>
                  )}
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
                  {submitting || fileUpload.uploading
                    ? 'Saving...'
                    : editingNews
                    ? 'Update'
                    : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
