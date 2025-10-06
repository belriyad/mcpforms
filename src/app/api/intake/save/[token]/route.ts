import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore'

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params
    const body = await request.json()

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      )
    }

    const { formData, customFields, customClauses } = body

    if (!formData) {
      return NextResponse.json(
        { success: false, error: 'Form data is required' },
        { status: 400 }
      )
    }

    console.log('💾 Saving progress for token:', token)

    // Find service by intake token
    const servicesRef = collection(db, 'services')
    const q = query(servicesRef, where('intakeForm.token', '==', token))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      console.log('❌ No service found with token:', token)
      return NextResponse.json(
        { success: false, error: 'Intake form not found' },
        { status: 404 }
      )
    }

    const serviceDoc = querySnapshot.docs[0]
    const service = serviceDoc.data()

    // Don't save if already submitted
    if (service.status === 'intake_submitted' || service.status === 'documents_ready' || service.status === 'completed') {
      console.log('⚠️ Not saving - form already submitted')
      return NextResponse.json({
        success: true,
        message: 'Form already submitted, no changes saved',
      })
    }

    // Update service with client response (save progress)
    const serviceRef = doc(db, 'services', serviceDoc.id)
    await updateDoc(serviceRef, {
      clientResponse: {
        responses: formData,
        customFields: customFields || [],
        customClauses: customClauses || [],
        savedAt: serverTimestamp(),
        status: 'in_progress',
      },
      updatedAt: serverTimestamp(),
    })

    console.log('✅ Progress saved successfully for service:', serviceDoc.id)

    return NextResponse.json({
      success: true,
      message: 'Progress saved successfully',
    })
  } catch (error) {
    console.error('❌ Error saving progress:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save progress',
      },
      { status: 500 }
    )
  }
}
