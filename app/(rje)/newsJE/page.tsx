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

export default function NewsJEPage() {
  const [news, setNews] = useState<News[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedNews, setSelectedNews] = useState<News | null>(null)

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
      setError('Failed to load news')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (newsItem: News) => {
    setSelectedNews(newsItem)
  }

  const handleCloseModal = () => {
    setSelectedNews(null)
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
          <h1 className="page-title">News & Updates</h1>
          <p className="page-subtitle">Stay informed with the latest news</p>
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
                  <p>No news available</p>
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
                      className="btn-icon btn-view"
                      onClick={() => handleViewDetails(item)}
                      title="View Details"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedNews && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{selectedNews.title}</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="news-meta">
                <span className="news-author">
                  By {selectedNews.author || 'Anonymous'}
                </span>
                <span className="news-date">
                  {formatDate(selectedNews.createdAt)}
                </span>
              </div>
              
              {selectedNews.image && (
                <div className="news-image">
                  <img src={selectedNews.image} alt={selectedNews.title} />
                </div>
              )}
              
              <div className="news-content">
                {selectedNews.content}
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-cancel"
                onClick={handleCloseModal}
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
