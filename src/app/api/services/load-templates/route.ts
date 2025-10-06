import { NextRequest, NextResponse } from 'next/server'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { serviceId, templateIds } = body

    if (!serviceId || !templateIds || !Array.isArray(templateIds)) {
      return NextResponse.json(
        { error: 'Missing required fields: serviceId, templateIds' },
        { status: 400 }
      )
    }

    // Fetch template details for each selected template
    const templateDetails = await Promise.all(
      templateIds.map(async (templateId: string) => {
        const templateDoc = await getDoc(doc(db, 'templates', templateId))
        if (!templateDoc.exists()) {
          throw new Error(`Template ${templateId} not found`)
        }
        const templateData = templateDoc.data()
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
    await updateDoc(doc(db, 'services', serviceId), {
      templates: templateDetails,
      updatedAt: serverTimestamp()
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
