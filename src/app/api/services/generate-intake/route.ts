import { NextRequest, NextResponse } from 'next/server'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { FormField } from '@/types/service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { serviceId } = body

    if (!serviceId) {
      return NextResponse.json(
        { error: 'Missing required field: serviceId' },
        { status: 400 }
      )
    }

    // Get service data
    const serviceDoc = await getDoc(doc(db, 'services', serviceId))
    if (!serviceDoc.exists()) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    const serviceData = serviceDoc.data()
    const templates = serviceData.templates || []

    if (templates.length === 0) {
      return NextResponse.json({ error: 'No templates found in service' }, { status: 400 })
    }

    // Collect all fields from all templates
    const allFields: FormField[] = []
    templates.forEach((template: any) => {
      const templateFields = template.extractedFields || []
      templateFields.forEach((field: any) => {
        allFields.push({
          ...field,
          sourceTemplateIds: [template.templateId]
        })
      })
    })

    // Deduplicate fields by name and type
    const fieldMap = new Map<string, FormField>()
    allFields.forEach((field) => {
      const key = `${field.name}_${field.type}`.toLowerCase()
      
      if (fieldMap.has(key)) {
        // Field already exists, merge source template IDs
        const existingField = fieldMap.get(key)!
        const combined = [...existingField.sourceTemplateIds, ...field.sourceTemplateIds]
        existingField.sourceTemplateIds = Array.from(new Set(combined))
        existingField.isCommon = existingField.sourceTemplateIds.length > 1
      } else {
        // New field
        fieldMap.set(key, {
          ...field,
          isCommon: false
        })
      }
    })

    // Convert map to array
    const uniqueFields = Array.from(fieldMap.values())

    // Mark common fields
    uniqueFields.forEach(field => {
      field.isCommon = field.sourceTemplateIds.length > 1
    })

    // Generate unique token for intake form
    const token = `intake_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const link = `${process.env.APP_BASE_URL || 'http://localhost:3000'}/intake/${token}`

    // Create intake form object
    const intakeForm = {
      id: `form_${Date.now()}`,
      serviceId,
      fields: uniqueFields,
      totalFields: allFields.length,
      uniqueFields: uniqueFields.length,
      duplicatesRemoved: allFields.length - uniqueFields.length,
      generatedAt: new Date().toISOString(),
      token,
      link
    }

    // Update service with intake form
    await updateDoc(doc(db, 'services', serviceId), {
      intakeForm,
      status: 'draft', // Still draft, not sent yet
      updatedAt: serverTimestamp()
    })

    return NextResponse.json({
      success: true,
      intakeForm,
      message: 'Intake form generated successfully'
    })
  } catch (error) {
    console.error('Error generating intake form:', error)
    return NextResponse.json(
      { error: 'Failed to generate intake form', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
