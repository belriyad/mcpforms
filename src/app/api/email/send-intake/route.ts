import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, isEmailConfigured } from '@/lib/email'
import { createIntakeEmail } from '@/lib/email-templates'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientEmail, clientName, lawyerName, serviceName, intakeLink } = body

    // Validate required fields
    if (!clientEmail || !clientName || !serviceName || !intakeLink) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if email is configured
    if (!isEmailConfigured()) {
      console.warn('⚠️ Email not configured - intake link generated but email not sent')
      return NextResponse.json({
        success: false,
        error: 'Email service not configured',
        message: 'The intake link was generated but email could not be sent. Please share the link manually.',
        intakeLink
      })
    }

    // Generate email content
    const { subject, html } = createIntakeEmail({
      clientName,
      lawyerName: lawyerName || 'Your Lawyer',
      serviceName,
      intakeLink,
      expiresInDays: 7
    })

    // Send email
    const result = await sendEmail({
      to: clientEmail,
      subject,
      html,
      replyTo: process.env.RESEND_REPLY_TO_EMAIL
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Intake form email sent to ${clientEmail}`,
        emailId: result.id
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          intakeLink
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('❌ Error sending intake email:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
