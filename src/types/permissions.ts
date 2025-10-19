// Permission Types and Utilities

export interface UserPermissions {
  // Service Management
  canCreateServices: boolean
  canEditServices: boolean
  canDeleteServices: boolean
  canGenerateDocuments: boolean
  
  // Template Management
  canViewTemplates: boolean
  canUploadTemplates: boolean
  canEditTemplates: boolean
  canDeleteTemplates: boolean
  
  // AI Features
  canApproveAISections: boolean
  canUseAIFormatting: boolean
  canGenerateAISections: boolean
  
  // Field Management
  canAddFields: boolean
  canEditFields: boolean
  canDeleteFields: boolean
  
  // Intake Management
  canCreateIntakes: boolean
  canViewIntakes: boolean
  canApproveIntakes: boolean
  canHelpFillIntakes: boolean
  
  // Document Management
  canEditDocuments: boolean
  canDownloadDocuments: boolean
  
  // User Management
  canManageUsers: boolean
  
  // Settings
  canAccessSettings: boolean
  canManageBranding: boolean
}

export type AccountType = 'manager' | 'team_member'

export interface UserProfile {
  uid: string
  email: string
  name: string
  accountType: AccountType
  managerId?: string
  createdAt: string
  createdBy?: string
  permissions: UserPermissions
  isActive: boolean
}

// Permission Presets
export const PERMISSION_PRESETS: Record<string, { name: string; permissions: UserPermissions }> = {
  full_access: {
    name: 'Full Access',
    permissions: {
      canCreateServices: true,
      canEditServices: true,
      canDeleteServices: true,
      canGenerateDocuments: true,
      canViewTemplates: true,
      canUploadTemplates: true,
      canEditTemplates: true,
      canDeleteTemplates: true,
      canApproveAISections: true,
      canUseAIFormatting: true,
      canGenerateAISections: true,
      canAddFields: true,
      canEditFields: true,
      canDeleteFields: true,
      canCreateIntakes: true,
      canViewIntakes: true,
      canApproveIntakes: true,
      canHelpFillIntakes: true,
      canEditDocuments: true,
      canDownloadDocuments: true,
      canManageUsers: true,
      canAccessSettings: true,
      canManageBranding: true,
    },
  },
  assistant: {
    name: 'Assistant',
    permissions: {
      canCreateServices: true,
      canEditServices: true,
      canDeleteServices: false,
      canGenerateDocuments: true,
      canViewTemplates: true,
      canUploadTemplates: false,
      canEditTemplates: false,
      canDeleteTemplates: false,
      canApproveAISections: false,
      canUseAIFormatting: true,
      canGenerateAISections: true,
      canAddFields: false,
      canEditFields: false,
      canDeleteFields: false,
      canCreateIntakes: true,
      canViewIntakes: true,
      canApproveIntakes: false,
      canHelpFillIntakes: true,
      canEditDocuments: true,
      canDownloadDocuments: true,
      canManageUsers: false,
      canAccessSettings: false,
      canManageBranding: false,
    },
  },
  viewer: {
    name: 'Viewer (Read-Only)',
    permissions: {
      canCreateServices: false,
      canEditServices: false,
      canDeleteServices: false,
      canGenerateDocuments: false,
      canViewTemplates: true,
      canUploadTemplates: false,
      canEditTemplates: false,
      canDeleteTemplates: false,
      canApproveAISections: false,
      canUseAIFormatting: false,
      canGenerateAISections: false,
      canAddFields: false,
      canEditFields: false,
      canDeleteFields: false,
      canCreateIntakes: false,
      canViewIntakes: true,
      canApproveIntakes: false,
      canHelpFillIntakes: false,
      canEditDocuments: false,
      canDownloadDocuments: true,
      canManageUsers: false,
      canAccessSettings: false,
      canManageBranding: false,
    },
  },
  custom: {
    name: 'Custom',
    permissions: {
      canCreateServices: false,
      canEditServices: false,
      canDeleteServices: false,
      canGenerateDocuments: false,
      canViewTemplates: true,
      canUploadTemplates: false,
      canEditTemplates: false,
      canDeleteTemplates: false,
      canApproveAISections: false,
      canUseAIFormatting: false,
      canGenerateAISections: false,
      canAddFields: false,
      canEditFields: false,
      canDeleteFields: false,
      canCreateIntakes: false,
      canViewIntakes: true,
      canApproveIntakes: false,
      canHelpFillIntakes: false,
      canEditDocuments: false,
      canDownloadDocuments: false,
      canManageUsers: false,
      canAccessSettings: false,
      canManageBranding: false,
    },
  },
}

