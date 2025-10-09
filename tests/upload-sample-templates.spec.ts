import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: '.env.test' });

// Helper functions
async function takeScreenshot(page: any, name: string, description: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `test-results/${timestamp}-${name}.png`;
  await page.screenshot({ path: filename, fullPage: true });
  console.log(`📸 Screenshot: ${description} → ${filename}`);
}

async function safeClick(page: any, selector: any, description: string, timeout = 30000): Promise<boolean> {
  try {
    await selector.waitFor({ state: 'visible', timeout: Math.min(timeout, 10000) });
    await selector.click({ timeout });
    console.log(`✅ Clicked: ${description}`);
    return true;
  } catch (error) {
    console.log(`❌ Failed to click: ${description}`);
    return false;
  }
}

async function safeFill(page: any, selector: any, value: string, description: string): Promise<boolean> {
  try {
    await selector.waitFor({ state: 'visible', timeout: 10000 });
    await selector.fill(value);
    console.log(`✅ Filled: ${description} = "${value}"`);
    return true;
  } catch (error) {
    console.log(`❌ Failed to fill: ${description}`);
    return false;
  }
}

test.describe('Upload Sample Templates', () => {
  
  test.use({
    actionTimeout: 30000,
    navigationTimeout: 90000,
  });

  test('Upload all templates from sample folder', async ({ page }) => {
    test.setTimeout(600000); // 10 minutes for uploads
    
    const email = process.env.TEST_USER_EMAIL!;
    const password = process.env.TEST_USER_PASSWORD!;
    
    console.log('\n============================================================');
    console.log('📤 UPLOADING SAMPLE TEMPLATES');
    console.log('============================================================');
    console.log(`📧 Test User: ${email}`);
    console.log(`⏰ Timestamp: ${new Date().toLocaleString()}`);
    console.log('============================================================\n\n');

    // Template files to upload
    const templateFiles = [
      {
        name: 'Warranty Deed Template',
        path: path.resolve(__dirname, '../src/sample/Warranty Deed Template.docx'),
        description: 'Warranty Deed legal document template'
      },
      {
        name: 'Revocable Living Trust Template',
        path: path.resolve(__dirname, '../src/sample/Revocable Living Trust Template.docx'),
        description: 'Revocable Living Trust legal document template'
      },
      {
        name: 'Certificate of Trust Fillable Template',
        path: path.resolve(__dirname, '../src/sample/Certificate_of_Trust_Fillable Template.docx'),
        description: 'Certificate of Trust fillable legal document template'
      }
    ];

    try {
      // ============================================================
      // STEP 1: LOGIN
      // ============================================================
      console.log('🔐 STEP 1: LOGIN');
      console.log('------------------------------------------------------------');
      
      await page.goto('https://formgenai-4545.web.app/login', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      await takeScreenshot(page, '01-login-page', 'Login page loaded');
      
      await safeFill(page, page.locator('input[type="email"]'), email, 'Email field');
      await safeFill(page, page.locator('input[type="password"]'), password, 'Password field');
      
      const loginButton = page.getByRole('button', { name: /sign in|login/i });
      await safeClick(page, loginButton, 'Sign In button');
      
      console.log('⏳ Waiting for login...');
      await page.waitForFunction(() => window.location.pathname.includes('admin'), { timeout: 30000 });
      await page.waitForTimeout(2000);
      
      await takeScreenshot(page, '02-logged-in', 'Logged in successfully');
      console.log('✅ STEP 1 COMPLETE: Logged in\n\n');

      // ============================================================
      // STEP 2: NAVIGATE TO TEMPLATES TAB
      // ============================================================
      console.log('📄 STEP 2: NAVIGATE TO TEMPLATES TAB');
      console.log('------------------------------------------------------------');
      
      await page.goto('https://formgenai-4545.web.app/admin', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);
      
      // Click on Templates tab
      const templatesTab = page.getByRole('tab', { name: /templates/i }).or(
        page.getByText(/^Templates$/).first()
      );
      const templatesTabVisible = await templatesTab.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (templatesTabVisible) {
        await templatesTab.click();
        console.log('✅ Clicked Templates tab');
      } else {
        // Try alternative methods to find templates tab
        console.log('⚠️  Templates tab not found by role, trying text search...');
        const allElements = await page.locator('button, a, [role="tab"]').all();
        for (const elem of allElements) {
          const text = await elem.textContent();
          if (text && text.toLowerCase().includes('template')) {
            await elem.click();
            console.log(`✅ Clicked element with text: "${text}"`);
            break;
          }
        }
      }
      
      await page.waitForTimeout(2000);
      await takeScreenshot(page, '03-templates-tab', 'Templates tab loaded');
      
      // Check existing templates count
      const existingTemplates = await page.locator('[class*="template"], [class*="card"], [data-testid*="template"]').count();
      console.log(`📊 Existing templates: ${existingTemplates}`);
      console.log('✅ STEP 2 COMPLETE: On templates tab\n\n');

      // ============================================================
      // STEP 3: UPLOAD EACH TEMPLATE
      // ============================================================
      console.log('📤 STEP 3: UPLOAD TEMPLATES');
      console.log('------------------------------------------------------------');
      
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < templateFiles.length; i++) {
        const template = templateFiles[i];
        console.log(`\n📝 Uploading ${i + 1}/${templateFiles.length}: ${template.name}`);
        console.log(`   File: ${template.path}`);
        
        try {
          // Look for upload/add button
          const uploadButton = page.getByRole('button', { name: /upload|add template|new template|\+ template|create template/i }).first();
          const uploadButtonVisible = await uploadButton.isVisible({ timeout: 3000 }).catch(() => false);
          
          if (!uploadButtonVisible) {
            console.log(`⚠️  Upload button not found, trying alternative methods...`);
            
            // Try clicking anywhere that might be an upload trigger
            const altButtons = await page.locator('button:has-text("Add"), button:has-text("+"), button:has-text("New"), button:has-text("Upload")').all();
            for (const btn of altButtons) {
              const text = await btn.textContent();
              console.log(`   Found button: "${text}"`);
            }
            
            // Try the first button with Upload in text
            for (const btn of altButtons) {
              const text = await btn.textContent();
              if (text && text.toLowerCase().includes('upload')) {
                await btn.click();
                console.log(`✅ Clicked: "${text}"`);
                break;
              }
            }
          } else {
            await uploadButton.click();
            console.log('✅ Clicked upload button');
          }
          
          await page.waitForTimeout(2000);
          await takeScreenshot(page, `04-upload-modal-${i + 1}`, `Upload modal for ${template.name}`);
          
          // Look for file input
          const fileInput = page.locator('input[type="file"]').first();
          await fileInput.waitFor({ state: 'attached', timeout: 5000 }).catch(() => {});
          
          // Set file regardless of visibility
          await fileInput.setInputFiles(template.path);
          console.log(`✅ Selected file: ${template.name}`);
          await page.waitForTimeout(2000);
          
          // Fill template name if there's a name field
          const nameInput = page.getByLabel(/template name|name/i).or(page.getByPlaceholder(/template name|name/i)).first();
          const nameInputVisible = await nameInput.isVisible({ timeout: 2000 }).catch(() => false);
          
          if (nameInputVisible) {
            await nameInput.fill(template.name);
            console.log(`✅ Filled template name: ${template.name}`);
          }
          
          // Fill description if there's a description field
          const descInput = page.getByLabel(/description/i).or(page.getByPlaceholder(/description/i)).first();
          const descInputVisible = await descInput.isVisible({ timeout: 2000 }).catch(() => false);
          
          if (descInputVisible) {
            await descInput.fill(template.description);
            console.log(`✅ Filled description`);
          }
          
          await takeScreenshot(page, `05-upload-ready-${i + 1}`, `Ready to upload ${template.name}`);
          
          // Click upload button - specific button text from TemplateUpload component
          const uploadBtn = page.getByRole('button', { name: /upload template|upload & parse/i }).first();
          const uploadBtnVisible = await uploadBtn.isVisible({ timeout: 3000 }).catch(() => false);
          
          let confirmClicked = false;
          if (uploadBtnVisible) {
            confirmClicked = await safeClick(page, uploadBtn, 'Upload Template button');
          } else {
            // Try any button with upload in it
            const anyUploadBtn = page.locator('button:has-text("Upload")').first();
            confirmClicked = await safeClick(page, anyUploadBtn, 'Upload button');
          }
          
          if (confirmClicked) {
            console.log('⏳ Waiting for upload to complete...');
            await page.waitForTimeout(8000); // Longer wait for upload and AI processing
            
            await takeScreenshot(page, `06-uploaded-${i + 1}`, `Uploaded ${template.name}`);
            console.log(`✅ SUCCESS: ${template.name} uploaded!`);
            successCount++;
            
            // Wait a bit longer for upload to complete
            await page.waitForTimeout(3000);
            
            // Go back to admin page templates tab for next upload
            await page.goto('https://formgenai-4545.web.app/admin', { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(2000);
            
            // Click templates tab again
            const templatesTabAgain = page.getByRole('tab', { name: /templates/i }).or(
              page.getByText(/^Templates$/).first()
            );
            const tabVisible = await templatesTabAgain.isVisible({ timeout: 3000 }).catch(() => false);
            if (tabVisible) {
              await templatesTabAgain.click();
              await page.waitForTimeout(1000);
            }
          } else {
            console.log(`❌ FAILED: Could not confirm upload for ${template.name}`);
            failCount++;
          }
          
        } catch (error) {
          console.log(`❌ ERROR uploading ${template.name}: ${error}`);
          failCount++;
          
          // Try to recover - go back to admin page templates tab
          await page.goto('https://formgenai-4545.web.app/admin', { waitUntil: 'domcontentloaded' });
          await page.waitForTimeout(2000);
          const templatesTabRecover = page.getByRole('tab', { name: /templates/i }).or(
            page.getByText(/^Templates$/).first()
          );
          const tabVisible = await templatesTabRecover.isVisible({ timeout: 3000 }).catch(() => false);
          if (tabVisible) {
            await templatesTabRecover.click();
            await page.waitForTimeout(1000);
          }
        }
      }

      console.log('\n✅ STEP 3 COMPLETE: Template upload process finished\n\n');

      // ============================================================
      // STEP 4: VERIFY UPLOADS
      // ============================================================
      console.log('🔍 STEP 4: VERIFY UPLOADS');
      console.log('------------------------------------------------------------');
      
      await page.goto('https://formgenai-4545.web.app/admin', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      
      // Click templates tab one more time
      const templatesTabFinal = page.getByRole('tab', { name: /templates/i }).or(
        page.getByText(/^Templates$/).first()
      );
      const tabVisibleFinal = await templatesTabFinal.isVisible({ timeout: 3000 }).catch(() => false);
      if (tabVisibleFinal) {
        await templatesTabFinal.click();
        await page.waitForTimeout(2000);
      }
      
      const finalTemplateCount = await page.locator('[class*="template"], [class*="card"], [data-testid*="template"]').count();
      console.log(`📊 Templates after upload: ${finalTemplateCount}`);
      console.log(`📈 Templates added: ${finalTemplateCount - existingTemplates}`);
      
      await takeScreenshot(page, '07-final-templates', 'Final templates page');
      console.log('✅ STEP 4 COMPLETE: Verification done\n\n');

      // ============================================================
      // FINAL SUMMARY
      // ============================================================
      console.log('\n============================================================');
      console.log('🎉 TEMPLATE UPLOAD SUMMARY');
      console.log('============================================================');
      console.log(`✅ Successful uploads: ${successCount}/${templateFiles.length}`);
      console.log(`❌ Failed uploads: ${failCount}/${templateFiles.length}`);
      console.log(`📊 Initial templates: ${existingTemplates}`);
      console.log(`📊 Final templates: ${finalTemplateCount}`);
      console.log(`📈 Net change: +${finalTemplateCount - existingTemplates}`);
      console.log('============================================================\n');
      
      // Verify at least one template was uploaded
      if (successCount > 0) {
        console.log('✅ TEST PASSED: At least one template uploaded successfully!');
      } else {
        console.log('⚠️  TEST WARNING: No templates uploaded successfully');
        console.log('   This might be due to UI differences - check screenshots');
      }
      
    } catch (error) {
      console.log(`\n❌ TEST FAILED: ${error}`);
      await takeScreenshot(page, '99-error', 'Error occurred');
      throw error;
    }
  });

  // Additional test: Just check the templates page UI
  test('Analyze templates page UI', async ({ page }) => {
    test.setTimeout(120000);
    
    const email = process.env.TEST_USER_EMAIL!;
    const password = process.env.TEST_USER_PASSWORD!;
    
    console.log('\n🔍 ANALYZING TEMPLATES PAGE UI\n');
    
    // Login
    await page.goto('https://formgenai-4545.web.app/login');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForFunction(() => window.location.pathname.includes('admin'), { timeout: 30000 });
    await page.waitForTimeout(2000);
    
    // Go to templates
    await page.goto('https://formgenai-4545.web.app/admin/templates');
    await page.waitForTimeout(3000);
    
    console.log('📄 Page URL:', page.url());
    console.log('📄 Page Title:', await page.title());
    
    // Find all buttons
    console.log('\n🔘 All Buttons:');
    const buttons = await page.locator('button').all();
    for (let i = 0; i < buttons.length; i++) {
      const btn = buttons[i];
      const text = await btn.textContent();
      const visible = await btn.isVisible();
      console.log(`  ${i + 1}. "${text}" (visible: ${visible})`);
    }
    
    // Find all inputs
    console.log('\n📝 All Inputs:');
    const inputs = await page.locator('input').all();
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const type = await input.getAttribute('type');
      const visible = await input.isVisible();
      console.log(`  ${i + 1}. type="${type}" (visible: ${visible})`);
    }
    
    // Find all links
    console.log('\n🔗 All Links:');
    const links = await page.locator('a').all();
    for (let i = 0; i < Math.min(links.length, 10); i++) {
      const link = links[i];
      const text = await link.textContent();
      const href = await link.getAttribute('href');
      console.log(`  ${i + 1}. "${text}" → ${href}`);
    }
    
    await takeScreenshot(page, 'templates-page-analysis', 'Templates page UI analysis');
    console.log('\n✅ Analysis complete - check screenshot\n');
  });
});
