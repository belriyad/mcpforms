import { emailTemplate } from './email'

export interface IntakeEmailData {
  clientName: string
  lawyerName: string
  serviceName: string
  intakeLink: string
  expiresInDays?: number
}

export function createIntakeEmail(data: IntakeEmailData): { subject: string; html: string } {
  const { clientName, lawyerName, serviceName, intakeLink, expiresInDays = 7 } = data

  const content = `
    <h2>Welcome, ${clientName}!</h2>
    
    <p>You have been invited by <strong>${lawyerName}</strong> to complete an intake form for:</p>
    
    <div class="info-box">
      <strong>Service:</strong> ${serviceName}
    </div>

    <p>To get started, please click the button below to access your secure intake form:</p>
    
    <div style="text-align: center;">
      <a href="${intakeLink}" class="button">Complete Intake Form</a>
    </div>
    
    <p style="font-size: 14px; color: #6b7280;">
      Or copy and paste this link into your browser:<br>
      <a href="${intakeLink}" style="color: #3b82f6;">${intakeLink}</a>
    </p>

    <div class="warning-box">
      <strong>⏰ Important:</strong> This link will expire in ${expiresInDays} days. 
      Please complete the form as soon as possible.
    </div>

    <h3>What to Expect:</h3>
    <ul>
      <li>The form will take approximately 10-15 minutes to complete</li>
      <li>Your progress is automatically saved</li>
      <li>You can return to the form using the same link</li>
      <li>All information is securely encrypted</li>
    </ul>

    <p>If you have any questions or need assistance, please reply to this email.</p>
    
    <p>Best regards,<br>
    <strong>${lawyerName}</strong></p>
  `

  return {
    subject: `Action Required: Complete Your ${serviceName} Intake Form`,
    html: emailTemplate(content)
  }
}

export interface SubmissionEmailData {
  lawyerName: string
  lawyerEmail: string
  clientName: string
  clientEmail: string
  serviceName: string
  serviceId: string
  serviceUrl: string
  totalFields: number
  submittedAt: string
}

export function createSubmissionNotificationEmail(data: SubmissionEmailData): { subject: string; html: string } {
  const { lawyerName, clientName, clientEmail, serviceName, serviceUrl, totalFields, submittedAt } = data

  const content = `
    <h2>New Intake Form Submission 🎉</h2>
    
    <p>Hi ${lawyerName},</p>
    
    <p>Great news! <strong>${clientName}</strong> has completed their intake form.</p>

    <div class="info-box">
      <strong>Service:</strong> ${serviceName}<br>
      <strong>Client:</strong> ${clientName}<br>
      <strong>Email:</strong> ${clientEmail}<br>
      <strong>Submitted:</strong> ${submittedAt}<br>
      <strong>Total Fields:</strong> ${totalFields}
    </div>

    <p>The responses are ready for your review.</p>

    <div style="text-align: center;">
      <a href="${serviceUrl}" class="button">Review Submission</a>
    </div>

    <p style="font-size: 14px; color: #6b7280;">
      Or visit: <a href="${serviceUrl}" style="color: #3b82f6;">${serviceUrl}</a>
    </p>

    <h3>Next Steps:</h3>
    <ol>
      <li>Review the client's responses</li>
      <li>Edit any information if needed</li>
      <li>Generate the final documents</li>
      <li>Deliver documents to the client</li>
    </ol>

    <p>You can view and edit the responses directly from the service detail page.</p>
  `

  return {
    subject: `✅ ${clientName} Completed Intake Form - ${serviceName}`,
    html: emailTemplate(content)
  }
}

export interface DocumentsReadyEmailData {
  clientName: string
  serviceName: string
  documentsCount: number
  documentsList: string[]
  downloadUrl?: string
  lawyerName: string
  message?: string
}

export function createDocumentsReadyEmail(data: DocumentsReadyEmailData): { subject: string; html: string } {
  const { clientName, serviceName, documentsCount, documentsList, downloadUrl, lawyerName, message } = data

  const documentsHtml = documentsList
    .map(doc => `<li>${doc}</li>`)
    .join('')

  const content = `
    <h2>Your Documents Are Ready! 📄</h2>
    
    <p>Dear ${clientName},</p>
    
    <p>Good news! Your documents for <strong>${serviceName}</strong> have been prepared and are ready for download.</p>

    <div class="info-box">
      <strong>Service:</strong> ${serviceName}<br>
      <strong>Documents Generated:</strong> ${documentsCount}<br>
      <strong>Status:</strong> Ready for Download
    </div>

    ${message ? `<p>${message}</p>` : ''}

    <h3>Your Documents:</h3>
    <ul style="line-height: 2;">
      ${documentsHtml}
    </ul>

    ${downloadUrl ? `
    <div style="text-align: center;">
      <a href="${downloadUrl}" class="button">Download Documents</a>
    </div>
    
    <p style="font-size: 14px; color: #6b7280;">
      Or visit: <a href="${downloadUrl}" style="color: #3b82f6;">${downloadUrl}</a>
    </p>
    ` : `
    <p>Your lawyer will provide instructions on how to access these documents.</p>
    `}

    <div class="warning-box">
      <strong>📋 Next Steps:</strong> Please review the documents carefully. 
      If you notice any errors or have questions, contact ${lawyerName} immediately.
    </div>

    <h3>Important Information:</h3>
    <ul>
      <li>All documents are in DOCX format (Microsoft Word)</li>
      <li>You may need to sign some documents</li>
      <li>Keep copies for your records</li>
      <li>Follow any specific instructions from your lawyer</li>
    </ul>

    <p>If you have any questions about these documents, please reply to this email or contact ${lawyerName}.</p>
    
    <p>Best regards,<br>
    <strong>${lawyerName}</strong></p>
  `

  return {
    subject: `Your ${serviceName} Documents Are Ready`,
    html: emailTemplate(content)
  }
}

export interface ReminderEmailData {
  clientName: string
  lawyerName: string
  serviceName: string
  intakeLink: string
  daysRemaining: number
}

export function createReminderEmail(data: ReminderEmailData): { subject: string; html: string } {
  const { clientName, lawyerName, serviceName, intakeLink, daysRemaining } = data

  const content = `
    <h2>Reminder: Intake Form Pending ⏰</h2>
    
    <p>Hi ${clientName},</p>
    
    <p>This is a friendly reminder that your intake form for <strong>${serviceName}</strong> is still pending completion.</p>

    <div class="warning-box">
      <strong>Time Sensitive:</strong> Your form link will expire in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}.
    </div>

    <p>To complete your form, please click below:</p>

    <div style="text-align: center;">
      <a href="${intakeLink}" class="button">Complete Intake Form</a>
    </div>
    
    <p style="font-size: 14px; color: #6b7280;">
      Or copy and paste this link:<br>
      <a href="${intakeLink}" style="color: #3b82f6;">${intakeLink}</a>
    </p>

    <h3>Need Help?</h3>
    <p>If you're having trouble completing the form or have any questions, please reply to this email. ${lawyerName} is here to help!</p>

    <p>Thank you for your prompt attention to this matter.</p>
    
    <p>Best regards,<br>
    <strong>${lawyerName}</strong></p>
  `

  return {
    subject: `Reminder: Complete Your ${serviceName} Intake Form`,
    html: emailTemplate(content)
  }
}
