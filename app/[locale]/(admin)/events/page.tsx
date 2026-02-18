'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import './style.css'

import EventsSortControls, { useSortEvents } from '../components/EventsSort'
import { useSearch } from '../components/SearchContext'

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
    junior: { name: string }
    createdBy: { name: string; email: string }
}

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { searchQuery } = useSearch()
    
    const { sortedData, sortColumn, sortDirection, handleSort } = useSortEvents(events)
    
    // Filter events based on search query
    const filteredEvents = sortedData.filter(event => {
        if (!searchQuery) return true
        const query = searchQuery.toLowerCase()
        return (
            event.title.toLowerCase().includes(query) ||
            event.slug.toLowerCase().includes(query) ||
            event.shortDescription?.toLowerCase().includes(query) ||
            event.location?.toLowerCase().includes(query) ||
            event.junior?.name.toLowerCase().includes(query)
        )
    })

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await fetch('/api/events', {
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

        fetchEvents()
    }, [])

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
                        <h1 className="events-title">Events</h1>
                        <p className="events-subtitle">
                            Manage your upcoming events and activities
                        </p>
                    </div>
                    <Link href="/events/create" className="btn-create">
                        + Create Event
                    </Link>
                </div>

                {/* Table Card */}
                <div className="table-card">
                    <div className="table-wrapper">
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
                                {filteredEvents.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="empty-state">
                                            No events found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredEvents.map((event: Event) => (
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
                                                        <img src={`${event.featuredMediaUrl}&t=${Date.now()}`} alt="Media" />
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
                                                <Link href={`/events/${event.id}/edit`} className="btn-edit" style={{ textDecoration: 'none', display: 'inline-block', textAlign: 'center' }}>
                                                    Edit
                                                </Link>
                                                <button
                                                    className="btn-delete"
                                                    onClick={() => handleDelete(event.id)}
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
                            Total events: <span className="footer-count">{filteredEvents.length}</span>
                        </p>
                    </div>


                </div>
            </div>
        </div>
    )
}