'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { doc, getDoc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/lib/auth/AuthProvider'
import { Service } from '@/types/service'
import ViewResponsesModal from '@/components/ViewResponsesModal'
import EditResponsesModal from '@/components/EditResponsesModal'
import AIPreviewModal from '@/components/admin/AIPreviewModal'
import PromptLibrary from '@/components/admin/PromptLibrary'
import PromptEditor from '@/components/admin/PromptEditor'
import { isFeatureEnabled } from '@/lib/feature-flags'
import { savePrompt, incrementPromptUsage, AIPrompt } from '@/lib/prompts-client'
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
  AlertCircle,
  RefreshCw,
  X
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
  const [showAIModal, setShowAIModal] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [aiPrompt, setAiPrompt] = useState('')
  const [generatingAI, setGeneratingAI] = useState(false)

  // AI Preview Modal state (Feature #13)
  const [showAIPreview, setShowAIPreview] = useState(false)
  const [aiPreviewData, setAiPreviewData] = useState<any>(null)
  const [isRegenerating, setIsRegenerating] = useState(false)

  // Prompt Library state (Feature #12)
  const [showPromptLibrary, setShowPromptLibrary] = useState(false)
  const [showPromptEditor, setShowPromptEditor] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<AIPrompt | null>(null)

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

  const handleGenerateAISection = async () => {
    if (!service || !selectedTemplateId || !aiPrompt.trim()) return
    
    setGeneratingAI(true)
    try {
      console.log('🤖 Generating AI section...', {
        serviceId: service.id,
        templateId: selectedTemplateId,
        promptLength: aiPrompt.length
      })
      
      const response = await fetch('/api/services/generate-ai-section', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceId: service.id,
          templateId: selectedTemplateId,
          prompt: aiPrompt
        }),
      })

      const result = await response.json()
      
      // Log full response for debugging
      console.log('📥 AI Generation Response:', {
        status: response.status,
        success: result.success,
        preview: result.preview,
        error: result.error,
        details: result.details
      })

      if (result.success) {
        // Feature #13: Preview-first workflow (if enabled)
        if (result.preview && isFeatureEnabled('aiPreviewModal')) {
          console.log('✨ Opening AI Preview Modal with data:', result.data)
          setAiPreviewData(result.data)
          setShowAIPreview(true)
          setShowAIModal(false) // Close input modal, open preview modal
        } else {
          // Legacy: auto-save (backward compatible)
          alert('✅ AI section generated successfully!')
          setShowAIModal(false)
          setAiPrompt('')
          setSelectedTemplateId(null)
        }
        // Service will update automatically via onSnapshot
      } else {
        // Show detailed error message
        const errorMsg = result.error || 'Unknown error'
        const errorDetails = result.details ? `\n\nDetails: ${result.details}` : ''
        console.error('❌ AI Generation Error:', result)
        alert(`❌ Failed to generate AI section\n\nError: ${errorMsg}${errorDetails}\n\nPlease check the browser console for more details.`)
      }
    } catch (error) {
      console.error('❌ Exception during AI generation:', error)
      alert(`❌ Failed to generate AI section\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease check the browser console for details.`)
    } finally {
      setGeneratingAI(false)
    }
  }

  const handleAcceptAI = async (finalContent: string, userEdits?: string, feedback?: 'positive' | 'negative' | null) => {
    if (!service || !aiPreviewData) return

    try {
      console.log('✅ Accepting AI section...', {
        serviceId: service.id,
        contentLength: finalContent.length,
        hasEdits: !!userEdits,
        feedback
      })

      const response = await fetch('/api/services/accept-ai-section', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceId: service.id,
          templateId: aiPreviewData.templateId || selectedTemplateId,
          placeholder: aiPreviewData.placeholder,
          prompt: aiPreviewData.prompt,
          originalContent: aiPreviewData.content,
          content: finalContent,
          model: aiPreviewData.model,
          temperature: aiPreviewData.temperature,
          generatedAt: aiPreviewData.generatedAt,
          userEdits,
          feedback: feedback || null,
          tempId: aiPreviewData.tempId
        }),
      })

      const result = await response.json()

      if (result.success) {
        console.log('✅ AI section accepted successfully')
        setShowAIPreview(false)
        setAiPreviewData(null)
        setAiPrompt('')
        setSelectedTemplateId(null)
        // Service will update automatically via onSnapshot
      } else {
        console.error('❌ Accept Error:', result)
        alert(`❌ Failed to accept AI section: ${result.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('❌ Exception during AI acceptance:', error)
      alert(`❌ Failed to accept AI section: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleRegenerateAI = async () => {
    if (!service || !aiPreviewData) return

    setIsRegenerating(true)
    try {
      console.log('🔄 Regenerating AI section with same prompt...')

      const response = await fetch('/api/services/generate-ai-section', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceId: service.id,
          templateId: aiPreviewData.templateId || selectedTemplateId,
          prompt: aiPreviewData.prompt
        }),
      })

      const result = await response.json()

      if (result.success && result.preview) {
        console.log('✨ Regenerated content received')
        setAiPreviewData(result.data) // Update preview with new content
      } else {
        console.error('❌ Regeneration Error:', result)
        alert(`❌ Failed to regenerate: ${result.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('❌ Exception during regeneration:', error)
      alert(`❌ Failed to regenerate: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsRegenerating(false)
    }
  }

  // Feature #12: Prompt Library handlers
  const handleSelectPrompt = async (prompt: AIPrompt) => {
    // Populate the AI input fields with the selected prompt
    const placeholder = prompt.placeholder || '';
    const body = prompt.body;
    setAiPrompt(`${placeholder}|${body}`);
    setShowPromptLibrary(false);

    // Increment usage count
    if (user) {
      try {
        await incrementPromptUsage(user.uid, prompt.id);
      } catch (error) {
        console.error('Failed to increment prompt usage:', error);
      }
    }
  }

  const handleSaveCurrentPromptToLibrary = async () => {
    if (!user || !aiPrompt.trim()) return;

    const parts = aiPrompt.split('|');
    const placeholder = parts[0]?.trim() || '';
    const body = parts[1]?.trim() || '';

    if (!body) {
      alert('Please enter a prompt description first');
      return;
    }

    setShowPromptEditor(true);
  }

  const handleSavePrompt = async (promptData: Omit<AIPrompt, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => {
    if (!user) return;

    try {
      await savePrompt(user.uid, promptData);
      alert('✅ Prompt saved to library!');
      setShowPromptEditor(false);
      setEditingPrompt(null);
    } catch (error) {
      console.error('Failed to save prompt:', error);
      throw error;
    }
  }

  const handleEditPrompt = (prompt: AIPrompt) => {
    setEditingPrompt(prompt);
    setShowPromptEditor(true);
    setShowPromptLibrary(false);
  }

  const handleGenerateDocuments = async () => {
    if (!service) return
    
    setGeneratingDocs(true)
    let currentDocuments: any = null
    
    try {
      const response = await fetch('/api/services/generate-documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ serviceId: service.id }),
      })

      const result = await response.json()

      // Log result regardless of success/failure
      console.log(`📊 API Response:`, result)
      
      // Handle both success and partial failure cases
      if (result.success || (result.summary && result.summary.total > 0)) {
        // Show detailed summary
        if (result.summary) {
          console.log('📊 Generation Summary:', {
            total: result.summary.total,
            successful: result.summary.successful,
            failed: result.summary.failed
          })
          
          if (result.summary.documentsWithUrls?.length) {
            console.log('✅ Documents with URLs:', result.summary.documentsWithUrls)
          }
          
          if (result.summary.documentsWithoutUrls?.length) {
            console.error('❌ Documents WITHOUT URLs:', result.summary.documentsWithoutUrls)
          }
        }
        
        // Show appropriate message based on results
        const successful = result.summary?.successful || 0
        const failed = result.summary?.failed || 0
        
        if (successful > 0 && failed === 0) {
          alert(`✅ Successfully generated ${successful} document(s)!`)
        } else if (successful > 0 && failed > 0) {
          alert(`⚠️ Generated ${successful} document(s), but ${failed} failed. Check console for details.`)
        } else if (failed > 0) {
          alert(`❌ All ${failed} document(s) failed to generate. Check console and Firebase logs for details.`)
        }
        
        // Wait longer for document generation and Firestore propagation
        console.log('⏳ Waiting 3 seconds for document generation to complete...')
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        // Force a refresh of the service data to get updated downloadUrls
        const serviceRef = doc(db, 'services', service.id)
        console.log('🔄 Fetching fresh service data from Firestore...')
        const updatedServiceDoc = await getDoc(serviceRef)
        
        if (updatedServiceDoc.exists()) {
          const freshService = { id: updatedServiceDoc.id, ...updatedServiceDoc.data() } as Service
          currentDocuments = freshService.generatedDocuments
          
          console.log('🔄 Refreshed service data:', {
            documentsCount: freshService.generatedDocuments?.length,
            documents: freshService.generatedDocuments?.map((d: any) => ({ 
              fileName: d.fileName, 
              hasUrl: !!d.downloadUrl,
              downloadUrl: d.downloadUrl
            }))
          })
          setService(freshService)
          
          // Check if all documents have downloadUrls
          const docsWithUrls = freshService.generatedDocuments?.filter((d: any) => d.downloadUrl).length || 0
          const totalDocs = freshService.generatedDocuments?.length || 0
          console.log(`📊 Status: ${docsWithUrls}/${totalDocs} documents have download URLs`)
        }
        
        // Add more aggressive backup refreshes at intervals
        setTimeout(() => {
          console.log('🔄 Backup refresh #1 (after 5s)...')
          const checkRef = doc(db, 'services', service.id)
          getDoc(checkRef).then(checkDoc => {
            if (checkDoc.exists()) {
              const checkService = { id: checkDoc.id, ...checkDoc.data() } as Service
              const docsWithUrls = checkService.generatedDocuments?.filter((d: any) => d.downloadUrl).length || 0
              const totalDocs = checkService.generatedDocuments?.length || 0
              console.log(`📊 Backup #1: ${docsWithUrls}/${totalDocs} documents ready`)
              
              if (JSON.stringify(checkService.generatedDocuments) !== JSON.stringify(currentDocuments)) {
                console.log('📦 Backup refresh #1 triggered - data changed')
                setService(checkService)
                currentDocuments = checkService.generatedDocuments
              }
            }
          })
        }, 5000)
        
        // Second backup check
        setTimeout(() => {
          console.log('🔄 Backup refresh #2 (after 10s)...')
          const checkRef = doc(db, 'services', service.id)
          getDoc(checkRef).then(checkDoc => {
            if (checkDoc.exists()) {
              const checkService = { id: checkDoc.id, ...checkDoc.data() } as Service
              const docsWithUrls = checkService.generatedDocuments?.filter((d: any) => d.downloadUrl).length || 0
              const totalDocs = checkService.generatedDocuments?.length || 0
              console.log(`📊 Backup #2: ${docsWithUrls}/${totalDocs} documents ready`)
              
              if (JSON.stringify(checkService.generatedDocuments) !== JSON.stringify(currentDocuments)) {
                console.log('📦 Backup refresh #2 triggered - data changed')
                setService(checkService)
              }
            }
          })
        }, 10000)
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
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-gray-900">{template.name}</h3>
                      <p className="text-sm text-gray-500">{template.fileName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {template.aiSections && template.aiSections.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                        <Sparkles className="w-3 h-3" />
                        {template.aiSections.length} AI section{template.aiSections.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* AI Sections List */}
                {template.aiSections && template.aiSections.length > 0 && (
                  <div className="mb-3 pl-8 space-y-1">
                    {template.aiSections.map((section: any, idx: number) => (
                      <div key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                        <Sparkles className="w-3 h-3 text-purple-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <span className="font-medium">{section.placeholder}</span>
                          {section.prompt && (
                            <span className="text-gray-500"> - {section.prompt.substring(0, 50)}{section.prompt.length > 50 ? '...' : ''}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setSelectedTemplateId(template.templateId || template.id)
                      setShowAIModal(true)
                    }}
                    className="px-3 py-1.5 text-sm bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors flex items-center gap-1"
                  >
                    <Sparkles className="w-4 h-4" />
                    Add AI Section
                  </button>
                  <button className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <Eye className="w-4 h-4 inline mr-1" />
                    View
                  </button>
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
                        ? (() => {
                            // Handle Firestore Timestamp
                            const timestamp = service.documentsGeneratedAt as any;
                            if (timestamp?.toDate) {
                              return timestamp.toDate().toLocaleString();
                            } else if (timestamp?.seconds) {
                              return new Date(timestamp.seconds * 1000).toLocaleString();
                            } else {
                              return new Date(timestamp).toLocaleString();
                            }
                          })()
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
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={async () => {
                          try {
                            // Check if document has downloadUrl (actual file generated)
                            if (!doc.downloadUrl) {
                              alert('Document file is still being generated. Please try again in a moment.');
                              return;
                            }
                            
                            // Download the document
                            const response = await fetch(`/api/services/${service.id}/documents/${doc.id}/download`);
                            
                            if (!response.ok) {
                              const error = await response.json();
                              alert(`Download failed: ${error.error || 'Unknown error'}`);
                              return;
                            }
                            
                            // Create blob and trigger download
                            const blob = await response.blob();
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = doc.fileName;
                            document.body.appendChild(a);
                            a.click();
                            window.URL.revokeObjectURL(url);
                            document.body.removeChild(a);
                          } catch (error) {
                            console.error('Download error:', error);
                            alert('Failed to download document. Please try again.');
                          }
                        }}
                        disabled={!doc.downloadUrl}
                      >
                        <Download className="w-4 h-4 inline mr-2" />
                        {doc.downloadUrl ? 'Download' : 'Generating...'}
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button 
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={async () => {
                      try {
                        // Check if any documents have downloadUrl
                        const downloadableDocuments = service.generatedDocuments?.filter((doc: any) => doc.downloadUrl) || [];
                        
                        if (downloadableDocuments.length === 0) {
                          alert('No documents are ready for download yet. Please wait for documents to be generated.');
                          return;
                        }
                        
                        // Download each document sequentially
                        for (const doc of downloadableDocuments) {
                          try {
                            const response = await fetch(`/api/services/${service.id}/documents/${doc.id}/download`);
                            
                            if (!response.ok) continue;
                            
                            const blob = await response.blob();
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = doc.fileName;
                            document.body.appendChild(a);
                            a.click();
                            window.URL.revokeObjectURL(url);
                            document.body.removeChild(a);
                            
                            // Small delay between downloads
                            await new Promise(resolve => setTimeout(resolve, 500));
                          } catch (error) {
                            console.error(`Failed to download ${doc.fileName}:`, error);
                          }
                        }
                        
                        alert(`Downloaded ${downloadableDocuments.length} document(s)`);
                      } catch (error) {
                        console.error('Download all error:', error);
                        alert('Failed to download documents. Please try again.');
                      }
                    }}
                    disabled={!service.generatedDocuments?.some((doc: any) => doc.downloadUrl)}
                  >
                    <Package className="w-5 h-5 inline mr-2" />
                    Download All Documents
                  </button>

                  <button 
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg hover:from-orange-700 hover:to-amber-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    onClick={handleGenerateDocuments}
                    disabled={generatingDocs}
                    title="Regenerate all documents with latest data and template files"
                  >
                    {generatingDocs ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Regenerating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-5 h-5" />
                        Regenerate Documents
                      </>
                    )}
                  </button>
                </div>
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
          
          {/* AI Section Modal */}
          {showAIModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      <Sparkles className="w-6 h-6 text-purple-600" />
                      Add AI-Generated Section
                    </h2>
                    <button
                      onClick={() => {
                        setShowAIModal(false)
                        setAiPrompt('')
                      }}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <p className="text-sm text-purple-800">
                      <strong>How it works:</strong> Describe the section you want to add to this template. 
                      AI will generate professional content that you can review and include in your document.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Placeholder Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., {{ai_liability_clause}}"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      value={aiPrompt.split('|')[0] || ''}
                      onChange={(e) => {
                        const parts = aiPrompt.split('|')
                        parts[0] = e.target.value
                        setAiPrompt(parts.join('|'))
                      }}
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      This placeholder will be used in your template
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Section Description / Instructions
                    </label>
                    <textarea
                      rows={6}
                      placeholder="Describe what content should be generated. Be specific about tone, length, and any requirements. For example: 'Generate a liability limitation clause that protects the service provider while maintaining professional tone. Include standard indemnification language.'"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      value={aiPrompt.split('|')[1] || ''}
                      onChange={(e) => {
                        const placeholder = aiPrompt.split('|')[0] || ''
                        setAiPrompt(`${placeholder}|${e.target.value}`)
                      }}
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Provide clear instructions for the AI to generate relevant content
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Example:</strong> "Generate a confidentiality clause for a consulting agreement. 
                      It should cover non-disclosure obligations, permitted disclosures, and survival of terms after agreement termination."
                    </p>
                  </div>

                  {/* Feature #12: Prompt Library Actions */}
                  {isFeatureEnabled('promptLibrary') && user && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowPromptLibrary(true)}
                        className="flex-1 px-4 py-2 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        Browse Saved Prompts
                      </button>
                      <button
                        onClick={handleSaveCurrentPromptToLibrary}
                        disabled={!aiPrompt.split('|')[1]?.trim()}
                        className="flex-1 px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <FileCheck className="w-4 h-4" />
                        Save to Library
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowAIModal(false)
                      setAiPrompt('')
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerateAISection}
                    disabled={generatingAI || !aiPrompt.trim() || !aiPrompt.includes('|')}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {generatingAI ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generate AI Section
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* AI Preview Modal (Feature #13) */}
          {aiPreviewData && (
            <AIPreviewModal
              isOpen={showAIPreview}
              onClose={() => {
                setShowAIPreview(false)
                setAiPreviewData(null)
                setAiPrompt('')
                setSelectedTemplateId(null)
              }}
              generatedContent={aiPreviewData.content}
              prompt={aiPreviewData.prompt}
              placeholder={aiPreviewData.placeholder}
              templateName={aiPreviewData.templateName}
              model={aiPreviewData.model}
              temperature={aiPreviewData.temperature}
              onAccept={handleAcceptAI}
              onRegenerate={handleRegenerateAI}
              isRegenerating={isRegenerating}
            />
          )}

          {/* Feature #12: Prompt Library Modal */}
          {showPromptLibrary && user && isFeatureEnabled('promptLibrary') && (
            <PromptLibrary
              userId={user.uid}
              onSelect={handleSelectPrompt}
              onEdit={handleEditPrompt}
              onClose={() => setShowPromptLibrary(false)}
            />
          )}

          {/* Feature #12: Prompt Editor Modal */}
          {showPromptEditor && user && isFeatureEnabled('promptLibrary') && (
            <PromptEditor
              prompt={editingPrompt}
              onSave={handleSavePrompt}
              onClose={() => {
                setShowPromptEditor(false);
                setEditingPrompt(null);
              }}
            />
          )}
        </>
      )}
    </div>
  )
}
