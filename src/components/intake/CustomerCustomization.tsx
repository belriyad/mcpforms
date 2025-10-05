'use client'

import { useState } from 'react'

interface CustomizationRules {
  allow_custom_fields: boolean
  allow_custom_clauses: boolean
  require_approval: boolean
  allowed_field_types: string[]
  max_custom_fields: number
  max_custom_clauses: number
}

interface CustomField {
  id: string
  name: string
  type: string
  label: string
  description?: string
  required: boolean
  placeholder?: string
}

interface CustomClause {
  id: string
  title: string
  content: string
}

interface CustomerCustomizationProps {
  rules: CustomizationRules
  onCustomFieldsChange: (fields: CustomField[]) => void
  onCustomClausesChange: (clauses: CustomClause[]) => void
  existingCustomFields?: CustomField[]
  existingCustomClauses?: CustomClause[]
}

export default function CustomerCustomization({
  rules,
  onCustomFieldsChange,
  onCustomClausesChange,
  existingCustomFields = [],
  existingCustomClauses = [],
}: CustomerCustomizationProps) {
  const [customFields, setCustomFields] = useState<CustomField[]>(existingCustomFields)
  const [customClauses, setCustomClauses] = useState<CustomClause[]>(existingCustomClauses)
  const [showAddField, setShowAddField] = useState(false)
  const [showAddClause, setShowAddClause] = useState(false)

  // New field form state
  const [newFieldLabel, setNewFieldLabel] = useState('')
  const [newFieldType, setNewFieldType] = useState('text')
  const [newFieldDescription, setNewFieldDescription] = useState('')
  const [newFieldRequired, setNewFieldRequired] = useState(false)

  // New clause form state
  const [newClauseTitle, setNewClauseTitle] = useState('')
  const [newClauseContent, setNewClauseContent] = useState('')

  const handleAddField = () => {
    if (!newFieldLabel.trim()) return

    const newField: CustomField = {
      id: `custom-${Date.now()}`,
      name: newFieldLabel.toLowerCase().replace(/\s+/g, '_'),
      type: newFieldType,
      label: newFieldLabel,
      description: newFieldDescription || undefined,
      required: newFieldRequired,
      placeholder: `Enter ${newFieldLabel.toLowerCase()}`,
    }

    const updatedFields = [...customFields, newField]
    setCustomFields(updatedFields)
    onCustomFieldsChange(updatedFields)

    // Reset form
    setNewFieldLabel('')
    setNewFieldType('text')
    setNewFieldDescription('')
    setNewFieldRequired(false)
    setShowAddField(false)
  }

  const handleRemoveField = (id: string) => {
    const updatedFields = customFields.filter(f => f.id !== id)
    setCustomFields(updatedFields)
    onCustomFieldsChange(updatedFields)
  }

  const handleAddClause = () => {
    if (!newClauseTitle.trim() || !newClauseContent.trim()) return

    const newClause: CustomClause = {
      id: `clause-${Date.now()}`,
      title: newClauseTitle,
      content: newClauseContent,
    }

    const updatedClauses = [...customClauses, newClause]
    setCustomClauses(updatedClauses)
    onCustomClausesChange(updatedClauses)

    // Reset form
    setNewClauseTitle('')
    setNewClauseContent('')
    setShowAddClause(false)
  }

  const handleRemoveClause = (id: string) => {
    const updatedClauses = customClauses.filter(c => c.id !== id)
    setCustomClauses(updatedClauses)
    onCustomClausesChange(updatedClauses)
  }

  const canAddMoreFields = customFields.length < rules.max_custom_fields
  const canAddMoreClauses = customClauses.length < rules.max_custom_clauses

  return (
    <div className="space-y-6 border-t pt-6 mt-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          ✨ Customization Options Available
        </h3>
        <p className="text-sm text-blue-800">
          You can add custom fields or clauses to this form to better suit your needs.
          {rules.require_approval && ' All customizations will be reviewed by our team before processing.'}
        </p>
      </div>

      {/* Custom Fields Section */}
      {rules.allow_custom_fields && (
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="font-semibold text-gray-900">Custom Fields</h4>
              <p className="text-sm text-gray-600">
                Add additional fields ({customFields.length}/{rules.max_custom_fields} used)
              </p>
            </div>
            {canAddMoreFields && !showAddField && (
              <button
                type="button"
                onClick={() => setShowAddField(true)}
                className="btn btn-secondary text-sm"
              >
                + Add Field
              </button>
            )}
          </div>

          {/* Existing Custom Fields */}
          {customFields.length > 0 && (
            <div className="space-y-3 mb-4">
              {customFields.map((field) => (
                <div key={field.id} className="bg-gray-50 rounded-lg p-3 flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{field.label}</div>
                    <div className="text-sm text-gray-600">
                      Type: {field.type} • {field.required ? 'Required' : 'Optional'}
                    </div>
                    {field.description && (
                      <div className="text-sm text-gray-500 mt-1">{field.description}</div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveField(field.id)}
                    className="text-red-600 hover:text-red-800 ml-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add Field Form */}
          {showAddField && (
            <div className="bg-white border rounded-lg p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field Label <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  placeholder="e.g., Project Budget"
                  className="form-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field Type
                </label>
                <select
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value)}
                  className="form-select"
                >
                  {rules.allowed_field_types.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={newFieldDescription}
                  onChange={(e) => setNewFieldDescription(e.target.value)}
                  placeholder="Provide context for this field"
                  rows={2}
                  className="form-textarea"
                />
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newFieldRequired}
                    onChange={(e) => setNewFieldRequired(e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Make this field required</span>
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAddField}
                  className="btn btn-primary"
                >
                  Add Field
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddField(false)
                    setNewFieldLabel('')
                    setNewFieldType('text')
                    setNewFieldDescription('')
                    setNewFieldRequired(false)
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {!canAddMoreFields && (
            <p className="text-sm text-gray-500 italic">
              Maximum number of custom fields reached
            </p>
          )}
        </div>
      )}

      {/* Custom Clauses Section */}
      {rules.allow_custom_clauses && (
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="font-semibold text-gray-900">Custom Clauses</h4>
              <p className="text-sm text-gray-600">
                Add special terms or conditions ({customClauses.length}/{rules.max_custom_clauses} used)
              </p>
            </div>
            {canAddMoreClauses && !showAddClause && (
              <button
                type="button"
                onClick={() => setShowAddClause(true)}
                className="btn btn-secondary text-sm"
              >
                + Add Clause
              </button>
            )}
          </div>

          {/* Existing Custom Clauses */}
          {customClauses.length > 0 && (
            <div className="space-y-3 mb-4">
              {customClauses.map((clause) => (
                <div key={clause.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium text-gray-900">{clause.title}</div>
                    <button
                      type="button"
                      onClick={() => handleRemoveClause(clause.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">{clause.content}</div>
                </div>
              ))}
            </div>
          )}

          {/* Add Clause Form */}
          {showAddClause && (
            <div className="bg-white border rounded-lg p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Clause Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newClauseTitle}
                  onChange={(e) => setNewClauseTitle(e.target.value)}
                  placeholder="e.g., Payment Terms"
                  className="form-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Clause Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={newClauseContent}
                  onChange={(e) => setNewClauseContent(e.target.value)}
                  placeholder="Enter the full text of the clause"
                  rows={4}
                  className="form-textarea"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAddClause}
                  className="btn btn-primary"
                >
                  Add Clause
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddClause(false)
                    setNewClauseTitle('')
                    setNewClauseContent('')
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {!canAddMoreClauses && (
            <p className="text-sm text-gray-500 italic">
              Maximum number of custom clauses reached
            </p>
          )}
        </div>
      )}

      {rules.require_approval && (customFields.length > 0 || customClauses.length > 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            ⚠️ Your customizations will be reviewed and approved by our team before processing.
          </p>
        </div>
      )}
    </div>
  )
}
