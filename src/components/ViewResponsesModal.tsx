'use client'

import { useState } from 'react'
import { X, FileText, Calendar, Mail, User } from 'lucide-react'
import { Service } from '@/types/service'

interface ViewResponsesModalProps {
  service: Service
  isOpen: boolean
  onClose: () => void
}

export default function ViewResponsesModal({ service, isOpen, onClose }: ViewResponsesModalProps) {
  if (!isOpen) return null

  const responses = service.clientResponse?.responses || {}
  const fields = service.intakeForm?.fields || []

  // Group responses by field type
  const groupedResponses: Record<string, any[]> = {}
  
  fields.forEach(field => {
    const value = responses[field.name]
    if (value !== undefined && value !== null && value !== '') {
      const category = field.type === 'textarea' ? 'Long Answers' : 
                       field.type === 'checkbox' ? 'Selections' :
                       field.type === 'date' ? 'Dates' : 'Short Answers'
      
      if (!groupedResponses[category]) {
        groupedResponses[category] = []
      }
      
      groupedResponses[category].push({
        field,
        value
      })
    }
  })

  const formatValue = (value: any, type: string) => {
    if (Array.isArray(value)) {
      return value.join(', ')
    }
    if (type === 'date' && value) {
      return new Date(value).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No'
    }
    return String(value)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-bold">Client Responses</h2>
              <p className="text-blue-100 text-sm">{service.clientName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metadata */}
        <div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <User className="w-4 h-4 text-blue-600" />
              <span className="font-medium">Client:</span>
              <span>{service.clientName}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Mail className="w-4 h-4 text-blue-600" />
              <span className="font-medium">Email:</span>
              <span>{service.clientEmail}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="font-medium">Submitted:</span>
              <span>
                {service.clientResponse?.submittedAt 
                  ? new Date(service.clientResponse.submittedAt.seconds * 1000).toLocaleDateString()
                  : 'Recently'}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {Object.keys(groupedResponses).length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No responses found</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedResponses).map(([category, items]) => (
                <div key={category}>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                    {category}
                  </h3>
                  <div className="space-y-4">
                    {items.map(({ field, value }, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <label className="font-medium text-gray-900 flex items-center gap-2">
                            {field.label}
                            {field.required && (
                              <span className="text-red-500 text-xs">*</span>
                            )}
                          </label>
                          <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
                            {field.type}
                          </span>
                        </div>
                        {field.description && (
                          <p className="text-sm text-gray-500 mb-2">
                            {field.description}
                          </p>
                        )}
                        <div className="bg-white rounded border border-gray-200 p-3">
                          {field.type === 'textarea' ? (
                            <p className="text-gray-900 whitespace-pre-wrap">
                              {formatValue(value, field.type)}
                            </p>
                          ) : (
                            <p className="text-gray-900">
                              {formatValue(value, field.type)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{Object.values(groupedResponses).flat().length}</span> responses total
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
