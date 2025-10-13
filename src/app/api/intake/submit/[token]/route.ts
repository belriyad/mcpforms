import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, isAdminInitialized } from '@/lib/firebase-admin'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
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

    // Check if Admin SDK is initialized
    if (!isAdminInitialized()) {
      console.error('❌ Firebase Admin SDK not initialized')
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      )
    }

    console.log('🚀 Submitting intake form for token:', token)

    // Use Admin SDK to find service by intake token
    const adminDb = getAdminDb()
    const querySnapshot = await adminDb
      .collection('services')
      .where('intakeForm.token', '==', token)
      .limit(1)
      .get()

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

    // Update service with final client response using Admin SDK
    await adminDb.collection('services').doc(serviceDoc.id).update({
      clientResponse: {
        responses: formData,
        customFields: customFields || [],
        customClauses: customClauses || [],
        submittedAt: FieldValue.serverTimestamp(),
        status: 'submitted',
      },
      status: 'intake_submitted',
      updatedAt: FieldValue.serverTimestamp(),
    })

    console.log('✅ Intake form submitted successfully for service:', serviceDoc.id)

    // Log intake submission activity
    try {
      await adminDb.collection('activityLogs').add({
        type: 'intake_submitted',
        userId: service.createdBy || 'unknown',
        serviceId: serviceDoc.id,
        intakeId: token,
        timestamp: Timestamp.now(),
        meta: {
          serviceName: service.name,
          clientName: service.clientName,
          clientEmail: service.clientEmail,
          fieldsSubmitted: Object.keys(formData).length,
        }
      });
      console.log('📝 Logged intake submission activity');
    } catch (logError) {
      console.error('⚠️ Failed to log intake submission:', logError);
      // Don't fail the request if logging fails
    }

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
          
          // Log email sent activity
          try {
            await adminDb.collection('activityLogs').add({
              type: 'email_sent',
              userId: service.createdBy || 'unknown',
              serviceId: serviceDoc.id,
              timestamp: Timestamp.now(),
              meta: {
                emailTemplate: 'intake_submitted',
                recipientEmail: service.lawyerEmail,
                clientName: service.clientName,
              }
            });
            console.log('📝 Logged email sent activity');
          } catch (logError) {
            console.error('⚠️ Failed to log email activity:', logError);
          }
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
