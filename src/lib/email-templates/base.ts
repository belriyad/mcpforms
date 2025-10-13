/**
 * Base Email Template
 * Feature #25: Email Notifications
 * 
 * Responsive HTML email template with branding support
 */

import { Branding, DEFAULT_BRANDING } from '../branding';

export interface BaseTemplateOptions {
  title: string;
  preheader?: string;
  content: string;
  branding?: Branding;
}

/**
 * Generate base email HTML template
 */
export function getBaseEmailTemplate(options: BaseTemplateOptions): string {
  const { title, preheader, content, branding = DEFAULT_BRANDING } = options;
  
  const accentColor = branding.accentColor || DEFAULT_BRANDING.accentColor;
  const primaryColor = branding.primaryColor || DEFAULT_BRANDING.primaryColor;
  const companyName = branding.companyName || DEFAULT_BRANDING.companyName;
  const logoUrl = branding.logoUrl || null;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  ${preheader ? `<meta name="description" content="${preheader}">` : ''}
  <style>
    /* Reset styles */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    
    /* Base styles */
    body {
      margin: 0;
      padding: 0;
      width: 100% !important;
      background-color: #f3f4f6;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #1f2937;
      line-height: 1.6;
    }
    
    /* Container */
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    
    /* Header */
    .header {
      padding: 32px 24px;
      text-align: center;
      background: linear-gradient(to right, ${accentColor}, ${primaryColor});
    }
    
    .logo {
      max-height: 60px;
      max-width: 200px;
    }
    
    .company-name {
      font-size: 24px;
      font-weight: bold;
      color: #ffffff;
      margin: 0;
    }
    
    /* Content */
    .content {
      padding: 32px 24px;
    }
    
    .title {
      font-size: 24px;
      font-weight: bold;
      color: #111827;
      margin: 0 0 16px 0;
    }
    
    .text {
      font-size: 16px;
      color: #4b5563;
      margin: 0 0 16px 0;
    }
    
    /* Button */
    .button {
      display: inline-block;
      padding: 14px 28px;
      margin: 16px 0;
      background: linear-gradient(to right, ${accentColor}, ${primaryColor});
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
    }
    
    .button:hover {
      opacity: 0.9;
    }
    
    /* Info box */
    .info-box {
      background-color: #f9fafb;
      border-left: 4px solid ${accentColor};
      padding: 16px;
      margin: 16px 0;
      border-radius: 4px;
    }
    
    .info-label {
      font-size: 12px;
      text-transform: uppercase;
      color: #6b7280;
      margin: 0 0 4px 0;
      font-weight: 600;
    }
    
    .info-value {
      font-size: 16px;
      color: #111827;
      margin: 0;
    }
    
    /* Footer */
    .footer {
      padding: 24px;
      text-align: center;
      background-color: #f9fafb;
      border-top: 1px solid #e5e7eb;
    }
    
    .footer-text {
      font-size: 14px;
      color: #6b7280;
      margin: 8px 0;
    }
    
    .footer-link {
      color: ${primaryColor};
      text-decoration: none;
    }
    
    /* Responsive */
    @media only screen and (max-width: 600px) {
      .content { padding: 24px 16px !important; }
      .title { font-size: 20px !important; }
      .button { display: block !important; width: 100% !important; text-align: center; }
    }
  </style>
</head>
<body>
  ${preheader ? `
  <div style="display: none; max-height: 0; overflow: hidden;">
    ${preheader}
  </div>
  ` : ''}
  
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6; padding: 32px 0;">
    <tr>
      <td align="center">
        <table class="container" role="presentation" cellspacing="0" cellpadding="0" border="0" width="600">
          
          <!-- Header -->
          <tr>
            <td class="header">
              ${logoUrl ? `
                <img src="${logoUrl}" alt="${companyName}" class="logo">
              ` : `
                <h1 class="company-name">${companyName}</h1>
              `}
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td class="content">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td class="footer">
              <p class="footer-text">
                <strong>${companyName}</strong>
              </p>
              <p class="footer-text">
                Powered by MCPForms
              </p>
              <p class="footer-text">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}" class="footer-link">Visit Website</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
