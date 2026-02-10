'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import './style.css'

export default function AdminRegisterPage() {
    const router = useRouter()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [role, setRole] = useState<'RJE' | 'ADMIN'>('RJE')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess('')

        if (password.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }

        setLoading(true)

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Registration failed')
            }

            setSuccess('User created successfully!')
            setName('')
            setEmail('')
            setPassword('')
            setRole('RJE')

            // Optional: Refresh users list if we were on the same page, or redirect
            // router.push('/users') 
        } catch (err: any) {
            setError(err.message || 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="register-page">
            <div className="register-container">
                {/* Header */}
                <div className="register-header">
                    <h1 className="register-title">Register New User</h1>
                    <p className="register-subtitle">
                        Create a new account for a team member or admin
                    </p>
                </div>

                {/* Form Card */}
                <div className="form-card">
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
                                placeholder="John Doe"
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
                                placeholder="john@example.com"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Role</label>
                            <select
                                className="form-select"
                                value={role}
                                onChange={(e) => setRole(e.target.value as 'RJE' | 'ADMIN')}
                            >
                                <option value="RJE">RJE</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input
                                type="password"
                                className="form-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                            />
                            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                                Must be at least 6 characters
                            </p>
                        </div>

                        <button type="submit" className="btn-submit" disabled={loading}>
                            {loading ? 'Creating...' : 'Create User'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
