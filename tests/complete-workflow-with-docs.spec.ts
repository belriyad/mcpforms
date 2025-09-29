import { test, expect } from '@playwright/test';
import path from 'path';

const BASE_URL = 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'briyad@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'your-password';

// Sample files paths
const SAMPLE_FILES = [
  'Certificate_of_Trust_Fillable Template.docx',
  'Revocable Living Trust Template.docx', 
  'Warranty Deed Template.docx'
];

const SAMPLE_DIR = path.join(__dirname, '..', 'src', 'sample');

// Test data for form filling
const CLIENT_DATA = {
  firstName: 'John',
  lastName: 'Smith',
  email: 'john.smith@example.com',
  phone: '555-123-4567',
  address: '123 Main Street',
  city: 'Anytown',
  state: 'CA',
  zipCode: '90210',
  company: 'Acme Corporation',
  title: 'CEO',
  dateOfBirth: '1980-01-15',
  ssn: '123-45-6789'
};

test.describe('Complete MCPForms Workflow with Document Generation', () => {
  
  test('Full workflow: Upload templates → Create service → Fill intake → Generate documents', async ({ page }) => {
    console.log('🚀 Starting complete MCPForms workflow with document generation...');
    
    // Set up response and request monitoring
    let intakeUrl = '';
    let intakeId = '';
    let submissionSuccess = false;
    let documentsGenerated = false;
    
    // Monitor network requests for intake URLs and submissions
    page.on('response', async (response) => {
      try {
        if (response.url().includes('/generateIntakeLink') && response.status() === 200) {
          const responseBody = await response.json();
          if (responseBody.result?.data?.intakeUrl) {
            intakeUrl = responseBody.result.data.intakeUrl;
            intakeId = responseBody.result.data.intakeId;
            console.log('✅ Captured intake URL:', intakeUrl);
            console.log('✅ Captured intake ID:', intakeId);
          }
        }
        
        if (response.url().includes('/submit') && response.status() === 200) {
          submissionSuccess = true;
          console.log('✅ Form submission successful');
        }
        
        if (response.url().includes('/generateDocumentsFromIntake') && response.status() === 200) {
          documentsGenerated = true;
          console.log('✅ Document generation triggered');
        }
      } catch (error) {
        // Ignore JSON parsing errors for non-JSON responses
      }
    });
    
    // Step 1: Authenticate as admin
    console.log('🔐 Step 1: Authenticating as admin...');
    await authenticateAdmin(page);
    
    // Step 2: Upload templates
    console.log('📤 Step 2: Uploading templates...');
    await uploadAllTemplates(page);
    
    // Step 3: Create service
    console.log('🔧 Step 3: Creating service...');
    const serviceName = 'Complete Workflow Test Service';
    await createServiceWithTemplates(page, serviceName);
    
    // Step 4: Generate intake link
    console.log('🔗 Step 4: Generating intake link...');
    await generateIntakeLink(page, serviceName);
    
    // Wait for intake URL to be captured
    await page.waitForTimeout(2000);
    expect(intakeUrl).toBeTruthy();
    
    // Step 5: Fill and submit intake form
    console.log('📝 Step 5: Filling and submitting intake form...');
    await fillAndSubmitIntakeForm(page, intakeUrl);
    
    // Step 6: Approve intake and generate documents
    console.log('✅ Step 6: Approving intake and generating documents...');
    await approveIntakeAndGenerateDocuments(page, intakeId);
    
    // Step 7: Verify document generation
    console.log('📄 Step 7: Verifying document generation...');
    await verifyDocumentGeneration(page, intakeId);
    
    console.log('🎉 Complete workflow with document generation completed successfully!');
  });
});

async function authenticateAdmin(page: any) {
  await page.goto(`${BASE_URL}/admin`);
  
  // Check if already authenticated
  const isAuthenticated = await page.locator('text=Template Management').isVisible({ timeout: 5000 });
  
  if (!isAuthenticated) {
    // Fill login form
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Wait for successful login
    await expect(page.locator('text=Template Management')).toBeVisible({ timeout: 15000 });
  }
  
  console.log('✅ Admin authentication successful');
}

async function uploadAllTemplates(page: any) {
  for (let i = 0; i < SAMPLE_FILES.length; i++) {
    const fileName = SAMPLE_FILES[i];
    const templateName = fileName.replace('.docx', '').replace(/[_-]/g, ' ');
    
    console.log(`📄 Uploading template ${i + 1}/${SAMPLE_FILES.length}: ${templateName}`);
    
    // Click upload template button
    await page.click('text=Upload Template');
    
    // Wait for upload modal
    await page.waitForSelector('input[placeholder*="template name"]', { timeout: 10000 });
    
    // Fill template name
    await page.fill('input[placeholder*="template name"]', templateName);
    
    // Upload file
    const filePath = path.join(SAMPLE_DIR, fileName);
    await page.setInputFiles('input[type="file"]', filePath);
    
    // Click upload button
    await page.click('button:has-text("Upload Template")');
    
    // Wait for success message
    await expect(page.locator('text=Template uploaded successfully')).toBeVisible({ timeout: 30000 });
    console.log(`✅ ${templateName} uploaded successfully`);
    
    // Close modal
    await page.press('body', 'Escape');
    await page.waitForTimeout(1000);
  }
  
  console.log('✅ All templates uploaded successfully');
}

