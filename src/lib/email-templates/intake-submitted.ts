/**
 * Intake Submitted Email Template
 * Feature #25: Email Notifications
 * 
 * Notification sent to lawyer when client submits intake form
 */

import { getBaseEmailTemplate } from './base';
import { Branding } from '../branding';

export interface IntakeSubmittedData {
  serviceName: string;
  clientName: string;
  clientEmail: string;
  serviceId: string;
  submittedAt: Date;
  branding?: Branding;
}

/**
 * Generate intake submitted email HTML
 */
export function getIntakeSubmittedTemplate(data: IntakeSubmittedData): string {
  const {
    serviceName,
    clientName,
    clientEmail,
    serviceId,
    submittedAt,
    branding,
  } = data;

  const viewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/admin/services/${serviceId}`;
  const formattedDate = submittedAt.toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const content = `
    <h2 class="title">New Intake Submission Received</h2>
    
    <p class="text">
      You have received a new intake form submission for <strong>${serviceName}</strong>.
    </p>
    
    <div class="info-box">
      <p class="info-label">Client Name</p>
      <p class="info-value">${clientName}</p>
    </div>
    
    <div class="info-box">
      <p class="info-label">Client Email</p>
      <p class="info-value">${clientEmail}</p>
    </div>
    
    <div class="info-box">
      <p class="info-label">Submitted</p>
      <p class="info-value">${formattedDate}</p>
    </div>
    
    <p class="text">
      <a href="${viewUrl}" class="button">View Submission</a>
    </p>
    
    <p class="text" style="font-size: 14px; color: #6b7280;">
      <strong>Next Steps:</strong>
    </p>
    <ul style="color: #6b7280; font-size: 14px; margin: 0; padding-left: 24px;">
      <li>Review the client's responses</li>
      <li>Generate documents from the intake data</li>
      <li>Download and send the completed documents to your client</li>
    </ul>
  `;

  return getBaseEmailTemplate({
    title: `New Intake: ${serviceName}`,
    preheader: `${clientName} has submitted an intake form for ${serviceName}`,
    content,
    branding,
  });
}
