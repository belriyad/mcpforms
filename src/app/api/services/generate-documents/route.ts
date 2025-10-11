import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, getAdminStorage, isAdminInitialized } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import { Service } from '@/types/service'
import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'

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
        
        // Download URL and storage info (will be set after actual document generation)
        downloadUrl: null as string | null,
        storagePath: null as string | null,
        
        // Size and format info
        fileSize: null as number | null,
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

    // Now generate actual DOCX files
    const adminStorage = getAdminStorage()
    const bucket = adminStorage.bucket()

    for (const doc of generatedDocuments) {
      try {
        console.log(`📝 Generating DOCX file for: ${doc.templateName}`)
        
        // Find the template
        const template = service.templates.find((t: any) => t.templateId === doc.templateId)
        if (!template || !template.storagePath) {
          console.warn(`⚠️ Template storage path not found for ${doc.templateName}`)
          continue
        }

        // Download template from Cloud Storage
        const templateFile = bucket.file(template.storagePath)
        const [templateExists] = await templateFile.exists()
        
        if (!templateExists) {
          console.warn(`⚠️ Template file not found in storage: ${template.storagePath}`)
          continue
        }

        const [templateBuffer] = await templateFile.download()

        // Load template with docxtemplater
        const zip = new PizZip(templateBuffer)
        const docx = new Docxtemplater(zip, {
          paragraphLoop: true,
          linebreaks: true,
        })

        // Prepare data for template
        const templateData: Record<string, any> = {}
        
        // Add all populated fields
        for (const [fieldName, fieldData] of Object.entries(doc.populatedFields)) {
          templateData[fieldName] = (fieldData as any).value
        }

        // Add AI sections if any
        if (template.aiSections && template.aiSections.length > 0) {
          for (const aiSection of template.aiSections) {
            if (aiSection.generatedContent) {
              templateData[aiSection.placeholder] = aiSection.generatedContent
            }
          }
        }

        // Add metadata
        templateData.serviceName = service.name
        templateData.clientName = service.clientName
        templateData.clientEmail = service.clientEmail
        templateData.generatedDate = new Date().toLocaleDateString()

        console.log('📋 Template data keys:', Object.keys(templateData))

        // Render the document
        docx.render(templateData)

        // Generate buffer
        const generatedBuffer = docx.getZip().generate({
          type: 'nodebuffer',
          compression: 'DEFLATE',
        })

        // Upload to Cloud Storage
        const storagePath = `services/${serviceId}/documents/${doc.id}/${doc.fileName}`
        const file = bucket.file(storagePath)
        
        await file.save(generatedBuffer, {
          metadata: {
            contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            metadata: {
              serviceId,
              documentId: doc.id,
              templateId: doc.templateId,
              generatedAt: new Date().toISOString(),
            },
          },
        })

        // Make file publicly readable (or use signed URL for private access)
        await file.makePublic()
        const downloadUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`

        // Update document metadata
        doc.downloadUrl = downloadUrl
        doc.storagePath = storagePath
        doc.fileSize = generatedBuffer.length

        console.log(`✅ Generated and uploaded: ${doc.fileName} (${doc.fileSize} bytes)`)
      } catch (error) {
        console.error(`❌ Error generating ${doc.templateName}:`, error)
        // Continue with other documents even if one fails
      }
    }

    // Update service with generated documents (now with downloadUrls)
    await adminDb.collection('services').doc(serviceId).update({
      generatedDocuments,
      status: 'documents_ready',
      documentsGeneratedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    console.log('✅ Service updated with generated documents and download URLs')

    const successCount = generatedDocuments.filter(doc => doc.downloadUrl).length

    return NextResponse.json({
      success: true,
      message: `Successfully generated ${successCount}/${generatedDocuments.length} documents`,
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
