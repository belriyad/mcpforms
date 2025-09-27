'use client'

import { useState, useEffect } from 'react'
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '@/lib/firebase'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

interface Intake {
  id: string
  serviceId: string
  serviceName: string
  linkToken: string
  clientData: Record<string, any>
  status: 'link-generated' | 'opened' | 'in-progress' | 'submitted' | 'approved' | 'rejected' | 'documents-generated'
  createdAt: any
  submittedAt?: any
  approvedAt?: any
  clientEmail?: string
  clientName?: string
  expiresAt?: any
}

export default function IntakeMonitor() {
  const [intakes, setIntakes] = useState<Intake[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIntake, setSelectedIntake] = useState<Intake | null>(null)
  const [showGenerateLink, setShowGenerateLink] = useState(false)

  useEffect(() => {
    const q = query(collection(db, 'intakes'), orderBy('createdAt', 'desc'))
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const intakesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Intake[]
      
      setIntakes(intakesData)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const handleApproveIntake = async (intakeId: string, approved: boolean) => {
    try {
      const approveIntakeForm = httpsCallable(functions, 'approveIntakeForm')
      await approveIntakeForm({ intakeId, approved })
      toast.success(`Intake ${approved ? 'approved' : 'rejected'} successfully`)
    } catch (error: any) {
      console.error('Error approving intake:', error)
      toast.error(error.message || 'Failed to update intake status')
    }
  }

  const handleGenerateDocuments = async (intakeId: string) => {
    try {
      const generateDocumentsFromIntake = httpsCallable(functions, 'generateDocumentsFromIntake')
      await generateDocumentsFromIntake({ intakeId })
      toast.success('Document generation started')
    } catch (error: any) {
      console.error('Error generating documents:', error)
      toast.error(error.message || 'Failed to generate documents')
    }
  }

  const copyIntakeLink = (intake: Intake) => {
    const baseUrl = window.location.origin
    const intakeUrl = `${baseUrl}/intake/${intake.linkToken}`
    navigator.clipboard.writeText(intakeUrl)
    toast.success('Intake link copied to clipboard')
  }

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      'link-generated': 'status-neutral',
      'opened': 'status-info',
      'in-progress': 'status-warning',
      'submitted': 'status-info',
      'approved': 'status-success',
      'rejected': 'status-error',
      'documents-generated': 'status-success'
    }
    
    const statusLabels = {
      'link-generated': 'Link Generated',
      'opened': 'Opened',
      'in-progress': 'In Progress',
      'submitted': 'Submitted',
      'approved': 'Approved',
      'rejected': 'Rejected',
      'documents-generated': 'Documents Generated'
    }

    return (
      <span className={statusClasses[status as keyof typeof statusClasses] || 'status-neutral'}>
        {statusLabels[status as keyof typeof statusLabels] || status}
      </span>
    )
  }

  const isExpired = (intake: Intake) => {
    return intake.expiresAt && intake.expiresAt.toDate() < new Date()
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Intake Monitor</h2>
          <p className="text-gray-600 mt-1">Monitor and manage client intake submissions</p>
        </div>
        <button
          onClick={() => setShowGenerateLink(true)}
          className="btn btn-primary"
        >
          + Generate Intake Link
        </button>
      </div>

      {intakes.length === 0 ? (
        <div className="card">
          <div className="card-content text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No intakes found</h3>
            <p className="text-gray-500 mb-4">Generate intake links to start collecting client information</p>
            <button
              onClick={() => setShowGenerateLink(true)}
              className="btn btn-primary"
            >
              Generate Intake Link
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          {intakes.map((intake) => (
            <div key={intake.id} className="card">
              <div className="card-content">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{intake.serviceName}</h3>
                      {getStatusBadge(intake.status)}
                      {isExpired(intake) && (
                        <span className="status-error">Expired</span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                      <div>
                        <span className="font-medium">Created:</span> {intake.createdAt?.toDate().toLocaleString()}
                      </div>
                      {intake.submittedAt && (
                        <div>
                          <span className="font-medium">Submitted:</span> {intake.submittedAt.toDate().toLocaleString()}
                        </div>
                      )}
                      {intake.clientEmail && (
                        <div>
                          <span className="font-medium">Client Email:</span> {intake.clientEmail}
                        </div>
                      )}
                      {intake.clientName && (
                        <div>
                          <span className="font-medium">Client Name:</span> {intake.clientName}
                        </div>
                      )}
                    </div>

                    {intake.expiresAt && (
                      <div className="text-sm text-gray-500 mb-3">
                        <span className="font-medium">Expires:</span> {intake.expiresAt.toDate().toLocaleString()}
                      </div>
                    )}

                    {Object.keys(intake.clientData || {}).length > 0 && (
                      <div className="mb-3">
                        <button
                          onClick={() => setSelectedIntake(selectedIntake?.id === intake.id ? null : intake)}
                          className="text-sm text-primary-600 hover:text-primary-500 font-medium"
                        >
                          {selectedIntake?.id === intake.id ? 'Hide' : 'View'} Client Data
                        </button>
                        
                        {selectedIntake?.id === intake.id && (
                          <div className="mt-2 p-3 bg-gray-50 rounded border">
                            <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-x-auto">
                              {JSON.stringify(intake.clientData, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {intake.status === 'submitted' && (
                      <>
                        <button
                          onClick={() => handleApproveIntake(intake.id, true)}
                          className="btn btn-sm btn-primary"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleApproveIntake(intake.id, false)}
                          className="btn btn-sm btn-outline text-red-600 border-red-300 hover:bg-red-50"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    
                    {intake.status === 'approved' && (
                      <button
                        onClick={() => handleGenerateDocuments(intake.id)}
                        className="btn btn-sm btn-primary"
                      >
                        Generate Documents
                      </button>
                    )}
                    
                    {['link-generated', 'opened', 'in-progress'].includes(intake.status) && !isExpired(intake) && (
                      <button
                        onClick={() => copyIntakeLink(intake)}
                        className="btn btn-sm btn-outline"
                        title="Copy intake link"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showGenerateLink && (
        <GenerateIntakeLinkForm
          onClose={() => setShowGenerateLink(false)}
          onLinkGenerated={() => setShowGenerateLink(false)}
        />
      )}
    </div>
  )
}

function GenerateIntakeLinkForm({ onClose, onLinkGenerated }: { onClose: () => void, onLinkGenerated: () => void }) {
  const [services, setServices] = useState<any[]>([])
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [expiresInDays, setExpiresInDays] = useState(30)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    const q = query(collection(db, 'services'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const servicesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter((service: any) => service.status === 'active')
      
      setServices(servicesData)
    })

    return unsubscribe
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedServiceId) {
      toast.error('Please select a service')
      return
    }

    setGenerating(true)

    try {
      const generateIntakeLink = httpsCallable(functions, 'generateIntakeLink')
      const result = await generateIntakeLink({
        serviceId: selectedServiceId,
        clientEmail: clientEmail || undefined,
        expiresInDays,
      })

      const { intakeUrl } = (result.data as any).data
      
      // Copy to clipboard
      navigator.clipboard.writeText(intakeUrl)
      toast.success('Intake link generated and copied to clipboard!')
      
      onLinkGenerated()
    } catch (error: any) {
      console.error('Error generating intake link:', error)
      toast.error(error.message || 'Failed to generate intake link')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="card">
          <div className="card-header">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Generate Intake Link</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="card-content space-y-4">
            <div>
              <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-1">
                Service
              </label>
              <select
                id="service"
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                className="form-select"
                required
              >
                <option value="">Select a service</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="clientEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Client Email (Optional)
              </label>
              <input
                id="clientEmail"
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="form-input"
                placeholder="client@example.com"
              />
            </div>

            <div>
              <label htmlFor="expiresInDays" className="block text-sm font-medium text-gray-700 mb-1">
                Expires In (Days)
              </label>
              <input
                id="expiresInDays"
                type="number"
                min="1"
                max="365"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(parseInt(e.target.value))}
                className="form-input"
              />
            </div>
          </form>

          <div className="card-footer">
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={generating}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={generating || !selectedServiceId}
                className="btn btn-primary"
              >
                {generating ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Generating...</span>
                  </>
                ) : (
                  'Generate Link'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}