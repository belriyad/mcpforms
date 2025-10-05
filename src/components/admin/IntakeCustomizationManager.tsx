'use client'

import { useState, useEffect } from 'react'
import { getFunctions, httpsCallable } from 'firebase/functions'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

interface CustomField {
  id: string
  name: string
  type: string
  label: string
  description?: string
  required: boolean
  placeholder?: string
}

interface CustomClause {
  id: string
  title: string
  content: string
}

interface PendingIntake {
  id: string
  serviceName: string
  clientName?: string
  clientEmail?: string
  submittedAt: any
  customFields: CustomField[]
  customClauses: CustomClause[]
  clientData: Record<string, any>
  custom_fields?: CustomField[]
  custom_clauses?: CustomClause[]
}

export default function IntakeCustomizationManager() {
  const [intakes, setIntakes] = useState<PendingIntake[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedIntake, setSelectedIntake] = useState<PendingIntake | null>(null)
  const [processing, setProcessing] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)

  useEffect(() => {
    loadPendingIntakes()
  }, [])

  const loadPendingIntakes = async () => {
    try {
      setLoading(true)
      setError(null)

      const functions = getFunctions()
      const listIntakes = httpsCallable(functions, 'listIntakes')
      const result = await listIntakes({ status: 'pending-approval' }) as any

      if (result.data.success) {
        const intakeData = result.data.data.map((intake: any) => ({
          ...intake,
          customFields: intake.custom_fields || [],
          customClauses: intake.custom_clauses || [],
          submittedAt: intake.submittedAt?.toDate ? intake.submittedAt.toDate() : new Date(intake.submittedAt),
        }))
        setIntakes(intakeData)
      } else {
        setError(result.data.error || 'Failed to load pending intakes')
      }
    } catch (err) {
      console.error('Error loading pending intakes:', err)
      setError('Failed to load pending customizations')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (intakeId: string) => {
    try {
      setProcessing(true)
      const functions = getFunctions()
      const approveCustomization = httpsCallable(functions, 'approveCustomization')
      const result = await approveCustomization({ intakeId }) as any

      if (result.data.success) {
        toast.success('Customization approved successfully!')
        setSelectedIntake(null)
        await loadPendingIntakes()
      } else {
        toast.error(result.data.error || 'Failed to approve customization')
      }
    } catch (err) {
      console.error('Error approving customization:', err)
      toast.error('Failed to approve customization')
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!selectedIntake || !rejectReason.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }

    try {
      setProcessing(true)
      const functions = getFunctions()
      const rejectCustomization = httpsCallable(functions, 'rejectCustomization')
      const result = await rejectCustomization({ 
        intakeId: selectedIntake.id,
        reason: rejectReason,
      }) as any

      if (result.data.success) {
        toast.success('Customization rejected')
        setSelectedIntake(null)
        setShowRejectModal(false)
        setRejectReason('')
        await loadPendingIntakes()
      } else {
        toast.error(result.data.error || 'Failed to reject customization')
      }
    } catch (err) {
      console.error('Error rejecting customization:', err)
      toast.error('Failed to reject customization')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="card">
        <div className="card-content text-center py-12">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-600">{error}</p>
          <button onClick={loadPendingIntakes} className="btn btn-primary mt-4">
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (intakes.length === 0) {
    return (
      <div className="card">
        <div className="card-content text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Customizations</h3>
          <p className="text-gray-600">
            All customizations have been reviewed. New submissions will appear here.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pending Customizations</h2>
          <p className="text-gray-600 mt-1">
            Review and approve customer customizations before document generation
          </p>
        </div>
        <button
          onClick={loadPendingIntakes}
          className="btn btn-secondary"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Intakes List */}
      <div className="grid gap-4">
        {intakes.map((intake) => (
          <div key={intake.id} className="card hover:shadow-lg transition-shadow">
            <div className="card-content">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{intake.serviceName}</h3>
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    {intake.clientName && (
                      <p>
                        <span className="font-medium">Client:</span> {intake.clientName}
                        {intake.clientEmail && ` (${intake.clientEmail})`}
                      </p>
                    )}
                    <p>
                      <span className="font-medium">Submitted:</span>{' '}
                      {intake.submittedAt?.toLocaleDateString?.()} at {intake.submittedAt?.toLocaleTimeString?.()}
                    </p>
                    <p>
                      <span className="font-medium">Custom Fields:</span> {intake.customFields?.length || 0} added
                    </p>
                    <p>
                      <span className="font-medium">Custom Clauses:</span> {intake.customClauses?.length || 0} added
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedIntake(intake)}
                  className="btn btn-primary ml-4"
                >
                  Review
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Review Modal */}
      {selectedIntake && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedIntake.serviceName}</h2>
                  <p className="text-gray-600 mt-1">
                    {selectedIntake.clientName} • {selectedIntake.clientEmail}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedIntake(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Custom Fields */}
              {selectedIntake.customFields && selectedIntake.customFields.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Custom Fields</h3>
                  <div className="space-y-3">
                    {selectedIntake.customFields.map((field) => (
                      <div key={field.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{field.label}</div>
                            <div className="text-sm text-gray-600 mt-1">
                              Type: <span className="font-mono">{field.type}</span> •{' '}
                              {field.required ? 'Required' : 'Optional'}
                            </div>
                            {field.description && (
                              <div className="text-sm text-gray-700 mt-2">{field.description}</div>
                            )}
                          </div>
                          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            New Field
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Clauses */}
              {selectedIntake.customClauses && selectedIntake.customClauses.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Custom Clauses</h3>
                  <div className="space-y-3">
                    {selectedIntake.customClauses.map((clause) => (
                      <div key={clause.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium text-gray-900">{clause.title}</div>
                          <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                            New Clause
                          </span>
                        </div>
                        <div className="text-sm text-gray-700 whitespace-pre-wrap border-l-2 border-purple-300 pl-3">
                          {clause.content}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t">
                <button
                  onClick={() => {
                    setShowRejectModal(true)
                  }}
                  disabled={processing}
                  className="btn btn-outline text-red-600 hover:bg-red-50"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleApprove(selectedIntake.id)}
                  disabled={processing}
                  className="btn btn-primary"
                >
                  {processing ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">Processing...</span>
                    </>
                  ) : (
                    'Approve Customizations'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedIntake && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Customization</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting these customizations. This will be shared with the client.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={4}
              className="form-textarea mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectReason('')
                }}
                disabled={processing}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={processing || !rejectReason.trim()}
                className="btn bg-red-600 hover:bg-red-700 text-white"
              >
                {processing ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Rejecting...</span>
                  </>
                ) : (
                  'Confirm Rejection'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
