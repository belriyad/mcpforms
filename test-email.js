/**
 * Quick test script to verify Resend email configuration
 * Run with: node test-email.js
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { Resend } = require('resend');

async function testEmail() {
  console.log('🧪 Testing Resend Email Configuration...\n');
  
  // Check if API key is configured
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';
  const fromName = process.env.FROM_NAME || 'MCPForms';
  
  if (!apiKey) {
    console.error('❌ RESEND_API_KEY not found in .env.local');
    process.exit(1);
  }
  
  console.log('✅ API Key found:', apiKey.substring(0, 10) + '...');
  console.log('✅ From Email:', fromEmail);
  console.log('✅ From Name:', fromName);
  console.log('');
  
  // Initialize Resend
  const resend = new Resend(apiKey);
  
  // Send test email
  try {
    console.log('📧 Sending test email...');
    
    const result = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: 'rubazayed@gmail.com', // Change to your email
      subject: 'MCPForms Email Test - Success! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4F46E5;">Email Configuration Successful! 🎉</h1>
          <p>Your MCPForms email system is now working correctly.</p>
          
          <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0;">Configuration Details:</h2>
            <ul>
              <li><strong>From Email:</strong> ${fromEmail}</li>
              <li><strong>From Name:</strong> ${fromName}</li>
              <li><strong>API Status:</strong> Connected ✅</li>
            </ul>
          </div>
          
          <p>You can now:</p>
          <ul>
            <li>Send intake forms to clients</li>
            <li>Receive submission notifications</li>
            <li>Send automated reminders</li>
          </ul>
          
          <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
            This is a test email from your MCPForms production deployment.
          </p>
        </div>
      `
    });
    
    console.log('\n✅ Email sent successfully!');
    console.log('📬 Email ID:', result.data?.id);
    console.log('');
    console.log('Check your inbox at: rubazayed@gmail.com');
    console.log('');
    console.log('🎊 Email system is ready for production!');
    
  } catch (error) {
    console.error('\n❌ Email sending failed:');
    console.error(error.message);
    
    if (error.message.includes('API key')) {
      console.log('\n💡 Tip: Verify your Resend API key is correct');
    }
    
    process.exit(1);
  }
}

testEmail();
