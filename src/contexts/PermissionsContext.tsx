'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAuth } from '@/lib/auth/AuthProvider'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { UserPermissions, UserProfile, PERMISSION_PRESETS } from '@/types/permissions'

interface PermissionsContextType {
  permissions: UserPermissions | null
  userProfile: UserProfile | null
  loading: boolean
  isManager: boolean
  hasPermission: (permission: keyof UserPermissions) => boolean
  hasAnyPermission: (permissions: (keyof UserPermissions)[]) => boolean
  hasAllPermissions: (permissions: (keyof UserPermissions)[]) => boolean
  refreshPermissions: () => Promise<void>
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined)

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [permissions, setPermissions] = useState<UserPermissions | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadPermissions = async () => {
    if (!user) {
      setPermissions(null)
      setUserProfile(null)
      setLoading(false)
      return
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      
      if (userDoc.exists()) {
        const data = userDoc.data() as UserProfile
        
        // If no permissions field exists, user is a manager with full access (backward compatibility)
        const userPermissions = data.permissions || PERMISSION_PRESETS.full_access.permissions
        const accountType = data.accountType || 'manager'
        
        const profile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          name: data.name || user.displayName || '',
          accountType,
          managerId: data.managerId,
          createdAt: data.createdAt || new Date().toISOString(),
          createdBy: data.createdBy,
          permissions: userPermissions,
          isActive: data.isActive !== undefined ? data.isActive : true,
        }
        
        setUserProfile(profile)
        setPermissions(userPermissions)
      } else {
        // New user - create with manager permissions by default
        const defaultProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          name: user.displayName || '',
          accountType: 'manager',
          createdAt: new Date().toISOString(),
          permissions: PERMISSION_PRESETS.full_access.permissions,
          isActive: true,
        }
        setUserProfile(defaultProfile)
        setPermissions(defaultProfile.permissions)
      }
    } catch (error) {
      console.error('Error loading permissions:', error)
      // On error, assume manager with full permissions (fail open for existing users)
      setPermissions(PERMISSION_PRESETS.full_access.permissions)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPermissions()
  }, [user])

  const hasPermission = (permission: keyof UserPermissions): boolean => {
    if (!permissions) return false
    return permissions[permission] === true
  }

  const hasAnyPermission = (requiredPermissions: (keyof UserPermissions)[]): boolean => {
    if (!permissions) return false
    return requiredPermissions.some(permission => permissions[permission] === true)
  }

  const hasAllPermissions = (requiredPermissions: (keyof UserPermissions)[]): boolean => {
    if (!permissions) return false
    return requiredPermissions.every(permission => permissions[permission] === true)
  }

  const refreshPermissions = async () => {
    await loadPermissions()
  }

  const isManager = userProfile?.accountType === 'manager'

  return (
    <PermissionsContext.Provider
      value={{
        permissions,
        userProfile,
        loading,
        isManager,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        refreshPermissions,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  )
}

export function usePermissions() {
  const context = useContext(PermissionsContext)
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider')
  }
  return context
}
