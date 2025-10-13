'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { collection, query, onSnapshot, orderBy, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/lib/auth/AuthProvider'
import { 
  ClipboardList, 
  Mail,
  CheckCircle2,
  Clock,
  Send,
  Eye,
  Loader2
} from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { SearchBar } from '@/components/ui/SearchBar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import ErrorState from '@/components/ui/ErrorState'
import { isFeatureEnabled } from '@/lib/feature-flags'

interface IntakeForm {
  id: string
  serviceId: string
  serviceName?: string
  clientName?: string
  clientEmail?: string
  status: 'pending' | 'submitted' | 'viewed'
  createdAt: any
  submittedAt?: any
  token: string
}

export default function IntakesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [intakes, setIntakes] = useState<IntakeForm[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const emptyErrorStatesEnabled = isFeatureEnabled('emptyErrorStates')

  useEffect(() => {
    if (!user?.uid) return

    const intakesQuery = query(
      collection(db, 'intakeForms'),
      where('createdBy', '==', user.uid),
      orderBy('createdAt', 'desc')
    )
    
    const unsubscribe = onSnapshot(intakesQuery, (snapshot) => {
      const intakesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as IntakeForm[]
      
      setIntakes(intakesData)
      setError(null)
      setLoading(false)
    }, (error) => {
      console.error('Error loading intakes:', error)
      setError('Failed to load intake forms')
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user?.uid])

  const filteredIntakes = searchQuery.trim()
    ? intakes.filter(intake => 
        intake.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        intake.clientEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        intake.serviceName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : intakes

  const formatDate = (date: any) => {
    if (!date) return 'Recently'
    if (typeof date.toDate === 'function') {
      return date.toDate().toLocaleDateString()
    }
    return new Date(date).toLocaleDateString()
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'submitted':
        return { variant: 'success' as const, label: 'Submitted', icon: CheckCircle2 }
      case 'viewed':
        return { variant: 'info' as const, label: 'Viewed', icon: Eye }
      default:
        return { variant: 'warning' as const, label: 'Pending', icon: Clock }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Intake Forms</h1>
          <p className="text-gray-600">Monitor and manage client intake submissions</p>
        </div>

        {/* Stats */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Intakes</p>
                  <p className="text-2xl font-bold text-gray-900">{intakes.length}</p>
                </div>
                <ClipboardList className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {intakes.filter(i => i.status === 'pending').length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Submitted</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {intakes.filter(i => i.status === 'submitted').length}
                  </p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading intake forms...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          emptyErrorStatesEnabled ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <ErrorState
                title="Failed to load intakes"
                message={error}
                onRetry={() => window.location.reload()}
                retryLabel="Reload Page"
                showDetails={false}
              />
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Reload Page
              </button>
            </div>
          )
        )}

        {/* Search */}
        {!loading && !error && (
          <>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search by client name, email, or service..."
              />
            </div>

            {/* Intakes List */}
            {filteredIntakes.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title={searchQuery ? 'No intakes match your search' : 'No intake forms yet'}
                description={searchQuery ? 'Try adjusting your search terms' : 'Intake forms will appear here when clients submit them'}
              />
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Client
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Service
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Submitted
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredIntakes.map((intake) => {
                        const statusInfo = getStatusInfo(intake.status)
                        return (
                          <tr key={intake.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col">
                                <div className="text-sm font-medium text-gray-900">
                                  {intake.clientName || 'Unknown'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {intake.clientEmail}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {intake.serviceName || 'N/A'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <StatusBadge variant={statusInfo.variant}>
                                {statusInfo.label}
                              </StatusBadge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(intake.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {intake.submittedAt ? formatDate(intake.submittedAt) : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => router.push(`/admin/services/${intake.serviceId}`)}
                                className="inline-flex items-center gap-2 px-3 py-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                                View Service
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
