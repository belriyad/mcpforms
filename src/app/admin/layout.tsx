'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/lib/auth/AuthProvider'
import { signOut } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { AdminLayoutWrapper } from '@/components/layout/AdminLayoutWrapper'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, userProfile } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <ProtectedRoute>
      <AdminLayoutWrapper
        user={user || undefined}
        userProfile={userProfile || undefined}
        onSignOut={handleSignOut}
      >
        {children}
      </AdminLayoutWrapper>
    </ProtectedRoute>
  )
}
