'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
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

interface IntakeData {
  intakeId: string
  serviceName: string
  serviceDescription: string
  formFields: FormField[]
  clientData: Record<string, any>
  status: string
}

export default function IntakeFormPage() {
  const params = useParams()
  const token = params.token as string
  
  const [intakeData, setIntakeData] = useState<IntakeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm()

  useEffect(() => {
    fetchIntakeData()
  }, [token])

  const fetchIntakeData = async () => {
    try {
      const response = await fetch(`/api/intake/${token}`)
      const result = await response.json()

      if (!result.success) {
        setError(result.error || 'Failed to load intake form')
        return
      }

      setIntakeData(result.data)
      
      // Pre-fill form with existing data
      if (result.data.clientData) {
        Object.entries(result.data.clientData).forEach(([key, value]) => {
          setValue(key, value)
        })
      }
    } catch (err) {
      console.error('Error fetching intake data:', err)
      setError('Failed to load intake form')
    } finally {
      setLoading(false)
    }
  }

  const saveProgress = async (formData: Record<string, any>) => {
    try {
      await fetch(`/api/intake/${token}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ formData }),
      })
    } catch (err) {
      console.error('Error saving progress:', err)
    }
  }

  const onSubmit = async (formData: Record<string, any>) => {
    if (!intakeData) return

    setSubmitting(true)

    try {
      const response = await fetch(`/api/intake/${token}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intakeId: intakeData.intakeId,
          formData,
          clientInfo: {
            name: formData.clientName || '',
            email: formData.clientEmail || '',
          },
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Form submitted successfully!')
        // Refresh data to show updated status
        await fetchIntakeData()
      } else {
        toast.error(result.error || 'Failed to submit form')
      }
    } catch (err) {
      console.error('Error submitting form:', err)
      toast.error('Failed to submit form')
    } finally {
      setSubmitting(false)
    }
  }

  // Auto-save progress every 30 seconds
  useEffect(() => {
    if (!intakeData || intakeData.status === 'submitted') return

    const formData = watch()
    const interval = setInterval(() => {
      if (Object.keys(formData).length > 0) {
        saveProgress(formData)
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [intakeData, watch])

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

  const isSubmitted = intakeData.status === 'submitted'

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">{intakeData.serviceName}</h1>
          <p className="text-gray-600 mt-2">{intakeData.serviceDescription}</p>
          {isSubmitted && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">
                ✓ Form submitted successfully! We'll review your information and get back to you soon.
              </p>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-content">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {intakeData.formFields.map((field) => (
                <div key={field.id}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  
                  {field.description && (
                    <p className="text-sm text-gray-500 mb-2">{field.description}</p>
                  )}
                  
                  {renderField(field)}
                  
                  {errors[field.name] && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors[field.name]?.message as string}
                    </p>
                  )}
                </div>
              ))}

              <div className="pt-6 border-t">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">
                    Progress is automatically saved
                  </p>
                  
                  {!isSubmitted && (
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn btn-primary"
                    >
                      {submitting ? (
                        <>
                          <LoadingSpinner size="sm" />
                          <span className="ml-2">Submitting...</span>
                        </>
                      ) : (
                        'Submit Form'
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