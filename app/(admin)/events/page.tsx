'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import './style.css'
import EventsSortControls, { useSortEvents } from '../components/EventsSort'

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
    const [isFiltering, setIsFiltering] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [juniors, setJuniors] = useState<any[]>([])


    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [juniorId, setJuniorId] = useState('')
    const [isActive, setIsActive] = useState('all')
    const [dateRange, setDateRange] = useState('all')

    // Abort controller ref to cancel previous requests
    // Fixed: Use standard type casting for Next.js/Browser environments
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
                    <Link href="/events/create" className="btn-create">
                        + Create Event
                    </Link>
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
        </div>
    )
}
