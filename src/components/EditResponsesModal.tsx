'use client'

import { useState } from 'react'
import { X, Save, AlertCircle, CheckCircle2, Settings, Plus, Trash2 } from 'lucide-react'
import { Service } from '@/types/service'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface EditResponsesModalProps {
  service: Service
  isOpen: boolean
  onClose: () => void
  onSave?: () => void
}

interface FieldState {
  value: any
  type: string
  options?: string[]
  label: string
  description?: string
  required: boolean
  saving: boolean
  success: boolean
  edited: boolean
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'email', label: 'Email' },
  { value: 'tel', label: 'Phone' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Dropdown' },
  { value: 'radio', label: 'Radio Buttons' },
  { value: 'checkbox', label: 'Checkboxes' },
]

export default function EditResponsesModal({ service, isOpen, onClose, onSave }: EditResponsesModalProps) {
  const [fieldStates, setFieldStates] = useState<Record<string, FieldState>>(() => {
    const initial: Record<string, FieldState> = {}
    const fields = service.intakeForm?.fields || []
    const responses = service.clientResponse?.responses || {}
    
    fields.forEach((field) => {
      initial[field.name] = {
        value: responses[field.name] || '',
        type: field.type || 'text',
        options: field.options || [],
        label: field.label || field.name,
        description: field.description,
        required: field.required || false,
        saving: false,
        success: false,
        edited: false
      }
    })
    
    return initial
  })
  
  const [error, setError] = useState<string | null>(null)
  const [editingFieldType, setEditingFieldType] = useState<string | null>(null)
  const [newOption, setNewOption] = useState('')

  if (!isOpen) return null

  const fields = service.intakeForm?.fields || []

  const handleValueChange = (fieldName: string, value: any) => {
    setFieldStates(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        value,
        edited: true,
        success: false
      }
    }))
    setError(null)
  }

  const handleTypeChange = (fieldName: string, newType: string) => {
    setFieldStates(prev => {
      const currentState = prev[fieldName]
      let newValue = currentState.value
      
      // Reset value if incompatible type change
      if ((newType === 'checkbox') !== (currentState.type === 'checkbox')) {
        newValue = newType === 'checkbox' ? [] : ''
      }
      
      return {
        ...prev,
        [fieldName]: {
          ...currentState,
          type: newType,
          value: newValue,
          edited: true,
          success: false,
          // Initialize empty options for select/radio/checkbox if not present
          options: ['select', 'radio', 'checkbox'].includes(newType) && (!currentState.options || currentState.options.length === 0)
            ? ['Option 1', 'Option 2']
            : currentState.options
        }
      }
    })
    setEditingFieldType(null)
    setError(null)
  }

  const handleAddOption = (fieldName: string) => {
    if (!newOption.trim()) return
    
    setFieldStates(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        options: [...(prev[fieldName].options || []), newOption.trim()],
        edited: true
      }
    }))
    setNewOption('')
  }

  const handleRemoveOption = (fieldName: string, optionToRemove: string) => {
    setFieldStates(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        options: prev[fieldName].options?.filter(opt => opt !== optionToRemove) || [],
        edited: true
      }
    }))
  }

  const handleSaveIndividualField = async (fieldName: string) => {
    try {
      setFieldStates(prev => ({
        ...prev,
        [fieldName]: { ...prev[fieldName], saving: true, success: false }
      }))
      setError(null)

      const fieldState = fieldStates[fieldName]
      const fieldIndex = fields.findIndex(f => f.name === fieldName)
      
      if (fieldIndex === -1) {
        throw new Error('Field not found')
      }

      // Validate required field
      if (fieldState.required && !fieldState.value) {
        setError(`${fieldState.label} is required`)
        setFieldStates(prev => ({
          ...prev,
          [fieldName]: { ...prev[fieldName], saving: false }
        }))
        return
      }

      // Update both the response value and the field definition
      const updatedFields = [...fields]
      updatedFields[fieldIndex] = {
        ...updatedFields[fieldIndex],
        type: fieldState.type as 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'number' | 'email' | 'tel' | 'date',
        options: fieldState.options,
        label: fieldState.label,
        description: fieldState.description,
        required: fieldState.required
      }

      const serviceRef = doc(db, 'services', service.id)
      await updateDoc(serviceRef, {
        [`clientResponse.responses.${fieldName}`]: fieldState.value,
        'intakeForm.fields': updatedFields,
        'clientResponse.lastEditedAt': serverTimestamp(),
        'clientResponse.editedBy': 'admin',
        updatedAt: serverTimestamp()
      })

      setFieldStates(prev => ({
        ...prev,
        [fieldName]: { 
          ...prev[fieldName], 
          saving: false, 
          success: true,
          edited: false 
        }
      }))

      // Clear success message after 2 seconds
      setTimeout(() => {
        setFieldStates(prev => ({
          ...prev,
          [fieldName]: { ...prev[fieldName], success: false }
        }))
      }, 2000)

      if (onSave) onSave()
    } catch (err) {
      console.error('Error saving field:', err)
      setError(`Failed to save ${fieldStates[fieldName].label}. Please try again.`)
      setFieldStates(prev => ({
        ...prev,
        [fieldName]: { ...prev[fieldName], saving: false }
      }))
    }
  }

  const renderFieldInput = (fieldName: string, fieldState: FieldState) => {
    const { value, type, options } = fieldState

    switch (type) {
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleValueChange(fieldName, e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        )

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleValueChange(fieldName, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select an option</option>
            {options?.map((option: string) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )

      case 'radio':
        return (
          <div className="space-y-2">
            {options?.map((option: string) => (
              <label key={option} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={fieldName}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleValueChange(fieldName, e.target.value)}
                  className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        )

      case 'checkbox':
        const checkboxValues = Array.isArray(value) ? value : []
        return (
          <div className="space-y-2">
            {options?.map((option: string) => (
              <label key={option} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  value={option}
                  checked={checkboxValues.includes(option)}
                  onChange={(e) => {
                    const newValues = e.target.checked
                      ? [...checkboxValues, option]
                      : checkboxValues.filter((v: string) => v !== option)
                    handleValueChange(fieldName, newValues)
                  }}
                  className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500 rounded"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        )

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleValueChange(fieldName, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        )

      case 'email':
        return (
          <input
            type="email"
            value={value}
            onChange={(e) => handleValueChange(fieldName, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        )

      case 'tel':
        return (
          <input
            type="tel"
            value={value}
            onChange={(e) => handleValueChange(fieldName, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        )

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleValueChange(fieldName, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        )

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleValueChange(fieldName, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        )
    }
  }

  const renderOptionsEditor = (fieldName: string, fieldState: FieldState) => {
    if (!['select', 'radio', 'checkbox'].includes(fieldState.type)) {
      return null
    }

    return (
      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Options:</h4>
        <div className="space-y-2 mb-3">
          {fieldState.options?.map((option, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="flex-1 text-sm text-gray-700 bg-white px-3 py-1.5 rounded border">
                {option}
              </span>
              <button
                onClick={() => handleRemoveOption(fieldName, option)}
                className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
                title="Remove option"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newOption}
            onChange={(e) => setNewOption(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddOption(fieldName)}
            placeholder="Add new option"
            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => handleAddOption(fieldName)}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm inline-flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Edit Client Responses & Field Types</h2>
            <p className="text-indigo-100 text-sm">{service.clientName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 m-6 mb-0">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {fields.map((field, index) => {
              const fieldState = fieldStates[field.name]
              if (!fieldState) return null

              return (
                <div
                  key={index}
                  className={`bg-gray-50 rounded-lg p-4 border-2 transition-all ${
                    fieldState.edited
                      ? 'border-orange-300 bg-orange-50'
                      : fieldState.success
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-200'
                  }`}
                >
                  {/* Field Header with Type Selector */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <label className="block font-medium text-gray-900 mb-1">
                        {fieldState.label}
                        {fieldState.required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </label>
                      {fieldState.description && (
                        <p className="text-sm text-gray-600">
                          {fieldState.description}
                        </p>
                      )}
                    </div>
                    
                    {/* Type Selector */}
                    <div className="flex items-center gap-2 ml-4">
                      {editingFieldType === field.name ? (
                        <select
                          value={fieldState.type}
                          onChange={(e) => handleTypeChange(field.name, e.target.value)}
                          className="px-3 py-1.5 text-sm border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                          autoFocus
                          onBlur={() => setEditingFieldType(null)}
                        >
                          {FIELD_TYPES.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <button
                          onClick={() => setEditingFieldType(field.name)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
                          title="Change field type"
                        >
                          <Settings className="w-4 h-4" />
                          {FIELD_TYPES.find(t => t.value === fieldState.type)?.label || 'Text'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Field Input */}
                  <div className="mb-3">
                    {renderFieldInput(field.name, fieldState)}
                  </div>

                  {/* Options Editor for select/radio/checkbox */}
                  {renderOptionsEditor(field.name, fieldState)}

                  {/* Save Button */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      {fieldState.edited && (
                        <span className="text-sm text-orange-600 font-medium">
                          • Unsaved changes
                        </span>
                      )}
                      {fieldState.success && (
                        <span className="inline-flex items-center gap-1 text-sm text-green-600 font-medium">
                          <CheckCircle2 className="w-4 h-4" />
                          Saved successfully!
                        </span>
                      )}
                    </div>
                    
                    <button
                      onClick={() => handleSaveIndividualField(field.name)}
                      disabled={fieldState.saving || (!fieldState.edited && !fieldState.success)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {fieldState.saving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Field
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Close
          </button>
          <div className="text-sm text-gray-600">
            {Object.values(fieldStates).filter(f => f.edited).length > 0 && (
              <span className="text-orange-600 font-medium">
                {Object.values(fieldStates).filter(f => f.edited).length} field(s) with unsaved changes
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
