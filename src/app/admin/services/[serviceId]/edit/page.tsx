'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { ArrowLeft, Plus, Edit3, Trash2, Eye, EyeOff, Save, Sparkles, FileText } from 'lucide-react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
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

interface Service {
  id: string
  name: string
  description: string
  templateIds: string[]
  masterFormJson: FormField[]
  status: string
}

interface Template {
  id: string
  name: string
  fileName: string
}

export default function EditServicePage({ params }: { params: { serviceId: string } }) {
  const router = useRouter()
  const [service, setService] = useState<Service | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [fields, setFields] = useState<FormField[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAddField, setShowAddField] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [editingField, setEditingField] = useState<FormField | null>(null)
  const [newField, setNewField] = useState<Partial<FormField>>({
    type: 'text',
    required: false,
    isCustom: true
  })
  
  // AI Field Generation
  const [showAISection, setShowAISection] = useState(false)
  const [aiParagraph, setAiParagraph] = useState('')
  const [selectedTemplateForAI, setSelectedTemplateForAI] = useState<string>('') // Template selection for AI
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiSuggestedFields, setAiSuggestedFields] = useState<FormField[]>([])
  const [selectedAIFields, setSelectedAIFields] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadServiceData()
  }, [params.serviceId])

  const loadServiceData = async () => {
    try {
      // Load service
      const serviceDoc = await getDoc(doc(db, 'services', params.serviceId))
      if (!serviceDoc.exists()) {
        showErrorToast('Service not found')
        router.push('/admin')
        return
      }

      const serviceData = { id: serviceDoc.id, ...serviceDoc.data() } as Service
      setService(serviceData)
      setFields(serviceData.masterFormJson || [])

      // Load associated templates
      if (serviceData.templateIds && serviceData.templateIds.length > 0) {
        const templatePromises = serviceData.templateIds.map(id => 
          getDoc(doc(db, 'templates', id))
        )
        const templateDocs = await Promise.all(templatePromises)
        const templatesData = templateDocs
          .filter(doc => doc.exists())
          .map(doc => ({ id: doc.id, ...doc.data() } as Template))
        setTemplates(templatesData)
      }

      setLoading(false)
    } catch (error) {
      console.error('Error loading service:', error)
      showErrorToast('Failed to load service')
      setLoading(false)
    }
  }

  const handleAddField = () => {
    if (!newField.label || !newField.name) {
      showErrorToast('Please provide field label and name')
      return
    }

    if ((newField.type === 'select' || newField.type === 'radio' || newField.type === 'checkbox') && (!newField.options || newField.options.length === 0)) {
      showErrorToast('Please provide options for this field type')
      return
    }

    const field: FormField = {
      id: `custom_${Date.now()}`,
      name: newField.name!,
      label: newField.label!,
      type: newField.type || 'text',
      required: newField.required || false,
      options: newField.options,
      placeholder: newField.placeholder,
      description: newField.description,
      isCustom: true
    }

    setFields([...fields, field])
    setNewField({ type: 'text', required: false, isCustom: true })
    setShowAddField(false)
    showSuccessToast('Field added successfully')
  }

  const handleEditField = (field: FormField) => {
    setEditingField(field)
    setNewField({
      name: field.name,
      label: field.label,
      type: field.type,
      required: field.required,
      options: field.options,
      placeholder: field.placeholder,
      description: field.description,
      isCustom: field.isCustom
    })
    setShowAddField(true)
  }

  const handleUpdateField = () => {
    if (!editingField || !newField.label || !newField.name) {
      showErrorToast('Please provide field label and name')
      return
    }

    const updatedFields = fields.map(f => {
      if (f.id === editingField.id) {
        return {
          ...f,
          name: newField.name!,
          label: newField.label!,
          type: newField.type || 'text',
          required: newField.required || false,
          options: newField.options,
          placeholder: newField.placeholder,
          description: newField.description
        }
      }
      return f
    })

    setFields(updatedFields)
    setEditingField(null)
    setNewField({ type: 'text', required: false, isCustom: true })
    setShowAddField(false)
    showSuccessToast('Field updated successfully')
  }

  const handleDeleteField = (fieldId: string) => {
    const field = fields.find(f => f.id === fieldId)
    
    if (field && !field.isCustom) {
      showErrorToast('Cannot delete template fields. Only custom fields can be removed.')
      return
    }

    if (confirm('Are you sure you want to delete this field?')) {
      setFields(fields.filter(f => f.id !== fieldId))
      showSuccessToast('Field deleted successfully')
    }
  }

  const handleAIGenerateFields = async () => {
    if (!aiParagraph.trim()) {
      showErrorToast('Please enter a description of the fields you need')
      return
    }

    setAiGenerating(true)
    try {
      // Get template context if selected
      const selectedTemplate = selectedTemplateForAI 
        ? templates.find(t => t.id === selectedTemplateForAI)
        : null

      const response = await fetch('/api/ai/generate-fields', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: aiParagraph,
          existingFields: fields.map(f => f.name),
          serviceContext: {
            name: service?.name,
            description: service?.description,
            templateName: selectedTemplate?.name,
            templateFileName: selectedTemplate?.fileName
          }
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        // Show specific error message from API
        const errorMsg = data.error || 'Failed to generate fields'
        if (errorMsg.includes('API key not configured')) {
          showErrorToast('OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.')
        } else {
          showErrorToast(errorMsg)
        }
        return
      }
      
      if (data.fields && data.fields.length > 0) {
        const generatedFields: FormField[] = data.fields.map((field: any, index: number) => ({
          id: `ai_${Date.now()}_${index}`,
          name: field.name || `field_${Date.now()}_${index}`,
          label: field.label || field.name,
          type: field.type || 'text',
          required: field.required || false,
          options: field.options,
          placeholder: field.placeholder,
          description: field.description,
          isCustom: true
        }))

        setAiSuggestedFields(generatedFields)
        setSelectedAIFields(new Set(generatedFields.map(f => f.id)))
        showSuccessToast(`AI generated ${generatedFields.length} field suggestions`)
      } else {
        showErrorToast('AI could not identify any fields from the description')
      }
    } catch (error: any) {
      console.error('Error generating fields with AI:', error)
      showErrorToast(`Failed to generate fields with AI: ${error.message || 'Unknown error'}`)
    } finally {
      setAiGenerating(false)
    }
  }

  const handleAddAIFields = () => {
    const fieldsToAdd = aiSuggestedFields.filter(f => selectedAIFields.has(f.id))
    
    if (fieldsToAdd.length === 0) {
      showErrorToast('Please select at least one field to add')
      return
    }

    setFields([...fields, ...fieldsToAdd])
    showSuccessToast(`Added ${fieldsToAdd.length} AI-generated field(s)`)
    
    // Reset AI section
    setAiParagraph('')
    setAiSuggestedFields([])
    setSelectedAIFields(new Set())
    setShowAISection(false)
  }

  const toggleAIFieldSelection = (fieldId: string) => {
    const newSelection = new Set(selectedAIFields)
    if (newSelection.has(fieldId)) {
      newSelection.delete(fieldId)
    } else {
      newSelection.add(fieldId)
    }
    setSelectedAIFields(newSelection)
  }

  const handleSave = async () => {
    if (!service) return

    setSaving(true)
    try {
      await updateDoc(doc(db, 'services', service.id), {
        masterFormJson: fields
      })

      showSuccessToast('Service fields updated successfully')
      setTimeout(() => {
        router.push('/admin')
      }, 1000)
    } catch (error) {
      console.error('Error saving service:', error)
      showErrorToast('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Service not found</p>
          <button onClick={() => router.push('/admin')} className="mt-4 text-blue-600 hover:underline">
            Back to Admin
          </button>
        </div>
      </div>
    )
  }

  const templateFields = fields.filter(f => !f.isCustom)
  const customFields = fields.filter(f => f.isCustom)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40 backdrop-blur-lg bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl shadow-lg">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">{service.name}</h1>
                  <p className="text-xs text-gray-500">Edit Service Intake Fields</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="btn btn-sm btn-outline"
              >
                {showPreview ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                {showPreview ? 'Hide' : 'Show'} Preview
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn btn-sm btn-primary"
              >
                {saving ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-1" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Field Management */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-900">{service.description}</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {templates.map(template => (
                      <span key={template.id} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {template.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Template Fields */}
            {templateFields.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Template Fields ({templateFields.length})
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  These fields come from the document templates and cannot be deleted.
                </p>
                <div className="space-y-3">
                  {templateFields.map(field => (
                    <div key={field.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-gray-900">{field.label}</h4>
                            {field.required && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                                Required
                              </span>
                            )}
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                              {field.type === 'text' ? 'Text Input' :
                               field.type === 'textarea' ? 'Text Area' :
                               field.type === 'select' ? 'Dropdown' :
                               field.type === 'radio' ? 'Radio Buttons' :
                               field.type === 'checkbox' ? 'Checkboxes' :
                               field.type === 'number' ? 'Number' :
                               field.type === 'email' ? 'Email' :
                               field.type === 'tel' ? 'Phone' :
                               field.type === 'date' ? 'Date' : field.type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mb-1">Field name: {field.name}</p>
                          {field.placeholder && (
                            <p className="text-sm text-gray-500 mb-1">Placeholder: {field.placeholder}</p>
                          )}
                          {field.description && (
                            <p className="text-sm text-gray-600 mb-1">{field.description}</p>
                          )}
                          {field.options && field.options.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 mb-1">Options:</p>
                              <div className="flex flex-wrap gap-1">
                                {field.options.map((option, idx) => (
                                  <span key={idx} className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded">
                                    {option}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Field Generator */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl shadow-sm border-2 border-purple-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">AI Field Generator</h3>
                    <p className="text-sm text-gray-600">Describe the fields you need and let AI generate them</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAISection(!showAISection)}
                  className="btn btn-sm btn-outline"
                >
                  {showAISection ? 'Hide' : 'Show'} AI Generator
                </button>
              </div>

              {showAISection && (
                <div className="space-y-4">
                  {/* Template Selection */}
                  {templates.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Template (Optional)
                      </label>
                      <p className="text-xs text-gray-500 mb-2">
                        Choose a template to provide context for better field generation
                      </p>
                      <select
                        value={selectedTemplateForAI}
                        onChange={(e) => setSelectedTemplateForAI(e.target.value)}
                        className="form-input"
                      >
                        <option value="">-- No template (general fields) --</option>
                        {templates.map(template => (
                          <option key={template.id} value={template.id}>
                            {template.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Describe the fields you need
                    </label>
                    <textarea
                      value={aiParagraph}
                      onChange={(e) => setAiParagraph(e.target.value)}
                      className="form-textarea"
                      rows={4}
                      placeholder="Example: I need fields to collect employee information including their full name, email address, phone number, department (choose from Sales, Marketing, Engineering, HR), start date, and whether they need parking access."
                    />
                  </div>

                  <button
                    onClick={handleAIGenerateFields}
                    disabled={aiGenerating || !aiParagraph.trim()}
                    className="btn btn-primary"
                  >
                    {aiGenerating ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span className="ml-2">Generating Fields...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Fields with AI
                      </>
                    )}
                  </button>

                  {aiSuggestedFields.length > 0 && (
                    <div className="mt-6 space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium text-gray-900">
                          AI Suggested Fields ({aiSuggestedFields.length})
                        </h4>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedAIFields(new Set(aiSuggestedFields.map(f => f.id)))}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            Select All
                          </button>
                          <button
                            onClick={() => setSelectedAIFields(new Set())}
                            className="text-sm text-gray-600 hover:underline"
                          >
                            Deselect All
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {aiSuggestedFields.map(field => (
                          <div 
                            key={field.id} 
                            className={`bg-white rounded-lg p-4 border-2 transition-all cursor-pointer ${
                              selectedAIFields.has(field.id) 
                                ? 'border-purple-500 bg-purple-50' 
                                : 'border-gray-200 hover:border-purple-300'
                            }`}
                            onClick={() => toggleAIFieldSelection(field.id)}
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={selectedAIFields.has(field.id)}
                                onChange={() => toggleAIFieldSelection(field.id)}
                                className="mt-1 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h5 className="font-medium text-gray-900">{field.label}</h5>
                                  {field.required && (
                                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                                      Required
                                    </span>
                                  )}
                                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                                    {field.type === 'text' ? 'Text Input' :
                                     field.type === 'textarea' ? 'Text Area' :
                                     field.type === 'select' ? 'Dropdown' :
                                     field.type === 'radio' ? 'Radio Buttons' :
                                     field.type === 'checkbox' ? 'Checkboxes' :
                                     field.type === 'number' ? 'Number' :
                                     field.type === 'email' ? 'Email' :
                                     field.type === 'tel' ? 'Phone' :
                                     field.type === 'date' ? 'Date' : field.type}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-500 mb-1">Field name: {field.name}</p>
                                {field.placeholder && (
                                  <p className="text-sm text-gray-500 mb-1">Placeholder: {field.placeholder}</p>
                                )}
                                {field.description && (
                                  <p className="text-sm text-gray-600 mb-1">{field.description}</p>
                                )}
                                {field.options && field.options.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-xs text-gray-500 mb-1">Options:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {field.options.map((option, idx) => (
                                        <span key={idx} className="px-2 py-0.5 bg-purple-200 text-purple-800 text-xs rounded">
                                          {option}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={handleAddAIFields}
                        disabled={selectedAIFields.size === 0}
                        className="btn btn-primary w-full"
                      >
                        Add {selectedAIFields.size} Selected Field{selectedAIFields.size !== 1 ? 's' : ''}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Custom Fields */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Custom Fields ({customFields.length})
                </h3>
                <button
                  onClick={() => {
                    setEditingField(null)
                    setNewField({ type: 'text', required: false, isCustom: true })
                    setShowAddField(!showAddField)
                  }}
                  className="btn btn-sm btn-primary"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Field
                </button>
              </div>

              {showAddField && (
                <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-200">
                  <h4 className="font-medium text-gray-900 mb-3">
                    {editingField ? 'Edit Field' : 'Add New Field'}
                  </h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Field Label *
                        </label>
                        <input
                          type="text"
                          value={newField.label || ''}
                          onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                          className="form-input"
                          placeholder="e.g., Phone Number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Field Name *
                        </label>
                        <input
                          type="text"
                          value={newField.name || ''}
                          onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                          className="form-input"
                          placeholder="e.g., phone_number"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Field Type
                      </label>
                      <select
                        value={newField.type}
                        onChange={(e) => setNewField({ ...newField, type: e.target.value as any })}
                        className="form-input"
                      >
                        <option value="text">Text Input</option>
                        <option value="textarea">Text Area</option>
                        <option value="select">Dropdown (Select)</option>
                        <option value="radio">Radio Buttons</option>
                        <option value="checkbox">Checkboxes</option>
                        <option value="number">Number</option>
                        <option value="email">Email</option>
                        <option value="tel">Phone</option>
                        <option value="date">Date</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Placeholder Text
                      </label>
                      <input
                        type="text"
                        value={newField.placeholder || ''}
                        onChange={(e) => setNewField({ ...newField, placeholder: e.target.value })}
                        className="form-input"
                        placeholder="e.g., Enter your phone number"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={newField.description || ''}
                        onChange={(e) => setNewField({ ...newField, description: e.target.value })}
                        className="form-textarea"
                        rows={2}
                        placeholder="Help text for this field"
                      />
                    </div>

                    {(newField.type === 'select' || newField.type === 'radio' || newField.type === 'checkbox') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Options (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={newField.options?.join(', ') || ''}
                          onChange={(e) => setNewField({ 
                            ...newField, 
                            options: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                          })}
                          className="form-input"
                          placeholder="e.g., Option 1, Option 2, Option 3"
                        />
                      </div>
                    )}

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newField.required || false}
                        onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Required field</span>
                    </label>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={editingField ? handleUpdateField : handleAddField}
                        className="btn btn-sm btn-primary"
                      >
                        {editingField ? 'Update Field' : 'Add Field'}
                      </button>
                      <button
                        onClick={() => {
                          setShowAddField(false)
                          setEditingField(null)
                          setNewField({ type: 'text', required: false, isCustom: true })
                        }}
                        className="btn btn-sm btn-outline"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {customFields.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No custom fields added yet.</p>
                  <p className="text-sm mt-1">Click "Add Field" to create custom fields for this service.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {customFields.map(field => (
                    <div key={field.id} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-gray-900">{field.label}</h4>
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                              Custom
                            </span>
                            {field.required && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                                Required
                              </span>
                            )}
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                              {field.type === 'text' ? 'Text Input' :
                               field.type === 'textarea' ? 'Text Area' :
                               field.type === 'select' ? 'Dropdown' :
                               field.type === 'radio' ? 'Radio Buttons' :
                               field.type === 'checkbox' ? 'Checkboxes' :
                               field.type === 'number' ? 'Number' :
                               field.type === 'email' ? 'Email' :
                               field.type === 'tel' ? 'Phone' :
                               field.type === 'date' ? 'Date' : field.type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mb-1">Field name: {field.name}</p>
                          {field.placeholder && (
                            <p className="text-sm text-gray-500 mb-1">Placeholder: {field.placeholder}</p>
                          )}
                          {field.description && (
                            <p className="text-sm text-gray-600 mb-1">{field.description}</p>
                          )}
                          {field.options && field.options.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 mb-1">Options:</p>
                              <div className="flex flex-wrap gap-1">
                                {field.options.map((option, idx) => (
                                  <span key={idx} className="px-2 py-0.5 bg-blue-200 text-blue-800 text-xs rounded">
                                    {option}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleEditField(field)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                            title="Edit field"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteField(field.id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
                            title="Delete field"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Help Card */}
            <div className="bg-green-50 rounded-xl shadow-sm border border-green-200 p-6">
              <h3 className="text-sm font-semibold text-green-900 mb-2">About Service Fields</h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• <strong>Template Fields</strong>: Extracted from document templates - cannot be deleted</li>
                <li>• <strong>Custom Fields</strong>: Additional fields you create - can be edited or removed</li>
                <li>• All fields will appear in the intake form for this service</li>
              </ul>
            </div>
          </div>

          {/* Right Column - Preview */}
          {showPreview && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Intake Form Preview
                </h3>
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {fields.map(field => (
                    <div key={field.id}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {field.description && (
                        <p className="text-xs text-gray-500 mb-2">{field.description}</p>
                      )}
                      {field.type === 'textarea' ? (
                        <textarea
                          disabled
                          placeholder={field.placeholder}
                          className="form-textarea bg-gray-50"
                          rows={3}
                        />
                      ) : field.type === 'select' ? (
                        <select disabled className="form-input bg-gray-50">
                          <option>Select an option</option>
                          {field.options?.map((option, idx) => (
                            <option key={idx}>{option}</option>
                          ))}
                        </select>
                      ) : field.type === 'radio' ? (
                        <div className="space-y-2">
                          {field.options?.map((option, idx) => (
                            <label key={idx} className="flex items-center">
                              <input type="radio" disabled name={field.name} className="mr-2" />
                              <span className="text-sm text-gray-700">{option}</span>
                            </label>
                          ))}
                        </div>
                      ) : field.type === 'checkbox' ? (
                        <div className="space-y-2">
                          {field.options?.map((option, idx) => (
                            <label key={idx} className="flex items-center">
                              <input type="checkbox" disabled className="mr-2 rounded" />
                              <span className="text-sm text-gray-700">{option}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <input
                          type={field.type}
                          disabled
                          placeholder={field.placeholder}
                          className="form-input bg-gray-50"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
