import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, isAdminInitialized } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(request: NextRequest) {
  try {
    // Check if Firebase Admin is initialized
    if (!isAdminInitialized()) {
      return NextResponse.json(
        { error: 'Server configuration error - Firebase Admin not initialized' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { serviceId, templateIds } = body

    if (!serviceId || !templateIds || !Array.isArray(templateIds)) {
      return NextResponse.json(
        { error: 'Missing required fields: serviceId, templateIds' },
        { status: 400 }
      )
    }

    const adminDb = getAdminDb()

    // Fetch template details for each selected template
    const templateDetails = await Promise.all(
      templateIds.map(async (templateId: string) => {
        const templateDoc = await adminDb.collection('templates').doc(templateId).get()
        if (!templateDoc.exists) {
          throw new Error(`Template ${templateId} not found`)
        }
        const templateData = templateDoc.data()!
        return {
          id: `st_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          templateId: templateDoc.id,
          name: templateData.name || 'Untitled Template',
          fileName: templateData.originalFileName || 'unknown.docx',
          aiSections: [],
          extractedFields: (templateData.extractedFields || []).map((field: any) => ({
            ...field,
            sourceTemplateIds: [templateDoc.id],
            isCommon: false
          }))
        }
      })
    )

    // Update service with template details
    await adminDb.collection('services').doc(serviceId).update({
      templates: templateDetails,
      updatedAt: FieldValue.serverTimestamp()
    })

    return NextResponse.json({
      success: true,
      templates: templateDetails,
      message: 'Templates loaded successfully'
    })
  } catch (error) {
    console.error('Error loading templates:', error)
    return NextResponse.json(
      { error: 'Failed to load templates', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
