import { NextRequest, NextResponse } from 'next/server'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

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

    // TODO: Implement actual email sending (e.g., using SendGrid, AWS SES, etc.)
    // For now, we'll just update the status and timestamp
    
    console.log(`📧 Sending intake form to ${serviceData.clientEmail}`)
    console.log(`Link: ${serviceData.intakeForm.link}`)
    
    // Simulated email content
    const emailContent = {
      to: serviceData.clientEmail,
      subject: `${serviceData.name} - Intake Form Required`,
      html: `
        <h2>Hello ${serviceData.clientName},</h2>
        <p>Your lawyer has prepared an intake form for: <strong>${serviceData.name}</strong></p>
        <p>Please click the link below to fill out the form:</p>
        <p><a href="${serviceData.intakeForm.link}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px;">Fill Out Intake Form</a></p>
        <p>Or copy this link: ${serviceData.intakeForm.link}</p>
        <p>If you have any questions, please contact your lawyer directly.</p>
        <p>Best regards,<br/>Smart Forms AI</p>
      `
    }

    // Log email for development
    console.log('📧 Email Content:', emailContent)

    // Update service status
    await updateDoc(doc(db, 'services', serviceId), {
      status: 'intake_sent',
      intakeFormSentAt: new Date().toISOString(),
      updatedAt: serverTimestamp()
    })

    return NextResponse.json({
      success: true,
      message: `Intake form sent to ${serviceData.clientEmail}`,
      emailPreview: emailContent // For development/testing
    })
  } catch (error) {
    console.error('Error sending intake form:', error)
    return NextResponse.json(
      { error: 'Failed to send intake form', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
