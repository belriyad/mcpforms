'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/lib/auth/AuthProvider'
import { 
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  User,
  Mail,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react'
import { showSuccessToast, showErrorToast, showLoadingToast } from '@/lib/toast-helpers'
import toast from 'react-hot-toast'

interface Template {
  id: string
  name: string
  description?: string
  extractedFields?: any[]
  status: string
  updatedAt?: any
}

type Step = 1 | 2 | 3 | 4

export default function CreateServicePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
  
  // Step 1: Service Details
  const [serviceName, setServiceName] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [description, setDescription] = useState('')
  
  // Step 2: Template Selection
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set())
  
  // Step 3: AI Customization (templates with AI sections)
  const [aiSections, setAiSections] = useState<Record<string, {prompt: string, generating: boolean}>>({})
  
  // Step 4: Intake form preview
  const [intakeForm, setIntakeForm] = useState<any>(null)
  const [generatingIntake, setGeneratingIntake] = useState(false)

  // Load templates from Firestore - filter by current user
  useEffect(() => {
    if (!user?.uid) return
    
    const templatesQuery = query(
      collection(db, 'templates'),
      where('status', '==', 'parsed'),
      where('createdBy', '==', user.uid)
    )
    
    const unsubscribe = onSnapshot(templatesQuery, (snapshot) => {
      const templatesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Template[]
      
      setTemplates(templatesData)
      setLoading(false)
    }, (error) => {
      console.error('Error loading templates:', error)
      showErrorToast('Failed to load templates')
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user?.uid])

  const steps = [
    { number: 1, label: 'Service Details', icon: User },
    { number: 2, label: 'Select Templates', icon: FileText },
    { number: 3, label: 'Customize', icon: Sparkles },
    { number: 4, label: 'Review & Send', icon: CheckCircle2 }
  ]

  const toggleTemplate = (templateId: string) => {
    const newSelection = new Set(selectedTemplates)
    if (newSelection.has(templateId)) {
      newSelection.delete(templateId)
    } else {
      newSelection.add(templateId)
    }
    setSelectedTemplates(newSelection)
  }

  const canProceedFromStep1 = serviceName && clientName && clientEmail
  const canProceedFromStep2 = selectedTemplates.size > 0

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep((currentStep + 1) as Step)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step)
    } else {
      router.push('/admin/services')
    }
  }

  const handleFinish = async () => {
    setCreating(true)
    const loadingToastId = showLoadingToast('Creating service...')
    
    try {
      // Step 1: Create service
      const serviceData = {
        name: serviceName,
        clientName,
        clientEmail,
        description,
        templateIds: Array.from(selectedTemplates),
        createdBy: user?.uid || 'unknown' // Add user ID
      }
      
      const createResult = await fetch('/api/services/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceData)
      })
      
      if (!createResult.ok) {
        throw new Error('Failed to create service')
      }
      
      const { serviceId } = await createResult.json()
      
      // Step 2: Load templates
      await fetch('/api/services/load-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId, templateIds: Array.from(selectedTemplates) })
      })
      
      // Step 3: Generate intake form
      await fetch('/api/services/generate-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId })
      })
      
      // Step 4: Send intake form
      await fetch('/api/services/send-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId })
      })
      
      toast.dismiss(loadingToastId)
      showSuccessToast('Service created and intake form sent!')
      router.push(`/admin/services/${serviceId}`)
    } catch (error) {
      toast.dismiss(loadingToastId)
      console.error('Error creating service:', error)
      showErrorToast(error instanceof Error ? error.message : 'Failed to create service')
    } finally {
      setCreating(false)
    }
  }

  const totalFields = Array.from(selectedTemplates)
    .map(id => {
      const template = templates.find(t => t.id === id)
      return template?.extractedFields?.length || 0
    })
    .reduce((sum, count) => sum + count, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/admin/services')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Services
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Create New Service</h1>
          <p className="text-gray-600 mt-2">Set up a new client service with document preparation</p>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = currentStep === step.number
              const isCompleted = currentStep > step.number
              
              return (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                        isCompleted
                          ? 'bg-green-100 border-green-500 text-green-700'
                          : isActive
                          ? 'bg-blue-100 border-blue-500 text-blue-700'
                          : 'bg-gray-100 border-gray-300 text-gray-500'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-6 h-6" />
                      ) : (
                        <Icon className="w-6 h-6" />
                      )}
                    </div>
                    <span
                      className={`mt-2 text-sm font-medium ${
                        isActive ? 'text-gray-900' : 'text-gray-500'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-4 ${
                        currentStep > step.number ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 mb-6">
          {/* Step 1: Service Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Service Details</h2>
                <p className="text-gray-600">Enter the basic information about this service</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Name *
                  </label>
                  <input
                    type="text"
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    placeholder="e.g., Will Preparation, Business Contract"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g., John Doe"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client Email *
                  </label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="client@example.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    The intake form link will be sent to this email
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of the service requirements..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Template Selection */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Templates</h2>
                <p className="text-gray-600">Choose the document templates needed for this service</p>
              </div>

              {selectedTemplates.size > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-700">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">
                      {selectedTemplates.size} template{selectedTemplates.size !== 1 ? 's' : ''} selected
                      ({totalFields} total fields)
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                    <p className="text-gray-600">Loading templates...</p>
                  </div>
                ) : templates.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No templates available. Please upload templates first.
                  </div>
                ) : (
                  templates.map((template) => {
                    const isSelected = selectedTemplates.has(template.id)
                    const fieldCount = template.extractedFields?.length || 0
                    const lastUpdated = template.updatedAt?.toDate?.()?.toLocaleDateString() || 'Recently'
                    
                    return (
                      <div
                        key={template.id}
                        onClick={() => toggleTemplate(template.id)}
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'border-blue-500 bg-blue-500'
                                  : 'border-gray-300 bg-white'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                              <p className="text-sm text-gray-600 mb-2">{template.description || 'No description'}</p>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span>{fieldCount} fields</span>
                                <span>•</span>
                                <span>Last updated {lastUpdated}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}

          {/* Step 3: Customize (Placeholder) */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Customize Templates</h2>
                <p className="text-gray-600">Add AI-generated sections or modify templates</p>
              </div>

              <div className="space-y-4">
                {Array.from(selectedTemplates).map((templateId) => {
                  const template = templates.find(t => t.id === templateId)
                  if (!template) return null
                  
                  return (
                    <div key={templateId} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                        <div className="flex gap-2">
                          <button className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            Preview
                          </button>
                          <button className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            Edit Fields
                          </button>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <Sparkles className="w-5 h-5 text-purple-600 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-2">AI Assistant</h4>
                            <input
                              type="text"
                              placeholder="Describe a clause or section to add (e.g., 'Add clause to donate 50% of assets to charity')"
                              className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-3"
                            />
                            <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all text-sm font-medium">
                              Generate with AI
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Prototype Note</p>
                    <p>AI customization will be fully functional in the next phase. For now, click "Next" to continue.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review & Send */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Review & Send Intake Form</h2>
                <p className="text-gray-600">Review the unified intake form and send to client</p>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-start gap-3 mb-4">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Intake Form Generated</h3>
                    <p className="text-sm text-gray-600">
                      AI analyzed {selectedTemplates.size} template{selectedTemplates.size !== 1 ? 's' : ''} and found {totalFields} fields
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Unified Intake Form Preview</h4>
                  
                  <div className="space-y-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-700 mb-2">Common Information (merged from all templates)</p>
                      <ul className="space-y-1 ml-4 text-gray-600">
                        <li>• Full Legal Name <span className="text-gray-400">(used in {selectedTemplates.size} templates)</span></li>
                        <li>• Date of Birth <span className="text-gray-400">(used in 2 templates)</span></li>
                        <li>• Address <span className="text-gray-400">(used in {selectedTemplates.size} templates)</span></li>
                      </ul>
                    </div>

                    {Array.from(selectedTemplates).map((templateId) => {
                      const template = templates.find(t => t.id === templateId)
                      if (!template) return null
                      
                      return (
                        <div key={templateId}>
                          <p className="font-medium text-gray-700 mb-2">{template.name} - Specific Fields</p>
                          <ul className="space-y-1 ml-4 text-gray-600">
                            <li>• {template.extractedFields?.length || 0} fields from this template</li>
                          </ul>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Service Summary</h3>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Service Name:</dt>
                    <dd className="font-medium text-gray-900">{serviceName}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Client:</dt>
                    <dd className="font-medium text-gray-900">{clientName}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Email:</dt>
                    <dd className="font-medium text-gray-900">{clientEmail}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Templates:</dt>
                    <dd className="font-medium text-gray-900">{selectedTemplates.size} selected</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Total Fields:</dt>
                    <dd className="font-medium text-gray-900">{totalFields} fields</dd>
                  </div>
                </dl>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Ready to Send</p>
                    <p>Clicking "Create & Send" will generate a unique intake form link and email it to {clientEmail}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <div className="text-sm text-gray-500">
            Step {currentStep} of {steps.length}
          </div>

          {currentStep < 4 ? (
            <button
              onClick={handleNext}
              disabled={
                (currentStep === 1 && !canProceedFromStep1) ||
                (currentStep === 2 && !canProceedFromStep2)
              }
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={creating}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  Create & Send to Client
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
