'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { collection, query, onSnapshot, orderBy, where, deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/lib/auth/AuthProvider'
import { usePermissions } from '@/contexts/PermissionsContext'
import { PermissionGuard } from '@/components/auth/PermissionGuard'
import { 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle2, 
  Eye,
  Upload,
  Loader2,
  Search,
  Filter,
  Trash2,
  Layers
} from 'lucide-react'
import { SearchBar } from '@/components/ui/SearchBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/StatusBadge'
import ErrorState from '@/components/ui/ErrorState'
import { isFeatureEnabled } from '@/lib/feature-flags'

interface Template {
  id: string
  name: string
  status: 'uploaded' | 'parsing' | 'parsed' | 'error'
  createdAt: any
  updatedAt: any
  fileSize?: number
  aiFields?: any[]
}

export default function TemplatesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { hasPermission } = usePermissions()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | Template['status']>('all')
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const emptyErrorStatesEnabled = isFeatureEnabled('emptyErrorStates')

  // Load templates from Firestore
  useEffect(() => {
    if (!user?.uid) return

    try {
      const templatesQuery = query(
        collection(db, 'templates'),
        where('createdBy', '==', user.uid),
        orderBy('createdAt', 'desc')
      )
      
      const unsubscribe = onSnapshot(templatesQuery, (snapshot) => {
        try {
          const templatesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Template[]
          
          setTemplates(templatesData)
          setError(null)
        } catch (err) {
          console.error('Error processing templates:', err)
          setError('Failed to process templates data')
        }
        setLoading(false)
      }, (error) => {
        console.error('Error loading templates:', error)
        setError('Failed to load templates')
        setLoading(false)
      })

      return () => unsubscribe()
    } catch (err) {
      console.error('Error setting up templates listener:', err)
      setError('Failed to initialize templates')
      setLoading(false)
    }
  }, [user?.uid])

  // Filter templates
  const filteredTemplates = filter === 'all' 
    ? templates 
    : templates.filter(t => t.status === filter)

  // Apply search
  const searchedTemplates = searchQuery.trim()
    ? filteredTemplates.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredTemplates

    const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size'
    const kb = bytes / 1024
    const mb = kb / 1024
    return mb >= 1 ? `${mb.toFixed(2)} MB` : `${kb.toFixed(2)} KB`
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A'
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }).format(date)
    } catch {
      return 'Invalid date'
    }
  }

  const handleDelete = async (templateId: string, templateName: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!confirm(`Are you sure you want to delete "${templateName}"? This action cannot be undone.`)) {
      return
    }

    setDeletingId(templateId)
    
    try {
      await deleteDoc(doc(db, 'templates', templateId))
      // TODO: Also delete associated storage file if needed
      // const storageRef = ref(storage, `templates/${templateId}/...`)
      // await deleteObject(storageRef)
    } catch (err: any) {
      console.error('Error deleting template:', err)
      alert(`Failed to delete template: ${err.message}`)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Templates</h1>
              <p className="text-gray-600">Upload and manage document templates</p>
            </div>
            <PermissionGuard permission="canUploadTemplates">
              <div className="flex gap-3">
                <button
                  onClick={() => router.push('/admin/templates/bulk-upload')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <Layers className="w-5 h-5" />
                  Bulk Upload
                </button>
                <button
                  onClick={() => router.push('/admin/templates/upload')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <Upload className="w-5 h-5" />
                  Upload Single
                </button>
              </div>
            </PermissionGuard>
          </div>
        </div>

        {/* Stats */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Templates</p>
                  <p className="text-2xl font-bold text-gray-900">{templates.length}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Parsing</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {templates.filter(t => t.status === 'parsing').length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Parsed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {templates.filter(t => t.status === 'parsed').length}
                  </p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">AI Fields</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {templates.reduce((sum, t) => sum + (t.aiFields?.length || 0), 0)}
                  </p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading templates...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          emptyErrorStatesEnabled ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <ErrorState
                title="Failed to load templates"
                message={error}
                onRetry={() => window.location.reload()}
                retryLabel="Reload Page"
                showDetails={false}
              />
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Reload Page
              </button>
            </div>
          )
        )}

        {/* Filters and Search */}
        {!loading && !error && (
          <>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6">
              <div className="mb-4">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search templates by name..."
                  className="max-w-md"
                />
              </div>
              <div className="flex items-center gap-2 overflow-x-auto">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    filter === 'all'
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  All ({templates.length})
                </button>
                <button
                  onClick={() => setFilter('parsed')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    filter === 'parsed'
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Parsed ({templates.filter(t => t.status === 'parsed').length})
                </button>
                <button
                  onClick={() => setFilter('parsing')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    filter === 'parsing'
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Parsing ({templates.filter(t => t.status === 'parsing').length})
                </button>
                <button
                  onClick={() => setFilter('error')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    filter === 'error'
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Errors ({templates.filter(t => t.status === 'error').length})
                </button>
              </div>
            </div>

            {/* Templates List */}
            {searchedTemplates.length === 0 ? (
              <EmptyState
                icon={FileText}
                title={searchQuery ? 'No templates match your search' : 'No templates yet'}
                description={searchQuery ? 'Try adjusting your search terms' : 'Upload your first document template to get started'}
                action={!searchQuery ? (
                  <button
                    onClick={() => router.push('/admin/templates/upload')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all"
                  >
                    <Upload className="w-5 h-5" />
                    Upload Template
                  </button>
                ) : undefined}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchedTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => router.push(`/admin/templates/${template.id}`)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <StatusBadge
                        variant={template.status === 'parsed' ? 'success' : template.status === 'parsing' ? 'warning' : 'error'}
                      >
                        {template.status === 'parsed' ? 'Parsed' : template.status === 'parsing' ? 'Parsing' : template.status === 'uploaded' ? 'Uploaded' : 'Error'}
                      </StatusBadge>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
                      {template.name}
                    </h3>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center justify-between">
                        <span>AI Fields:</span>
                        <span className="font-medium text-gray-900">
                          {template.aiFields?.length || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Size:</span>
                        <span className="font-medium text-gray-900">
                          {formatFileSize(template.fileSize)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Created:</span>
                        <span className="font-medium text-gray-900">
                          {formatDate(template.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/admin/templates/${template.id}`)
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                      <button
                        onClick={(e) => handleDelete(template.id, template.name, e)}
                        disabled={deletingId === template.id}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete template"
                      >
                        {deletingId === template.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
