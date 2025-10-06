'use client'

import { useState, useEffect } from 'react'
import { 
  Settings, 
  Plus, 
  FileText, 
  Eye, 
  Save, 
  Trash2,
  ChevronDown,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Sparkles
} from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-components'
import { showSuccessToast, showErrorToast } from '@/lib/toast-helpers'

interface Service {
  id: string
  name: string
  description?: string
}

interface CustomField {
  id: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'number' | 'email' | 'tel' | 'date'
  required: boolean
  options?: string[]
  placeholder?: string
  description?: string
}

export default function CustomizePage() {
  const [services, setServices] = useState<Service[]>([])
  const [selectedService, setSelectedService] = useState<string>('')
  const [customFields, setCustomFields] = useState<CustomField[]>([])
  const [showAddField, setShowAddField] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // New field form state
  const [newField, setNewField] = useState<Partial<CustomField>>({
    label: '',
    type: 'text',
    required: false,
    options: [],
    placeholder: '',
    description: ''
  })

  useEffect(() => {
    loadServices()
  }, [])

  useEffect(() => {
    if (selectedService) {
      loadCustomFields()
    }
  }, [selectedService])

  const loadServices = async () => {
    try {
      // Mock services - replace with actual API call
      const mockServices: Service[] = [
        {
          id: 'service_001',
          name: 'Employment Contract',
          description: 'Standard employment agreement template'
        },
        {
          id: 'service_002',
          name: 'Non-Disclosure Agreement',
          description: 'Confidentiality and NDA template'
        },
        {
          id: 'service_003',
          name: 'Consulting Agreement',
          description: 'Independent contractor services template'
        }
      ]
      
      setServices(mockServices)
      if (mockServices.length > 0) {
        setSelectedService(mockServices[0].id)
      }
      setLoading(false)
    } catch (error) {
      showErrorToast('Failed to load services')
      setLoading(false)
    }
  }

  const loadCustomFields = async () => {
    try {
      // Mock custom fields - replace with actual API call
      setCustomFields([])
    } catch (error) {
      showErrorToast('Failed to load custom fields')
    }
  }

  const handleAddField = () => {
    if (!newField.label) {
      showErrorToast('Please enter a field label')
      return
    }

    const field: CustomField = {
      id: `custom_${Date.now()}`,
      label: newField.label || '',
      type: newField.type || 'text',
      required: newField.required || false,
      options: newField.options || [],
      placeholder: newField.placeholder,
      description: newField.description
    }

    setCustomFields([...customFields, field])
    setShowAddField(false)
    setNewField({
      label: '',
      type: 'text',
      required: false,
      options: [],
      placeholder: '',
      description: ''
    })
    showSuccessToast('Custom field added')
  }

  const handleDeleteField = (fieldId: string) => {
    setCustomFields(customFields.filter(f => f.id !== fieldId))
    showSuccessToast('Field removed')
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Call API to save custom fields
      await new Promise(resolve => setTimeout(resolve, 1000)) // Mock delay
      showSuccessToast('Custom fields saved successfully')
    } catch (error) {
      showErrorToast('Failed to save custom fields')
    } finally {
      setSaving(false)
    }
  }

  const fieldTypes = [
    { value: 'text', label: 'Text Input' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'select', label: 'Dropdown' },
    { value: 'radio', label: 'Radio Buttons' },
    { value: 'checkbox', label: 'Checkboxes' },
    { value: 'number', label: 'Number' },
    { value: 'email', label: 'Email' },
    { value: 'tel', label: 'Phone' },
    { value: 'date', label: 'Date' }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading customization..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Form Customization</h1>
                <p className="text-sm text-gray-600 mt-1">Add custom fields to your intake forms</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">{showPreview ? 'Hide' : 'Show'}</span> Preview
              </button>
              <button
                onClick={handleSave}
                disabled={saving || customFields.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
              >
                {saving ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="hidden sm:inline">Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span className="hidden sm:inline">Save Changes</span>
                    <span className="sm:hidden">Save</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`grid ${showPreview ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-8`}>
          {/* Left Panel - Customization */}
          <div className="space-y-6">
            {/* Service Selector */}
            <div className="card animate-fade-in">
              <div className="card-content">
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Select Service to Customize
                </label>
                <div className="relative">
                  <select
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="form-select w-full text-base appearance-none"
                  >
                    {services.map(service => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
                {services.find(s => s.id === selectedService)?.description && (
                  <p className="text-sm text-gray-600 mt-2 flex items-start gap-2">
                    <HelpCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{services.find(s => s.id === selectedService)?.description}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Custom Fields List */}
            <div className="card animate-fade-in">
              <div className="card-content">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Custom Fields</h2>
                  <button
                    onClick={() => setShowAddField(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Field
                  </button>
                </div>

                {customFields.length === 0 && !showAddField && (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                    <Sparkles className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-600 font-medium mb-1">No custom fields yet</p>
                    <p className="text-sm text-gray-500 mb-4">Click "Add Field" to create your first custom field</p>
                  </div>
                )}

                <div className="space-y-3">
                  {customFields.map((field) => (
                    <div
                      key={field.id}
                      className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors animate-slide-in"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-medium text-gray-900">{field.label}</span>
                            {field.required && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                                Required
                              </span>
                            )}
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                              {fieldTypes.find(t => t.value === field.type)?.label}
                            </span>
                          </div>
                          {field.description && (
                            <p className="text-sm text-gray-600 mt-1">{field.description}</p>
                          )}
                          {field.options && field.options.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {field.options.map((option, i) => (
                                <span key={i} className="px-2 py-0.5 bg-white border border-gray-200 text-xs rounded">
                                  {option}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteField(field.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-2 flex-shrink-0"
                          title="Remove field"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add Field Form */}
                  {showAddField && (
                    <div className="border-2 border-blue-200 rounded-lg p-6 bg-blue-50 animate-slide-in">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4">Add New Field</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Field Label <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={newField.label}
                            onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                            placeholder="e.g., Emergency Contact"
                            className="form-input w-full"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Field Type
                          </label>
                          <select
                            value={newField.type}
                            onChange={(e) => setNewField({ ...newField, type: e.target.value as any })}
                            className="form-select w-full"
                          >
                            {fieldTypes.map(type => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Placeholder Text (Optional)
                          </label>
                          <input
                            type="text"
                            value={newField.placeholder}
                            onChange={(e) => setNewField({ ...newField, placeholder: e.target.value })}
                            placeholder="e.g., Enter contact name"
                            className="form-input w-full"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description (Optional)
                          </label>
                          <textarea
                            value={newField.description}
                            onChange={(e) => setNewField({ ...newField, description: e.target.value })}
                            placeholder="Help text for this field"
                            rows={2}
                            className="form-input w-full"
                          />
                        </div>

                        {(newField.type === 'select' || newField.type === 'radio' || newField.type === 'checkbox') && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Options (comma-separated)
                            </label>
                            <input
                              type="text"
                              value={newField.options?.join(', ')}
                              onChange={(e) => setNewField({ 
                                ...newField, 
                                options: e.target.value.split(',').map(o => o.trim()).filter(Boolean)
                              })}
                              placeholder="e.g., Option 1, Option 2, Option 3"
                              className="form-input w-full"
                            />
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="required"
                            checked={newField.required}
                            onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor="required" className="text-sm text-gray-700">
                            This field is required
                          </label>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 pt-2">
                          <button
                            onClick={handleAddField}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Add Field
                          </button>
                          <button
                            onClick={() => {
                              setShowAddField(false)
                              setNewField({
                                label: '',
                                type: 'text',
                                required: false,
                                options: [],
                                placeholder: '',
                                description: ''
                              })
                            }}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Help Card */}
            <div className="card bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 animate-fade-in">
              <div className="card-content">
                <div className="flex gap-3">
                  <HelpCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">How it works</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Custom fields will be added to all intake forms for this service</li>
                      <li>• Changes take effect immediately after saving</li>
                      <li>• Required fields must be completed before form submission</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Preview */}
          {showPreview && (
            <div className="space-y-6 animate-fade-in">
              <div className="card sticky top-6">
                <div className="card-content">
                  <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-200">
                    <Eye className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Live Preview</h2>
                  </div>

                  {customFields.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>Add custom fields to see preview</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <p className="text-sm text-gray-600 mb-4">
                        This is how your custom fields will appear in the intake form:
                      </p>
                      
                      {customFields.map((field) => (
                        <div key={field.id} className="animate-fade-in">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          
                          {field.description && (
                            <p className="text-sm text-gray-500 mb-2">{field.description}</p>
                          )}

                          {field.type === 'textarea' && (
                            <textarea
                              placeholder={field.placeholder}
                              rows={3}
                              className="form-input w-full"
                              disabled
                            />
                          )}

                          {field.type === 'select' && (
                            <select className="form-select w-full" disabled>
                              <option value="">Select an option</option>
                              {field.options?.map((option, i) => (
                                <option key={i} value={option}>{option}</option>
                              ))}
                            </select>
                          )}

                          {field.type === 'radio' && field.options && (
                            <div className="space-y-2">
                              {field.options.map((option, i) => (
                                <label key={i} className="flex items-center">
                                  <input
                                    type="radio"
                                    name={field.id}
                                    disabled
                                    className="rounded-full border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">{option}</span>
                                </label>
                              ))}
                            </div>
                          )}

                          {field.type === 'checkbox' && field.options && (
                            <div className="space-y-2">
                              {field.options.map((option, i) => (
                                <label key={i} className="flex items-center">
                                  <input
                                    type="checkbox"
                                    disabled
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">{option}</span>
                                </label>
                              ))}
                            </div>
                          )}

                          {!['textarea', 'select', 'radio', 'checkbox'].includes(field.type) && (
                            <input
                              type={field.type}
                              placeholder={field.placeholder}
                              className="form-input w-full"
                              disabled
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
