'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { 
  ArrowLeft, 
  FileText, 
  Plus, 
  Edit3,
  Trash2,
  Eye,
  Save,
  Settings,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-components'
import { showSuccessToast, showErrorToast } from '@/lib/toast-helpers'

interface FormField {
  id: string
  name: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'number' | 'email' | 'tel' | 'date'
  required: boolean
  options?: string[]
  placeholder?: string
  description?: string
  isCustom?: boolean
}

interface Template {
  id: string
  name: string
  description?: string
  originalFileName: string
  currentVersion: number
}

export default function TemplateEditorPage({ params }: { params: { templateId: string } }) {
  const router = useRouter()
  const [template, setTemplate] = useState<Template | null>(null)
  const [fields, setFields] = useState<FormField[]>([])
  const [showAddField, setShowAddField] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingField, setEditingField] = useState<FormField | null>(null)

  // New field form state
  const [newField, setNewField] = useState<Partial<FormField>>({
    label: '',
    type: 'text',
    required: false,
    options: [],
    placeholder: '',
    description: ''
  })

  useEffect(() => {
    loadTemplate()
  }, [params.templateId])

  const loadTemplate = async () => {
    try {
      // Load template from Firestore
      const templateDoc = await getDoc(doc(db, 'templates', params.templateId))
      
      if (!templateDoc.exists()) {
        showErrorToast('Template not found')
        router.push('/admin/templates')
        return
      }

      const templateData = templateDoc.data()
      
      const loadedTemplate: Template = {
        id: templateDoc.id,
        name: templateData.name || 'Untitled Template',
        description: templateData.description,
        originalFileName: templateData.originalFileName || 'unknown.docx',
        currentVersion: templateData.currentVersion || 1
      }

      // Load extracted fields (from original document) and custom fields
      const extractedFields: FormField[] = (templateData.extractedFields || []).map((f: any) => ({
        ...f,
        isCustom: false
      }))
      
      const customFields: FormField[] = (templateData.customFields || []).map((f: any) => ({
        ...f,
        isCustom: true
      }))

      setTemplate(loadedTemplate)
      setFields([...extractedFields, ...customFields])
      setLoading(false)
    } catch (error) {
      console.error('Error loading template:', error)
      showErrorToast('Failed to load template')
      setLoading(false)
    }
  }

  const handleAddField = () => {
    if (!newField.label) {
      showErrorToast('Please enter a field label')
      return
    }

    const field: FormField = {
      id: `custom_${Date.now()}`,
      name: newField.label?.toLowerCase().replace(/\s+/g, '_') || '',
      label: newField.label || '',
      type: newField.type || 'text',
      required: newField.required || false,
      options: newField.options || [],
      placeholder: newField.placeholder,
      description: newField.description,
      isCustom: true
    }

    setFields([...fields, field])
    setShowAddField(false)
    setNewField({
      label: '',
      type: 'text',
      required: false,
      options: [],
      placeholder: '',
      description: ''
    })
    showSuccessToast('Field added successfully')
  }

  const handleEditField = (field: FormField) => {
    setEditingField(field)
    setNewField({
      label: field.label,
      type: field.type,
      required: field.required,
      options: field.options || [],
      placeholder: field.placeholder,
      description: field.description
    })
    setShowAddField(true)
  }

  const handleUpdateField = () => {
    if (!editingField || !newField.label) {
      showErrorToast('Please enter a field label')
      return
    }

    const updatedFields = fields.map(f => 
      f.id === editingField.id
        ? {
            ...f,
            label: newField.label || f.label,
            type: newField.type || f.type,
            required: newField.required || false,
            options: newField.options || [],
            placeholder: newField.placeholder,
            description: newField.description
          }
        : f
    )

    setFields(updatedFields)
    setShowAddField(false)
    setEditingField(null)
    setNewField({
      label: '',
      type: 'text',
      required: false,
      options: [],
      placeholder: '',
      description: ''
    })
    showSuccessToast('Field updated successfully')
  }

  const handleDeleteField = (fieldId: string) => {
    const field = fields.find(f => f.id === fieldId)
    if (field && !field.isCustom) {
      showErrorToast('Cannot delete template fields, only custom fields can be removed')
      return
    }
    
    setFields(fields.filter(f => f.id !== fieldId))
    showSuccessToast('Field removed')
  }

  const handleSave = async () => {
    if (!template) return
    
    setSaving(true)
    try {
      // Save the custom fields to Firestore
      // We only save custom fields, not template fields (those come from the original document)
      const customFields = fields.filter(f => f.isCustom)
      
      await updateDoc(doc(db, 'templates', template.id), {
        customFields: customFields,
        updatedAt: new Date().toISOString()
      })
      
      showSuccessToast('Template updated successfully')
    } catch (error) {
      console.error('Error saving template:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Detailed error:', errorMessage, error)
      showErrorToast(`Failed to save template: ${errorMessage}`)
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
        <LoadingSpinner size="lg" message="Loading template..." />
      </div>
    )
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Template Not Found</h2>
          <button onClick={() => router.back()} className="btn btn-primary mt-4">
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Back to Templates</span>
              </button>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{template.name}</h1>
                  <p className="text-sm text-gray-600 mt-1">
                    {template.originalFileName} • Version {template.currentVersion}
                  </p>
                </div>
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
                disabled={saving}
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
          {/* Left Panel - Field Editor */}
          <div className="space-y-6">
            {/* Template Info */}
            {template.description && (
              <div className="card bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 animate-fade-in">
                <div className="card-content">
                  <div className="flex gap-3">
                    <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">About This Template</h3>
                      <p className="text-sm text-gray-700">{template.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Form Fields */}
            <div className="card animate-fade-in">
              <div className="card-content">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Form Fields</h2>
                  <button
                    onClick={() => {
                      setEditingField(null)
                      setNewField({
                        label: '',
                        type: 'text',
                        required: false,
                        options: [],
                        placeholder: '',
                        description: ''
                      })
                      setShowAddField(true)
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Field
                  </button>
                </div>

                <p className="text-sm text-gray-600 mb-4">
                  {fields.filter(f => !f.isCustom).length} template fields, {fields.filter(f => f.isCustom).length} custom fields
                </p>

                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className={`border rounded-lg p-4 transition-colors animate-slide-in ${
                        field.isCustom ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                      } hover:shadow-md`}
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
                            {field.isCustom && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                                Custom
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mb-1">Field name: {field.name}</p>
                          {field.description && (
                            <p className="text-sm text-gray-600 mt-1">{field.description}</p>
                          )}
                          {field.placeholder && (
                            <p className="text-xs text-gray-500 mt-1">Placeholder: "{field.placeholder}"</p>
                          )}
                          {field.options && field.options.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              <span className="text-xs text-gray-600">Options:</span>
                              {field.options.map((option, i) => (
                                <span key={i} className="px-2 py-0.5 bg-white border border-gray-200 text-xs rounded">
                                  {option}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                          {field.isCustom && (
                            <>
                              <button
                                onClick={() => handleEditField(field)}
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                title="Edit field"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteField(field.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Remove field"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add/Edit Field Form */}
                  {showAddField && (
                    <div className="border-2 border-blue-200 rounded-lg p-6 bg-blue-50 animate-slide-in">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4">
                        {editingField ? 'Edit Field' : 'Add New Field'}
                      </h3>
                      
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
                            onClick={editingField ? handleUpdateField : handleAddField}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            {editingField ? 'Update Field' : 'Add Field'}
                          </button>
                          <button
                            onClick={() => {
                              setShowAddField(false)
                              setEditingField(null)
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
            <div className="card bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 animate-fade-in">
              <div className="card-content">
                <div className="flex gap-3">
                  <HelpCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">About Fields</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• <strong>Template fields</strong> come from the original document and cannot be deleted</li>
                      <li>• <strong>Custom fields</strong> can be added, edited, or removed as needed</li>
                      <li>• All fields will appear in intake forms for services using this template</li>
                      <li>• Changes take effect immediately after saving</li>
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
                    <h2 className="text-lg font-semibold text-gray-900">Intake Form Preview</h2>
                  </div>

                  <p className="text-sm text-gray-600 mb-6">
                    This is how the intake form will appear to clients:
                  </p>
                  
                  <div className="space-y-6">
                    {fields.map((field) => (
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
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
