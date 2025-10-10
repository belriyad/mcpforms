import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, isAdminInitialized } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import { sendEmail, isEmailConfigured } from '@/lib/email'
import { createIntakeEmail } from '@/lib/email-templates'

export async function POST(request: NextRequest) {
  try {
    if (!isAdminInitialized()) {
      return NextResponse.json(
        { error: 'Server configuration error - Firebase Admin not initialized' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { serviceId } = body

    if (!serviceId) {
      return NextResponse.json(
        { error: 'Missing required field: serviceId' },
        { status: 400 }
      )
    }

    // Get service data using Admin SDK
    const adminDb = getAdminDb()
    const serviceDoc = await adminDb.collection('services').doc(serviceId).get()
    if (!serviceDoc.exists) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    const serviceData = serviceDoc.data()!

    if (!serviceData.intakeForm) {
      return NextResponse.json(
        { error: 'No intake form generated. Generate intake form first.' },
        { status: 400 }
      )
    }

    console.log(`📧 Sending intake form to ${serviceData.clientEmail}`)
    
    let emailResult = null
    let emailSent = false

    // Send email if configured
    if (isEmailConfigured()) {
      const { subject, html } = createIntakeEmail({
        clientName: serviceData.clientName,
        lawyerName: serviceData.lawyerName || 'Your Lawyer',
        serviceName: serviceData.name,
        intakeLink: serviceData.intakeForm.link,
        expiresInDays: 7
      })

      emailResult = await sendEmail({
        to: serviceData.clientEmail,
        subject,
        html,
        replyTo: process.env.RESEND_REPLY_TO_EMAIL
      })

      emailSent = emailResult.success
      
      if (emailResult.success) {
        console.log('✅ Intake email sent successfully')
      } else {
        console.error('❌ Failed to send email:', emailResult.error)
      }
    } else {
      console.warn('⚠️ Email not configured - link generated but email not sent')
    }

    // Update service status using Admin SDK
    await adminDb.collection('services').doc(serviceId).update({
      status: 'intake_sent',
      intakeFormSentAt: FieldValue.serverTimestamp(),
      emailSent,
      updatedAt: FieldValue.serverTimestamp()
    })

    return NextResponse.json({
      success: true,
      message: emailSent 
        ? `Intake form sent to ${serviceData.clientEmail}`
        : 'Intake form generated. Email service not configured - please share link manually.',
      intakeLink: serviceData.intakeForm.link,
      emailSent,
      emailId: emailResult?.id
    })
  } catch (error) {
    console.error('Error sending intake form:', error)
    return NextResponse.json(
      { error: 'Failed to send intake form', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