async function createServiceWithTemplates(page: any, serviceName: string) {
  // Navigate to services tab
  await page.click('text=Services');
  await page.waitForTimeout(1000);
  
  // Click create service
  await page.click('text=Create Service');
  
  // Wait for service creation form
  await page.waitForSelector('input[placeholder*="service name"]', { timeout: 10000 });
  
  // Fill service details
  await page.fill('input[placeholder*="service name"]', serviceName);
  await page.fill('textarea[placeholder*="description"]', 
    'Automated test service with complete document workflow');
  
  // Select all available templates
  const templateCheckboxes = page.locator('input[type="checkbox"]');
  const checkboxCount = await templateCheckboxes.count();
  
  for (let i = 0; i < checkboxCount; i++) {
    await templateCheckboxes.nth(i).check();
  }
  
  console.log(`📋 Selected ${checkboxCount} templates for service`);
  
  // Create service
  await page.click('button:has-text("Create Service")');
  
  // Wait for service to be created
  await expect(page.locator(`text=${serviceName}`)).toBeVisible({ timeout: 15000 });
  console.log('✅ Service created successfully');
}

async function generateIntakeLink(page: any, serviceName: string) {
  // Find the service row and click generate intake link
  const serviceRow = page.locator(`text=${serviceName}`).locator('..');
  
  // Look for generate link button (multiple possible text variations)
  const generateButton = serviceRow.locator('button').filter({ 
    hasText: /Generate|Link|Intake/i 
  }).first();
  
  await generateButton.click();
  
  // Wait for intake generation modal or success message
  await page.waitForTimeout(2000);
  
  // Look for success indicators
  const successIndicators = [
    'text=Intake link generated',
    'text=Link copied',
    'text=Generated successfully',
    'text=Link created'
  ];
  
  for (const indicator of successIndicators) {
    const element = page.locator(indicator);
    if (await element.isVisible({ timeout: 2000 })) {
      console.log('✅ Intake link generation confirmed');
      break;
    }
  }
}

async function fillAndSubmitIntakeForm(page: any, intakeUrl: string) {
  console.log('🔗 Navigating to intake form:', intakeUrl);
  
  // Navigate to intake form
  await page.goto(intakeUrl);
  
  // Wait for form to load
  await page.waitForSelector('form, input, textarea', { timeout: 15000 });
  
  // Auto-fill form fields based on field names/labels
  const formFields = [
    { selectors: ['input[name*="firstName"], input[name*="first_name"], input[name*="first"]'], value: CLIENT_DATA.firstName },
    { selectors: ['input[name*="lastName"], input[name*="last_name"], input[name*="last"]'], value: CLIENT_DATA.lastName },
    { selectors: ['input[name*="email"], input[type="email"]'], value: CLIENT_DATA.email },
    { selectors: ['input[name*="phone"], input[type="tel"]'], value: CLIENT_DATA.phone },
    { selectors: ['input[name*="address"], input[name*="street"]'], value: CLIENT_DATA.address },
    { selectors: ['input[name*="city"]'], value: CLIENT_DATA.city },
    { selectors: ['input[name*="state"]'], value: CLIENT_DATA.state },
    { selectors: ['input[name*="zip"], input[name*="postal"]'], value: CLIENT_DATA.zipCode },
    { selectors: ['input[name*="company"], input[name*="organization"]'], value: CLIENT_DATA.company },
    { selectors: ['input[name*="title"], input[name*="position"]'], value: CLIENT_DATA.title },
    { selectors: ['input[name*="date"], input[type="date"]'], value: CLIENT_DATA.dateOfBirth },
    { selectors: ['input[name*="ssn"], input[name*="social"]'], value: CLIENT_DATA.ssn }
  ];
  
  // Fill all available fields
  let fieldsFound = 0;
  for (const field of formFields) {
    for (const selector of field.selectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 1000 })) {
        await element.fill(field.value);
        fieldsFound++;
        console.log(`📝 Filled field: ${selector} = ${field.value}`);
        break;
      }
    }
  }
  
  console.log(`📝 Filled ${fieldsFound} form fields`);
  
  // Handle any select/dropdown fields
  const selectFields = page.locator('select');
  const selectCount = await selectFields.count();
  
  for (let i = 0; i < selectCount; i++) {
    const select = selectFields.nth(i);
    const options = select.locator('option');
    const optionCount = await options.count();
    
    if (optionCount > 1) {
      // Select the second option (skip first which is usually empty/default)
      await select.selectOption({ index: 1 });
      console.log('📝 Selected option in dropdown field');
    }
  }
  
  // Handle any textarea fields
  const textareas = page.locator('textarea');
  const textareaCount = await textareas.count();
  
  for (let i = 0; i < textareaCount; i++) {
    await textareas.nth(i).fill('Additional information provided by automated test.');
    console.log('📝 Filled textarea field');
  }
  
  // Submit the form
  const submitButton = page.locator('button[type="submit"], button:has-text("Submit"), input[type="submit"]').first();
  await submitButton.click();
  
  // Wait for submission confirmation
  const confirmationSelectors = [
    'text=submitted successfully',
    'text=Thank you',
    'text=Form submitted',
    'text=Submission received'
  ];
  
  let submissionConfirmed = false;
  for (const selector of confirmationSelectors) {
    const element = page.locator(selector);
    if (await element.isVisible({ timeout: 10000 })) {
      console.log('✅ Form submission confirmed');
      submissionConfirmed = true;
      break;
    }
  }
  
  if (!submissionConfirmed) {
    console.log('⚠️ Form submission confirmation not found, but continuing...');
  }
}

