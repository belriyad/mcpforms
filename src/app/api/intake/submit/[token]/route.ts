import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore'
import { sendEmail, isEmailConfigured } from '@/lib/email'
import { createSubmissionNotificationEmail } from '@/lib/email-templates'

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

    console.log('🚀 Submitting intake form for token:', token)

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

    // Check if already submitted
    if (service.status === 'intake_submitted' || service.status === 'documents_ready' || service.status === 'completed') {
      console.log('⚠️ Form already submitted')
      return NextResponse.json({
        success: true,
        message: 'Form already submitted',
        alreadySubmitted: true,
      })
    }

    // Update service with final client response
    const serviceRef = doc(db, 'services', serviceDoc.id)
    await updateDoc(serviceRef, {
      clientResponse: {
        responses: formData,
        customFields: customFields || [],
        customClauses: customClauses || [],
        submittedAt: serverTimestamp(),
        status: 'submitted',
      },
      status: 'intake_submitted',
      updatedAt: serverTimestamp(),
    })

    console.log('✅ Intake form submitted successfully for service:', serviceDoc.id)

    // Send email notification to lawyer
    if (isEmailConfigured() && service.lawyerEmail) {
      try {
        const serviceUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/services/${serviceDoc.id}`
        
        const { subject, html } = createSubmissionNotificationEmail({
          lawyerName: service.lawyerName || 'Lawyer',
          lawyerEmail: service.lawyerEmail,
          clientName: service.clientName,
          clientEmail: service.clientEmail,
          serviceName: service.name,
          serviceId: serviceDoc.id,
          serviceUrl,
          totalFields: Object.keys(formData).length,
          submittedAt: new Date().toLocaleString()
        })

        const emailResult = await sendEmail({
          to: service.lawyerEmail,
          subject,
          html
        })

        if (emailResult.success) {
          console.log('✅ Lawyer notification email sent')
        } else {
          console.error('❌ Failed to send lawyer notification:', emailResult.error)
        }
      } catch (emailError) {
        console.error('❌ Error sending lawyer notification:', emailError)
        // Don't fail the submission if email fails
      }
    } else {
      console.warn('⚠️ Email not configured or no lawyer email - notification not sent')
    }

    return NextResponse.json({
      success: true,
      message: 'Form submitted successfully! The lawyer will be notified.',
      serviceId: serviceDoc.id,
    })
  } catch (error) {
    console.error('❌ Error submitting intake form:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to submit form',
      },
      { status: 500 }
    )
  }
}
