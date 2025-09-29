import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('MCPForms Basic Functionality Test', () => {
  
  test('Server is running and admin page loads', async ({ page }) => {
    console.log('🔍 Testing basic server functionality...');
    
    // Navigate to admin page
    console.log('🔗 Navigating to admin page...');
    await page.goto(`${BASE_URL}/admin`);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/admin-page-test.png' });
    
    // Check if page loaded
    const pageTitle = await page.title();
    console.log('📄 Page title:', pageTitle);
    
    // Look for any visible content
    const bodyText = await page.locator('body').textContent();
    console.log('📝 Page content length:', bodyText?.length || 0);
    
    if (bodyText && bodyText.length > 100) {
      console.log('✅ Admin page loaded successfully');
    } else {
      console.log('⚠️ Admin page may not have loaded properly');
    }
    
    // Check for login form or dashboard
    const hasLoginForm = await page.locator('input[type="email"]').isVisible({ timeout: 5000 });
    const hasDashboard = await page.locator('text=Template Management').isVisible({ timeout: 5000 });
    
    if (hasLoginForm) {
      console.log('🔐 Login form detected');
    } else if (hasDashboard) {
      console.log('📊 Dashboard detected (already logged in)');
    } else {
      console.log('❓ Unknown page state');
    }
    
    console.log('✅ Basic functionality test completed');
  });

  test('Check if sample templates exist', async ({ page }) => {
    console.log('📁 Checking for sample template files...');
    
    const fs = require('fs');
    const path = require('path');
    
    const sampleDir = path.join(process.cwd(), 'src', 'sample');
    const expectedFiles = [
      'Certificate_of_Trust_Fillable Template.docx',
      'Revocable Living Trust Template.docx',
      'Warranty Deed Template.docx'
    ];
    
    console.log('🔍 Looking in directory:', sampleDir);
    
    if (fs.existsSync(sampleDir)) {
      const files = fs.readdirSync(sampleDir);
      console.log('📄 Found files:', files);
      
      expectedFiles.forEach(expectedFile => {
        if (files.includes(expectedFile)) {
          console.log(`✅ Found: ${expectedFile}`);
        } else {
          console.log(`❌ Missing: ${expectedFile}`);
        }
      });
    } else {
      console.log('❌ Sample directory does not exist');
      console.log('ℹ️ Create src/sample/ directory and add template files for automation');
    }
  });

  test('Test a known intake URL if available', async ({ page }) => {
    console.log('🧪 Testing intake URL functionality...');
    
    // Test URLs that might exist (replace with real ones when available)
    const testUrls = [
      `${BASE_URL}/intake/test-token-123`,
      `${BASE_URL}/intake/demo-form-456`,
      `${BASE_URL}/intake/sample-intake`
    ];
    
    for (const testUrl of testUrls) {
      console.log(`🔗 Testing: ${testUrl}`);
      
      try {
        await page.goto(testUrl);
        await page.waitForLoadState('networkidle');
        
        const pageTitle = await page.title();
        const bodyText = await page.locator('body').textContent();
        
        console.log(`📄 Title: ${pageTitle}`);
        console.log(`📝 Content length: ${bodyText?.length || 0}`);
        
        // Check for form elements
        const hasForm = await page.locator('form').count() > 0;
        const hasInputs = await page.locator('input').count() > 0;
        
        if (hasForm && hasInputs) {
          console.log('✅ Intake form found! This URL is working.');
          
          // Take screenshot
          await page.screenshot({ 
            path: `test-results/working-intake-form-${Date.now()}.png`,
            fullPage: true 
          });
          
          // Try to fill a simple field
          const nameField = page.locator('input[name*="name"], input[placeholder*="name"]').first();
          if (await nameField.isVisible({ timeout: 2000 })) {
            await nameField.fill('Test User');
            console.log('📝 Successfully filled a test field');
          }
          
          break; // Found a working URL, no need to test others
        } else {
          console.log('⚠️ No form found on this URL');
        }
        
      } catch (error) {
        console.log(`❌ Error testing ${testUrl}:`, error instanceof Error ? error.message : String(error));
      }
    }
  });
  
});