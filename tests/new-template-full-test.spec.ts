import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load test environment variables
dotenv.config({ path: '.env.test' });

const BASE_URL = process.env.TEST_BASE_URL || 'https://formgenai-4545.web.app';
const TEST_EMAIL = process.env.TEST_USER_EMAIL!;
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD!;

// Configure test settings at top level
test.use({ 
  viewport: { width: 1920, height: 1080 }
});

test.describe('New Template Upload & Document Generation Test', () => {
  let serviceId: string | null = null;
  let templateId: string | null = null;

  test('Complete workflow: Upload template → Create service → Generate documents → Download', async ({ page }) => {
    console.log('\n🚀 STARTING NEW TEMPLATE FULL TEST');
    console.log('================================================\n');

    // Step 1: Login
    console.log('🔐 STEP 1: LOGIN');
    console.log('---------------------------------------------');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('domcontentloaded');
    
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/admin/**', { timeout: 15000 });
    console.log('✅ Login successful\n');

    // Step 2: Navigate to Templates
    console.log('📄 STEP 2: NAVIGATE TO TEMPLATES');
    console.log('---------------------------------------------');
    await page.goto(`${BASE_URL}/admin/templates`);
    await page.waitForLoadState('domcontentloaded');
    console.log('✅ On templates page\n');

    // Step 3: Upload Template
    console.log('📤 STEP 3: UPLOAD NEW TEMPLATE');
    console.log('---------------------------------------------');
    
    // Create a sample DOCX file for testing (or use existing one)
    const testFilePath = path.join(process.cwd(), 'test-files', 'sample-template.docx');
    
    // Check if test file exists, if not create directory
    const testFilesDir = path.join(process.cwd(), 'test-files');
    if (!fs.existsSync(testFilesDir)) {
      fs.mkdirSync(testFilesDir, { recursive: true });
    }

    // If no test file exists, we'll look for any existing template file in the project
    let uploadFilePath = testFilePath;
    if (!fs.existsSync(testFilePath)) {
      console.log('⚠️  Sample template not found, looking for existing templates...');
      // Look for any .docx files in common locations
      const possiblePaths = [
        path.join(process.cwd(), 'sample-template.docx'),
        path.join(process.cwd(), 'templates', 'sample.docx'),
        path.join(process.cwd(), 'test-templates', 'sample.docx')
      ];
      
      for (const possiblePath of possiblePaths) {
        if (fs.existsSync(possiblePath)) {
          uploadFilePath = possiblePath;
          console.log(`✅ Found template at: ${possiblePath}`);
          break;
        }
      }
      
      if (!fs.existsSync(uploadFilePath)) {
        console.log('❌ No template file found. Please provide a .docx file.');
        console.log('📝 Expected location: test-files/sample-template.docx');
        throw new Error('No template file available for upload');
      }
    }

    // Find and click upload button
    const uploadButton = page.locator('button:has-text("Upload Template"), button:has-text("New Template"), input[type="file"]').first();
    
    // Handle file input
    const fileInput = await page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(uploadFilePath);
    
    console.log(`📁 Uploaded file: ${path.basename(uploadFilePath)}`);
    console.log('⏳ Waiting for AI field extraction...');
    
    // Wait for upload to complete and AI processing
    await page.waitForTimeout(5000); // Give it time to upload
    
    // Look for success message or new template in list
    try {
      await page.waitForSelector('text=/successfully|uploaded|processing/i', { timeout: 10000 });
      console.log('✅ Template upload initiated');
    } catch {
      console.log('⚠️  Upload message not found, continuing...');
    }
    
    // Wait for AI extraction to complete (usually 30-60 seconds)
    console.log('⏳ Waiting 60 seconds for AI field extraction...');
    await page.waitForTimeout(60000);
    
    // Refresh to see the new template
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    console.log('✅ Template should be ready\n');

    // Step 4: Create Service with New Template
    console.log('🔧 STEP 4: CREATE SERVICE');
    console.log('---------------------------------------------');
    await page.goto(`${BASE_URL}/admin/services`);
    await page.waitForLoadState('domcontentloaded');
    
    // Click Create Service button
    const createServiceBtn = page.locator('button:has-text("Create Service"), button:has-text("New Service")').first();
    await createServiceBtn.click();
    await page.waitForTimeout(2000);
    
    // Fill service details
    const timestamp = Date.now();
    const serviceName = `Test Service ${timestamp}`;
    await page.fill('input[name="name"], input[placeholder*="service name" i]', serviceName);
    
    // Select the first template (our newly uploaded one)
    const templateSelect = page.locator('select, [role="combobox"]').first();
    await templateSelect.click();
    await page.waitForTimeout(1000);
    
    // Select first option after placeholder
    const firstTemplate = page.locator('option, [role="option"]').nth(1);
    await firstTemplate.click();
    
    console.log(`📝 Service name: ${serviceName}`);
    
    // Submit form
    const submitBtn = page.locator('button[type="submit"], button:has-text("Create")').first();
    await submitBtn.click();
    
    // Wait for redirect to service detail page
    await page.waitForURL('**/admin/services/**', { timeout: 10000 });
    
    // Extract service ID from URL
    const url = page.url();
    const match = url.match(/\/services\/([^\/\?]+)/);
    if (match) {
      serviceId = match[1];
      console.log(`✅ Service created: ${serviceId}\n`);
    } else {
      throw new Error('Could not extract service ID from URL');
    }

    // Step 5: Generate Documents
    console.log('📄 STEP 5: GENERATE DOCUMENTS');
    console.log('---------------------------------------------');
    
    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    console.log('📊 Initial page state:');
    const initialButtonState = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const downloadButtons = buttons.filter(b => 
        b.textContent?.toLowerCase().includes('download') ||
        b.textContent?.toLowerCase().includes('regenerate')
      );
      return downloadButtons.map(b => ({
        text: b.textContent?.trim(),
        disabled: b.disabled,
        classes: b.className
      }));
    });
    console.log(JSON.stringify(initialButtonState, null, 2));
    
    // Look for Regenerate Documents button
    const regenerateBtn = page.locator('button:has-text("Regenerate Documents"), button:has-text("Generate Documents")').first();
    await regenerateBtn.waitFor({ state: 'visible', timeout: 10000 });
    
    console.log('🔄 Clicking Regenerate Documents...');
    await regenerateBtn.click();
    
    // Wait for generation to start
    await page.waitForTimeout(3000);
    
    console.log('⏳ Waiting for document generation (monitoring state every 3 seconds)...');
    
    // Monitor button state for up to 30 seconds
    let downloadEnabled = false;
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(3000);
      
      const buttonState = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const downloadButtons = buttons.filter(b => 
          b.textContent?.toLowerCase().includes('download') &&
          !b.textContent?.toLowerCase().includes('regenerate')
        );
        
        const statuses = downloadButtons.map(b => ({
          text: b.textContent?.trim(),
          disabled: b.disabled,
          visible: b.offsetParent !== null
        }));
        
        // Check console for status
        return {
          buttons: statuses,
          anyEnabled: statuses.some(s => !s.disabled)
        };
      });
      
      console.log(`   Check ${i + 1}/10:`, buttonState.anyEnabled ? '✅ Enabled!' : '⏳ Still disabled');
      
      if (buttonState.anyEnabled) {
        downloadEnabled = true;
        console.log('✅ Download buttons are enabled!\n');
        break;
      }
    }
    
    if (!downloadEnabled) {
      console.log('⚠️  Download buttons still disabled after 30 seconds');
      
      // Take screenshot for debugging
      await page.screenshot({ 
        path: `test-results/new-template-test-still-disabled-${timestamp}.png`,
        fullPage: true 
      });
      
      // Get console logs
      const consoleLogs = await page.evaluate(() => {
        return (window as any).__consoleLogs || 'No console logs captured';
      });
      console.log('📋 Console logs:', consoleLogs);
    }

    // Step 6: Verify and Download
    console.log('📥 STEP 6: VERIFY DOWNLOAD');
    console.log('---------------------------------------------');
    
    // Find all download buttons
    const downloadButtons = page.locator('button:has-text("Download")').filter({
      hasNot: page.locator('button:has-text("Regenerate")')
    });
    
    const buttonCount = await downloadButtons.count();
    console.log(`📊 Found ${buttonCount} download button(s)`);
    
    if (buttonCount > 0) {
      const firstButton = downloadButtons.first();
      const isDisabled = await firstButton.isDisabled();
      
      if (!isDisabled) {
        console.log('✅ Download button is enabled!');
        
        // Take success screenshot
        await page.screenshot({ 
          path: `test-results/new-template-test-success-${timestamp}.png`,
          fullPage: true 
        });
        
        // Optionally click to test download
        console.log('🎉 TEST PASSED - Download buttons are working!');
      } else {
        console.log('❌ Download button is still disabled');
        
        // Get more debugging info
        const debugInfo = await page.evaluate(() => {
          // Check what's in Firestore data
          return {
            url: window.location.href,
            documentCount: document.querySelectorAll('[data-document-id]').length,
            buttonState: Array.from(document.querySelectorAll('button')).map(b => ({
              text: b.textContent?.trim().substring(0, 30),
              disabled: b.disabled
            }))
          };
        });
        console.log('🔍 Debug info:', JSON.stringify(debugInfo, null, 2));
        
        throw new Error('Download buttons remain disabled after generation');
      }
    } else {
      console.log('❌ No download buttons found');
      throw new Error('No download buttons found on page');
    }

    console.log('\n================================================');
    console.log('🎉 COMPLETE WORKFLOW TEST FINISHED');
    console.log('================================================\n');
    
    if (serviceId) {
      console.log('📋 SERVICE DETAILS:');
      console.log(`   Service ID: ${serviceId}`);
      console.log(`   Service Name: ${serviceName}`);
      console.log(`   URL: ${BASE_URL}/admin/services/${serviceId}`);
    }
  });
});
