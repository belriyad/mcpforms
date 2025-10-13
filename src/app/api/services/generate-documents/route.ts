import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, getAdminStorage, isAdminInitialized } from '@/lib/firebase-admin'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { Service } from '@/types/service'
import { generateDocument, prepareTemplateData } from '@/lib/document-generator'
import { sendDocumentsReadyEmail } from '@/lib/email-service'
import { getBranding } from '@/lib/branding'

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
        if (!template) {
          console.warn(`⚠️ Template not found for ${doc.templateName}`)
          doc.status = 'error'
          doc.downloadUrl = null
          continue
        }

        console.log(`📂 Template found:`, {
          name: template.name,
          hasStoragePath: !!template.storagePath,
          storagePath: template.storagePath,
          hasFileName: !!template.fileName
        })

        if (!template.storagePath) {
          console.warn(`⚠️ Template storage path not found for ${doc.templateName}`)
          doc.status = 'error'
          doc.downloadUrl = null
          continue
        }

        // Download template from Cloud Storage
        const templateFile = bucket.file(template.storagePath)
        const [templateExists] = await templateFile.exists()
        
        if (!templateExists) {
          console.warn(`⚠️ Template file not found in storage: ${template.storagePath}`)
          doc.status = 'error'
          doc.downloadUrl = null
          continue
        }

        const [templateBuffer] = await templateFile.download()
        console.log(`✅ Template downloaded: ${template.storagePath}`)

        // Prepare data for template using the proper library function
        const clientResponseValues: Record<string, any> = {}
        for (const [fieldName, fieldData] of Object.entries(doc.populatedFields)) {
          clientResponseValues[fieldName] = (fieldData as any).value
        }

        // Prepare AI sections
        const aiSections: Record<string, string> = {}
        if (template.aiSections && template.aiSections.length > 0) {
          for (const aiSection of template.aiSections) {
            if (aiSection.generatedContent && aiSection.placeholder) {
              aiSections[aiSection.placeholder.replace(/^ai_/, '')] = aiSection.generatedContent
            }
          }
        }

        // Use the proper prepareTemplateData function
        const templateData = prepareTemplateData(clientResponseValues, aiSections)
        
        // Add service-specific metadata
        templateData.serviceName = service.name
        templateData.clientName = service.clientName
        templateData.clientEmail = service.clientEmail

        console.log('📋 Template data prepared with keys:', Object.keys(templateData))

        // Generate document using the proper library function
        const generatedBuffer = await generateDocument({
          templateBuffer,
          data: templateData,
          fileName: doc.fileName
        })

        console.log(`✅ Document generated: ${doc.fileName} (${generatedBuffer.length} bytes)`)

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
        console.log(`   Download URL: ${doc.downloadUrl}`)
      } catch (error) {
        console.error(`❌ Error generating ${doc.templateName}:`, error)
        console.error(`   Error details:`, error instanceof Error ? error.message : 'Unknown error')
        console.error(`   Stack:`, error instanceof Error ? error.stack : 'No stack')
        doc.status = 'error'
        doc.downloadUrl = null
        // Continue with other documents even if one fails
      }
    }

    // Count successful generations
    const successfulDocs = generatedDocuments.filter(d => d.downloadUrl).length
    const failedDocs = generatedDocuments.length - successfulDocs
    
    console.log(`\n📊 Generation Summary:`)
    console.log(`   ✅ Successful: ${successfulDocs}/${generatedDocuments.length}`)
    console.log(`   ❌ Failed: ${failedDocs}/${generatedDocuments.length}`)
    
    generatedDocuments.forEach((doc, i) => {
      console.log(`   ${i + 1}. ${doc.fileName}: ${doc.downloadUrl ? '✅ HAS URL' : '❌ NO URL'}`)
    })

    // Update service with generated documents (now with downloadUrls)
    await adminDb.collection('services').doc(serviceId).update({
      generatedDocuments,
      status: successfulDocs > 0 ? 'documents_ready' : 'generation_failed',
      documentsGeneratedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    console.log('✅ Service updated with generated documents and download URLs')

    // Log activity for each successfully generated document
    try {
      for (const doc of generatedDocuments.filter(d => d.downloadUrl)) {
        await adminDb.collection('activityLogs').add({
          type: 'doc_generated',
          userId: service.createdBy || 'unknown',
          serviceId: serviceId,
          timestamp: Timestamp.now(),
          meta: {
            documentName: doc.fileName,
            templateName: doc.templateName,
            clientName: service.clientName,
          }
        });
      }
      console.log(`📝 Logged ${generatedDocuments.filter(d => d.downloadUrl).length} document generation activities`);
    } catch (logError) {
      console.error('⚠️ Failed to log activity:', logError);
      // Don't fail the request if logging fails
    }

    // Increment usage metrics for each successfully generated document
    try {
      const successfulDocCount = generatedDocuments.filter(d => d.downloadUrl).length;
      if (successfulDocCount > 0 && service.createdBy) {
        const today = new Date().toISOString().split('T')[0];
        const usageDocPath = `usageDaily/${service.createdBy}/${today}`;
        const usageDocRef = adminDb.doc(usageDocPath);
        
        const usageSnapshot = await usageDocRef.get();
        if (usageSnapshot.exists) {
          // Increment existing count
          await usageDocRef.update({
            docGeneratedCount: FieldValue.increment(successfulDocCount),
            lastUpdated: Timestamp.now(),
          });
        } else {
          // Create new daily record
          await usageDocRef.set({
            userId: service.createdBy,
            date: today,
            docGeneratedCount: successfulDocCount,
            lastUpdated: Timestamp.now(),
          });
        }
        console.log(`📊 Incremented usage metrics by ${successfulDocCount} for user ${service.createdBy}`);
      }
    } catch (metricsError) {
      console.error('⚠️ Failed to update usage metrics:', metricsError);
      // Don't fail the request if metrics update fails
    }

    // Send email notification to client about ready documents
    if (service.clientEmail && successfulDocs > 0) {
      try {
        // Get branding for email template
        const branding = await getBranding(service.createdBy)
        
        // Get list of successful document names
        const documentNames = generatedDocuments
          .filter(d => d.downloadUrl)
          .map(d => d.fileName)
        
        // Send notification
        const emailResult = await sendDocumentsReadyEmail(
          service.clientEmail,
          service.name,
          successfulDocs,
          documentNames,
          serviceId,
          branding
        )

        if (emailResult.success) {
          console.log('✅ Documents ready notification sent to client:', emailResult.messageId)
          
          // Log email sent activity
          try {
            await adminDb.collection('activityLogs').add({
              type: 'email_sent',
              userId: service.createdBy || 'unknown',
              serviceId: serviceId,
              timestamp: Timestamp.now(),
              meta: {
                emailTemplate: 'documents_ready',
                recipientEmail: service.clientEmail,
                documentCount: successfulDocs,
                messageId: emailResult.messageId,
                devMode: emailResult.devMode || false
              }
            });
          } catch (logError) {
            console.error('⚠️ Failed to log email activity:', logError);
          }
        } else {
          console.error('❌ Failed to send documents ready notification:', emailResult.error)
          
          // Log failed email attempt
          try {
            await adminDb.collection('activityLogs').add({
              type: 'email_failed',
              userId: service.createdBy || 'unknown',
              serviceId: serviceId,
              timestamp: Timestamp.now(),
              meta: {
                emailTemplate: 'documents_ready',
                recipientEmail: service.clientEmail,
                error: emailResult.error
              }
            });
          } catch (logError) {
            console.error('⚠️ Failed to log email failure:', logError);
          }
        }
      } catch (emailError) {
        console.error('❌ Error sending documents ready notification:', emailError)
        // Don't fail the request if email fails
      }
    } else if (!service.clientEmail) {
      console.warn('⚠️ No client email configured - notification not sent')
    }

    const successCount = generatedDocuments.filter(doc => doc.downloadUrl).length
    const failedCount = generatedDocuments.length - successCount

    return NextResponse.json({
      success: successCount > 0,
      message: `Successfully generated ${successCount}/${generatedDocuments.length} documents${failedCount > 0 ? ` (${failedCount} failed)` : ''}`,
      documents: generatedDocuments,
      serviceId,
      summary: {
        total: generatedDocuments.length,
        successful: successCount,
        failed: failedCount,
        documentsWithUrls: generatedDocuments.filter(d => d.downloadUrl).map(d => ({
          fileName: d.fileName,
          downloadUrl: d.downloadUrl
        })),
        documentsWithoutUrls: generatedDocuments.filter(d => !d.downloadUrl).map(d => ({
          fileName: d.fileName,
          status: d.status
        }))
      }
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
