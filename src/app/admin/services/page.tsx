'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  Edit,
  Download,
  Mail,
  ArrowRight,
  Loader2
} from 'lucide-react'
import { SearchBar } from '@/components/ui/SearchBar'
import { StatsCard } from '@/components/ui/StatsCard'

interface Service {
  id: string
  name: string
  clientName: string
  clientEmail: string
  status: 'draft' | 'intake_sent' | 'intake_submitted' | 'documents_ready' | 'completed'
  templates?: any[]
  createdAt: any
  updatedAt: any
}

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'gray', icon: Edit },
  intake_sent: { label: 'Intake Sent', color: 'blue', icon: Mail },
  intake_submitted: { label: 'Pending Review', color: 'yellow', icon: Clock },
  documents_ready: { label: 'Ready', color: 'green', icon: CheckCircle2 },
  completed: { label: 'Completed', color: 'purple', icon: CheckCircle2 }
}

export default function ServicesPage() {
  const router = useRouter()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | Service['status']>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Load services from Firestore
  useEffect(() => {
    try {
      const servicesQuery = query(
        collection(db, 'services'),
        orderBy('createdAt', 'desc')
      )
      
      const unsubscribe = onSnapshot(servicesQuery, (snapshot) => {
        try {
          const servicesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Service[]
          
          setServices(servicesData)
          setError(null)
        } catch (err) {
          console.error('Error processing services:', err)
          setError('Failed to process services data')
        }
        setLoading(false)
      }, (error) => {
        console.error('Error loading services:', error)
        setError('Failed to load services')
        setLoading(false)
      })

      return () => unsubscribe()
    } catch (err) {
      console.error('Error setting up services listener:', err)
      setError('Failed to initialize services')
      setLoading(false)
    }
  }, [])

  const filteredServices = filter === 'all' 
    ? services 
    : services.filter(s => s.status === filter)

  // Apply search filter
  const searchedServices = searchQuery.trim()
    ? filteredServices.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.clientEmail.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredServices

  const getStatusBadge = (status: Service['status']) => {
    const config = STATUS_CONFIG[status]
    if (!config) {
      // Fallback for unknown status
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border bg-gray-100 text-gray-700 border-gray-300">
          {status || 'Unknown'}
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Services</h1>
              <p className="text-gray-600">Manage client services and document preparation</p>
            </div>
            <button
              onClick={() => router.push('/admin/services/create')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5" />
              New Service
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {loading ? (
          <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 mb-8 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading services...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-12 text-center mb-8">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Services</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
        ) : (
          <>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Services</p>
                <p className="text-2xl font-bold text-gray-900">{services.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Awaiting Response</p>
                <p className="text-2xl font-bold text-gray-900">
                  {services.filter(s => s.status === 'intake_sent').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Ready to Generate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {services.filter(s => s.status === 'intake_submitted').length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {services.filter(s => s.status === 'documents_ready' || s.status === 'completed').length}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6">
          <div className="mb-4">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search services by name, client, or email..."
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
              All ({services.length})
            </button>
            {Object.entries(STATUS_CONFIG).map(([status, config]) => {
              const count = services.filter(s => s.status === status).length
              return (
                <button
                  key={status}
                  onClick={() => setFilter(status as Service['status'])}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    filter === status
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {config.label} ({count})
                </button>
              )
            })}
          </div>
        </div>

        {/* Services List */}
        <div className="space-y-4">
          {searchedServices.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchQuery ? 'No services match your search' : 'No services found'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery ? 'Try adjusting your search terms' : 'Get started by creating your first service'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => router.push('/admin/services/create')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Create Service
                </button>
              )}
            </div>
          ) : (
            searchedServices.map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{service.name}</h3>
                      {getStatusBadge(service.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <span className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        {service.templates?.length || 0} template{(service.templates?.length || 0) !== 1 ? 's' : ''}
                      </span>
                      <span>•</span>
                      <span>Client: {service.clientName}</span>
                      <span>•</span>
                      <span>Updated {service.updatedAt ? (typeof service.updatedAt.toDate === 'function' ? service.updatedAt.toDate().toLocaleDateString() : new Date(service.updatedAt).toLocaleDateString()) : 'Recently'}</span>
                    </div>
                    <p className="text-sm text-gray-500">{service.clientEmail}</p>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => router.push(`/admin/services/${service.id}`)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    
                    {service.status === 'documents_ready' && (
                      <button
                        onClick={() => {/* Download logic */}}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    )}
                    
                    {service.status === 'draft' && (
                      <button
                        onClick={() => router.push(`/admin/services/${service.id}`)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all"
                      >
                        Continue
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        </>
        )}
      </div>
    </div>
  )
}
