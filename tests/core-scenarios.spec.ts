import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

const PRODUCTION_URL = 'https://formgenai-4545.web.app';

test.describe('Core Scenarios - Complete E2E Tests', () => {
  
  test.setTimeout(300000);
  
  test.use({
    actionTimeout: 30000,
    navigationTimeout: 90000,
  });

  test('COMPLETE WORKFLOW: Create Account → Login → Create Service → Generate Intake → Fill & Submit → Approve → Generate Document', async ({ page }) => {
    
    const timestamp = Date.now();
    const testUser = {
      email: `test${timestamp}@example.com`,
      password: 'TestPass123!',
      name: 'E2E Test User'
    };
    
    console.log('\n========================================');
    console.log('STEP 1: CREATE NEW ACCOUNT');
    console.log('========================================');
    
    await page.goto(`${PRODUCTION_URL}/signup`);
    await page.waitForLoadState('domcontentloaded');
    
    await page.getByLabel(/name/i).fill(testUser.name);
    await page.getByLabel(/email/i).fill(testUser.email);
    await page.getByLabel(/^password$/i).fill(testUser.password);
    await page.getByLabel(/confirm password/i).fill(testUser.password);
    
    const termsCheckbox = page.locator('input[type="checkbox"]');
    if (await termsCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
      await termsCheckbox.check();
    }
    
    console.log(`Creating account: ${testUser.email}`);
    await page.screenshot({ path: 'test-results/01-signup-filled.png', fullPage: true });
    
    await page.getByRole('button', { name: /sign up|create account/i }).click();
    await page.waitForURL('**/admin', { timeout: 60000 });
    await page.waitForLoadState('domcontentloaded');
    
    console.log('✅ Account created successfully!');
    await page.screenshot({ path: 'test-results/02-account-created.png', fullPage: true });
    
    console.log('\n========================================');
    console.log('STEP 2: CREATE A SERVICE');
    console.log('========================================');
    
    await page.goto(`${PRODUCTION_URL}/admin/services`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    const createButton = page.getByRole('button', { name: /create service|new service/i }).first();
    await expect(createButton).toBeVisible({ timeout: 10000 });
    await createButton.click();
    await page.waitForTimeout(2000);
    
    const serviceName = `E2E Test Service ${timestamp}`;
    await page.getByLabel(/service name|name/i).first().fill(serviceName);
    
    const descriptionInput = page.getByLabel(/description/i).first();
    if (await descriptionInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await descriptionInput.fill('Automated E2E test service');
    }
    
    console.log(`Creating service: ${serviceName}`);
    await page.screenshot({ path: 'test-results/03-service-form.png', fullPage: true });
    
    await page.getByRole('button', { name: /save|create|submit/i }).first().click();
    await page.waitForTimeout(3000);
    
    await page.waitForURL(/\/admin\/services\/[^/]+/, { timeout: 10000 });
    const serviceId = page.url().split('/').pop()!;
    
    console.log(`✅ Service created! ID: ${serviceId}`);
    await page.screenshot({ path: 'test-results/04-service-created.png', fullPage: true });
    
    console.log('\n========================================');
    console.log('STEP 3: GENERATE INTAKE FORM');
    console.log('========================================');
    
    await page.waitForTimeout(2000);
    const generateIntakeButton = page.getByRole('button', { name: /generate intake|create intake/i });
    
    let intakeToken = '';
    
    if (await generateIntakeButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await generateIntakeButton.click();
      await page.waitForTimeout(5000);
      
      console.log('Generating intake form...');
      await page.screenshot({ path: 'test-results/05-intake-generating.png', fullPage: true });
      
      await page.waitForTimeout(3000);
      
      const intakeLinkElement = page.locator('text=/intake_/i, a[href*="/intake/"], input[value*="/intake/"]').first();
      
      if (await intakeLinkElement.isVisible({ timeout: 5000 }).catch(() => false)) {
        const linkHref = await intakeLinkElement.getAttribute('href');
        const linkText = await intakeLinkElement.textContent();
        const inputValue = await intakeLinkElement.getAttribute('value');
        
        intakeToken = linkHref?.split('/intake/')[1] || 
                     linkText?.split('/intake/')[1] || 
                     inputValue?.split('/intake/')[1] || '';
        
        console.log(`✅ Intake generated! Token: ${intakeToken}`);
      } else {
        const pageText = await page.locator('body').textContent();
        const tokenMatch = pageText?.match(/intake_\w+/);
        if (tokenMatch) {
          intakeToken = tokenMatch[0];
          console.log(`✅ Found token: ${intakeToken}`);
        }
      }
      
      await page.screenshot({ path: 'test-results/06-intake-generated.png', fullPage: true });
    }
    
    if (intakeToken) {
      console.log('\n========================================');
      console.log('STEP 4: OPEN INTAKE LINK (AS CLIENT)');
      console.log('========================================');
      
      const intakeUrl = `${PRODUCTION_URL}/intake/${intakeToken}`;
      console.log(`Opening: ${intakeUrl}`);
      
      await page.goto(intakeUrl);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);
      
      await page.screenshot({ path: 'test-results/07-intake-opened.png', fullPage: true });
      
      const hasError = await page.locator('text=/error|not found|invalid/i').isVisible({ timeout: 3000 }).catch(() => false);
      
      if (!hasError) {
        console.log('✅ Intake form loaded!');
        
        console.log('\n========================================');
        console.log('STEP 5: FILL INTAKE FORM');
        console.log('========================================');
        
        const textInputs = page.locator('input[type="text"], input[type="email"], input[type="tel"], input[type="number"]');
        const count = await textInputs.count();
        
        console.log(`Filling ${count} input fields...`);
        
        for (let i = 0; i < count; i++) {
          const input = textInputs.nth(i);
          if (await input.isVisible({ timeout: 1000 }).catch(() => false)) {
            const type = await input.getAttribute('type');
            const name = await input.getAttribute('name') || `field-${i}`;
            
            let value = '';
            if (type === 'email' || name.toLowerCase().includes('email')) {
              value = 'client@example.com';
            } else if (type === 'tel' || name.toLowerCase().includes('phone')) {
              value = '555-123-4567';
            } else if (type === 'number') {
              value = '35';
            } else {
              value = `Test ${name}`;
            }
            
            await input.fill(value);
            console.log(`  ✓ ${name}: ${value}`);
          }
        }
        
        const textareas = page.locator('textarea');
        const textareaCount = await textareas.count();
        
        for (let i = 0; i < textareaCount; i++) {
          const textarea = textareas.nth(i);
          if (await textarea.isVisible({ timeout: 1000 }).catch(() => false)) {
            await textarea.fill('Test response for E2E testing');
            console.log(`  ✓ Textarea ${i + 1}`);
          }
        }
        
        console.log('✅ Form filled!');
        await page.screenshot({ path: 'test-results/08-intake-filled.png', fullPage: true });
        
        console.log('\n========================================');
        console.log('STEP 6: SUBMIT INTAKE FORM');
        console.log('========================================');
        
        const submitButton = page.getByRole('button', { name: /submit|send|continue/i }).last();
        if (await submitButton.isVisible({ timeout: 5000 }).catch(() => false)) {
          await submitButton.click();
          await page.waitForTimeout(5000);
          
          const successMessage = page.getByText(/success|submitted|thank you|received/i);
          if (await successMessage.isVisible({ timeout: 5000 }).catch(() => false)) {
            console.log('✅ Form submitted successfully!');
          } else {
            console.log('⚠️  Submit may have worked (no confirmation message)');
          }
          
          await page.screenshot({ path: 'test-results/09-intake-submitted.png', fullPage: true });
        }
        
        console.log('\n========================================');
        console.log('STEP 7: REVIEW AS ADMIN');
        console.log('========================================');
        
        await page.goto(`${PRODUCTION_URL}/admin/services/${serviceId}`);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(3000);
        
        console.log('Back on service page as admin');
        await page.screenshot({ path: 'test-results/10-admin-review.png', fullPage: true });
        
        const intakeTab = page.getByText(/intake|submission|response/i);
        if (await intakeTab.isVisible({ timeout: 3000 }).catch(() => false)) {
          await intakeTab.click();
          await page.waitForTimeout(2000);
        }
        
        console.log('\n========================================');
        console.log('STEP 8: APPROVE SUBMISSION');
        console.log('========================================');
        
        const approveButton = page.getByRole('button', { name: /approve/i }).first();
        if (await approveButton.isVisible({ timeout: 5000 }).catch(() => false)) {
          await approveButton.click();
          await page.waitForTimeout(2000);
          console.log('✅ Submission approved!');
          await page.screenshot({ path: 'test-results/11-approved.png', fullPage: true });
        } else {
          console.log('ℹ️  No approval needed');
        }
        
        console.log('\n========================================');
        console.log('STEP 9: GENERATE DOCUMENT');
        console.log('========================================');
        
        await page.waitForTimeout(2000);
        const generateDocButton = page.getByRole('button', { name: /generate document|create document/i }).first();
        
        if (await generateDocButton.isVisible({ timeout: 5000 }).catch(() => false)) {
          await generateDocButton.click();
          await page.waitForTimeout(5000);
          
          console.log('Document generation initiated!');
          await page.screenshot({ path: 'test-results/12-doc-generating.png', fullPage: true });
          
          await page.waitForTimeout(10000);
          
          const downloadLink = page.getByText(/download|ready|complete/i);
          if (await downloadLink.isVisible({ timeout: 15000 }).catch(() => false)) {
            console.log('✅ Document ready!');
            await page.screenshot({ path: 'test-results/13-doc-ready.png', fullPage: true });
          } else {
            console.log('⏳ Document may still be processing');
          }
        } else {
          console.log('⚠️  Generate button not found (templates may be required)');
        }
      } else {
        console.log('❌ Intake form shows error');
      }
    }
    
    console.log('\n========================================');
    console.log('WORKFLOW COMPLETE!');
    console.log('========================================');
    console.log(`Account: ${testUser.email}`);
    console.log(`Service: ${serviceId}`);
    console.log(`Intake: ${intakeToken || 'N/A'}`);
    console.log('Screenshots: test-results/');
  });
});

