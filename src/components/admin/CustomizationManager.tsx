'use client'

import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '@/lib/firebase'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

interface CustomerOverride {
  id: string
  customer_id: string
  service_id: string
  override_type: 'add_field' | 'remove_field' | 'modify_field' | 'custom_clause'
  target_field?: string
  new_field?: any
  modifications?: any
  custom_clause?: {
    text: string
    position: string
  }
  status: 'pending' | 'approved' | 'rejected'
  created_at: any
  reviewed_at?: any
  reviewed_by?: string
  customer_email?: string
  service_name?: string
}

interface Service {
  id: string
  name: string
}

export default function CustomizationManager() {
  const [overrides, setOverrides] = useState<CustomerOverride[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [selectedService, setSelectedService] = useState<string>('all')
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    console.log('🎨 CustomizationManager: Setting up Firestore listeners')
    
    // Load services
    const servicesQuery = query(collection(db, 'services'))
    const unsubscribeServices = onSnapshot(servicesQuery, 
      (snapshot) => {
        const servicesData = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        })) as Service[]
        setServices(servicesData)
      },
      (error) => {
        console.error('❌ CustomizationManager: Services error:', error)
        toast.error(`Failed to load services: ${error.message}`)
      }
    )

    // Load overrides
    const overridesQuery = query(collection(db, 'customer_overrides'))
    const unsubscribeOverrides = onSnapshot(overridesQuery, 
      (snapshot) => {
        console.log('🎨 CustomizationManager: Received overrides snapshot with', snapshot.docs.length, 'documents')
        const overridesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as CustomerOverride[]
        
        setOverrides(overridesData.sort((a, b) => 
          b.created_at?.toDate() - a.created_at?.toDate()
        ))
        setLoading(false)
      },
      (error) => {
        console.error('❌ CustomizationManager: Overrides error:', error)
        toast.error(`Failed to load customizations: ${error.message}`)
        setLoading(false)
      }
    )

    return () => {
      unsubscribeServices()
      unsubscribeOverrides()
    }
  }, [])

  const handleApprove = async (overrideId: string) => {
    try {
      setProcessing(overrideId)
      const functions = getFunctions()
      const approveOverride = httpsCallable(functions, 'approveCustomerOverride')
      await approveOverride({ overrideId, approved: true })
      toast.success('Customization approved')
    } catch (error: any) {
      console.error('Error approving override:', error)
      toast.error(error.message || 'Failed to approve customization')
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (overrideId: string) => {
    if (!confirm('Are you sure you want to reject this customization?')) {
      return
    }

    try {
      setProcessing(overrideId)
      const functions = getFunctions()
      const approveOverride = httpsCallable(functions, 'approveCustomerOverride')
      await approveOverride({ overrideId, approved: false })
      toast.success('Customization rejected')
    } catch (error: any) {
      console.error('Error rejecting override:', error)
      toast.error(error.message || 'Failed to reject customization')
    } finally {
      setProcessing(null)
    }
  }

  const filteredOverrides = overrides.filter(override => {
    const statusMatch = filter === 'all' || override.status === filter
    const serviceMatch = selectedService === 'all' || override.service_id === selectedService
    return statusMatch && serviceMatch
  })

  const pendingCount = overrides.filter(o => o.status === 'pending').length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Customizations</h2>
          <p className="mt-1 text-sm text-gray-500">
            Review and approve custom fields and clauses requested by customers
          </p>
        </div>
        {pendingCount > 0 && (
          <div className="mt-4 sm:mt-0">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
              {pendingCount} pending approval{pendingCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-4 sm:space-y-0">
          {/* Status Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="input w-full"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Service Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="input w-full"
            >
              <option value="all">All Services</option>
              {services.map(service => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Overrides List */}
      {filteredOverrides.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <div className="text-gray-400 text-5xl mb-4">🎨</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Customizations Found</h3>
          <p className="text-gray-500">
            {filter === 'pending' 
              ? 'There are no pending customizations to review.'
              : 'No customizations match your current filters.'}
          </p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
          {filteredOverrides.map(override => (
            <div key={override.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      override.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      override.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {override.status}
                    </span>
                    <span className="text-sm text-gray-500">
                      {override.customer_email || override.customer_id}
                    </span>
                    <span className="text-sm text-gray-500">•</span>
                    <span className="text-sm text-gray-500">
                      {override.service_name || override.service_id}
                    </span>
                  </div>

                  {/* Override Type */}
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {override.override_type === 'add_field' && '➕ Add Custom Field'}
                    {override.override_type === 'modify_field' && '✏️ Modify Field'}
                    {override.override_type === 'remove_field' && '➖ Remove Field'}
                    {override.override_type === 'custom_clause' && '📝 Custom Clause'}
                  </h3>

                  {/* Override Details */}
                  <div className="mt-3 bg-gray-50 rounded-md p-4">
                    {override.override_type === 'add_field' && override.new_field && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">New Field:</p>
                        <p className="text-sm text-gray-600 mt-1">
                          <strong>{override.new_field.label}</strong> ({override.new_field.type})
                        </p>
                        {override.new_field.description && (
                          <p className="text-sm text-gray-500 mt-1">{override.new_field.description}</p>
                        )}
                      </div>
                    )}

                    {override.override_type === 'custom_clause' && override.custom_clause && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Custom Clause:</p>
                        <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                          {override.custom_clause.text}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          Position: {override.custom_clause.position}
                        </p>
                      </div>
                    )}

                    {override.override_type === 'modify_field' && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Modifying field: <strong>{override.target_field}</strong>
                        </p>
                        <pre className="text-xs text-gray-600 mt-2 overflow-auto">
                          {JSON.stringify(override.modifications, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* Timestamp */}
                  <p className="text-xs text-gray-500 mt-3">
                    Requested {override.created_at?.toDate?.().toLocaleString() || 'recently'}
                  </p>
                </div>

                {/* Actions */}
                {override.status === 'pending' && (
                  <div className="ml-4 flex flex-col space-y-2">
                    <button
                      onClick={() => handleApprove(override.id)}
                      disabled={processing === override.id}
                      className="btn btn-primary btn-sm whitespace-nowrap"
                    >
                      {processing === override.id ? 'Processing...' : '✓ Approve'}
                    </button>
                    <button
                      onClick={() => handleReject(override.id)}
                      disabled={processing === override.id}
                      className="btn btn-outline btn-sm whitespace-nowrap text-red-600 hover:bg-red-50"
                    >
                      ✗ Reject
                    </button>
                  </div>
                )}

                {override.status !== 'pending' && (
                  <div className="ml-4 text-sm text-gray-500">
                    {override.reviewed_at && (
                      <p>Reviewed {override.reviewed_at?.toDate?.().toLocaleDateString()}</p>
                    )}
                    {override.reviewed_by && (
                      <p className="mt-1">by {override.reviewed_by}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function getFunctions() {
  // Import here to avoid SSR issues
  const { getFunctions: getFirebaseFunctions } = require('firebase/functions')
  return getFirebaseFunctions()
}
