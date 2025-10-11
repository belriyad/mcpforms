import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

const BASE_URL = process.env.TEST_BASE_URL || 'https://formgenai-4545.web.app';
const TEST_EMAIL = process.env.TEST_USER_EMAIL!;
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD!;

test.describe('Create Service & Test Download Buttons', () => {
  let serviceId: string | null = null;

  test('Create service and verify download buttons work', async ({ page }) => {
    console.log('\n🚀 TESTING WITH NEW SERVICE');
    console.log('================================================\n');

    // Step 1: Login
    console.log('🔐 STEP 1: LOGIN');
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/**', { timeout: 15000 });
    console.log('✅ Logged in\n');

    // Step 2: Navigate to Services
    console.log('🔧 STEP 2: CREATE NEW SERVICE');
    await page.goto(`${BASE_URL}/admin/services`);
    await page.waitForLoadState('domcontentloaded');
    
    // Take screenshot of services page
    await page.screenshot({ path: 'test-results/services-page.png', fullPage: true });
    
    // Look for Create/New Service button
    try {
      const createBtn = page.locator('button:has-text("Create Service"), button:has-text("New Service"), button:has-text("Add Service")').first();
      await createBtn.click({ timeout: 5000 });
      console.log('✅ Clicked create service button');
    } catch (error) {
      console.log('⚠️  Could not find create button, trying alternative...');
      // Look for a "+" button or link
      const addBtn = page.locator('button:has-text("+"), a:has-text("Create"), a:has-text("New")').first();
      await addBtn.click({ timeout: 5000 });
    }
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/create-service-modal.png', fullPage: true });
    
    // Fill service form
    const timestamp = Date.now();
    const serviceName = `Download Test Service ${timestamp}`;
    
    try {
      // Try different possible input selectors
      const nameInput = page.locator('input[name="name"], input[name="serviceName"], input[placeholder*="name" i]').first();
      await nameInput.fill(serviceName);
      console.log(`📝 Entered service name: ${serviceName}`);
      
      // Wait a moment for form to be ready
      await page.waitForTimeout(1000);
      
      // Select template - try multiple selectors
      const templateField = page.locator('select, [role="combobox"], [role="listbox"]').first();
      await templateField.click();
      await page.waitForTimeout(1000);
      
      // Select second option (first is usually placeholder)
      const options = page.locator('option, [role="option"]');
      const optionCount = await options.count();
      console.log(`📋 Found ${optionCount} template options`);
      
      if (optionCount > 1) {
        await options.nth(1).click();
        console.log('✅ Selected first template');
      } else {
        console.log('⚠️  No templates found! Please upload a template first.');
        console.log('   Go to: https://formgenai-4545.web.app/admin/templates');
        console.log('   Upload: test-files/sample-template.docx');
        throw new Error('No templates available. Please upload a template first.');
      }
      
      // Submit form
      await page.waitForTimeout(1000);
      const submitBtn = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Save")').first();
      await submitBtn.click();
      console.log('✅ Submitted form');
      
      // Wait for redirect
      await page.waitForURL('**/admin/services/**', { timeout: 10000 });
      
      // Extract service ID
      const url = page.url();
      const match = url.match(/\/services\/([^\/\?]+)/);
      if (match) {
        serviceId = match[1];
        console.log(`✅ Service created: ${serviceId}\n`);
      }
      
    } catch (error) {
      console.error('❌ Error creating service:', error);
      await page.screenshot({ path: 'test-results/create-service-error.png', fullPage: true });
      throw error;
    }

    // Step 3: Test Document Generation
    console.log('📄 STEP 3: TEST DOCUMENT GENERATION');
    console.log('---------------------------------------------');
    
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    // Capture console logs
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('📊') || text.includes('✅') || text.includes('❌')) {
        console.log(`[BROWSER] ${text}`);
      }
    });
    
    // Find and click Regenerate button
    const regenerateBtn = page.locator('button:has-text("Regenerate Documents"), button:has-text("Generate Documents")').first();
    
    await regenerateBtn.waitFor({ state: 'visible', timeout: 10000 });
    console.log('🔄 Found Regenerate Documents button');
    
    await page.screenshot({ path: 'test-results/before-regenerate.png', fullPage: true });
    
    console.log('🔄 Clicking Regenerate Documents...');
    await regenerateBtn.click();
    
    // Monitor for 30 seconds
    console.log('⏳ Monitoring button state (30 seconds)...');
    let downloadEnabled = false;
    
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(3000);
      
      const status = await page.evaluate(() => {
        const downloadBtns = Array.from(document.querySelectorAll('button'))
          .filter(b => 
            b.textContent?.toLowerCase().includes('download') &&
            !b.textContent?.toLowerCase().includes('regenerate')
          );
        
        return {
          count: downloadBtns.length,
          anyEnabled: downloadBtns.some(b => !b.disabled),
          allStates: downloadBtns.map(b => ({
            text: b.textContent?.trim().substring(0, 30),
            disabled: b.disabled,
            className: b.className
          }))
        };
      });
      
      console.log(`   Check ${i + 1}/10: ${status.anyEnabled ? '✅ ENABLED!' : '⏳ Still disabled'} (${status.count} buttons)`);
      
      if (status.anyEnabled) {
        downloadEnabled = true;
        console.log('   Button states:', JSON.stringify(status.allStates, null, 2));
        break;
      }
    }
    
    // Take final screenshot
    await page.screenshot({ 
      path: `test-results/final-state-${downloadEnabled ? 'success' : 'failed'}.png`,
      fullPage: true 
    });
    
    if (downloadEnabled) {
      console.log('\n🎉 SUCCESS! Download buttons are enabled!');
      console.log('================================================\n');
      console.log(`📋 Service ID: ${serviceId}`);
      console.log(`🔗 URL: ${BASE_URL}/admin/services/${serviceId}\n`);
    } else {
      console.log('\n❌ FAILED: Download buttons still disabled after 30 seconds');
      console.log('================================================\n');
      
      // Get more info
      const debugInfo = await page.evaluate(() => {
        return {
          url: window.location.href,
          alerts: Array.from(document.querySelectorAll('[role="alert"]')).map(a => a.textContent),
          buttonCount: document.querySelectorAll('button').length
        };
      });
      console.log('Debug info:', JSON.stringify(debugInfo, null, 2));
      
      throw new Error('Download buttons did not enable within 30 seconds');
    }
  });
});
