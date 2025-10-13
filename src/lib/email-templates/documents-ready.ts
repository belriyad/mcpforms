/**
 * Documents Ready Email Template
 * Feature #25: Email Notifications
 * 
 * Notification sent to client when documents are generated
 */

import { getBaseEmailTemplate } from './base';
import { Branding } from '../branding';

export interface DocumentsReadyData {
  serviceName: string;
  documentCount: number;
  documentNames: string[];
  serviceId: string;
  branding?: Branding;
}

/**
 * Generate documents ready email HTML
 */
export function getDocumentsReadyTemplate(data: DocumentsReadyData): string {
  const {
    serviceName,
    documentCount,
    documentNames,
    serviceId,
    branding,
  } = data;

  const downloadUrl = `${process.env.NEXT_PUBLIC_APP_URL}/admin/services/${serviceId}`;

  const content = `
    <h2 class="title">Your Documents are Ready! 🎉</h2>
    
    <p class="text">
      Great news! Your documents for <strong>${serviceName}</strong> have been generated and are ready for review.
    </p>
    
    <div class="info-box">
      <p class="info-label">Documents Generated</p>
      <p class="info-value">${documentCount} ${documentCount === 1 ? 'document' : 'documents'}</p>
    </div>
    
    ${documentNames.length > 0 ? `
    <div class="info-box">
      <p class="info-label">Document List</p>
      <ul style="margin: 8px 0 0 0; padding-left: 24px; color: #111827;">
        ${documentNames.map(name => `<li style="margin: 4px 0;">${name}</li>`).join('')}
      </ul>
    </div>
    ` : ''}
    
    <p class="text">
      <a href="${downloadUrl}" class="button">View & Download Documents</a>
    </p>
    
    <p class="text" style="font-size: 14px; color: #6b7280;">
      <strong>What's Next?</strong>
    </p>
    <ul style="color: #6b7280; font-size: 14px; margin: 0; padding-left: 24px;">
      <li>Review each document carefully</li>
      <li>Download the documents you need</li>
      <li>Contact us if you have any questions or need revisions</li>
    </ul>
    
    <p class="text" style="font-size: 12px; color: #9ca3af; margin-top: 24px;">
      <em>Note: These documents are for your review. Please consult with your legal professional before using them.</em>
    </p>
  `;

  return getBaseEmailTemplate({
    title: `Documents Ready: ${serviceName}`,
    preheader: `Your ${documentCount} ${documentCount === 1 ? 'document is' : 'documents are'} ready to download`,
    content,
    branding,
  });
}
