import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, isAdminInitialized } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import { Service } from '@/types/service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { serviceId } = body

    if (!serviceId) {
      return NextResponse.json(
        { success: false, error: 'Service ID is required' },
        { status: 400 }
      )
    }

    // Check if Admin SDK is initialized
    if (!isAdminInitialized()) {
      console.error('❌ Firebase Admin SDK not initialized')
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      )
    }

    console.log('📄 Generating documents for service:', serviceId)

    // Load service from Firestore using Admin SDK
    const adminDb = getAdminDb()
    const serviceDoc = await adminDb.collection('services').doc(serviceId).get()

    if (!serviceDoc.exists) {
      console.log('❌ Service not found:', serviceId)
      return NextResponse.json(
        { success: false, error: 'Service not found' },
        { status: 404 }
      )
    }

    const serviceData = serviceDoc.data()
    const service = { id: serviceDoc.id, ...serviceData } as any

    // Verify intake form has been submitted
    if (!service.clientResponse || service.clientResponse.status !== 'submitted') {
      console.log('❌ Client has not submitted intake form yet')
      return NextResponse.json(
        { 
          success: false, 
          error: 'Client must submit intake form before generating documents' 
        },
        { status: 400 }
      )
    }

    // Check if documents already generated
    if (service.generatedDocuments && service.generatedDocuments.length > 0) {
      console.log('⚠️ Documents already generated, regenerating...')
    }

    const generatedDocuments = []
    const clientResponses = service.clientResponse.responses || {}

    // Generate a document for each template
    for (const template of service.templates || []) {
      console.log(`📄 Processing template: ${template.name}`)

      // Create document metadata
      const generatedDoc = {
        id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        templateId: template.templateId,
        templateName: template.name,
        fileName: `${template.name.replace(/\s+/g, '_')}_${service.clientName.replace(/\s+/g, '_')}_Final.docx`,
        status: 'generated',
        generatedAt: new Date().toISOString(),
        
        // Document details
        metadata: {
          serviceName: service.name,
          clientName: service.clientName,
          clientEmail: service.clientEmail,
          generatedDate: new Date().toLocaleDateString(),
          templateFileName: template.fileName,
        },

        // Data that was populated
        populatedFields: {} as Record<string, any>,
        
        // AI sections that were included
        aiSections: template.aiSections || [],
        
        // Download URL (will be set after actual document generation)
        downloadUrl: null,
        
        // Size and format info
        fileSize: null,
        format: 'docx',
      }

      // Map client responses to template fields
      for (const field of template.extractedFields || []) {
        const fieldValue = clientResponses[field.name]
        if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
          generatedDoc.populatedFields[field.name] = {
            fieldName: field.name,
            label: field.label || field.name,
            value: fieldValue,
            type: field.type,
          }
        }
      }

      generatedDocuments.push(generatedDoc)
    }

    console.log(`✅ Generated metadata for ${generatedDocuments.length} documents`)

    // Update service with generated documents using Admin SDK
    await adminDb.collection('services').doc(serviceId).update({
      generatedDocuments,
      status: 'documents_ready',
      documentsGeneratedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    console.log('✅ Service updated with generated documents')

    // TODO: Actual document generation
    // For now, we're creating metadata only
    // Next steps:
    // 1. Load DOCX template from Cloud Storage
    // 2. Use docxtemplater or similar to populate fields
    // 3. Include AI-generated sections
    // 4. Save to Cloud Storage
    // 5. Update downloadUrl in generatedDocuments

    return NextResponse.json({
      success: true,
      message: `Successfully generated ${generatedDocuments.length} documents`,
      documents: generatedDocuments,
      serviceId,
    })
  } catch (error) {
    console.error('❌ Error generating documents:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate documents',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
