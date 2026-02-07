'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import '../style.css' // Reuse the same styles

type Junior = {
    id: number
    name: string
}

export default function CreateEventPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [juniors, setJuniors] = useState<Junior[]>([])

    const [title, setTitle] = useState('')
    const [slug, setSlug] = useState('')
    const [shortDescription, setShortDescription] = useState('')
    const [fullDescription, setFullDescription] = useState('')
    const [date, setDate] = useState('')
    const [location, setLocation] = useState('')
    const [juniorId, setJuniorId] = useState('')

    // File states
    const [logoFile, setLogoFile] = useState<File | null>(null)
    const [featuredMediaFile, setFeaturedMediaFile] = useState<File | null>(null)
    // Preview URLs (local object URLs)
    const [logoPreview, setLogoPreview] = useState<string>('')
    const [featuredPreview, setFeaturedPreview] = useState<string>('')


    useEffect(() => {
        // Generate slug
        const generatedSlug = title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '')
        setSlug(generatedSlug)
    }, [title])

    useEffect(() => {
        // Fetch Juniors
        const fetchJuniors = async () => {
            try {
                const resJuniors = await fetch('/api/juniors')
                if (resJuniors.ok) {
                    setJuniors(await resJuniors.json())
                }
            } catch (err) {
                console.error('Failed to load juniors', err)
            }
        }
        fetchJuniors()
    }, [])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFile: (f: File | null) => void, setPreview: (u: string) => void) => {
        const file = e.target.files?.[0]
        if (file) {
            setFile(file)
            setPreview(URL.createObjectURL(file))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const formData = new FormData()
            formData.append('title', title)
            formData.append('slug', slug)
            formData.append('shortDescription', shortDescription)
            formData.append('fullDescription', fullDescription)
            formData.append('date', date)
            formData.append('location', location)
            formData.append('juniorId', juniorId)
            formData.append('isActive', 'true')
            // Note: createdById is now handled server-side via session

            if (logoFile) {
                formData.append('logoFile', logoFile)
            }
            if (featuredMediaFile) {
                formData.append('featuredMediaFile', featuredMediaFile)
            }

            const res = await fetch('/api/events', {
                method: 'POST',
                body: formData, // No JSON.stringify, No Content-Type (browser sets multipart/form-data)
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to create event')
            }

            router.push('/events')
            router.refresh()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="events-page">
            <div className="events-container" style={{ maxWidth: '800px' }}>
                <div className="events-header">
                    <h1 className="events-title">Create New Event</h1>
                    <Link href="/events" className="text-gray-500 hover:text-gray-700">
                        Cancel
                    </Link>
                </div>

                <div className="table-card" style={{ padding: '24px' }}>
                    {error && (
                        <div className="error-box" style={{ marginBottom: '24px', width: '100%', maxWidth: '100%' }}>
                            <p className="error-text">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Title */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                required
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                            />
                        </div>

                        {/* Slug */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Slug</label>
                            <input
                                type="text"
                                value={slug}
                                onChange={e => setSlug(e.target.value)}
                                required
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db', background: '#f3f4f6' }}
                            />
                        </div>

                        {/* Junior Selection */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Junior</label>
                            <select
                                value={juniorId}
                                onChange={e => setJuniorId(e.target.value)}
                                required
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                            >
                                <option value="">Select a Junior</option>
                                {juniors.map(junior => (
                                    <option key={junior.id} value={junior.id}>
                                        {junior.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Short Description */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Short Description</label>
                            <textarea
                                value={shortDescription}
                                onChange={e => setShortDescription(e.target.value)}
                                required
                                rows={2}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                            />
                        </div>

                        {/* Full Description */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Full Description</label>
                            <textarea
                                value={fullDescription}
                                onChange={e => setFullDescription(e.target.value)}
                                required
                                rows={5}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            {/* Date */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Date</label>
                                <input
                                    type="datetime-local"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                />
                            </div>

                            {/* Location */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Location</label>
                                <input
                                    type="text"
                                    value={location}
                                    onChange={e => setLocation(e.target.value)}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                />
                            </div>
                        </div>

                        {/* Images Upload */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Logo Image</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileChange(e, setLogoFile, setLogoPreview)}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                />
                                {logoPreview && (
                                    <div style={{ marginTop: '8px' }}>
                                        <p style={{ fontSize: '12px', color: '#059669', marginBottom: '4px' }}>✓ Selected</p>
                                        <img src={logoPreview} alt="Logo preview" style={{ height: '40px', borderRadius: '4px' }} />
                                    </div>
                                )}
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Featured Media</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileChange(e, setFeaturedMediaFile, setFeaturedPreview)}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                />
                                {featuredPreview && (
                                    <div style={{ marginTop: '8px' }}>
                                        <p style={{ fontSize: '12px', color: '#059669', marginBottom: '4px' }}>✓ Selected</p>
                                        <img src={featuredPreview} alt="Featured preview" style={{ height: '40px', borderRadius: '4px' }} />
                                    </div>
                                )}
                            </div>
                        </div>


                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-create"
                            style={{ width: '100%', marginTop: '16px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}
                        >
                            {loading ? 'Creating...' : 'Create Event'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
