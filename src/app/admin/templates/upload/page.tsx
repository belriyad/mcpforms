'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthProvider'
import { PermissionGuard } from '@/components/auth/PermissionGuard'
import { Upload, FileText, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { db, storage, functions } from '@/lib/firebase'
import { collection, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { httpsCallable } from 'firebase/functions'
import { Analytics, Funnel, PerformanceTimer } from '@/lib/analytics'

export default function UploadTemplatePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [templateName, setTemplateName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Track page view on mount
  useEffect(() => {
    Analytics.pageView('/admin/templates/upload', 'Upload Template')
    
    // Track funnel: User landed on upload page
    if (user?.uid) {
      Funnel.templateUploadStarted(user.uid)
    }
  }, [user?.uid])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Track file selection
      if (user?.uid) {
        Funnel.templateUploadFileSelected(user.uid, selectedFile.name, selectedFile.size)
        Analytics.templateUploadFileSelected(selectedFile.name, selectedFile.size, selectedFile.type)
      }

      // Validate file type
      if (!selectedFile.name.endsWith('.docx')) {
        setError('Only .docx files are supported')
        if (user?.uid) {
          Analytics.templateUploadValidationFailed('invalid_file_type', selectedFile.name, {
            fileType: selectedFile.type
          })
        }
        return
      }
      
      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB')
        if (user?.uid) {
          Analytics.templateUploadValidationFailed('file_too_large', selectedFile.name, {
            fileSize: selectedFile.size
          })
        }
        return
      }
      
      setFile(selectedFile)
      setError(null)
      
      // Track validation success
      if (user?.uid) {
        Funnel.templateUploadValidationPassed(user.uid)
        Analytics.templateUploadValidationPassed(selectedFile.name, selectedFile.size)
      }
      
      // Auto-fill template name from filename if empty
      if (!templateName) {
        const name = selectedFile.name.replace('.docx', '')
        setTemplateName(name)
      }
    }
  }

  const handleUpload = async () => {
    if (!file || !templateName.trim() || !user) {
      setError('Please provide a template name and select a file')
      return
    }

    setUploading(true)
    setError(null)
    setUploadProgress(0)
    
    // Start performance timer
    const timer = new PerformanceTimer('template_upload')
    let templateId = ''

    try {
      // Track name entered
      if (user?.uid) {
        Funnel.templateUploadNameEntered(user.uid, templateName.trim())
      }

      // 1. Create template document in Firestore first to get template ID
      setUploadProgress(20)
      Analytics.templateUploadProgress('', 20, 'firestore_creation_started')
      
      const templateDoc = await addDoc(collection(db, 'templates'), {
        name: templateName.trim(),
        fileName: file.name,
        fileSize: file.size,
        status: 'uploading',
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      
      templateId = templateDoc.id
      console.log('Template document created with ID:', templateId)
      
      // Track Firestore creation success
      if (user?.uid) {
        Funnel.templateUploadFirestoreCreated(user.uid, templateId)
      }
      Analytics.templateUploadProgress(templateId, 20, 'firestore_created')
      
      // 2. Upload file to Firebase Storage using templateId
      // Path format: templates/{templateId}/{fileName}
      // This triggers the cloud function automatically
      const fileName = file.name
      const storageRef = ref(storage, `templates/${templateId}/${fileName}`)
      
      setUploadProgress(40)
      Analytics.templateUploadProgress(templateId, 40, 'storage_upload_started')
      
      await uploadBytes(storageRef, file)
      
      // Track storage upload success
      if (user?.uid) {
        Funnel.templateUploadStorageUploaded(user.uid, templateId)
      }
      Analytics.templateUploadProgress(templateId, 40, 'storage_uploaded')
      
      setUploadProgress(70)
      Analytics.templateUploadProgress(templateId, 70, 'getting_download_url')
      
      const downloadURL = await getDownloadURL(storageRef)
      
      // 3. Update template with storage info
      setUploadProgress(90)
      Analytics.templateUploadProgress(templateId, 90, 'metadata_update_started')
      
      await updateDoc(templateDoc, {
        storagePath: storageRef.fullPath,
        downloadURL,
        status: 'uploaded',
        updatedAt: serverTimestamp()
      })
      
      // Track metadata update success
      if (user?.uid) {
        Funnel.templateUploadMetadataUpdated(user.uid, templateId)
      }
      Analytics.templateUploadProgress(templateId, 90, 'metadata_updated')
      
      setUploadProgress(95)
      Analytics.templateUploadProgress(templateId, 95, 'parsing_trigger_started')
      
      // 4. Trigger parsing via cloud function
      try {
        console.log('Triggering parsing for template:', templateId)
        const processTemplate = httpsCallable(functions, 'processUploadedTemplate')
        const result = await processTemplate({
          templateId,
          filePath: storageRef.fullPath
        })
        console.log('Parsing triggered:', result.data)
        
        // Track parsing trigger success
        if (user?.uid) {
          Funnel.templateUploadParsingTriggered(user.uid, templateId)
        }
        Analytics.templateUploadParseTriggered(templateId)
      } catch (parseError: any) {
        console.warn('Parse trigger warning (will retry automatically):', parseError.message)
        // Don't fail the upload if parsing fails - it can be retried
      }
      
      setUploadProgress(100)
      Analytics.templateUploadProgress(templateId, 100, 'completed')
      setSuccess(true)
      
      // Track completion with timing
      const duration = timer.end()
      if (user?.uid) {
        Funnel.templateUploadCompleted(user.uid, templateId, duration)
      }
      Analytics.templateUploaded(templateId, file.size)
      
      console.log('Template uploaded successfully. Parsing in progress...')
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/admin/templates')
      }, 2000)
      
    } catch (err: any) {
      console.error('Upload error:', err)
      console.error('Error code:', err.code)
      console.error('Error message:', err.message)
      console.error('Error details:', JSON.stringify(err, null, 2))
      
      let errorMessage = 'Failed to upload template'
      let errorType = 'unknown_error'
      
      if (err.code === 'permission-denied') {
        errorMessage = 'Permission denied. You need lawyer or admin role to upload templates.'
        errorType = 'permission_denied'
      } else if (err.code === 'storage/unauthorized') {
        errorMessage = 'Storage permission denied. Please check your permissions.'
        errorType = 'storage_unauthorized'
      } else if (err.message) {
        errorMessage = err.message
        errorType = err.code || 'api_error'
      }
      
      // Track failure
      if (user?.uid) {
        Funnel.templateUploadFailed(user.uid, errorType, errorMessage)
      }
      Analytics.errorOccurred(errorType, errorMessage, 'template_upload')
      
      setError(errorMessage)
      setUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <PermissionGuard 
      permission="canUploadTemplates"
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
          <div className="max-w-md mx-auto px-4">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Permission Required</h2>
              <p className="text-gray-600 mb-6">
                You don't have permission to upload templates. Please contact your administrator to request access.
              </p>
              <button
                onClick={() => router.push('/admin/templates')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Templates
              </button>
            </div>
          </div>
        </div>
      }
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Template</h1>
            <p className="text-gray-600">Upload a .docx document template to use for document generation</p>
          </div>

          {/* Upload Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            {success ? (
              /* Success State */
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Template Uploaded Successfully!</h3>
                <p className="text-gray-600 mb-4">Redirecting to templates...</p>
                <div className="flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              </div>
            ) : (
              <>
                {/* Template Name */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g., Employment Contract, NDA Template"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    disabled={uploading}
                  />
                </div>

                {/* File Upload */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document File *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                    {file ? (
                      <div className="space-y-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
                          <FileText className="w-8 h-8 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{file.name}</p>
                          <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                        </div>
                        {!uploading && (
                          <button
                            onClick={() => {
                              setFile(null)
                              setError(null)
                            }}
                            className="text-sm text-red-600 hover:text-red-700 font-medium"
                          >
                            Remove file
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full">
                          <Upload className="w-8 h-8 text-gray-400" />
                        </div>
                        <div>
                          <label className="cursor-pointer">
                            <span className="text-blue-600 font-medium hover:text-blue-700">
                              Click to upload
                            </span>
                            <span className="text-gray-600"> or drag and drop</span>
                            <input
                              type="file"
                              accept=".docx"
                              onChange={handleFileChange}
                              className="hidden"
                              disabled={uploading}
                            />
                          </label>
                          <p className="text-sm text-gray-500 mt-2">
                            DOCX files only, up to 10MB
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                {/* Upload Progress */}
                {uploading && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Uploading...</span>
                      <span className="text-sm text-gray-600">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Info Box */}
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Template Requirements</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• File format: Microsoft Word (.docx)</li>
                    <li>• Maximum file size: 10MB</li>
                    <li>• Use placeholders like {'{'}field_name{'}'} for dynamic content</li>
                    <li>• The template will be parsed to extract AI fields automatically</li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={handleUpload}
                    disabled={!file || !templateName.trim() || uploading}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        Upload Template
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => router.back()}
                    disabled={uploading}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </PermissionGuard>
  )
}
