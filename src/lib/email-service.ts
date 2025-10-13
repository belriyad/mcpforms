/**
 * Email Service
 * Feature #25: Email Notifications
 * 
 * Handles sending emails with proper dev/prod routing
 */

import { isFeatureEnabled } from './feature-flags';

// Email configuration
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const DEV_MAILBOX = process.env.DEV_MAILBOX || 'dev@mcpforms.test';
const EMAIL_FROM = process.env.EMAIL_FROM || 'MCPForms <noreply@mcpforms.com>';

// Email service provider (for future implementation)
// Currently logs to console and activity logs only
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'console'; // 'console' | 'sendgrid' | 'ses'

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  devMode?: boolean;
  actualRecipient?: string;
}

/**
 * Send an email
 * In dev mode: logs to console only
 * In prod: would integrate with email provider (future)
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const featureEnabled = isFeatureEnabled('notifAuto');
  
  if (!featureEnabled) {
    return {
      success: false,
      error: 'Email notifications feature is disabled',
    };
  }

  try {
    const { to, subject, html, text, from = EMAIL_FROM } = options;

    // Development mode: log to console instead of sending
    if (!IS_PRODUCTION || EMAIL_PROVIDER === 'console') {
      console.log('\n📧 ============ EMAIL (DEV MODE) ============');
      console.log(`From: ${from}`);
      console.log(`To: ${to} (Would send to: ${DEV_MAILBOX} in dev)`);
      console.log(`Subject: ${subject}`);
      console.log('\n--- HTML Content ---');
      console.log(html.substring(0, 500) + (html.length > 500 ? '...' : ''));
      console.log('\n--- Text Content ---');
      console.log(text || 'No text version provided');
      console.log('==========================================\n');

      return {
        success: true,
        messageId: `dev_${Date.now()}`,
        devMode: true,
        actualRecipient: to,
      };
    }

    // Production mode: integrate with email service provider
    switch (EMAIL_PROVIDER) {
      case 'sendgrid':
        return await sendViaSendGrid(options);
      
      case 'ses':
        return await sendViaSES(options);
      
      default:
        console.warn('No email provider configured. Email not sent.');
        return {
          success: false,
          error: 'No email provider configured',
        };
    }
  } catch (error) {
    console.error('Email send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * SendGrid integration (placeholder for future implementation)
 */
async function sendViaSendGrid(options: EmailOptions): Promise<EmailResult> {
  // TODO: Implement SendGrid integration
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // const msg = { ...options, from: options.from || EMAIL_FROM };
  // const [response] = await sgMail.send(msg);
  
  console.log('SendGrid integration not yet implemented');
  return {
    success: false,
    error: 'SendGrid integration not implemented',
  };
}

/**
 * AWS SES integration (placeholder for future implementation)
 */
async function sendViaSES(options: EmailOptions): Promise<EmailResult> {
  // TODO: Implement AWS SES integration
  // const AWS = require('aws-sdk');
  // const ses = new AWS.SES({ region: 'us-east-1' });
  // const params = { ... };
  // const result = await ses.sendEmail(params).promise();
  
  console.log('AWS SES integration not yet implemented');
  return {
    success: false,
    error: 'AWS SES integration not implemented',
  };
}

/**
 * Send intake submission notification email
 */
export async function sendIntakeSubmittedEmail(
  serviceOwnerEmail: string,
  serviceName: string,
  clientName: string,
  clientEmail: string,
  serviceId: string,
  submittedAt: Date,
  branding?: any
): Promise<EmailResult> {
  const { getIntakeSubmittedTemplate } = await import('./email-templates/intake-submitted');
  
  const subject = `New Intake Submission: ${serviceName}`;
  const html = getIntakeSubmittedTemplate({
    serviceName,
    clientName,
    clientEmail,
    serviceId,
    submittedAt,
    branding,
  });

  return sendEmail({
    to: serviceOwnerEmail,
    subject,
    html,
    text: `New intake submission received for ${serviceName} from ${clientName} (${clientEmail}).\n\nView submission: ${process.env.NEXT_PUBLIC_APP_URL}/admin/services/${serviceId}`,
  });
}

/**
 * Send documents ready notification email
 */
export async function sendDocumentsReadyEmail(
  clientEmail: string,
  serviceName: string,
  documentCount: number,
  documentNames: string[],
  serviceId: string,
  branding?: any
): Promise<EmailResult> {
  const { getDocumentsReadyTemplate } = await import('./email-templates/documents-ready');
  
  const subject = `Your Documents are Ready: ${serviceName}`;
  const html = getDocumentsReadyTemplate({
    serviceName,
    documentCount,
    documentNames,
    serviceId,
    branding,
  });

  return sendEmail({
    to: clientEmail,
    subject,
    html,
    text: `Your documents for ${serviceName} are ready!\n\nYou can view and download them at: ${process.env.NEXT_PUBLIC_APP_URL}/intake/view/${serviceId}\n\nDocuments generated: ${documentNames.join(', ')}`,
  });
}

/**
 * Test email sending (for admin testing)
 */
export async function sendTestEmail(to: string): Promise<EmailResult> {
  return sendEmail({
    to,
    subject: 'MCPForms Test Email',
    html: '<h1>Test Email</h1><p>This is a test email from MCPForms.</p>',
    text: 'Test Email - This is a test email from MCPForms.',
  });
}