// Permission Groups for UI
export const PERMISSION_GROUPS = [
  {
    id: 'services',
    name: 'Services',
    icon: '📋',
    permissions: [
      { key: 'canCreateServices' as keyof UserPermissions, label: 'Create services' },
      { key: 'canEditServices' as keyof UserPermissions, label: 'Edit services' },
      { key: 'canDeleteServices' as keyof UserPermissions, label: 'Delete services' },
      { key: 'canGenerateDocuments' as keyof UserPermissions, label: 'Generate documents' },
    ],
  },
  {
    id: 'templates',
    name: 'Templates',
    icon: '📄',
    permissions: [
      { key: 'canViewTemplates' as keyof UserPermissions, label: 'View templates (read-only)' },
      { key: 'canUploadTemplates' as keyof UserPermissions, label: 'Upload templates' },
      { key: 'canEditTemplates' as keyof UserPermissions, label: 'Edit templates' },
      { key: 'canDeleteTemplates' as keyof UserPermissions, label: 'Delete templates' },
    ],
  },
  {
    id: 'ai',
    name: 'AI Features',
    icon: '✨',
    permissions: [
      { key: 'canApproveAISections' as keyof UserPermissions, label: 'Approve AI sections' },
      { key: 'canUseAIFormatting' as keyof UserPermissions, label: 'Use AI formatting' },
      { key: 'canGenerateAISections' as keyof UserPermissions, label: 'Generate AI sections' },
    ],
  },
  {
    id: 'fields',
    name: 'Fields',
    icon: '🎯',
    permissions: [
      { key: 'canAddFields' as keyof UserPermissions, label: 'Add fields' },
      { key: 'canEditFields' as keyof UserPermissions, label: 'Edit fields' },
      { key: 'canDeleteFields' as keyof UserPermissions, label: 'Delete fields' },
    ],
  },
  {
    id: 'intakes',
    name: 'Intakes',
    icon: '📝',
    permissions: [
      { key: 'canCreateIntakes' as keyof UserPermissions, label: 'Create intake links' },
      { key: 'canViewIntakes' as keyof UserPermissions, label: 'View intakes' },
      { key: 'canApproveIntakes' as keyof UserPermissions, label: 'Approve intakes' },
      { key: 'canHelpFillIntakes' as keyof UserPermissions, label: 'Help clients fill intakes' },
    ],
  },
  {
    id: 'documents',
    name: 'Documents',
    icon: '📑',
    permissions: [
      { key: 'canEditDocuments' as keyof UserPermissions, label: 'Edit documents' },
      { key: 'canDownloadDocuments' as keyof UserPermissions, label: 'Download documents' },
    ],
  },
  {
    id: 'admin',
    name: 'Administration',
    icon: '⚙️',
    permissions: [
      { key: 'canManageUsers' as keyof UserPermissions, label: 'Manage team members' },
      { key: 'canAccessSettings' as keyof UserPermissions, label: 'Access settings' },
      { key: 'canManageBranding' as keyof UserPermissions, label: 'Manage branding' },
    ],
  },
]

// Utility: Check if user has permission
export function hasPermission(
  userPermissions: UserPermissions | undefined,
  permission: keyof UserPermissions
): boolean {
  if (!userPermissions) return false
  return userPermissions[permission] === true
}

// Utility: Check if user has any of the permissions
export function hasAnyPermission(
  userPermissions: UserPermissions | undefined,
  permissions: (keyof UserPermissions)[]
): boolean {
  if (!userPermissions) return false
  return permissions.some(permission => userPermissions[permission] === true)
}

// Utility: Check if user has all permissions
export function hasAllPermissions(
  userPermissions: UserPermissions | undefined,
  permissions: (keyof UserPermissions)[]
): boolean {
  if (!userPermissions) return false
  return permissions.every(permission => userPermissions[permission] === true)
}

// Utility: Get missing permissions
export function getMissingPermissions(
  userPermissions: UserPermissions | undefined,
  requiredPermissions: (keyof UserPermissions)[]
): (keyof UserPermissions)[] {
  if (!userPermissions) return requiredPermissions
  return requiredPermissions.filter(permission => !userPermissions[permission])
}

// Utility: Count enabled permissions
export function countEnabledPermissions(permissions: UserPermissions): number {
  return Object.values(permissions).filter(value => value === true).length
}

// Utility: Get permission label
export function getPermissionLabel(permission: keyof UserPermissions): string {
  const allPermissions = PERMISSION_GROUPS.flatMap(group => group.permissions)
  const found = allPermissions.find(p => p.key === permission)
  return found?.label || permission
}
