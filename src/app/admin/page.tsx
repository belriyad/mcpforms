'use client'

import { useAuth } from '@/lib/auth/AuthProvider'
import AdminDashboard from '@/components/admin/AdminDashboard'
import { Loader2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function AdminPage() {
  const { user, userProfile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <AdminDashboard />
}
