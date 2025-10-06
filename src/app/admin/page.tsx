'use client'

import { useAuth } from '@/lib/auth/AuthProvider'
import { useState } from 'react'
import LoginForm from '@/components/auth/LoginForm'
import AdminDashboard from '@/components/admin/AdminDashboard'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function AdminPage() {
  const { user, loading, authError } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-gray-600 mt-4">Connecting to Firebase...</p>
        </div>
      </div>
    )
  }

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <h3 className="text-red-800 font-medium">Authentication Error</h3>
            <p className="text-red-600 mt-1">{authError}</p>
            <p className="text-red-600 text-sm mt-2">
              Please check your internet connection and Firebase configuration.
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Login</h1>
            <p className="text-gray-600 mt-2">Sign in to access the dashboard</p>
          </div>
          <LoginForm />
        </div>
      </div>
    )
  }

  return <AdminDashboard />
}