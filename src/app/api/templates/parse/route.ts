import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
  try {
    const { templateId } = await request.json()
    
    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    console.log('Manual parsing trigger for template:', templateId)

    // Update template status to trigger parsing
    const db = getAdminDb()
    
    await db.collection('templates').doc(templateId).update({
      status: 'parsing',
      parseRequested: true,
      parseRequestedAt: new Date(),
      updatedAt: new Date()
    })

    return NextResponse.json({ 
      success: true,
      message: 'Parsing triggered successfully'
    })
  } catch (error: any) {
    console.error('Error triggering parse:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to trigger parsing' },
      { status: 500 }
    )
  }
}
