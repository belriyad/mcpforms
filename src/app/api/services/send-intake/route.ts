import { NextRequest, NextResponse } from 'next/server'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { sendEmail, isEmailConfigured } from '@/lib/email'
import { createIntakeEmail } from '@/lib/email-templates'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { serviceId } = body

    if (!serviceId) {
      return NextResponse.json(
        { error: 'Missing required field: serviceId' },
        { status: 400 }
      )
    }

    // Get service data
    const serviceDoc = await getDoc(doc(db, 'services', serviceId))
    if (!serviceDoc.exists()) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    const serviceData = serviceDoc.data()

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

    // Update service status
    await updateDoc(doc(db, 'services', serviceId), {
      status: 'intake_sent',
      intakeFormSentAt: serverTimestamp(),
      emailSent,
      updatedAt: serverTimestamp()
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
