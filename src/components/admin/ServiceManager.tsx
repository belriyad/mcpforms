'use client'

import { useState, useEffect } from 'react'
import { collection, query, onSnapshot, doc, deleteDoc } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '@/lib/firebase'
import { LoadingSpinner } from '@/components/ui/loading-components'
import { showSuccessToast, showErrorToast, showLoadingToast } from '@/lib/toast-helpers'
import toast from 'react-hot-toast'

interface Service {
  id: string
  name: string
  description: string
  templateIds: string[]
  status: 'draft' | 'active' | 'inactive'
  masterFormJson: any[]
  createdAt: any
}

interface Template {
  id: string
  name: string
  status: string
  default_customization_rules?: {
    allow_custom_fields?: boolean
    allow_custom_clauses?: boolean
    require_approval?: boolean
    allowed_field_types?: string[]
    max_custom_fields?: number
    max_custom_clauses?: number
  }
}

export default function ServiceManager() {
  const [services, setServices] = useState<Service[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('⚙️ ServiceManager: Setting up Firestore listeners')
    setError(null)
    
    // Load services
    const servicesQuery = query(collection(db, 'services'))
    const unsubscribeServices = onSnapshot(servicesQuery, 
      (snapshot) => {
        console.log('⚙️ ServiceManager: Received services snapshot with', snapshot.docs.length, 'documents')
        const servicesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Service[]
        
        setServices(servicesData.sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate()))
      },
      (error) => {
        console.error('❌ ServiceManager: Services error:', error)
        setError(`Services error: ${error.message}`)
      }
    )

    // Load templates
    const templatesQuery = query(collection(db, 'templates'))
    const unsubscribeTemplates = onSnapshot(templatesQuery, 
      (snapshot) => {
        console.log('⚙️ ServiceManager: Received templates snapshot with', snapshot.docs.length, 'documents')
        const templatesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Template[]
        
        setTemplates(templatesData.filter(t => t.status === 'parsed'))
        setLoading(false)
      },
      (error) => {
        console.error('❌ ServiceManager: Templates error:', error)
        setError(`Templates error: ${error.message}`)
        setLoading(false)
      }
    )

    return () => {
      unsubscribeServices()
      unsubscribeTemplates()
    }
  }, [])

  const handleDelete = async (serviceId: string) => {
    if (confirm('Are you sure you want to delete this service?')) {
      try {
        const deleteServiceRequest = httpsCallable(functions, 'deleteServiceRequest')
        await deleteServiceRequest({ serviceId })
        toast.success('Service deleted successfully')
      } catch (error: any) {
        console.error('Error deleting service:', error)
        toast.error(error.message || 'Failed to delete service')
      }
    }
  }

  const toggleServiceStatus = async (serviceId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
      const updateServiceRequest = httpsCallable(functions, 'updateServiceRequest')
      await updateServiceRequest({ serviceId, updates: { status: newStatus } })
      toast.success(`Service ${newStatus === 'active' ? 'activated' : 'deactivated'}`)
    } catch (error: any) {
      console.error('Error updating service status:', error)
      toast.error(error.message || 'Failed to update service status')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      draft: 'status-neutral',
      active: 'status-success',
      inactive: 'status-error'
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
        <LoadingSpinner size="lg" message="Loading services..." />
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
          <h2 className="text-2xl font-bold text-gray-900">Service Management</h2>
          <p className="text-gray-600 mt-1">Create and manage service requests</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn btn-primary"
        >
          + Create Service
        </button>
      </div>

      {services.length === 0 ? (
        <div className="card">
          <div className="card-content text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No services created</h3>
            <p className="text-gray-500 mb-4">Create your first service to start generating intake forms</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn btn-primary"
            >
              Create Service
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          {services.map((service) => (
            <div key={service.id} className="card">
              <div className="card-content">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                      {getStatusBadge(service.status)}
                    </div>
                    <p className="text-gray-600 mb-3">{service.description}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                      <span>Templates: {service.templateIds?.length || 0}</span>
                      <span>Fields: {service.masterFormJson?.length || 0}</span>
                      <span>Created: {service.createdAt?.toDate().toLocaleDateString()}</span>
                    </div>

                    {service.templateIds && service.templateIds.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">Associated Templates:</p>
                        <div className="flex flex-wrap gap-2">
                          {service.templateIds.map(templateId => {
                            const template = templates.find(t => t.id === templateId)
                            return (
                              <span key={templateId} className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                                {template?.name || 'Unknown Template'}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleServiceStatus(service.id, service.status)}
                      className={`btn btn-sm ${service.status === 'active' ? 'btn-outline' : 'btn-primary'}`}
                    >
                      {service.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDelete(service.id)}
                      className="text-red-600 hover:text-red-800 p-2"
                      title="Delete service"
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

      {showCreateForm && (
        <CreateServiceForm
          templates={templates}
          onClose={() => setShowCreateForm(false)}
          onServiceCreated={() => setShowCreateForm(false)}
        />
      )}
    </div>
  )
}

interface CreateServiceFormProps {
  templates: Template[]
  onClose: () => void
  onServiceCreated: () => void
}

function CreateServiceForm({ templates, onClose, onServiceCreated }: CreateServiceFormProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([])
  const [creating, setCreating] = useState(false)
  
  // Customization settings
  const [enableCustomization, setEnableCustomization] = useState(false)
  const [allowCustomFields, setAllowCustomFields] = useState(true)
  const [allowCustomClauses, setAllowCustomClauses] = useState(true)
  const [requireApproval, setRequireApproval] = useState(true)
  const [allowedFieldTypes, setAllowedFieldTypes] = useState<string[]>([
    'text', 'email', 'phone', 'date', 'number', 'address', 'currency', 'dropdown'
  ])
  const [inheritedFrom, setInheritedFrom] = useState<string | null>(null)

  // Load template defaults when templates are selected
  useEffect(() => {
    if (selectedTemplates.length === 0) {
      setInheritedFrom(null)
      return
    }

    // Find templates with default customization rules
    const templatesWithRules = selectedTemplates
      .map(id => templates.find(t => t.id === id))
      .filter(t => t?.default_customization_rules)

    if (templatesWithRules.length > 0) {
      // Use the first template's defaults
      const firstTemplate = templatesWithRules[0]!
      const rules = firstTemplate.default_customization_rules!
      
      console.log('📋 Inheriting customization rules from template:', firstTemplate.name, rules)
      
      setEnableCustomization(true)
      if (rules.allow_custom_fields !== undefined) setAllowCustomFields(rules.allow_custom_fields)
      if (rules.allow_custom_clauses !== undefined) setAllowCustomClauses(rules.allow_custom_clauses)
      if (rules.require_approval !== undefined) setRequireApproval(rules.require_approval)
      if (rules.allowed_field_types) setAllowedFieldTypes(rules.allowed_field_types)
      setInheritedFrom(firstTemplate.name)
      
      toast.success(`Inherited customization settings from ${firstTemplate.name}`)
    }
  }, [selectedTemplates, templates])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim() || !description.trim() || selectedTemplates.length === 0) {
      toast.error('Please fill in all fields and select at least one template')
      return
    }

    setCreating(true)
    console.log('🚀 ServiceManager: Starting service creation...', {
      name: name.trim(),
      description: description.trim(),
      templateIds: selectedTemplates,
    })

    try {
      const createServiceRequest = httpsCallable(functions, 'createServiceRequest')
      const result = await createServiceRequest({
        name: name.trim(),
        description: description.trim(),
        templateIds: selectedTemplates,
        customization: enableCustomization ? {
          allow_custom_fields: allowCustomFields,
          allow_custom_clauses: allowCustomClauses,
          require_approval: requireApproval,
          allowed_field_types: allowedFieldTypes,
          max_custom_fields: 10,
          max_custom_clauses: 5
        } : null
      })

      console.log('✅ ServiceManager: Service creation result:', result)
      
      if (result.data && (result.data as any).success) {
        console.log('✅ ServiceManager: Service created successfully!')
        toast.success('Service created successfully!')
        onServiceCreated()
      } else {
        console.error('❌ ServiceManager: Service creation failed:', result.data)
        throw new Error((result.data as any)?.error || 'Service creation failed')
      }
    } catch (error: any) {
      console.error('❌ ServiceManager: Error creating service:', error)
      toast.error(error.message || 'Failed to create service')
    } finally {
      setCreating(false)
    }
  }

  const toggleTemplate = (templateId: string) => {
    setSelectedTemplates(prev => 
      prev.includes(templateId)
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId]
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="card">
          <div className="card-header">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Create New Service</h3>
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
          
          <form onSubmit={handleSubmit} className="card-content space-y-4 overflow-y-auto">
            <div>
              <label htmlFor="serviceName" className="block text-sm font-medium text-gray-700 mb-1">
                Service Name
              </label>
              <input
                id="serviceName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
                placeholder="Enter service name"
                required
              />
            </div>

            <div>
              <label htmlFor="serviceDescription" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="serviceDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-textarea"
                rows={3}
                placeholder="Describe what this service is for"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Templates ({selectedTemplates.length} selected)
              </label>
              {templates.length === 0 ? (
                <p className="text-sm text-gray-500 p-4 border border-gray-200 rounded">
                  No parsed templates available. Please upload and parse templates first.
                </p>
              ) : (
                <div className="border border-gray-200 rounded max-h-40 overflow-y-auto">
                  {templates.map((template) => (
                    <label
                      key={template.id}
                      className="flex items-center p-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTemplates.includes(template.id)}
                        onChange={() => toggleTemplate(template.id)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-3 text-sm text-gray-900">{template.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Customization Settings */}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Customer Customization Options</h4>
                  <p className="text-xs text-gray-500 mt-1">Allow customers to add custom fields and clauses to this service</p>
                  {inheritedFrom && (
                    <div className="flex items-center mt-2 text-xs">
                      <svg className="w-3 h-3 text-blue-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
                      </svg>
                      <span className="text-blue-600 font-medium">Inherited from template: {inheritedFrom}</span>
                      <span className="text-gray-500 ml-1">(you can override these settings)</span>
                    </div>
                  )}
                </div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableCustomization}
                    onChange={(e) => setEnableCustomization(e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">Enable</span>
                </label>
              </div>

              {enableCustomization && (
                <div className="space-y-3 pl-4 border-l-2 border-gray-200">
                  <label className="flex items-start cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowCustomFields}
                      onChange={(e) => setAllowCustomFields(e.target.checked)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 mt-0.5"
                    />
                    <div className="ml-3">
                      <span className="text-sm font-medium text-gray-700">Allow Custom Fields</span>
                      <p className="text-xs text-gray-500">Customers can add new fields to the intake form</p>
                    </div>
                  </label>

                  <label className="flex items-start cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowCustomClauses}
                      onChange={(e) => setAllowCustomClauses(e.target.checked)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 mt-0.5"
                    />
                    <div className="ml-3">
                      <span className="text-sm font-medium text-gray-700">Allow Custom Clauses</span>
                      <p className="text-xs text-gray-500">Customers can add custom text clauses to documents</p>
                    </div>
                  </label>

                  <label className="flex items-start cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requireApproval}
                      onChange={(e) => setRequireApproval(e.target.checked)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 mt-0.5"
                    />
                    <div className="ml-3">
                      <span className="text-sm font-medium text-gray-700">Require Admin Approval</span>
                      <p className="text-xs text-gray-500">Admin must approve customizations before use</p>
                    </div>
                  </label>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Allowed Field Types
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {['text', 'email', 'phone', 'date', 'number', 'address', 'currency', 'dropdown'].map(type => (
                        <label key={type} className="flex items-center text-xs cursor-pointer">
                          <input
                            type="checkbox"
                            checked={allowedFieldTypes.includes(type)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setAllowedFieldTypes([...allowedFieldTypes, type])
                              } else {
                                setAllowedFieldTypes(allowedFieldTypes.filter(t => t !== type))
                              }
                            }}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="ml-2 text-gray-600 capitalize">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </form>

          <div className="card-footer">
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={creating}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={creating || selectedTemplates.length === 0}
                className="btn btn-primary"
              >
                {creating ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Creating...</span>
                  </>
                ) : (
                  'Create Service'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}