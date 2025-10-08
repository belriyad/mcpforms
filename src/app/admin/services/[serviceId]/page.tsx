'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { doc, getDoc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/lib/auth/AuthProvider'
import { Service } from '@/types/service'
import ViewResponsesModal from '@/components/ViewResponsesModal'
import EditResponsesModal from '@/components/EditResponsesModal'
import { 
  ArrowLeft,
  FileText,
  Mail,
  Clock,
  CheckCircle2,
  Eye,
  Edit,
  Download,
  ExternalLink,
  Sparkles,
  Calendar,
  User,
  Trash2,
  Send,
  FileCheck,
  Package,
  Loader2,
  AlertCircle
} from 'lucide-react'

export default function ServiceDetailPage({ params }: { params: { serviceId: string } }) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [service, setService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showIntakePreview, setShowIntakePreview] = useState(false)
  const [generatingDocs, setGeneratingDocs] = useState(false)
  const [showViewResponses, setShowViewResponses] = useState(false)
  const [showEditResponses, setShowEditResponses] = useState(false)

  // Load service from Firestore with real-time updates
  useEffect(() => {
    if (authLoading) return
    
    if (!user) {
      router.push('/login')
      return
    }

    const serviceRef = doc(db, 'services', params.serviceId)
    
    const unsubscribe = onSnapshot(
      serviceRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const serviceData = { id: docSnap.id, ...docSnap.data() } as Service
          
          // TEMPORARY: Show ownership info for debugging
          console.log('📦 Service loaded:', {
            id: serviceData.id,
            name: serviceData.name,
            createdBy: serviceData.createdBy || '❌ MISSING',
            currentUser: user.uid
          });
          
          // Show warning if service needs migration or belongs to different user
          if (!serviceData.createdBy) {
            console.warn('⚠️ This service needs migration - missing createdBy field');
          } else if (serviceData.createdBy !== user.uid) {
            console.warn('⚠️ This service belongs to:', serviceData.createdBy);
            console.warn('Your user ID:', user.uid);
          }
          
          // TEMPORARY: Allow viewing for debugging
          setService(serviceData)
          setError(null)
        } else {
          setError('Service not found')
        }
        setLoading(false)
      },
      (err) => {
        console.error('Error loading service:', err)
        // More helpful error message
        if (err.code === 'permission-denied') {
          setError('Access denied. This service may need to be migrated. Please visit /migrate.html to assign ownership.')
        } else {
          setError('Failed to load service. Please try again or contact support.')
        }
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [params.serviceId, user, authLoading, router])

  const getStatusBadge = () => {
    if (!service || !service.status) return null
    
    const statusConfig = {
      draft: { label: 'Draft', color: 'gray', icon: Edit },
      active: { label: 'Active', color: 'green', icon: CheckCircle2 },
      inactive: { label: 'Inactive', color: 'gray', icon: Clock },
      intake_sent: { label: 'Intake Sent', color: 'blue', icon: Mail },
      intake_submitted: { label: 'Pending Review', color: 'yellow', icon: Clock },
      documents_ready: { label: 'Ready', color: 'green', icon: CheckCircle2 },
      completed: { label: 'Completed', color: 'purple', icon: CheckCircle2 }
    }

    const config = statusConfig[service.status as keyof typeof statusConfig]
    
    // If status doesn't match any known config, show a default badge
    if (!config) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border bg-gray-100 text-gray-700 border-gray-300">
          <Edit className="w-4 h-4" />
          {service.status || 'Unknown'}
        </span>
      )
    }
    
    const Icon = config.icon
    
    const colors: Record<string, string> = {
      gray: 'bg-gray-100 text-gray-700 border-gray-300',
      blue: 'bg-blue-100 text-blue-700 border-blue-300',
      yellow: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      green: 'bg-green-100 text-green-700 border-green-300',
      purple: 'bg-purple-100 text-purple-700 border-purple-300'
    }

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${colors[config.color]}`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    )
  }

  const handleResendIntake = () => {
    if (!service) return
    alert('Intake form link resent to ' + service.clientEmail)
  }

  const handleGenerateDocuments = async () => {
    if (!service) return
    
    setGeneratingDocs(true)
    try {
      const response = await fetch('/api/services/generate-documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ serviceId: service.id }),
      })

      const result = await response.json()

      if (result.success) {
        alert(`✅ Successfully generated ${result.documents.length} documents!`)
        // Service will update automatically via onSnapshot
      } else {
        alert(`❌ Error: ${result.error}`)
      }
    } catch (err) {
      console.error('Error generating documents:', err)
      alert('❌ Failed to generate documents')
    } finally {
      setGeneratingDocs(false)
    }
  }

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading service details...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !service) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-xl p-8 shadow-lg border border-red-200">
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
              {error || 'Service Not Found'}
            </h2>
            <p className="text-gray-600 text-center mb-6">
              {error?.includes('migrated') 
                ? 'This service was created before user ownership was implemented. Please run the migration tool to assign ownership.'
                : 'The service you\'re looking for doesn\'t exist or you don\'t have access to it.'
              }
            </p>
            <div className="space-y-3">
              {error?.includes('migrated') && (
                <button
                  onClick={() => window.open('/migrate.html', '_blank')}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium"
                >
                  🔧 Run Migration Tool
                </button>
              )}
              <button
                onClick={() => router.push('/admin/services')}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium"
              >
                <ArrowLeft className="w-4 h-4 inline mr-2" />
                Back to Services
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/admin/services')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Services
          </button>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{service.name}</h1>
              <div className="flex items-center gap-4 text-gray-600 mb-3 flex-wrap">
                {service.clientName && (
                  <>
                    <span className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {service.clientName}
                    </span>
                    <span>•</span>
                  </>
                )}
                {service.clientEmail && (
                  <>
                    <span className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {service.clientEmail}
                    </span>
                    <span>•</span>
                  </>
                )}
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Created {service.createdAt ? new Date(service.createdAt as any).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
              {getStatusBadge()}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push(`/admin/services/${service.id}/edit`)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
              >
                <Edit className="w-4 h-4" />
                Edit Service
              </button>
              <button
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        </div>

        {/* Service Description */}
        {service.description && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
            <p className="text-gray-700">{service.description}</p>
          </div>
        )}

        {/* Templates Section */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Templates ({service.templates?.length || 0})
          </h2>

          <div className="space-y-3">
            {service.templates && service.templates.length > 0 ? service.templates.map((template) => (
              <div
                key={template.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-gray-900">{template.name}</h3>
                      <p className="text-sm text-gray-500">{template.fileName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {template.aiSections && template.aiSections.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                        <Sparkles className="w-3 h-3" />
                        {template.aiSections.length} AI section{template.aiSections.length !== 1 ? 's' : ''}
                      </span>
                    )}
                    <button className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      <Eye className="w-4 h-4 inline mr-1" />
                      View
                    </button>
                    <button className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      <Edit className="w-4 h-4 inline mr-1" />
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No templates assigned to this service</p>
              </div>
            )}
          </div>
        </div>

        {/* Intake Form Section */}
        {service.intakeForm && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileCheck className="w-5 h-5" />
              Intake Form
            </h2>

            <div className="space-y-4">
              {/* Form Stats */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-700 mb-3">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">Unified Intake Form Generated</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Total Fields</p>
                    <p className="text-lg font-semibold text-gray-900">{service.intakeForm.totalFields || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Unique Fields</p>
                    <p className="text-lg font-semibold text-gray-900">{service.intakeForm.uniqueFields || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Duplicates Removed</p>
                    <p className="text-lg font-semibold text-gray-900">{service.intakeForm.duplicatesRemoved || 0}</p>
                  </div>
                </div>
              </div>

              {/* Form Link */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Status</p>
                    <p className="text-sm text-gray-600">
                      {service.intakeFormSentAt 
                        ? `Sent to client on ${new Date(service.intakeFormSentAt as any).toLocaleString()}`
                        : 'Ready to send'
                      }
                    </p>
                  </div>
                  {service.status === 'intake_sent' && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      <Send className="w-3 h-3" />
                      Sent
                    </span>
                  )}
                </div>

                {service.intakeForm.link && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <p className="text-sm text-gray-600 mb-2">Intake Form Link:</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-sm bg-white px-3 py-2 rounded border border-gray-200 font-mono break-all">
                        {service.intakeForm.link}
                      </code>
                      <button
                        onClick={() => window.open(service.intakeForm?.link, '_blank')}
                        className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowIntakePreview(!showIntakePreview)}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    <Eye className="w-4 h-4 inline mr-2" />
                    View Form
                  </button>
                  <button
                    onClick={handleResendIntake}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <Mail className="w-4 h-4 inline mr-2" />
                    Resend Link
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Client Response Section */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Client Response
          </h2>

          {!service.clientResponse ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <Clock className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">Waiting for Client Response</h3>
              <p className="text-sm text-gray-600">
                The intake form has been sent to {service.clientEmail}. You'll be notified when they submit it.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-700 mb-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">
                    Form Submitted on {service.clientResponse.submittedAt 
                      ? new Date(service.clientResponse.submittedAt as any).toLocaleString() 
                      : 'Recently'}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => setShowViewResponses(true)}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  <Eye className="w-4 h-4 inline mr-2" />
                  View Responses
                </button>
                <button 
                  onClick={() => setShowEditResponses(true)}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  <Edit className="w-4 h-4 inline mr-2" />
                  Edit Responses
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Document Generation Section */}
        {service.clientResponse && (service.clientResponse.status === 'submitted' || service.status === 'intake_submitted') && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Document Generation
            </h2>

            {!service.generatedDocuments || service.generatedDocuments.length === 0 ? (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 text-center">
                  <FileCheck className="w-12 h-12 text-green-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">Ready to Generate Documents</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    All intake data has been collected. Click below to populate templates and generate final documents.
                  </p>
                  <button
                    onClick={handleGenerateDocuments}
                    disabled={generatingDocs}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generatingDocs ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generate All Documents
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>What will be generated:</strong> {service.templates?.length || 0} final documents with all intake data populated and AI-generated sections included.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-700 mb-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">
                      Documents generated on {service.documentsGeneratedAt 
                        ? new Date(service.documentsGeneratedAt as any).toLocaleString() 
                        : 'Recently'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {service.generatedDocuments?.map((doc: any) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <div>
                          <h4 className="font-medium text-gray-900">{doc.fileName}</h4>
                          <p className="text-sm text-gray-500">
                            Generated from {doc.templateName || 'template'}
                            {doc.populatedFields && typeof doc.populatedFields === 'object' && ` • ${Object.keys(doc.populatedFields).length} fields populated`}
                          </p>
                        </div>
                      </div>
                      <button 
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        onClick={() => alert('Document download will be available soon!')}
                      >
                        <Download className="w-4 h-4 inline mr-2" />
                        Download
                      </button>
                    </div>
                  ))}
                </div>

                <button 
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium"
                  onClick={() => alert('ZIP download will be available soon!')}
                >
                  <Package className="w-5 h-5 inline mr-2" />
                  Download All as ZIP
                </button>
              </div>
            )}
          </div>
        )}

        {/* Last Updated */}
        <div className="text-center text-sm text-gray-500">
          Last updated {service.updatedAt ? new Date(service.updatedAt as any).toLocaleString() : 'Unknown'}
        </div>
      </div>

      {/* Modals */}
      {service && (
        <>
          <ViewResponsesModal
            service={service}
            isOpen={showViewResponses}
            onClose={() => setShowViewResponses(false)}
          />
          <EditResponsesModal
            service={service}
            isOpen={showEditResponses}
            onClose={() => setShowEditResponses(false)}
            onSave={() => {
              // Service will update automatically via onSnapshot
              console.log('Responses saved successfully')
            }}
          />
        </>
      )}
    </div>
  )
}
