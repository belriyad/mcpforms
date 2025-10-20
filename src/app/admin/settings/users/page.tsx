'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthProvider'
import { usePermissions } from '@/contexts/PermissionsContext'
import { collection, query, where, getDocs, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { UserProfile, PERMISSION_PRESETS } from '@/types/permissions'
import { Users, UserPlus, Edit, Trash2, Shield, ShieldCheck, ArrowLeft, Mail, Key, MailCheck, Clock } from 'lucide-react'
import AddTeamMemberModal from '@/components/admin/AddTeamMemberModal'
import EditTeamMemberModal from '@/components/admin/EditTeamMemberModal'

export default function UserManagementPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { hasPermission, isManager, loading: permissionsLoading } = usePermissions()
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingMember, setEditingMember] = useState<UserProfile | null>(null)
  const [resettingPassword, setResettingPassword] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading || permissionsLoading) return

    if (!user) {
      router.push('/login')
      return
    }

    if (!hasPermission('canManageUsers')) {
      router.push('/admin')
      return
    }

    loadTeamMembers()
  }, [user, authLoading, permissionsLoading, hasPermission])

  const loadTeamMembers = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Load all team members where current user is the manager
      const membersQuery = query(
        collection(db, 'users'),
        where('managerId', '==', user.uid)
      )
      
      const snapshot = await getDocs(membersQuery)
      const members: UserProfile[] = []
      
      snapshot.forEach(doc => {
        members.push({ uid: doc.id, ...doc.data() } as UserProfile)
      })
      
      // Sort by creation date
      members.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      
      setTeamMembers(members)
    } catch (error) {
      console.error('Error loading team members:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this team member? This action cannot be undone.')) {
      return
    }

    try {
      await deleteDoc(doc(db, 'users', memberId))
      setTeamMembers(prev => prev.filter(m => m.uid !== memberId))
    } catch (error) {
      console.error('Error removing team member:', error)
      alert('Failed to remove team member')
    }
  }

  const handleResetPassword = async (member: UserProfile) => {
    if (!confirm(`Send password reset email to ${member.email}?`)) {
      return
    }

    setResettingPassword(member.uid)

    try {
      const token = await user?.getIdToken()
      
      const response = await fetch('/api/users/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: member.uid,
          email: member.email
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send password reset')
      }

      // Update Firestore with reset timestamp
      await updateDoc(doc(db, 'users', member.uid), {
        lastPasswordResetAt: new Date().toISOString(),
        passwordResetBy: user?.uid
      })

      alert(`Password reset email sent to ${member.email}`)
      loadTeamMembers()
    } catch (error: any) {
      console.error('Error sending password reset:', error)
      alert(error.message || 'Failed to send password reset email')
    } finally {
      setResettingPassword(null)
    }
  }

  const getPermissionCount = (member: UserProfile) => {
    return Object.values(member.permissions).filter(v => v === true).length
  }

  if (authLoading || permissionsLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/admin/settings')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Settings
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-600" />
                Team Management
              </h1>
              <p className="mt-2 text-gray-600">
                Manage your team members and their permissions
              </p>
            </div>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg font-medium"
            >
              <UserPlus className="w-5 h-5" />
              Add Team Member
            </button>
          </div>
        </div>

        {/* Admin Account Section */}
        {user && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 shadow-sm border border-blue-200 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Your Account (Admin)</h3>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
              </div>
              <button
                onClick={() => handleResetPassword({
                  uid: user.uid,
                  email: user.email || '',
                  name: 'Admin',
                  accountType: 'manager',
                  createdAt: new Date().toISOString(),
                  permissions: {} as any,
                  isActive: true
                })}
                disabled={resettingPassword === user.uid}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-purple-700 border-2 border-purple-300 rounded-lg hover:bg-purple-50 transition-colors font-medium disabled:opacity-50"
              >
                {resettingPassword === user.uid ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    Reset My Password
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Team Members</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{teamMembers.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Members</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {teamMembers.filter(m => m.isActive).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Invites Sent</p>
                <p className="text-3xl font-bold text-purple-600 mt-1">
                  {teamMembers.filter(m => m.inviteSentAt).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <MailCheck className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inactive Members</p>
                <p className="text-3xl font-bold text-gray-400 mt-1">
                  {teamMembers.filter(m => !m.isActive).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Team Members List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
          </div>

          {teamMembers.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No team members yet</h3>
              <p className="text-gray-500 mb-6">
                Add your first team member to start collaborating
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <UserPlus className="w-5 h-5" />
                Add Team Member
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invite Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Permissions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Added
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {teamMembers.map(member => (
                    <tr key={member.uid} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{member.name}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {member.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {member.isActive ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {member.inviteSentAt ? (
                            <>
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                <MailCheck className="w-3 h-3" />
                                Invited
                              </span>
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(member.inviteSentAt).toLocaleDateString()}
                              </div>
                            </>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              No invite sent
                            </span>
                          )}
                          {member.lastPasswordResetAt && (
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <Key className="w-3 h-3" />
                              Reset: {new Date(member.lastPasswordResetAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getPermissionCount(member)} / {Object.keys(member.permissions).length} enabled
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(member.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleResetPassword(member)}
                            disabled={resettingPassword === member.uid}
                            className="text-purple-600 hover:text-purple-900 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Send password reset email"
                          >
                            {resettingPassword === member.uid ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                            ) : (
                              <Key className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => setEditingMember(member)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit permissions"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRemoveMember(member.uid)}
                            className="text-red-600 hover:text-red-900"
                            title="Remove member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddTeamMemberModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            loadTeamMembers()
          }}
        />
      )}

      {editingMember && (
        <EditTeamMemberModal
          isOpen={!!editingMember}
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onSuccess={() => {
            setEditingMember(null)
            loadTeamMembers()
          }}
        />
      )}
    </div>
  )
}
