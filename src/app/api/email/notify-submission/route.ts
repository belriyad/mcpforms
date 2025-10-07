import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, isEmailConfigured } from '@/lib/email'
import { createSubmissionNotificationEmail } from '@/lib/email-templates'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      lawyerEmail,
      lawyerName,
      clientName,
      clientEmail,
      serviceName,
      serviceId,
      serviceUrl,
      totalFields,
      submittedAt
    } = body

    // Validate required fields
    if (!lawyerEmail || !clientName || !serviceName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if email is configured
    if (!isEmailConfigured()) {
      console.warn('⚠️ Email not configured - submission notification not sent')
      return NextResponse.json({
        success: false,
        error: 'Email service not configured',
        message: 'Form was submitted successfully but lawyer notification email could not be sent.'
      })
    }

    // Generate email content
    const { subject, html } = createSubmissionNotificationEmail({
      lawyerName: lawyerName || 'Lawyer',
      lawyerEmail,
      clientName,
      clientEmail: clientEmail || 'Not provided',
      serviceName,
      serviceId,
      serviceUrl: serviceUrl || `${process.env.NEXT_PUBLIC_APP_URL}/admin/services/${serviceId}`,
      totalFields: totalFields || 0,
      submittedAt: submittedAt || new Date().toLocaleString()
    })

    // Send email
    const result = await sendEmail({
      to: lawyerEmail,
      subject,
      html
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Notification sent to ${lawyerEmail}`,
        emailId: result.id
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('❌ Error sending submission notification:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send notification',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
