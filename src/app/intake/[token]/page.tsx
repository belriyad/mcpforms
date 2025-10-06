'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { LoadingSpinner, ProgressIndicator } from '@/components/ui/loading-components'
import { showSuccessToast, showErrorToast } from '@/lib/toast-helpers'
import CustomerCustomization from '@/components/intake/CustomerCustomization'
import { Shield, Lock, Save, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface FormField {
  id: string
  name: string
  type: 'text' | 'email' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox' | 'radio'
  label: string
  description?: string
  required: boolean
  options?: string[]
  placeholder?: string
}

interface CustomizationRules {
  allow_custom_fields: boolean
  allow_custom_clauses: boolean
  require_approval: boolean
  allowed_field_types: string[]
  max_custom_fields: number
  max_custom_clauses: number
}

interface IntakeData {
  intakeId: string
  serviceName: string
  serviceDescription: string
  formFields: FormField[]
  clientData: Record<string, any>
  status: string
  customizationEnabled: boolean
  customizationRules: CustomizationRules | null
  existingCustomFields: any[]
  existingCustomClauses: any[]
}

export default function IntakeFormPage() {
  const params = useParams()
  const token = params.token as string
  
  const [intakeData, setIntakeData] = useState<IntakeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [customFields, setCustomFields] = useState<any[]>([])
  const [customClauses, setCustomClauses] = useState<any[]>([])
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm()

  // Calculate form completion progress
  const formData = watch()
  const completionPercentage = useMemo(() => {
    if (!intakeData?.formFields) return 0
    const requiredFields = intakeData.formFields.filter(f => f.required)
    if (requiredFields.length === 0) return 100
    
    const filledFields = requiredFields.filter(field => {
      const value = formData[field.name]
      return value && value !== ''
    })
    
    return Math.round((filledFields.length / requiredFields.length) * 100)
  }, [formData, intakeData])

  useEffect(() => {
    fetchIntakeData()
  }, [token])

  const fetchIntakeData = async () => {
    try {
      // Use our new API endpoint
      const response = await fetch(`/api/intake/load/${token}`)
      
      // Check if response is ok and content-type is JSON
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Response is not JSON format')
      }
      
      const result = await response.json()

      if (!result.success) {
        setError(result.error || 'Failed to load intake form')
        return
      }

      // Validate data structure
      const data = result.data
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid intake data structure')
      }
      
      // Ensure all required properties exist with sensible defaults
      const validatedData: IntakeData = {
        intakeId: data.intakeId || '',
        serviceName: data.serviceName || 'Service Information',
        serviceDescription: data.serviceDescription || 'Please complete the form below.',
        formFields: Array.isArray(data.formFields) ? data.formFields : [],
        clientData: data.clientData && typeof data.clientData === 'object' ? data.clientData : {},
        status: data.status || 'active',
        customizationEnabled: data.customizationEnabled || false,
        customizationRules: data.customizationRules || null,
        existingCustomFields: Array.isArray(data.existingCustomFields) ? data.existingCustomFields : [],
        existingCustomClauses: Array.isArray(data.existingCustomClauses) ? data.existingCustomClauses : [],
      }

      if (validatedData.formFields.length === 0) {
        console.warn('No form fields found in intake data')
      }

      setIntakeData(validatedData)
      
      // Initialize custom fields and clauses from existing data
      setCustomFields(validatedData.existingCustomFields)
      setCustomClauses(validatedData.existingCustomClauses)
      
      // Set submitted flag if form is already submitted
      if (validatedData.status === 'submitted') {
        setIsSubmitted(true)
        console.log('📝 Form already submitted, auto-save disabled')
      }
      
      // Pre-fill form with existing data
      if (validatedData.clientData && Object.keys(validatedData.clientData).length > 0) {
        Object.entries(validatedData.clientData).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            setValue(key, value)
          }
        })
      }
    } catch (err) {
      console.error('Error fetching intake data:', err)
      setError(`Failed to load intake form: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const saveProgress = async (formData: Record<string, any>) => {
    // Don't save if form is already submitted (check both flags)
    if (isSubmitted || intakeData?.status === 'submitted') {
      console.log('🚫 Not saving progress - form already submitted', { 
        isSubmitted, 
        status: intakeData?.status 
      })
      return
    }
    
    try {
      console.log('💾 Auto-saving progress...', { 
        status: intakeData?.status,
        isSubmitted 
      })
      // Use our new API endpoint
      await fetch(`/api/intake/save/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          formData,
          customFields,
          customClauses,
        }),
      })
      console.log('✅ Progress saved successfully')
      setLastSaved(new Date())
    } catch (err) {
      console.error('Error saving progress:', err)
    }
  }

  const onSubmit = async (formData: Record<string, any>) => {
    if (!intakeData) return

    setSubmitting(true)

    try {
      console.log('🚀 Submitting form data:', { intakeId: intakeData.intakeId, formData })
      
      // Use our new API endpoint
      const response = await fetch(`/api/intake/submit/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formData,
          clientInfo: {
            name: formData.clientName || '',
            email: formData.clientEmail || '',
          },
          customFields,
          customClauses,
        }),
      })

      console.log('📡 Response status:', response.status, response.statusText)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Submit error response:', errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const result = await response.json()
      console.log('✅ Submit result:', result)

      if (result.success) {
        showSuccessToast('Form submitted successfully!')
        // Set submitted flag immediately to stop all auto-save
        setIsSubmitted(true)
        // Update local status immediately
        if (intakeData) {
          setIntakeData({ ...intakeData, status: 'submitted' })
        }
        // Refresh data to show updated status
        await fetchIntakeData()
      } else {
        showErrorToast(result.error || 'Failed to submit form')
      }
    } catch (err) {
      console.error('Error submitting form:', err)
      showErrorToast('Failed to submit form')
    } finally {
      setSubmitting(false)
    }
  }

  // Auto-save progress every 30 seconds
  useEffect(() => {
    if (!intakeData || intakeData.status === 'submitted' || isSubmitted) {
      console.log('🚫 Auto-save disabled', { 
        hasIntakeData: !!intakeData, 
        status: intakeData?.status,
        isSubmitted 
      })
      return
    }

    const formData = watch()
    console.log('⚡ Auto-save enabled, setting up interval')
    const interval = setInterval(() => {
      console.log('🕐 Auto-save interval triggered', { 
        hasFormData: Object.keys(formData).length > 0,
        isSubmitted,
        status: intakeData?.status 
      })
      if (Object.keys(formData).length > 0 && !isSubmitted) {
        saveProgress(formData)
      }
    }, 30000)

    return () => {
      console.log('🧹 Auto-save interval cleared')
      clearInterval(interval)
    }
  }, [intakeData, watch, isSubmitted])

  const renderField = (field: FormField) => {
    const fieldProps = {
      ...register(field.name, {
        required: field.required ? `${field.label} is required` : false,
      }),
      className: field.type === 'textarea' ? 'form-textarea' : 'form-input',
      placeholder: field.placeholder || '',
    }

    switch (field.type) {
      case 'textarea':
        return <textarea {...fieldProps} rows={4} />

      case 'select':
        return (
          <select {...fieldProps} className="form-select">
            <option value="">Select an option</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )

      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <label key={option} className="flex items-center">
                <input
                  {...register(field.name, {
                    required: field.required ? `${field.label} is required` : false,
                  })}
                  type="radio"
                  value={option}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        )

      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <label key={option} className="flex items-center">
                <input
                  {...register(`${field.name}.${option}`)}
                  type="checkbox"
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        )

      default:
        return <input {...fieldProps} type={field.type} />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full">
          <div className="card">
            <div className="card-content text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Form</h3>
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!intakeData) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{intakeData.serviceName}</h1>
          <p className="text-gray-600 mb-6">{intakeData.serviceDescription}</p>
          
          {/* Progress Indicator */}
          {!isSubmitted && (
            <div className="mb-4">
              <ProgressIndicator 
                progress={completionPercentage} 
                total={100}
                label={`Form Progress`}
                showPercentage={true}
              />
            </div>
          )}
          
          {/* Auto-save Indicator */}
          {!isSubmitted && lastSaved && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-4">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Auto-saved {lastSaved.toLocaleTimeString()}</span>
            </div>
          )}
          
          {isSubmitted && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg animate-fade-in">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-green-800 font-medium">
                  Form submitted successfully! We'll review your information and get back to you soon.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-content">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {intakeData.formFields && intakeData.formFields.length > 0 ? (
                intakeData.formFields.map((field) => {
                  const fieldValue = formData[field.name]
                  const isFieldFilled = fieldValue && fieldValue !== ''
                  const hasError = errors[field.name]
                  
                  return (
                  <div key={field.id} className="relative">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                      {field.required && <span className="text-red-500">*</span>}
                      {field.required && isFieldFilled && !hasError && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </label>
                    
                    {field.description && (
                      <p className="text-sm text-gray-500 mb-2">{field.description}</p>
                    )}
                    
                    {renderField(field)}
                    
                    {errors[field.name] && (
                      <div className="flex items-center gap-1 mt-2 animate-slide-in">
                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <p className="text-sm text-red-600">
                          {errors[field.name]?.message as string}
                        </p>
                      </div>
                    )}
                  </div>
                )})
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-500">
                    <p className="text-lg font-medium">No form fields available</p>
                    <p className="text-sm mt-2">
                      This intake form doesn't have any fields configured yet.
                    </p>
                  </div>
                </div>
              )}

              {/* Customer Customization Section */}
              {intakeData.customizationEnabled && intakeData.customizationRules && !isSubmitted && (
                <CustomerCustomization
                  rules={intakeData.customizationRules}
                  onCustomFieldsChange={setCustomFields}
                  onCustomClausesChange={setCustomClauses}
                  existingCustomFields={customFields}
                  existingCustomClauses={customClauses}
                />
              )}

              <div className="pt-6 border-t space-y-4">
                {/* Trust Badges */}
                <div className="flex flex-wrap items-center justify-center gap-6 py-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Shield className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="font-medium">Secure & Encrypted</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <Lock className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="font-medium">GDPR Compliant</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Save className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="font-medium">Auto-Saved</span>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-center">
                  {!isSubmitted && (
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn btn-primary px-8 py-3 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover-scale disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <LoadingSpinner size="sm" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          <span>Submit Form</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Powered by Smart Forms AI
          </p>
        </div>
      </div>
    </div>
  )
}