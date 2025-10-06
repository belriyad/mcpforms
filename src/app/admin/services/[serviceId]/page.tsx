'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  Package
} from 'lucide-react'

// Mock service data
const MOCK_SERVICE = {
  id: 'service_1',
  name: 'Will Preparation',
  clientName: 'John Doe',
  clientEmail: 'john@example.com',
  description: 'Estate planning with charitable donation clause',
  status: 'intake_sent',
  createdAt: '2025-10-04',
  lastUpdated: '2 hours ago',
  templates: [
    {
      id: 'template_1',
      name: 'Will Template',
      fileName: 'will_template.docx',
      aiSections: 1
    },
    {
      id: 'template_2',
      name: 'Agency Contract',
      fileName: 'agency_contract.docx',
      aiSections: 0
    },
    {
      id: 'template_3',
      name: 'Disclaimer Agreement',
      fileName: 'disclaimer.docx',
      aiSections: 0
    }
  ],
  intakeForm: {
    totalFields: 28,
    mergedFields: 18,
    duplicatesRemoved: 10,
    link: 'https://formgenai-4545.web.app/intake/abc123',
    sentAt: '2025-10-06 10:30 AM',
    status: 'sent'
  },
  clientResponse: null, // null = waiting, {} = submitted
  generatedDocuments: null // null = not generated, [] = generated
}

export default function ServiceDetailPage({ params }: { params: { serviceId: string } }) {
  const router = useRouter()
  const [service] = useState(MOCK_SERVICE)
  const [showIntakePreview, setShowIntakePreview] = useState(false)

  const getStatusBadge = () => {
    const statusConfig = {
      draft: { label: 'Draft', color: 'gray', icon: Edit },
      intake_sent: { label: 'Intake Sent', color: 'blue', icon: Mail },
      intake_submitted: { label: 'Pending Review', color: 'yellow', icon: Clock },
      documents_ready: { label: 'Ready', color: 'green', icon: CheckCircle2 },
      completed: { label: 'Completed', color: 'purple', icon: CheckCircle2 }
    }

    const config = statusConfig[service.status as keyof typeof statusConfig]
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
    alert('Intake form link resent to ' + service.clientEmail)
  }

  const handleGenerateDocuments = () => {
    // This would trigger document generation
    alert('Document generation started!')
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
              <div className="flex items-center gap-4 text-gray-600 mb-3">
                <span className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {service.clientName}
                </span>
                <span>•</span>
                <span className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {service.clientEmail}
                </span>
                <span>•</span>
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Created {service.createdAt}
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
            Templates ({service.templates.length})
          </h2>

          <div className="space-y-3">
            {service.templates.map((template) => (
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
                    {template.aiSections > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                        <Sparkles className="w-3 h-3" />
                        {template.aiSections} AI section{template.aiSections !== 1 ? 's' : ''}
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
            ))}
          </div>
        </div>

        {/* Intake Form Section */}
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
                  <p className="text-lg font-semibold text-gray-900">{service.intakeForm.totalFields}</p>
                </div>
                <div>
                  <p className="text-gray-600">Merged to</p>
                  <p className="text-lg font-semibold text-gray-900">{service.intakeForm.mergedFields}</p>
                </div>
                <div>
                  <p className="text-gray-600">Duplicates Removed</p>
                  <p className="text-lg font-semibold text-gray-900">{service.intakeForm.duplicatesRemoved}</p>
                </div>
              </div>
            </div>

            {/* Form Link */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Status</p>
                  <p className="text-sm text-gray-600">Sent to client on {service.intakeForm.sentAt}</p>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  <Send className="w-3 h-3" />
                  Sent
                </span>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <p className="text-sm text-gray-600 mb-2">Intake Form Link:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm bg-white px-3 py-2 rounded border border-gray-200 font-mono">
                    {service.intakeForm.link}
                  </code>
                  <button
                    onClick={() => window.open(service.intakeForm.link, '_blank')}
                    className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>

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
                  <span className="font-medium">Form Submitted on Oct 6, 2025 3:45 PM</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                  <Eye className="w-4 h-4 inline mr-2" />
                  View Responses
                </button>
                <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                  <Edit className="w-4 h-4 inline mr-2" />
                  Edit Responses
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Document Generation Section */}
        {service.clientResponse && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Document Generation
            </h2>

            {!service.generatedDocuments ? (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 text-center">
                  <FileCheck className="w-12 h-12 text-green-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">Ready to Generate Documents</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    All intake data has been collected. Click below to populate templates and generate final documents.
                  </p>
                  <button
                    onClick={handleGenerateDocuments}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl"
                  >
                    <Sparkles className="w-5 h-5" />
                    Generate All Documents
                  </button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>What will be generated:</strong> {service.templates.length} final documents with all intake data populated and AI-generated sections included.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-700 mb-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">Documents generated on Oct 6, 2025 4:00 PM</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {service.templates.map((template) => (
                    <div
                      key={template.id}
                      className="flex items-center justify-between border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {template.name.replace(' Template', '')}_JohnDoe_Final.docx
                          </h4>
                          <p className="text-sm text-gray-500">Generated from {template.name}</p>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                        <Download className="w-4 h-4 inline mr-2" />
                        Download
                      </button>
                    </div>
                  ))}
                </div>

                <button className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium">
                  <Package className="w-5 h-5 inline mr-2" />
                  Download All as ZIP
                </button>
              </div>
            )}
          </div>
        )}

        {/* Last Updated */}
        <div className="text-center text-sm text-gray-500">
          Last updated {service.lastUpdated}
        </div>
      </div>
    </div>
  )
}
