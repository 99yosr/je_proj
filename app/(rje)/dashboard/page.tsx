'use client'

import { useEffect, useState } from 'react'
import FeedbackStatsCard from "../components/AvgNote";
import ProjectsChartCard from "../components/projByYear";

type User = {
  id: string
  email: string
  name: string
  role: string
  juniorId: number | null
}

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch('/api/auth/me', {
          credentials: 'include',
        })

        if (res.ok) {
          const userData = await res.json()
          setCurrentUser(userData)
        }
      } catch (err) {
        console.error('Failed to fetch user:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCurrentUser()
  }, [])

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="spinner" style={{ margin: '0 auto', marginBottom: '16px' }}></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </main>
    )
  }

  if (!currentUser?.juniorId) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="text-center bg-red-50 p-8 rounded-lg">
          <p className="text-red-600 font-semibold">
            You are not associated with any Junior Enterprise
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-start p-8">
      <h1 className="text-4xl font-bold mb-6 text-heading">Feedback Dashboard</h1>

      <FeedbackStatsCard juniorId={currentUser.juniorId} />
      <div className="mt-8 w-full max-w-4xl">
        <ProjectsChartCard juniorId={currentUser.juniorId} />
      </div>
    </main>
  );
}
