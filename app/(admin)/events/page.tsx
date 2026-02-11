'use client'

import { useEffect, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import './style.css'
import EventsSortControls, { useSortEvents } from '../components/EventsSort'

type Event = {
    id: number
    title: string
    slug: string
    shortDescription: string
    fullDescription?: string
    date: string | null
    location: string | null
    isActive: boolean
    logoUrl: string | null
    featuredMediaUrl: string | null
    updatedAt: string
    juniorId: number
    junior: { name: string }
    createdBy: { name: string; email: string }
}

type Junior = {
    id: number
    name: string
    role: string
    city: string
}

type EventFormData = {
    title: string
    slug: string
    shortDescription: string
    fullDescription: string
    date: string
    location: string
    juniorId: string
    isActive: boolean
}

type FileUploadState = {
    logoFile: File | null
    logoPreview: string
    featuredFile: File | null
    featuredPreview: string
}

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([])
    const [juniors, setJuniors] = useState<Junior[]>([])
    const [loading, setLoading] = useState(true)
    const [isFiltering, setIsFiltering] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingEvent, setEditingEvent] = useState<Event | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const [formData, setFormData] = useState<EventFormData>({
        title: '',
        slug: '',
        shortDescription: '',
        fullDescription: '',
        date: '',
        location: '',
        juniorId: '',
        isActive: true
    })

    const [fileUpload, setFileUpload] = useState<FileUploadState>({
        logoFile: null,
        logoPreview: '',
        featuredFile: null,
        featuredPreview: ''
    })

    // Filter states
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [juniorId, setJuniorId] = useState('')
    const [isActive, setIsActive] = useState('all')
    const [dateRange, setDateRange] = useState('all')

    // Abort controller ref to cancel previous requests
    const [currentController, setCurrentController] = useState<AbortController | null>(null);

    // Fetch Juniors for the dropdown
    useEffect(() => {
        const fetchJuniors = async () => {
            try {
                const res = await fetch('/api/juniors')
                if (res.ok) {
                    setJuniors(await res.json())
                }
            } catch (err) {
                console.error('Failed to load juniors', err)
            }
        }
        fetchJuniors()
    }, [])

    // Auto-generate slug from title
    useEffect(() => {
        if (!editingEvent && formData.title) {
            const generatedSlug = formData.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '')
            setFormData(prev => ({ ...prev, slug: generatedSlug }))
        }
    }, [formData.title, editingEvent])

    const fetchEvents = async (searchVal: string, jid: string, active: string, range: string, signal?: AbortSignal) => {
        try {
            setIsFiltering(true)
            const params = new URLSearchParams()
            if (searchVal) params.append('search', searchVal)
            if (jid) params.append('juniorId', jid)
            if (active !== 'all') params.append('isActive', active)
            if (range !== 'all') params.append('dateRange', range)

            const res = await fetch(`/api/events?${params.toString()}`, {
                credentials: 'include',
                signal
            })

            if (!res.ok) {
                throw new Error('Failed to fetch events')
            }

            const data = await res.json()
            setEvents(data)
            setError(null)
        } catch (err: any) {
            if (err.name === 'AbortError') return
            console.error('Fetch error:', err)
            setError('Failed to load events')
        } finally {
            setIsFiltering(false)
            setLoading(false)
        }
    }

    // Debounce search input only
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search)
        }, 350)
        return () => clearTimeout(timer)
    }, [search])

    // Trigger fetch on filter changes
    useEffect(() => {
        // Create new controller for this request
        const controller = new AbortController()
        setCurrentController(prev => {
            prev?.abort()
            return controller
        })

        fetchEvents(debouncedSearch, juniorId, isActive, dateRange, controller.signal)

        return () => controller.abort()
    }, [debouncedSearch, juniorId, isActive, dateRange])

    function handleReset() {
        setSearch('')
        setJuniorId('')
        setIsActive('all')
        setDateRange('all')
    }

    const handleOpenModal = (event?: Event) => {
        if (event) {
            setEditingEvent(event)
            setFormData({
                title: event.title,
                slug: event.slug,
                shortDescription: event.shortDescription,
                fullDescription: event.fullDescription || '',
                date: event.date ? new Date(event.date).toISOString().slice(0, 16) : '',
                location: event.location || '',
                juniorId: event.juniorId.toString(),
                isActive: event.isActive
            })
            setFileUpload({
                logoFile: null,
                logoPreview: event.logoUrl || '',
                featuredFile: null,
                featuredPreview: event.featuredMediaUrl || ''
            })
        } else {
            setEditingEvent(null)
            setFormData({
                title: '',
                slug: '',
                shortDescription: '',
                fullDescription: '',
                date: '',
                location: '',
                juniorId: '',
                isActive: true
            })
            setFileUpload({
                logoFile: null,
                logoPreview: '',
                featuredFile: null,
                featuredPreview: ''
            })
        }
        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setEditingEvent(null)
        setFormData({
            title: '',
            slug: '',
            shortDescription: '',
            fullDescription: '',
            date: '',
            location: '',
            juniorId: '',
            isActive: true
        })
        setFileUpload({
            logoFile: null,
            logoPreview: '',
            featuredFile: null,
            featuredPreview: ''
        })
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'featured') => {
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
        
        if (type === 'logo') {
            setFileUpload(prev => ({ ...prev, logoFile: file, logoPreview: preview }))
        } else {
            setFileUpload(prev => ({ ...prev, featuredFile: file, featuredPreview: preview }))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)

        try {
            const submitFormData = new FormData()
            submitFormData.append('title', formData.title)
            submitFormData.append('slug', formData.slug)
            submitFormData.append('shortDescription', formData.shortDescription)
            submitFormData.append('fullDescription', formData.fullDescription)
            submitFormData.append('date', formData.date)
            submitFormData.append('location', formData.location)
            submitFormData.append('juniorId', formData.juniorId)
            submitFormData.append('isActive', formData.isActive.toString())

            if (fileUpload.logoFile) {
                submitFormData.append('logoFile', fileUpload.logoFile)
            }
            if (fileUpload.featuredFile) {
                submitFormData.append('featuredMediaFile', fileUpload.featuredFile)
            }

            if (editingEvent) {
                // Update existing event
                const res = await fetch(`/api/events/${editingEvent.id}`, {
                    method: 'PUT',
                    body: submitFormData,
                })

                if (res.ok) {
                    const updatedEvent = await res.json()
                    setEvents(prev => prev.map(item => 
                        item.id === updatedEvent.id ? updatedEvent : item
                    ))
                    handleCloseModal()
                } else {
                    const errorData = await res.json()
                    alert(errorData.error || 'Failed to update event')
                }
            } else {
                // Create new event
                const res = await fetch('/api/events', {
                    method: 'POST',
                    body: submitFormData,
                })

                if (res.ok) {
                    const newEvent = await res.json()
                    setEvents(prev => [newEvent, ...prev])
                    handleCloseModal()
                } else {
                    const errorData = await res.json()
                    alert(errorData.error || 'Failed to create event')
                }
            }
        } catch (err) {
            alert('An error occurred')
        } finally {
            setSubmitting(false)
        }
    }

    // Apply sorting to events
    const { sortedData, sortColumn, sortDirection, handleSort } = useSortEvents(events)

    async function handleDelete(id: number) {
        if (!confirm('Are you sure you want to delete this event?')) return

        const res = await fetch(`/api/events/${id}`, {
            method: 'DELETE',
        })

        if (res.ok) {
            setEvents(prev => prev.filter(event => event.id !== id))
        } else {
            alert('Failed to delete event')
        }
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
        <div className="events-page">
            <div className="events-container">
                {/* Header */}
                <div className="events-header">
                    <div>
                        <h1 className="events-title">Events</h1>
                        <p className="events-subtitle">
                            Manage your upcoming events and activities
                        </p>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="filters-card">
                    <div className="filters-grid">
                        <div className="filter-group">
                            <label className="filter-label">Search</label>
                            <input
                                type="text"
                                placeholder="Search title or description..."
                                className="filter-input"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="filter-group">
                            <label className="filter-label">Junior</label>
                            <select
                                className="filter-select"
                                value={juniorId}
                                onChange={(e) => setJuniorId(e.target.value)}
                            >
                                <option value="">All Juniors</option>
                                {juniors.map(j => (
                                    <option key={j.id} value={j.id}>{j.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label className="filter-label">Status</label>
                            <select
                                className="filter-select"
                                value={isActive}
                                onChange={(e) => setIsActive(e.target.value)}
                            >
                                <option value="all">All Status</option>
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                            </select>
                        </div>

                        <div className="filter-group">
                            <label className="filter-label">Date Range</label>
                            <select
                                className="filter-select"
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                            >
                                <option value="all">All Dates</option>
                                <option value="upcoming">Upcoming</option>
                                <option value="past">Past</option>
                            </select>
                        </div>

                        <div className="filter-group">
                            <button className="btn-reset" onClick={handleReset}>
                                Reset Filters
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table Card */}
                <div className="table-card" style={{ position: 'relative' }}>
                    {/* Partial Loading Overlay */}
                    {isFiltering && !loading && (
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(255, 255, 255, 0.4)',
                            zIndex: 10,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            pointerEvents: 'none'
                        }}>
                            <div className="spinner" style={{ width: '32px', height: '32px' }}></div>
                        </div>
                    )}

                    <div className="table-wrapper">
                        {loading ? (
                            <div style={{ padding: '60px', textAlign: 'center' }}>
                                <div className="spinner"></div>
                                <p style={{ marginTop: '16px', color: '#6b7280' }}>Loading events...</p>
                            </div>
                        ) : (
                            <table className="events-table">
                                <thead className="table-head">
                                    <tr>
                                        <EventsSortControls 
                                            currentSort={sortColumn} 
                                            currentDirection={sortDirection} 
                                            onSort={handleSort} 
                                        />
                                    </tr>
                                </thead>

                                <tbody>
                                    {sortedData.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="empty-state">
                                                No events found matching your criteria
                                            </td>
                                        </tr>
                                    ) : (
                                        sortedData.map(event => (
                                            <tr key={event.id} className="table-row">
                                                <td className="table-cell">
                                                    <div className="event-info">
                                                        <div className="event-logo">
                                                            {event.logoUrl ? (
                                                                <img src={event.logoUrl} alt={event.title} />
                                                            ) : (
                                                                <span className="logo-text">
                                                                    {event.title.charAt(0).toUpperCase()}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="event-title">{event.title}</div>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="table-cell">
                                                    <div className="text-sm text-gray-500">
                                                        {event.slug}
                                                    </div>
                                                </td>

                                                <td className="table-cell">
                                                    <div className="event-logo">
                                                        {event.featuredMediaUrl ? (
                                                            <img src={event.featuredMediaUrl} alt="Media" />
                                                        ) : (
                                                            <span className="logo-text">-</span>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="table-cell">
                                                    <div className="text-sm text-gray-900">
                                                        {event.junior?.name || 'Unknown'}
                                                    </div>
                                                </td>

                                                <td className="table-cell">
                                                    <div className="text-sm text-gray-500">
                                                        {event.createdBy?.name || event.createdBy?.email || 'Unknown'}
                                                    </div>
                                                </td>

                                                <td className="table-cell">
                                                    <div className="text-sm text-gray-500">
                                                        {new Date(event.updatedAt).toLocaleString()}
                                                    </div>
                                                </td>

                                                <td className="table-cell">
                                                    <span className={`status-badge ${event.isActive ? 'status-active' : 'status-inactive'
                                                        }`}>
                                                        {event.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>

                                                <td className="table-cell actions-cell">
                                                    <button 
                                                        className="btn-edit"
                                                        onClick={() => handleOpenModal(event)}
                                                        title="Edit"
                                                    >
                                                        <Pencil size={18} />
                                                    </button>
                                                    <button
                                                        className="btn-delete"
                                                        onClick={() => handleDelete(event.id)}
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
                        )}
                    </div>

                    {/* Footer */}
                    {!loading && (
                        <div className="table-footer">
                            <p className="footer-text">
                                Found <span className="footer-count">{sortedData.length}</span> events
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Add Button */}
            <button 
                className="floating-add-button"
                onClick={() => handleOpenModal()}
                title="Add new event"
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
                                {editingEvent ? 'Edit Event' : 'Add Event'}
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
                                    placeholder="Enter event title"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="slug">
                                    Slug *
                                </label>
                                <input
                                    id="slug"
                                    type="text"
                                    className="form-input"
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    required
                                    placeholder="event-slug"
                                    disabled={!editingEvent}
                                    style={{ background: editingEvent ? '#fff' : '#f3f4f6' }}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="shortDescription">
                                    Short Description *
                                </label>
                                <textarea
                                    id="shortDescription"
                                    className="form-textarea"
                                    value={formData.shortDescription}
                                    onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                                    required
                                    placeholder="Brief description for preview"
                                    rows={2}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="fullDescription">
                                    Full Description *
                                </label>
                                <textarea
                                    id="fullDescription"
                                    className="form-textarea"
                                    value={formData.fullDescription}
                                    onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
                                    required
                                    placeholder="Complete event description"
                                    rows={4}
                                />
                            </div>

                            {!editingEvent && (
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

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label" htmlFor="date">
                                        Date & Time
                                    </label>
                                    <input
                                        id="date"
                                        type="datetime-local"
                                        className="form-input"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label" htmlFor="location">
                                        Location
                                    </label>
                                    <input
                                        id="location"
                                        type="text"
                                        className="form-input"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        placeholder="Event location"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="logoFile">
                                    Logo Image
                                </label>
                                <input
                                    id="logoFile"
                                    type="file"
                                    className="form-input"
                                    onChange={(e) => handleFileChange(e, 'logo')}
                                    accept="image/*"
                                />
                                {fileUpload.logoPreview && (
                                    <div style={{ marginTop: '12px' }}>
                                        <img 
                                            src={fileUpload.logoPreview} 
                                            alt="Logo Preview" 
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
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="featuredFile">
                                    Featured Media
                                </label>
                                <input
                                    id="featuredFile"
                                    type="file"
                                    className="form-input"
                                    onChange={(e) => handleFileChange(e, 'featured')}
                                    accept="image/*"
                                />
                                {fileUpload.featuredPreview && (
                                    <div style={{ marginTop: '12px' }}>
                                        <img 
                                            src={fileUpload.featuredPreview} 
                                            alt="Featured Preview" 
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
                            </div>

                            <div className="form-group">
                                <label className="form-label flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        style={{ width: 'auto', margin: 0 }}
                                    />
                                    <span>Active Event</span>
                                </label>
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
                                    {submitting ? 'Saving...' : editingEvent ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
