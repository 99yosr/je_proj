'use client'

import { useState, useEffect } from 'react'
import './style.css'

export default function ProfilePage() {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [role, setRole] = useState('')
    const [newPassword, setNewPassword] = useState('')

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    useEffect(() => {
        fetchProfile()
    }, [])

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/profile')
            if (!res.ok) throw new Error('Failed to load profile')
            const data = await res.json()

            setName(data.name || '')
            setEmail(data.email || '')
            setRole(data.role || '')
        } catch (err: any) {
            setError(err.message || 'Error loading profile')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess('')
        setSaving(true)

        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    email,
                    password: newPassword || undefined
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Failed to update profile')
            }

            setSuccess('Profile updated successfully')
            setNewPassword('') // Clear password field
        } catch (err: any) {
            setError(err.message || 'Error updating profile')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-content">
                    <div className="spinner"></div>
                    <p className="loading-text">Loading profile...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="profile-page">
            <div className="profile-container">
                <div className="profile-header">
                    <h1 className="profile-title">My Profile</h1>
                    <p className="profile-subtitle">
                        Manage your account settings and preferences
                    </p>
                </div>

                <div className="profile-card">
                    {error && <div className="error-message">{error}</div>}
                    {success && <div className="success-message">{success}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input
                                type="text"
                                className="form-input"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input
                                type="email"
                                className="form-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Role</label>
                            <input
                                type="text"
                                className="form-input"
                                value={role}
                                disabled
                                title="Roles cannot be changed by the user"
                            />
                            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                                Contact an administrator to change your role
                            </p>
                        </div>

                        <div className="form-group" style={{
                            borderTop: '1px solid #e5e7eb',
                            paddingTop: '24px',
                            marginTop: '24px'
                        }}>
                            <h3 style={{
                                fontSize: '16px',
                                fontWeight: '600',
                                color: '#111827',
                                marginBottom: '16px'
                            }}>
                                Change Password
                            </h3>
                            <label className="form-label">New Password</label>
                            <input
                                type="password"
                                className="form-input"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Leave blank to keep current password"
                                minLength={6}
                            />
                        </div>

                        <button type="submit" className="btn-save" disabled={saving}>
                            {saving ? 'Saving Changes...' : 'Save Changes'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
