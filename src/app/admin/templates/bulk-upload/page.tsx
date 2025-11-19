'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthProvider'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { PermissionGuard } from '@/components/auth/PermissionGuard'
import { 
  Upload, 
  FileText, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  X,
  Clock,
  CheckCircle,
  XCircle,
  Crown
} from 'lucide-react'
import { db, storage } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import UpgradeModal from '@/components/UpgradeModal'

interface UploadQueueItem {
  id: string
  file: File
  name: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress: number
  error?: string
  templateId?: string
}

export default function BulkUploadTemplatePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { subscription, isPremium, canPerformAction, hasReachedLimit } = useSubscription()
  
  const [files, setFiles] = useState<File[]>([])
  const [queue, setQueue] = useState<UploadQueueItem[]>([])
  const [uploading, setUploading] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeReason, setUpgradeReason] = useState<{
    reason: 'templates' | 'services' | 'users' | 'analytics'
    currentCount: number
    limit: number
  } | null>(null)
  
  // Track current template count
  const [currentTemplateCount, setCurrentTemplateCount] = useState(0)
  const [loadingCount, setLoadingCount] = useState(true)

  useEffect(() => {
    loadTemplateCount()
  }, [user])

  const loadTemplateCount = async () => {
    if (!user?.uid) return
    
    try {
      const templatesQuery = query(
        collection(db, 'templates'),
        where('createdBy', '==', user.uid)
      )
      const snapshot = await getDocs(templatesQuery)
      setCurrentTemplateCount(snapshot.size)
    } catch (error) {
      console.error('Error loading template count:', error)
    } finally {
      setLoadingCount(false)
    }
  }

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    
    // Validate file types
    const validFiles = selectedFiles.filter(file => {
      if (!file.name.endsWith('.docx')) {
        alert(`${file.name} is not a .docx file`)
        return false
      }
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} is larger than 10MB`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    // Check subscription limits
    const maxTemplates = isPremium ? Infinity : 3
    const totalAfterUpload = currentTemplateCount + validFiles.length
    
    if (totalAfterUpload > maxTemplates) {
      const canUpload = maxTemplates - currentTemplateCount
      setUpgradeReason({
        reason: 'templates',
        currentCount: currentTemplateCount,
        limit: maxTemplates
      })
      setShowUpgradeModal(true)
      
      if (canUpload > 0) {
        alert(`You can only upload ${canUpload} more template${canUpload === 1 ? '' : 's'} on the FREE plan. Selected: ${validFiles.length}. Please upgrade to Premium for unlimited uploads.`)
      } else {
        alert(`You've reached your limit of ${maxTemplates} templates. Please upgrade to Premium for unlimited uploads.`)
      }
      return
    }

    setFiles(validFiles)
    
    // Create queue items
    const queueItems: UploadQueueItem[] = validFiles.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      file,
      name: file.name.replace('.docx', ''),
      status: 'pending',
      progress: 0
    }))
    
    setQueue(queueItems)
  }

  const removeFromQueue = (id: string) => {
    setQueue(prev => prev.filter(item => item.id !== id))
    setFiles(prev => {
      const item = queue.find(q => q.id === id)
      if (item) {
        return prev.filter(f => f !== item.file)
      }
      return prev
    })
  }

  const updateQueueItem = (id: string, updates: Partial<UploadQueueItem>) => {
    setQueue(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ))
  }

  const uploadSingleTemplate = async (item: UploadQueueItem): Promise<void> => {
    if (!user?.uid) throw new Error('User not authenticated')

    updateQueueItem(item.id, { status: 'processing', progress: 10 })

    try {
      // Upload file to Storage
      const fileRef = ref(storage, `templates/${user.uid}/${Date.now()}_${item.file.name}`)
      updateQueueItem(item.id, { progress: 30 })
      
      await uploadBytes(fileRef, item.file)
      updateQueueItem(item.id, { progress: 50 })
      
      const downloadURL = await getDownloadURL(fileRef)
      updateQueueItem(item.id, { progress: 70 })

      // Create template document in Firestore
      const templateData = {
        name: item.name,
        fileName: item.file.name,
        fileSize: item.file.size,
        fileUrl: downloadURL,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        extractedFields: [],
        status: 'uploaded'
      }

      const docRef = await addDoc(collection(db, 'templates'), templateData)
      updateQueueItem(item.id, { 
        status: 'completed', 
        progress: 100,
        templateId: docRef.id
      })

      // Increment current count
      setCurrentTemplateCount(prev => prev + 1)

    } catch (error: any) {
      console.error('Error uploading template:', error)
      updateQueueItem(item.id, { 
        status: 'error', 
        error: error.message || 'Upload failed',
        progress: 0
      })
      throw error
    }
  }

  const processQueue = async () => {
    setUploading(true)

    // Process one at a time to avoid overwhelming the system
    for (const item of queue) {
      if (item.status === 'pending') {
        try {
          await uploadSingleTemplate(item)
        } catch (error) {
          // Continue with next file even if one fails
          console.error(`Failed to upload ${item.name}:`, error)
        }
      }
    }

    setUploading(false)
  }

  const retryFailed = async () => {
    const failedItems = queue.filter(item => item.status === 'error')
    
    for (const item of failedItems) {
      updateQueueItem(item.id, { status: 'pending', error: undefined })
      try {
        await uploadSingleTemplate(item)
      } catch (error) {
        console.error(`Retry failed for ${item.name}:`, error)
      }
    }
  }

  const completedCount = queue.filter(item => item.status === 'completed').length
  const errorCount = queue.filter(item => item.status === 'error').length
  const pendingCount = queue.filter(item => item.status === 'pending').length
  const processingCount = queue.filter(item => item.status === 'processing').length

  const maxTemplates = isPremium ? '∞' : 3
  const remainingSlots = isPremium ? Infinity : Math.max(0, 3 - currentTemplateCount)

  return (
    <PermissionGuard permission="canUploadTemplates">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push('/admin/templates')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Templates
            </button>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Bulk Upload Templates</h1>
                <p className="text-gray-600">Upload multiple .docx templates at once</p>
              </div>
              
              {/* Subscription Info */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4">
                <div className="text-sm text-gray-600 mb-1">Templates</div>
                <div className="text-2xl font-bold text-gray-900">
                  {loadingCount ? '...' : currentTemplateCount} / {maxTemplates}
                </div>
                {!isPremium && (
                  <div className="text-xs text-gray-500 mt-1">
                    {remainingSlots} slot{remainingSlots !== 1 ? 's' : ''} remaining
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Upload Area */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-dashed border-gray-300 p-12 mb-8 text-center">
            <div className="flex flex-col items-center">
              <div className="p-4 bg-blue-100 rounded-full mb-4">
                <Upload className="w-12 h-12 text-blue-600" />
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Select Templates to Upload
              </h3>
              <p className="text-gray-600 mb-6">
                Choose multiple .docx files (max 10MB each)
              </p>

              <input
                type="file"
                id="file-upload"
                multiple
                accept=".docx"
                onChange={handleFilesChange}
                disabled={uploading || loadingCount}
                className="hidden"
              />
              
              <label
                htmlFor="file-upload"
                className={`px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all cursor-pointer inline-flex items-center gap-2 ${
                  uploading || loadingCount ? 'opacity-50 cursor-not-allowed' : 'hover:from-blue-700 hover:to-purple-700'
                }`}
              >
                <FileText className="w-5 h-5" />
                Select Files
              </label>

              {!isPremium && (
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="mt-4 px-6 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg font-medium shadow-sm hover:shadow-md transition-all inline-flex items-center gap-2"
                >
                  <Crown className="w-4 h-4" />
                  Upgrade for Unlimited Templates
                </button>
              )}
            </div>
          </div>

          {/* Queue Status */}
          {queue.length > 0 && (
            <>
              {/* Summary */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Upload Queue ({queue.length} file{queue.length !== 1 ? 's' : ''})
                  </h3>
                  
                  <div className="flex items-center gap-4 text-sm">
                    {completedCount > 0 && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        {completedCount} completed
                      </div>
                    )}
                    {processingCount > 0 && (
                      <div className="flex items-center gap-1 text-blue-600">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {processingCount} processing
                      </div>
                    )}
                    {pendingCount > 0 && (
                      <div className="flex items-center gap-1 text-gray-600">
                        <Clock className="w-4 h-4" />
                        {pendingCount} pending
                      </div>
                    )}
                    {errorCount > 0 && (
                      <div className="flex items-center gap-1 text-red-600">
                        <XCircle className="w-4 h-4" />
                        {errorCount} failed
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  {!uploading && pendingCount > 0 && (
                    <button
                      onClick={processQueue}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Start Upload
                    </button>
                  )}
                  
                  {errorCount > 0 && !uploading && (
                    <button
                      onClick={retryFailed}
                      className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                    >
                      Retry Failed
                    </button>
                  )}
                  
                  {completedCount === queue.length && queue.length > 0 && (
                    <button
                      onClick={() => router.push('/admin/templates')}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      View All Templates
                    </button>
                  )}
                </div>
              </div>

              {/* Queue Items */}
              <div className="space-y-3">
                {queue.map(item => (
                  <div
                    key={item.id}
                    className={`bg-white rounded-lg shadow-sm border-2 p-4 transition-all ${
                      item.status === 'completed'
                        ? 'border-green-300 bg-green-50'
                        : item.status === 'error'
                        ? 'border-red-300 bg-red-50'
                        : item.status === 'processing'
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Status Icon */}
                      <div className="flex-shrink-0">
                        {item.status === 'completed' && (
                          <CheckCircle2 className="w-8 h-8 text-green-600" />
                        )}
                        {item.status === 'error' && (
                          <XCircle className="w-8 h-8 text-red-600" />
                        )}
                        {item.status === 'processing' && (
                          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        )}
                        {item.status === 'pending' && (
                          <Clock className="w-8 h-8 text-gray-400" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-gray-900 truncate">
                            {item.name}
                          </h4>
                          <span className="text-sm text-gray-500">
                            {(item.file.size / 1024).toFixed(0)} KB
                          </span>
                        </div>
                        
                        {/* Progress Bar */}
                        {item.status === 'processing' && (
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                        )}
                        
                        {/* Status Text */}
                        <div className="text-sm">
                          {item.status === 'completed' && (
                            <span className="text-green-600">✓ Uploaded successfully</span>
                          )}
                          {item.status === 'error' && (
                            <span className="text-red-600">✗ {item.error}</span>
                          )}
                          {item.status === 'processing' && (
                            <span className="text-blue-600">Uploading... {item.progress}%</span>
                          )}
                          {item.status === 'pending' && (
                            <span className="text-gray-600">Waiting in queue...</span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      {item.status === 'pending' && !uploading && (
                        <button
                          onClick={() => removeFromQueue(item.id)}
                          className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Empty State */}
          {queue.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No files selected yet</p>
              <p className="text-sm text-gray-400">Choose files above to start uploading</p>
            </div>
          )}
        </div>
      </div>

      {/* Upgrade Modal */}
      {upgradeReason && (
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          reason={upgradeReason.reason}
          currentCount={upgradeReason.currentCount}
          limit={upgradeReason.limit}
        />
      )}
    </PermissionGuard>
  )
}
