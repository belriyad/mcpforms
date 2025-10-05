'use client'

import { useState, useEffect } from 'react'
import { collection, query, onSnapshot, doc, deleteDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import TemplateUpload from './TemplateUpload'
import TemplateEditor from './TemplateEditor'

interface Template {
  id: string
  name?: string
  originalFileName?: string
  fileType?: string
  status: 'uploaded' | 'parsing' | 'parsed' | 'error'
  extractedFields?: any[]
  createdAt?: any
  errorMessage?: string
}

export default function TemplateManager() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('📊 TemplateManager: Setting up Firestore listener')
    const q = query(collection(db, 'templates'))
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        console.log('📊 TemplateManager: Received snapshot with', snapshot.docs.length, 'documents')
        const templatesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Template[]
        
        setTemplates(templatesData.sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate()))
        setLoading(false)
      },
      (error) => {
        console.error('❌ TemplateManager: Firestore error:', error)
        console.error('❌ TemplateManager: Error code:', error.code)
        console.error('❌ TemplateManager: Error message:', error.message)
        setError(`Failed to load templates: ${error.message}`)
        setLoading(false)
      }
    )

    return unsubscribe
  }, [])

  const handleDelete = async (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      try {
        await deleteDoc(doc(db, 'templates', templateId))
      } catch (error) {
        console.error('Error deleting template:', error)
      }
    }
  }

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      uploaded: 'status-info',
      parsing: 'status-warning',
      parsed: 'status-success',
      error: 'status-error'
    }
    
    return (
      <span className={statusClasses[status as keyof typeof statusClasses] || 'status-neutral'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <h3 className="text-red-800 font-medium">Connection Error</h3>
        <p className="text-red-600 mt-1">{error}</p>
        <p className="text-red-600 text-sm mt-2">Check your internet connection and Firebase configuration.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Template Management</h2>
          <p className="text-gray-600 mt-1">Upload and manage document templates</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="btn btn-primary"
        >
          + Upload Template
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="card">
          <div className="card-content text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates uploaded</h3>
            <p className="text-gray-500 mb-4">Get started by uploading your first document template</p>
            <button
              onClick={() => setShowUpload(true)}
              className="btn btn-primary"
            >
              Upload Template
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3" data-testid="template-grid">
          {templates.map((template) => (
            <div key={template.id} className="card">
              <div className="card-content">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{template.name || 'Unnamed Template'}</h3>
                      {getStatusBadge(template.status)}
                    </div>
                    <p className="text-sm text-gray-500 mb-2">
                      File: {template.originalFileName || 'Unknown'} {template.fileType ? `(${template.fileType.toUpperCase()})` : ''}
                    </p>
                    <p className="text-sm text-gray-500">
                      Uploaded: {template.createdAt?.toDate()?.toLocaleDateString() || 'Unknown'}
                    </p>
                    
                    {template.status === 'parsed' && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700">
                          Extracted Fields: {template.extractedFields?.length || 0}
                        </p>
                        {template.extractedFields && template.extractedFields.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {template.extractedFields.slice(0, 5).map((field, index) => (
                              <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                                {field?.label || 'Unknown Field'}
                              </span>
                            ))}
                            {template.extractedFields.length > 5 && (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">
                                +{template.extractedFields.length - 5} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {template.status === 'error' && template.errorMessage && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                        <p className="text-sm text-red-700">Error: {template.errorMessage}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {template.status === 'parsing' && (
                      <LoadingSpinner size="sm" />
                    )}
                    {template.status === 'parsed' && (
                      <button
                        onClick={() => setSelectedTemplateId(template.id)}
                        className="text-blue-600 hover:text-blue-800 p-2"
                        title="Edit template"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="text-red-600 hover:text-red-800 p-2"
                      title="Delete template"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showUpload && (
        <TemplateUpload
          onClose={() => setShowUpload(false)}
          onUploadComplete={() => setShowUpload(false)}
        />
      )}

      {selectedTemplateId && (
        <TemplateEditor
          templateId={selectedTemplateId}
          onClose={() => setSelectedTemplateId(null)}
        />
      )}
    </div>
  )
}