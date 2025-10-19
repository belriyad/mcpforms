'use client'

import { useState } from 'react'
import { X, UserPlus, Mail, Loader2 } from 'lucide-react'
import { UserPermissions, PERMISSION_PRESETS } from '@/types/permissions'
import PermissionEditor from './PermissionEditor'
import { useAuth } from '@/lib/auth/AuthProvider'

interface AddTeamMemberModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AddTeamMemberModal({ isOpen, onClose, onSuccess }: AddTeamMemberModalProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    sendInvitation: true,
  })
  const [permissions, setPermissions] = useState<UserPermissions>(PERMISSION_PRESETS.assistant.permissions)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const token = await user?.getIdToken()
      if (!token) {
        throw new Error('Not authenticated')
      }

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          permissions,
          sendInvitation: formData.sendInvitation,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create team member')
      }

      // Show success message if invitation was sent
      if (data.resetLink) {
        alert('Team member created! They will receive an invitation email shortly.')
      } else {
        alert('Team member created successfully!')
      }

      onSuccess()
      onClose()
      
      // Reset form
      setFormData({ email: '', name: '', sendInvitation: true })
      setPermissions(PERMISSION_PRESETS.assistant.permissions)
      
    } catch (err: any) {
      console.error('Error creating team member:', err)
      setError(err.message || 'Failed to create team member')
    } finally {
      setLoading(false)
    }
  }

  const handlePresetChange = (presetKey: string) => {
    const preset = PERMISSION_PRESETS[presetKey as keyof typeof PERMISSION_PRESETS]
    if (preset) {
      setPermissions(preset.permissions)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Add Team Member</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="team.member@company.com"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="John Doe"
                disabled={loading}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="sendInvitation"
                checked={formData.sendInvitation}
                onChange={(e) => setFormData(prev => ({ ...prev, sendInvitation: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <label htmlFor="sendInvitation" className="text-sm text-gray-700 flex items-center gap-1">
                <Mail className="w-4 h-4" />
                Send invitation email
              </label>
            </div>
          </div>

          {/* Permission Presets */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Permission Level</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {Object.entries(PERMISSION_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handlePresetChange(key)}
                  className={`p-4 border-2 rounded-lg transition-colors text-center ${
                    JSON.stringify(permissions) === JSON.stringify(preset.permissions)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  disabled={loading}
                >
                  <span className="font-medium text-gray-900">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Permissions */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Custom Permissions</h3>
            <PermissionEditor
              permissions={permissions}
              onChange={setPermissions}
              disabled={loading}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Add Team Member
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
