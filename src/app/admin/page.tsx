'use client'

import { useAuth } from '@/lib/auth/AuthProvider'
import { useState } from 'react'
import LoginForm from '@/components/auth/LoginForm'
import AdminDashboard from '@/components/admin/AdminDashboard'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function AdminPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
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