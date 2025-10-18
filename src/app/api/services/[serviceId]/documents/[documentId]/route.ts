import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'

export async function PUT(
  request: NextRequest,
  { params }: { params: { serviceId: string; documentId: string } }
) {
  try {
    const { content } = await request.json()
    const { serviceId, documentId } = params

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    console.log(`📝 Updating document ${documentId} in service ${serviceId}`)

    // Get admin database
    const adminDb = getAdminDb()

    // Get the service document
    const serviceRef = adminDb.collection('services').doc(serviceId)
    const serviceDoc = await serviceRef.get()

    if (!serviceDoc.exists) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    const serviceData = serviceDoc.data()
    const generatedDocuments = serviceData?.generatedDocuments || []

    // Find and update the document
    const documentIndex = generatedDocuments.findIndex((doc: any) => doc.id === documentId)

    if (documentIndex === -1) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Update the document content
    generatedDocuments[documentIndex] = {
      ...generatedDocuments[documentIndex],
      content,
      lastEditedAt: new Date().toISOString(),
      edited: true
    }

    // Save back to Firestore
    await serviceRef.update({
      generatedDocuments,
      updatedAt: new Date()
    })

    console.log(`✅ Document ${documentId} updated successfully`)

    return NextResponse.json({
      success: true,
      message: 'Document updated successfully'
    })

  } catch (error: any) {
    console.error('❌ Error updating document:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update document', 
        details: error.message 
      },
      { status: 500 }
    )
  }
}
