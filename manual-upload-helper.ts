import { chromium } from 'playwright';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

const PRODUCTION_URL = 'https://formgenai-4545.web.app';

async function uploadTemplate() {
  console.log('\n' + '='.repeat(70));
  console.log('🤖 MANUAL ASSISTED UPLOAD');
  console.log('='.repeat(70));
  console.log('\nI\'ll open the browser and navigate to the upload page.');
  console.log('The browser will stay open so you can complete the upload manually.\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 // Slow down for visibility
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const testUser = {
    email: process.env.TEST_USER_EMAIL || 'belal.riyad@gmail.com',
    password: process.env.TEST_USER_PASSWORD || '9920032'
  };
  
  try {
    // Login
    console.log('🔐 Logging in...');
    await page.goto(`${PRODUCTION_URL}/login`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    await page.getByLabel(/email/i).fill(testUser.email);
    await page.getByLabel(/password/i).fill(testUser.password);
    await page.getByRole('button', { name: /sign in|login/i }).click();
    
    await page.waitForFunction(() => window.location.pathname.includes('admin'), { timeout: 30000 });
    await page.waitForTimeout(2000);
    console.log('✅ Logged in!');
    
    // Navigate to Templates
    console.log('\n📂 Navigating to Templates...');
    await page.goto(`${PRODUCTION_URL}/admin`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    const templatesTab = page.getByRole('tab', { name: /templates/i });
    if (await templatesTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await templatesTab.click();
      await page.waitForTimeout(1000);
    }
    console.log('✅ On Templates page!');
    
    // Click Upload button
    console.log('\n➕ Opening upload dialog...');
    const uploadButton = page.getByRole('button', { name: /\+|upload/i }).first();
    await uploadButton.click();
    await page.waitForTimeout(2000);
    console.log('✅ Upload dialog opened!');
    
    console.log('\n' + '='.repeat(70));
    console.log('📋 INSTRUCTIONS:');
    console.log('='.repeat(70));
    console.log('\n1. The browser window is now open with the upload dialog');
    console.log('2. Click "Choose File" or drag-and-drop');
    console.log('3. Select: src/sample/Warranty Deed Template.docx');
    console.log('4. Fill in template name: "Warranty Deed Template"');
    console.log('5. Click "Upload & Parse" or "Upload Template"');
    console.log('6. Wait for upload to complete');
    console.log('7. Press Ctrl+C in this terminal when done\n');
    console.log('The browser will stay open for you to complete the upload.');
    console.log('='.repeat(70) + '\n');
    
    // Keep the script running
    await new Promise(resolve => {
      process.on('SIGINT', () => {
        console.log('\n\n✅ Upload session ended. Closing browser...\n');
        resolve(undefined);
      });
    });
    
  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await browser.close();
    console.log('👋 Browser closed. Goodbye!\n');
    process.exit(0);
  }
}

uploadTemplate();
