'use client'

import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { httpsCallable } from 'firebase/functions'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore'
import { functions, storage, db } from '@/lib/firebase'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

interface TemplateUploadProps {
  onClose: () => void
  onUploadComplete: () => void
}

export default function TemplateUpload({ onClose, onUploadComplete }: TemplateUploadProps) {
  const [templateName, setTemplateName] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [useDirectUpload, setUseDirectUpload] = useState(true)

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setSelectedFile(acceptedFiles[0])
        if (!templateName) {
          const fileName = acceptedFiles[0].name.replace(/\.[^/.]+$/, '')
          setTemplateName(fileName)
        }
      }
    },
  })

  const handleUpload = async () => {
    if (!selectedFile || !templateName.trim()) {
      toast.error('Please select a file and enter a template name')
      return
    }

    setUploading(true)
    
    // Show debug information
    console.log('🔍 Upload Debug Info:', {
      fileName: selectedFile.name,
      fileSize: (selectedFile.size / 1024 / 1024).toFixed(2) + ' MB',
      fileType: selectedFile.type,
      templateName: templateName.trim()
    })
    
    const startTime = Date.now()
    toast.loading('Getting upload URL from server...', { id: 'upload-progress' })
    
    try {
      // Get upload URL from Cloud Function
      const uploadTemplateAndParse = httpsCallable(functions, 'uploadTemplateAndParse')
      const functionCallStart = Date.now()
      const result = await uploadTemplateAndParse({
        fileName: selectedFile.name,
        fileType: selectedFile.name.split('.').pop()?.toLowerCase(),
        templateName: templateName.trim(),
      })
      const functionCallTime = Date.now() - functionCallStart

      console.log('🔄 TemplateUpload: Function response:', result)
      console.log('🔄 TemplateUpload: Function response data:', result.data)
      console.log('⏱️ Function call took:', functionCallTime, 'ms')

      // Check if the function returned an error
      if (!(result.data as any)?.success) {
        throw new Error((result.data as any)?.error || 'Function returned error')
      }

      // Safely extract uploadUrl
      const responseData = (result.data as any)?.data
      if (!responseData || !responseData.uploadUrl) {
        console.error('❌ TemplateUpload: Invalid response structure:', result.data)
        throw new Error('Invalid response from server - missing upload URL')
      }

      const { uploadUrl } = responseData

      // Upload file to the signed URL
      toast.loading('Uploading file to storage...', { id: 'upload-progress' })
      const uploadStart = Date.now()
      
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': selectedFile.type,
        },
      })
      
      const uploadTime = Date.now() - uploadStart
      const totalTime = Date.now() - startTime
      
      console.log('⏱️ File upload took:', uploadTime, 'ms')
      console.log('📊 Upload speed:', (selectedFile.size / 1024 / 1024 / (uploadTime / 1000)).toFixed(2), 'MB/s')
      console.log('🎉 Total process took:', totalTime, 'ms')

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload file (${uploadResponse.status}: ${uploadResponse.statusText})`)
      }

      toast.success('Template uploaded successfully! AI parsing will begin shortly.', { id: 'upload-progress' })
      onUploadComplete()
    } catch (error: any) {
      console.error('❌ TemplateUpload: Upload error:', error)
      console.error('❌ TemplateUpload: Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        stack: error.stack
      })
      
      let errorMessage = 'Failed to upload template'
      
      if (error.code === 'functions/unauthenticated') {
        errorMessage = 'Authentication required. Please sign in and try again.'
      } else if (error.code === 'functions/permission-denied') {
        errorMessage = 'Permission denied. Check your Firebase security rules.'
      } else if (error.code === 'functions/unavailable') {
        errorMessage = 'Firebase Functions unavailable. Check your connection and try again.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  const handleDirectUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedFile || !templateName.trim()) {
      toast.error('Please select a file and provide a template name')
      return
    }

    setUploading(true)
    
    try {
      console.log('📤 TemplateUpload: Starting direct upload...')
      
      // Create template record in Firestore first to get the ID
      const templateData = {
        name: templateName.trim(),
        originalFileName: selectedFile.name,
        fileType: selectedFile.name.split('.').pop()?.toLowerCase() || 'unknown',
        extractedFields: [],
        status: 'uploading',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      const docRef = await addDoc(collection(db, 'templates'), templateData)
      console.log('✅ TemplateUpload: Template document created with ID:', docRef.id)
      
      // Now upload file with the correct path using the Firestore document ID
      const filePath = `templates/${docRef.id}/${selectedFile.name}`
      const storageRef = ref(storage, filePath)
      const uploadResult = await uploadBytes(storageRef, selectedFile)
      const downloadURL = await getDownloadURL(uploadResult.ref)
      
      console.log('✅ TemplateUpload: File uploaded to:', filePath)
      
      // Update the template document with file information
      await updateDoc(doc(db, 'templates', docRef.id), {
        id: docRef.id,
        fileUrl: filePath,
        downloadURL,
        status: 'uploaded',
        updatedAt: new Date(),
      })
      
      // Try to trigger AI processing
      try {
        console.log('🤖 Triggering AI processing for template:', docRef.id)
        
        // Create a Cloud Function call to process the uploaded template
        const processTemplate = httpsCallable(functions, 'processUploadedTemplate')
        await processTemplate({
          templateId: docRef.id,
          filePath: filePath
        })
        
        toast.success('Template uploaded successfully! AI processing started.')
      } catch (processingError: any) {
        console.error('⚠️ AI processing failed, but upload succeeded:', processingError)
        toast.success('Template uploaded successfully! (AI processing will be retried later)')
      }
      
      onUploadComplete()
    } catch (error: any) {
      console.error('❌ TemplateUpload: Direct upload error:', error)
      toast.error(`Upload failed: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="card">
          <div className="card-header">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Upload Template</h3>
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
          
          <div className="card-content space-y-4">
            <div>
              <label htmlFor="templateName" className="block text-sm font-medium text-gray-700 mb-1">
                Template Name
              </label>
              <input
                id="templateName"
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="form-input"
                placeholder="Enter template name"
                required
              />
            </div>

            {!selectedFile ? (
              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                  ${isDragActive 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
                  }
                `}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center">
                  <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-gray-600 mb-2">
                    {isDragActive ? 'Drop the file here...' : 'Drag & drop a file here, or click to select'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports PDF and DOCX files
                  </p>
                </div>
              </div>
            ) : (
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={removeFile}
                    className="text-red-600 hover:text-red-800"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="card-footer">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {useDirectUpload ? '✅ Direct upload (recommended)' : '⚠️ AI parsing (may fail)'}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  disabled={uploading}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setUseDirectUpload(!useDirectUpload)}
                  disabled={uploading}
                  className="btn btn-secondary text-sm px-3"
                >
                  {useDirectUpload ? 'Try AI' : 'Direct'}
                </button>
                <button
                  onClick={useDirectUpload ? handleDirectUpload : handleUpload}
                  disabled={!selectedFile || !templateName.trim() || uploading}
                  className="btn btn-primary"
                >
                  {uploading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">Uploading...</span>
                    </>
                  ) : (
                    useDirectUpload ? 'Upload Template' : 'Upload & Parse'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}