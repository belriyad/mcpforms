'use client'

import { ReactNode } from 'react'
import { usePermissions } from '@/contexts/PermissionsContext'
import { UserPermissions } from '@/types/permissions'
import { ShieldAlert } from 'lucide-react'

interface PermissionGuardProps {
  children: ReactNode
  permission?: keyof UserPermissions
  anyPermissions?: (keyof UserPermissions)[]
  allPermissions?: (keyof UserPermissions)[]
  fallback?: ReactNode
  requireManager?: boolean
  showTooltip?: boolean
}

export function PermissionGuard({
  children,
  permission,
  anyPermissions,
  allPermissions,
  fallback,
  requireManager,
  showTooltip = false,
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isManager, loading } = usePermissions()

  // While loading, show nothing to avoid flicker
  if (loading) {
    return null
  }

  // Check manager requirement
  if (requireManager && !isManager) {
    return fallback ? <>{fallback}</> : null
  }

  // Check single permission
  if (permission && !hasPermission(permission)) {
    if (showTooltip) {
      return (
        <div className="relative group">
          <div className="opacity-50 cursor-not-allowed pointer-events-none">
            {children}
          </div>
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50">
            <div className="bg-gray-900 text-white text-xs rounded py-2 px-3 whitespace-nowrap shadow-lg">
              <ShieldAlert className="w-3 h-3 inline mr-1" />
              This feature requires additional permissions
            </div>
          </div>
        </div>
      )
    }
    return fallback ? <>{fallback}</> : null
  }

  // Check any of permissions
  if (anyPermissions && !hasAnyPermission(anyPermissions)) {
    if (showTooltip) {
      return (
        <div className="relative group">
          <div className="opacity-50 cursor-not-allowed pointer-events-none">
            {children}
          </div>
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50">
            <div className="bg-gray-900 text-white text-xs rounded py-2 px-3 whitespace-nowrap shadow-lg">
              <ShieldAlert className="w-3 h-3 inline mr-1" />
              This feature requires additional permissions
            </div>
          </div>
        </div>
      )
    }
    return fallback ? <>{fallback}</> : null
  }

  // Check all permissions
  if (allPermissions && !hasAllPermissions(allPermissions)) {
    if (showTooltip) {
      return (
        <div className="relative group">
          <div className="opacity-50 cursor-not-allowed pointer-events-none">
            {children}
          </div>
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50">
            <div className="bg-gray-900 text-white text-xs rounded py-2 px-3 whitespace-nowrap shadow-lg">
              <ShieldAlert className="w-3 h-3 inline mr-1" />
              This feature requires additional permissions
            </div>
          </div>
        </div>
      )
    }
    return fallback ? <>{fallback}</> : null
  }

  // User has required permissions
  return <>{children}</>
}

// Utility component for inline permission checks
interface WithPermissionProps {
  has: keyof UserPermissions
  children: ReactNode
  fallback?: ReactNode
}

export function WithPermission({ has, children, fallback }: WithPermissionProps) {
  const { hasPermission } = usePermissions()
  
  if (!hasPermission(has)) {
    return fallback ? <>{fallback}</> : null
  }
  
  return <>{children}</>
}

// Hook for programmatic permission checks
export function usePermissionCheck() {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isManager } = usePermissions()
  
  return {
    canDo: hasPermission,
    canDoAny: hasAnyPermission,
    canDoAll: hasAllPermissions,
    isManager,
  }
}
