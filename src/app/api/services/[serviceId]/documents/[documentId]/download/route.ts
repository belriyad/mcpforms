import { NextRequest, NextResponse } from 'next/server'
import { adminDb, adminStorage } from '@/lib/firebase-admin'

export async function GET(
  request: NextRequest,
  { params }: { params: { serviceId: string; documentId: string } }
) {
  try {
    const { serviceId, documentId } = params

    // Get service from Firestore
    const serviceDoc = await adminDb.collection('services').doc(serviceId).get()
    
    if (!serviceDoc.exists) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    const service = serviceDoc.data()
    const document = service?.generatedDocuments?.find((doc: any) => doc.id === documentId)

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    if (!document.downloadUrl) {
      return NextResponse.json(
        { error: 'Document not yet generated' },
        { status: 400 }
      )
    }

    // Get file from storage
    const bucket = adminStorage.bucket()
    const file = bucket.file(document.storagePath)
    
    const [exists] = await file.exists()
    if (!exists) {
      return NextResponse.json(
        { error: 'File not found in storage' },
        { status: 404 }
      )
    }

    // Get file buffer
    const [buffer] = await file.download()

    // Return file with proper headers
    return new NextResponse(Buffer.from(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${document.fileName}"`,
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error downloading document:', error)
    return NextResponse.json(
      { 
        error: 'Failed to download document',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
