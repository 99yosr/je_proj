'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Pencil, Trash2 } from 'lucide-react'
import './style.css'

type Event = {
    id: number
    title: string
    slug: string
    shortDescription: string
    date: string | null
    location: string | null
    isActive: boolean
    logoUrl: string | null
    featuredMediaUrl: string | null
    updatedAt: string
    Junior?: { name: string }
    createdBy: { name: string; email: string }
}

type User = {
    id: string
    email: string
    name: string
    role: string
    juniorId: number | null
}

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [currentUser, setCurrentUser] = useState<User | null>(null)

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

            // Fetch events filtered by juniorId if user has one
            if (userData.juniorId) {
                await fetchEvents(userData.juniorId)
            } else {
                setError('You are not associated with any Junior Enterprise')
                setLoading(false)
            }
        } catch (err) {
            setError('Failed to authenticate. Please login.')
            setLoading(false)
        }
    }

    const fetchEvents = async (juniorId: number) => {
        try {
            const res = await fetch(`/api/events?juniorId=${juniorId}`, {
                credentials: 'include',
            })

            if (!res.ok) {
                throw new Error('Failed to fetch events')
            }

            const data = await res.json()
            setEvents(data)
        } catch (err) {
            setError('Failed to load events')
        } finally {
            setLoading(false)
        }
    }

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

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-content">
                    <div className="spinner"></div>
                    <p className="loading-text">Loading events...</p>
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
        <div className="events-page">
            <div className="events-container">
                {/* Header */}
                <div className="events-header">
                    <div>
                        <h1 className="events-title">My Events</h1>
                        <p className="events-subtitle">
                            Manage your Junior Enterprise events
                        </p>
                    </div>
                </div>

                {/* Table Card */}
                <div className="table-card">
                    <div className="table-wrapper">
                        <table className="events-table">
                            <thead className="table-head">
                                <tr>
                                    <th className="table-header">Event</th>
                                    <th className="table-header">Date</th>
                                    <th className="table-header">Location</th>
                                    <th className="table-header">Last Updated</th>
                                    <th className="table-header">Status</th>
                                    <th className="table-header table-header-right">Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {events.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="empty-state">
                                            No events found. Create your first event!
                                        </td>
                                    </tr>
                                ) : (
                                    events.map(event => (
                                        <tr key={event.id} className="table-row">
                                            <td className="table-cell">
                                                <div className="event-info">
                                                    <div className="event-logo">
                                                        {event.logoUrl ? (
                                                            <img src={`${event.logoUrl}&t=${Date.now()}`} alt={event.title} />
                                                        ) : (
                                                            <span className="logo-text">
                                                                {event.title.charAt(0).toUpperCase()}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="event-title">{event.title}</div>
                                                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                                            {event.shortDescription.substring(0, 50)}
                                                            {event.shortDescription.length > 50 && '...'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="table-cell">
                                                <div style={{ fontSize: '14px', color: '#111827' }}>
                                                    {event.date ? new Date(event.date).toLocaleDateString() : 'TBA'}
                                                </div>
                                            </td>

                                            <td className="table-cell">
                                                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                                                    {event.location || 'TBA'}
                                                </div>
                                            </td>

                                            <td className="table-cell">
                                                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                                                    {new Date(event.updatedAt).toLocaleDateString()}
                                                </div>
                                            </td>

                                            <td className="table-cell">
                                                <span className={`status-badge ${event.isActive ? 'status-active' : 'status-inactive'}`}>
                                                    {event.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>

                                            <td className="table-cell actions-cell">
                                                <Link href={`/eventsRJE/${event.id}/edit`} className="btn-edit" title="Edit">
                                                    <Pencil size={18} />
                                                </Link>
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
                    </div>

                    {/* Footer */}
                    <div className="table-footer">
                        <p className="footer-text">
                            Total events: <span className="footer-count">{events.length}</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Floating Add Button */}
            <Link href="/eventsRJE/create" className="floating-add-button" title="Add new event">
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
            </Link>
        </div>
    )
}