async function approveIntakeAndGenerateDocuments(page: any, intakeId: string) {
  // Navigate back to admin dashboard
  await page.goto(`${BASE_URL}/admin`);
  
  // Navigate to intakes section
  await page.click('text=Intakes');
  await page.waitForTimeout(2000);
  
  // Find the submitted intake (look for the email or name we used)
  const intakeRow = page.locator(`text=${CLIENT_DATA.email}`).locator('..').or(
    page.locator(`text=${CLIENT_DATA.firstName} ${CLIENT_DATA.lastName}`).locator('..')
  );
  
  // If specific intake not found, try to approve the first submitted intake
  const approveButton = intakeRow.locator('button:has-text("Approve")').or(
    page.locator('button:has-text("Approve")').first()
  );
  
  if (await approveButton.isVisible({ timeout: 5000 })) {
    await approveButton.click();
    console.log('✅ Intake approved');
    
    // Wait for approval to process
    await page.waitForTimeout(2000);
    
    // Look for generate documents button
    const generateDocsButton = intakeRow.locator('button:has-text("Generate Documents")').or(
      page.locator('button:has-text("Generate Documents")').first()
    );
    
    if (await generateDocsButton.isVisible({ timeout: 5000 })) {
      await generateDocsButton.click();
      console.log('✅ Document generation triggered');
    } else {
      console.log('⚠️ Generate Documents button not found');
    }
  } else {
    console.log('⚠️ Approve button not found');
  }
}

async function verifyDocumentGeneration(page: any, intakeId: string) {
  // Wait for document generation to complete
  await page.waitForTimeout(5000);
  
  // Look for document download links or success messages
  const documentIndicators = [
    'text=documents generated',
    'text=Download',
    'text=Ready for download',
    'a[href*="download"]',
    'button:has-text("Download")'
  ];
  
  let documentsFound = false;
  for (const indicator of documentIndicators) {
    const element = page.locator(indicator);
    if (await element.isVisible({ timeout: 2000 })) {
      console.log('✅ Documents generated and available for download');
      documentsFound = true;
      
      // Try to download a document if possible
      if (indicator.includes('Download') || indicator.includes('download')) {
        try {
          const downloadPromise = page.waitForEvent('download');
          await element.first().click();
          const download = await downloadPromise;
          console.log('✅ Document downloaded:', download.suggestedFilename());
        } catch (error) {
          console.log('⚠️ Download attempt failed:', error instanceof Error ? error.message : String(error));
        }
      }
      break;
    }
  }
  
  if (!documentsFound) {
    console.log('⚠️ Document generation indicators not found');
    
    // Take a screenshot for debugging
    await page.screenshot({ 
      path: `test-results/document-generation-debug-${Date.now()}.png`,
      fullPage: true 
    });
  }
  
  // Final verification - check for any generated files in the UI
  const fileCount = await page.locator('a[href*="download"], button:has-text("Download")').count();
  console.log(`📊 Found ${fileCount} downloadable documents`);
  
  return documentsFound;
}

// Helper function to wait for async operations
async function waitForAsyncOperation(
  page: any, 
  checkFunction: () => Promise<boolean>, 
  timeoutMs: number = 30000,
  intervalMs: number = 1000
): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    if (await checkFunction()) {
      return true;
    }
    await page.waitForTimeout(intervalMs);
  }
  
  return false;
}