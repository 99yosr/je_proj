'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import '../../style.css' // Go up two levels to find style.css

type Junior = {
    id: number
    name: string
}

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [juniors, setJuniors] = useState<Junior[]>([])

    // Form State
    const [title, setTitle] = useState('')
    const [slug, setSlug] = useState('')
    const [shortDescription, setShortDescription] = useState('')
    const [fullDescription, setFullDescription] = useState('')
    const [date, setDate] = useState('')
    const [location, setLocation] = useState('')
    const [isActive, setIsActive] = useState(true)

    // Display only
    const [juniorName, setJuniorName] = useState('')
    const [logoUrl, setLogoUrl] = useState('')
    const [featuredMediaUrl, setFeaturedMediaUrl] = useState('')

    // File states
    const [logoFile, setLogoFile] = useState<File | null>(null)
    const [featuredMediaFile, setFeaturedMediaFile] = useState<File | null>(null)
    // Preview URLs (local object URLs)
    const [logoPreview, setLogoPreview] = useState<string>('')
    const [featuredPreview, setFeaturedPreview] = useState<string>('')

    // Auto-generate slug from title (same as Create page)
    useEffect(() => {
        const generatedSlug = title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '')
        setSlug(generatedSlug)
    }, [title])

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Event
                const resEvent = await fetch(`/api/events/${id}`)
                if (!resEvent.ok) throw new Error('Failed to fetch event')
                const event = await resEvent.json()

                setTitle(event.title)
                setSlug(event.slug)
                setShortDescription(event.shortDescription)
                setFullDescription(event.fullDescription)
                // Format date for datetime-local input (YYYY-MM-DDTHH:MM)
                if (event.date) {
                    const d = new Date(event.date)
                    const formattedDetails = d.toISOString().slice(0, 16)
                    setDate(formattedDetails)
                }
                setLocation(event.location || '')
                setIsActive(event.isActive)
                setLogoUrl(event.logoUrl ? `${event.logoUrl}&t=${Date.now()}` : '')
                setFeaturedMediaUrl(event.featuredMediaUrl ? `${event.featuredMediaUrl}&t=${Date.now()}` : '')


            } catch (err: any) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [id])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFile: (f: File | null) => void, setPreview: (u: string) => void) => {
        const file = e.target.files?.[0]
        if (file) {
            setFile(file)
            setPreview(URL.createObjectURL(file))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setError(null)

        try {
            const formData = new FormData()
            formData.append('title', title)
            formData.append('slug', slug)
            formData.append('shortDescription', shortDescription)
            formData.append('fullDescription', fullDescription)
            formData.append('date', date)
            formData.append('location', location)
            formData.append('isActive', String(isActive))

            if (logoFile) {
                formData.append('logoFile', logoFile)
            }
            if (featuredMediaFile) {
                formData.append('featuredMediaFile', featuredMediaFile)
            }

            const res = await fetch(`/api/events/${id}`, {
                method: 'PUT',
                body: formData,
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to update event')
            }

            router.push('/events')
            router.refresh()
        } catch (err: any) {
            setError(err.message)
            setSaving(false)
        }
    }

    if (loading) return <div style={{ padding: '20px' }}>Loading...</div>

    return (
        <div className="events-page">
            <div className="events-container" style={{ maxWidth: '800px' }}>
                <div className="events-header">
                    <h1 className="events-title">Edit Event</h1>
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

                        {/* Status */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={isActive}
                                    onChange={e => setIsActive(e.target.checked)}
                                    style={{ marginRight: '8px' }}
                                />
                                <span style={{ fontWeight: 500 }}>Active Event</span>
                            </label>
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
                                {(logoPreview || logoUrl) && (
                                    <div style={{ marginTop: '8px' }}>
                                        <p style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                                            {logoPreview ? 'New Selection' : 'Current Model'}
                                        </p>
                                        <img
                                            src={logoPreview || logoUrl}
                                            alt="Logo"
                                            style={{ height: '60px', borderRadius: '4px', border: '1px solid #eee' }}
                                        />
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
                                {(featuredPreview || featuredMediaUrl) && (
                                    <div style={{ marginTop: '8px' }}>
                                        <p style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                                            {featuredPreview ? 'New Selection' : 'Current Media'}
                                        </p>
                                        <img
                                            src={featuredPreview || featuredMediaUrl}
                                            alt="Featured"
                                            style={{ height: '60px', borderRadius: '4px', border: '1px solid #eee' }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="btn-create"
                            style={{ width: '100%', marginTop: '16px', border: 'none', cursor: saving ? 'not-allowed' : 'pointer' }}
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
