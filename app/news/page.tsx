'use client'

import { useEffect, useState } from 'react'
import './style.css'

type News = {
  id: number
  title: string
  content: string
  author: string | null
  image: string | null
  createdAt: string
  updatedAt: string
}

type NewsFormData = {
  title: string
  content: string
  author: string
  image: string
}

export default function NewsPage() {
  const [news, setNews] = useState<News[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingNews, setEditingNews] = useState<News | null>(null)
  const [formData, setFormData] = useState<NewsFormData>({
    title: '',
    content: '',
    author: '',
    image: ''
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchNews()
  }, [])

  const fetchNews = async () => {
    try {
      const res = await fetch('/api/news', {
        credentials: 'include',
      })

      if (!res.ok) {
        throw new Error('Failed to fetch news')
      }

      const data = await res.json()
      setNews(data)
    } catch (err) {
      setError('You are not authorized or something went wrong')
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
    } else {
      setEditingNews(null)
      setFormData({
        title: '',
        content: '',
        author: '',
        image: ''
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
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      if (editingNews) {
        // Update existing news
        const res = await fetch('/api/news', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingNews.id,
            ...formData
          }),
        })

        if (res.ok) {
          const updatedNews = await res.json()
          setNews(prev => prev.map(item => 
            item.id === updatedNews.id ? updatedNews : item
          ))
          handleCloseModal()
        } else {
          alert('Failed to update news')
        }
      } else {
        // Create new news
        const res = await fetch('/api/news', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })

        if (res.ok) {
          const newNews = await res.json()
          setNews(prev => [newNews, ...prev])
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
          <p className="loading-text">Loading news...</p>
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
    <div className="news-page">
      <div className="news-container">
        {/* Header */}
        <div className="news-header">
          <h1 className="news-title">News</h1>
          <p className="news-subtitle">
            Manage news articles and announcements
          </p>
        </div>

        {/* Table Card */}
        <div className="table-card">
          <div className="table-wrapper">
            <table className="news-table">
              <thead className="table-head">
                <tr>
                  <th className="table-header">Title</th>
                  <th className="table-header">Author</th>
                  <th className="table-header">Date</th>
                  <th className="table-header table-header-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {news.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="empty-state">
                      No news articles found
                    </td>
                  </tr>
                ) : (
                  news.map(item => (
                    <tr key={item.id} className="table-row">
                      <td className="table-cell">
                        <div className="news-info">
                          {item.image && (
                            <div className="news-image">
                              <img src={item.image} alt={item.title} />
                            </div>
                          )}
                          <div>
                            <div className="news-item-title">
                              {item.title}
                            </div>
                            <div className="news-content-preview">
                              {item.content.substring(0, 80)}
                              {item.content.length > 80 ? '...' : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="table-cell">
                        <div className="news-author">
                          {item.author || 'Anonymous'}
                        </div>
                      </td>

                      <td className="table-cell">
                        <div className="news-date">
                          {formatDate(item.createdAt)}
                        </div>
                      </td>

                      <td className="table-cell actions-cell">
                        <button 
                          className="btn-edit"
                          onClick={() => handleOpenModal(item)}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn-delete"
                          onClick={() => handleDelete(item.id)}
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
              Total articles: <span className="footer-count">{news.length}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Floating Add Button */}
      <button 
        className="floating-add-button"
        onClick={() => handleOpenModal()}
        title="Add new news"
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
                {editingNews ? 'Edit News Article' : 'Add News Article'}
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
                <label className="form-label" htmlFor="content">
                  Content *
                </label>
                <textarea
                  id="content"
                  className="form-textarea"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  required
                  placeholder="Enter news content"
                  rows={6}
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
                <label className="form-label" htmlFor="image">
                  Image URL
                </label>
                <input
                  id="image"
                  type="text"
                  className="form-input"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="Enter image URL"
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
                  {submitting ? 'Saving...' : editingNews ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
