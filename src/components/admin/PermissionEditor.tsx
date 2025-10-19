'use client'

import { UserPermissions, PERMISSION_GROUPS } from '@/types/permissions'

interface PermissionEditorProps {
  permissions: UserPermissions
  onChange: (permissions: UserPermissions) => void
  disabled?: boolean
}

export default function PermissionEditor({ permissions, onChange, disabled = false }: PermissionEditorProps) {
  const handleToggle = (key: keyof UserPermissions) => {
    onChange({
      ...permissions,
      [key]: !permissions[key],
    })
  }

  return (
    <div className="space-y-6">
      {PERMISSION_GROUPS.map((group) => (
        <div key={group.id} className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">{group.icon}</span>
            <h4 className="font-semibold text-gray-900">{group.name}</h4>
          </div>
          <div className="space-y-2">
            {group.permissions.map((perm) => (
              <label
                key={perm.key}
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
              >
                <input
                  type="checkbox"
                  checked={permissions[perm.key]}
                  onChange={() => handleToggle(perm.key)}
                  disabled={disabled}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className="text-sm text-gray-700">{perm.label}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
