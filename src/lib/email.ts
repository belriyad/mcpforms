import { Resend } from 'resend'

// Initialize Resend (will be undefined if API key not set)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export const isEmailConfigured = () => {
  return resend !== null && process.env.RESEND_FROM_EMAIL !== undefined
}

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
}

export async function sendEmail({ to, subject, html, text, replyTo }: SendEmailOptions) {
  if (!isEmailConfigured()) {
    console.warn('⚠️ Email not configured - skipping email send')
    return {
      success: false,
      error: 'Email service not configured. Please set RESEND_API_KEY and RESEND_FROM_EMAIL.'
    }
  }

  try {
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@example.com'
    
    const result = await resend!.emails.send({
      from: fromEmail,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text: text || stripHtml(html),
      replyTo
    })

    console.log('✅ Email sent successfully:', result)
    return {
      success: true,
      id: result.data?.id,
      error: null
    }
  } catch (error: any) {
    console.error('❌ Failed to send email:', error)
    return {
      success: false,
      error: error.message || 'Failed to send email',
      details: error
    }
  }
}

// Simple HTML stripper for plain text fallback
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>.*<\/style>/gm, '')
    .replace(/<script[^>]*>.*<\/script>/gm, '')
    .replace(/<[^>]+>/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Email template wrapper with branding
export function emailTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FormGenAI</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
      color: white;
      padding: 32px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .content {
      padding: 32px;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
      transition: transform 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
    }
    .footer {
      padding: 24px 32px;
      background: #f9fafb;
      color: #6b7280;
      font-size: 14px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .info-box {
      background: #eff6ff;
      border-left: 4px solid #3b82f6;
      padding: 16px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .warning-box {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 16px;
      margin: 20px 0;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✨ FormGenAI</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>This is an automated message from FormGenAI</p>
      <p style="margin-top: 8px;">
        <a href="#" style="color: #3b82f6; text-decoration: none;">Privacy Policy</a> · 
        <a href="#" style="color: #3b82f6; text-decoration: none;">Terms of Service</a>
      </p>
    </div>
  </div>
</body>
</html>
  `
}