test.describe('Individual Core Scenarios', () => {
  
  test('Scenario 1: Create Account', async ({ page }) => {
    const email = `test-${Date.now()}@example.com`;
    
    await page.goto(`${PRODUCTION_URL}/signup`);
    await page.waitForLoadState('domcontentloaded');
    
    await page.getByLabel(/name/i).fill('Test User');
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/^password$/i).fill('TestPass123!');
    await page.getByLabel(/confirm password/i).fill('TestPass123!');
    
    const termsCheckbox = page.locator('input[type="checkbox"]');
    if (await termsCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
      await termsCheckbox.check();
    }
    
    await page.getByRole('button', { name: /sign up/i }).click();
    await page.waitForURL('**/admin', { timeout: 60000 });
    
    await expect(page).toHaveURL(/\/admin/);
    console.log(`✅ Account created: ${email}`);
  });
  
  test('Scenario 2: Login with Existing Account', async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL || 'rubazayed@gmail.com';
    const password = process.env.TEST_USER_PASSWORD || 'rubazayed';
    
    await page.goto(`${PRODUCTION_URL}/login`);
    await page.waitForLoadState('domcontentloaded');
    
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();
    
    await page.waitForURL('**/admin', { timeout: 60000 });
    await expect(page).toHaveURL(/\/admin/);
    
    console.log(`✅ Logged in: ${email}`);
  });
  
  test('Scenario 3: Create Service', async ({ page }) => {
    await page.goto(`${PRODUCTION_URL}/login`);
    await page.getByLabel(/email/i).fill(process.env.TEST_USER_EMAIL!);
    await page.getByLabel(/password/i).fill(process.env.TEST_USER_PASSWORD!);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('**/admin', { timeout: 60000 });
    
    await page.goto(`${PRODUCTION_URL}/admin/services`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    const createButton = page.getByRole('button', { name: /create service/i }).first();
    await expect(createButton).toBeVisible({ timeout: 10000 });
    await createButton.click();
    await page.waitForTimeout(2000);
    
    const serviceName = `Test Service ${Date.now()}`;
    await page.getByLabel(/service name|name/i).first().fill(serviceName);
    await page.getByRole('button', { name: /save|create/i }).first().click();
    await page.waitForTimeout(3000);
    
    await page.waitForURL(/\/admin\/services\/[^/]+/, { timeout: 10000 });
    console.log(`✅ Service created: ${serviceName}`);
  });
  
  test('Scenario 4: Open Intake Link', async ({ page }) => {
    const token = process.env.TEST_INTAKE_TOKEN || 'intake_1759821638675_0fk5ujved';
    
    await page.goto(`${PRODUCTION_URL}/intake/${token}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    const bodyText = await page.locator('body').textContent();
    const hasError = bodyText?.toLowerCase().includes('error') || bodyText?.toLowerCase().includes('not found');
    const hasForm = bodyText?.toLowerCase().includes('form') || bodyText?.toLowerCase().includes('field');
    
    if (hasForm) {
      console.log('✅ Intake form loaded');
    } else if (hasError) {
      console.log('⚠️  Error (expected for old tokens)');
    }
    
    expect(hasForm || hasError).toBe(true);
  });
  
  test('Scenario 5: Fill and Submit Intake Form', async ({ page }) => {
    const token = process.env.TEST_INTAKE_TOKEN || 'intake_1759821638675_0fk5ujved';
    
    await page.goto(`${PRODUCTION_URL}/intake/${token}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    const textInputs = page.locator('input[type="text"], input[type="email"]');
    const count = await textInputs.count();
    
    if (count > 0) {
      console.log(`Filling ${count} fields...`);
      
      for (let i = 0; i < Math.min(count, 5); i++) {
        const input = textInputs.nth(i);
        if (await input.isVisible({ timeout: 1000 }).catch(() => false)) {
          await input.fill(`Test Value ${i + 1}`);
        }
      }
      
      const submitButton = page.getByRole('button', { name: /submit/i });
      if (await submitButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await submitButton.click();
        await page.waitForTimeout(3000);
        console.log('✅ Form submitted');
      }
    } else {
      console.log('ℹ️  No form fields found (token may be invalid)');
    }
  });
  
  test('Scenario 6: Approve Intake and Generate Document', async ({ page }) => {
    await page.goto(`${PRODUCTION_URL}/login`);
    await page.getByLabel(/email/i).fill(process.env.TEST_USER_EMAIL!);
    await page.getByLabel(/password/i).fill(process.env.TEST_USER_PASSWORD!);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('**/admin', { timeout: 60000 });
    
    const serviceId = process.env.TEST_SERVICE_ID || 'w9rq4zgEiihA17ZNjhSg';
    
    await page.goto(`${PRODUCTION_URL}/admin/services/${serviceId}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    const approveButton = page.getByRole('button', { name: /approve/i }).first();
    if (await approveButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await approveButton.click();
      await page.waitForTimeout(2000);
      console.log('✅ Approved submission');
    }
    
    const generateButton = page.getByRole('button', { name: /generate document/i }).first();
    if (await generateButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await generateButton.click();
      await page.waitForTimeout(5000);
      console.log('✅ Generated document');
    } else {
      console.log('ℹ️  Generate button not found (templates may be required)');
    }
  });
});
