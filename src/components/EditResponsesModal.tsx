'use client'

import { useState } from 'react'
import { X, Save, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Service } from '@/types/service'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface EditResponsesModalProps {
  service: Service
  isOpen: boolean
  onClose: () => void
  onSave?: () => void
}

export default function EditResponsesModal({ service, isOpen, onClose, onSave }: EditResponsesModalProps) {
  const [responses, setResponses] = useState(service.clientResponse?.responses || {})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (!isOpen) return null

  const fields = service.intakeForm?.fields || []

  const handleChange = (fieldName: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [fieldName]: value
    }))
    setError(null)
    setSuccess(false)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)

      // Validate required fields
      const missingFields = fields
        .filter(field => field.required && !responses[field.name])
        .map(field => field.label)

      if (missingFields.length > 0) {
        setError(`Please fill in required fields: ${missingFields.join(', ')}`)
        setSaving(false)
        return
      }

      // Update service in Firestore
      const serviceRef = doc(db, 'services', service.id)
      await updateDoc(serviceRef, {
        'clientResponse.responses': responses,
        'clientResponse.lastEditedAt': serverTimestamp(),
        'clientResponse.editedBy': 'admin', // TODO: Get current user
        updatedAt: serverTimestamp()
      })

      setSuccess(true)
      setSaving(false)

      // Wait a moment to show success, then close
      setTimeout(() => {
        if (onSave) onSave()
        onClose()
      }, 1000)
    } catch (err) {
      console.error('Error saving responses:', err)
      setError('Failed to save responses. Please try again.')
      setSaving(false)
    }
  }

  const renderField = (field: any) => {
    const value = responses[field.name] || ''

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        )

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select an option</option>
            {field.options?.map((option: string) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )

      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option: string) => (
              <label key={option} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={field.name}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleChange(field.name, e.target.value)}
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
            {field.options?.map((option: string) => (
              <label key={option} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  value={option}
                  checked={checkboxValues.includes(option)}
                  onChange={(e) => {
                    const newValues = e.target.checked
                      ? [...checkboxValues, option]
                      : checkboxValues.filter((v: string) => v !== option)
                    handleChange(field.name, newValues)
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
            onChange={(e) => handleChange(field.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        )

      case 'email':
        return (
          <input
            type="email"
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        )

      case 'tel':
        return (
          <input
            type="tel"
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        )

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        )

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        )
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Edit Client Responses</h2>
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

        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 m-6 mb-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <p className="text-green-700">Responses saved successfully!</p>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {fields.map((field, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <label className="block font-medium text-gray-900 mb-2">
                  {field.label}
                  {field.required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>
                {field.description && (
                  <p className="text-sm text-gray-600 mb-3">
                    {field.description}
                  </p>
                )}
                {renderField(field)}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || success}
            className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : success ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
