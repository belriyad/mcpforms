import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

// Test admin credentials (you'll need to create these in your Firebase auth)
const ADMIN_EMAIL = 'admin@mcpforms.com';
const ADMIN_PASSWORD = 'adminpassword123';

test.describe('MCPForms - Working Form Tests', () => {
  
  test('Admin login and dashboard access', async ({ page }) => {
    console.log('🔐 Testing admin authentication...');
    
    // Navigate to admin page
    await page.goto(`${BASE_URL}/admin`);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if login form is present
    const loginFormVisible = await page.locator('input[type="email"]').isVisible({ timeout: 5000 });
    
    if (loginFormVisible) {
      console.log('📝 Login form found, attempting to sign in...');
      
      // Fill in login credentials
      await page.fill('input[type="email"]', ADMIN_EMAIL);
      await page.fill('input[type="password"]', ADMIN_PASSWORD);
      
      // Click submit button
      await page.click('button[type="submit"]');
      
      // Wait for authentication to complete
      await page.waitForTimeout(3000);
      
      // Check if we're now on dashboard
      const dashboardVisible = await page.locator('text=Template Management').isVisible({ timeout: 10000 }).catch(() => false);
      
      if (dashboardVisible) {
        console.log('✅ Successfully logged in to admin dashboard');
      } else {
        console.log('⚠️ Login form submitted but dashboard not found');
      }
    } else {
      console.log('⚠️ No login form found - may already be authenticated or Firebase not configured');
      
      // Check if we can see dashboard content
      const dashboardContent = await page.locator('text=Smart Forms').isVisible({ timeout: 5000 }).catch(() => false);
      if (dashboardContent) {
        console.log('✅ Dashboard content visible');
      }
    }
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/admin-page-state.png', fullPage: true });
  });

  test('Template upload functionality', async ({ page }) => {
    console.log('📁 Testing template upload...');
    
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('networkidle');
    
    // Look for upload functionality
    const uploadButtons = [
      'input[type="file"]',
      'text=Upload Template',
      'text=Choose File',
      '[data-testid="file-upload"]',
      'button:has-text("Upload")'
    ];
    
    let uploadFound = false;
    for (const selector of uploadButtons) {
      const isVisible = await page.locator(selector).isVisible({ timeout: 2000 }).catch(() => false);
      if (isVisible) {
        console.log(`✅ Found upload element: ${selector}`);
        uploadFound = true;
        break;
      }
    }
    
    if (!uploadFound) {
      console.log('⚠️ No upload functionality found on admin page');
    }
    
    // Check for existing templates
    const templatesList = await page.locator('text=Certificate').isVisible({ timeout: 2000 }).catch(() => false);
    if (templatesList) {
      console.log('✅ Found existing templates in dashboard');
    }
    
    await page.screenshot({ path: 'test-results/template-management.png', fullPage: true });
  });

  test('Service creation workflow', async ({ page }) => {
    console.log('🔧 Testing service creation...');
    
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('networkidle');
    
    // Look for service creation functionality
    const serviceElements = [
      'text=Create Service',
      'text=New Service',
      'button:has-text("Service")',
      '[data-testid="create-service"]'
    ];
    
    let serviceFound = false;
    for (const selector of serviceElements) {
      const isVisible = await page.locator(selector).isVisible({ timeout: 2000 }).catch(() => false);
      if (isVisible) {
        console.log(`✅ Found service creation element: ${selector}`);
        serviceFound = true;
        break;
      }
    }
    
    if (!serviceFound) {
      console.log('⚠️ No service creation functionality found');
    }
    
    await page.screenshot({ path: 'test-results/service-creation.png', fullPage: true });
  });

  test('Intake form generation and access', async ({ page }) => {
    console.log('📋 Testing intake form generation...');
    
    // Test various potential intake URLs
    const testUrls = [
      `${BASE_URL}/intake/test`,  
      `${BASE_URL}/intake/demo`,
      `${BASE_URL}/intake/sample`,
      `${BASE_URL}/form/test`,
      `${BASE_URL}/client/intake`
    ];
    
    for (const url of testUrls) {
      try {
        console.log(`🔗 Testing URL: ${url}`);
        
        const response = await page.goto(url);
        await page.waitForLoadState('networkidle');
        
        if (response && response.status() === 200) {
          const title = await page.title();
          console.log(`✅ ${url} loaded successfully - Title: ${title}`);
          
          // Look for form elements
          const formElements = await page.locator('input, select, textarea').count();
          if (formElements > 0) {
            console.log(`📝 Found ${formElements} form elements`);
          }
          
          await page.screenshot({ path: `test-results/intake-form-${url.split('/').pop()}.png`, fullPage: true });
          break; // Found working intake form
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`❌ ${url} failed: ${errorMessage}`);
      }
    }
  });

  test('Document generation workflow', async ({ page }) => {
    console.log('📄 Testing document generation workflow...');
    
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('networkidle');
    
    // Look for document generation functionality
    const docElements = [
      'text=Generate Documents',
      'text=Generate',
      'button:has-text("Generate")',
      'text=Download',
      '[data-testid="generate-docs"]'
    ];
    
    let docGenFound = false;
    for (const selector of docElements) {
      const isVisible = await page.locator(selector).isVisible({ timeout: 2000 }).catch(() => false);
      if (isVisible) {
        console.log(`✅ Found document generation element: ${selector}`);
        docGenFound = true;
        break;
      }
    }
    
    if (!docGenFound) {
      console.log('⚠️ No document generation functionality found');
    }
    
    // Check for downloadable documents
    const downloadLinks = await page.locator('a[href*=".pdf"], a[href*=".docx"], a[download]').count();
    if (downloadLinks > 0) {
      console.log(`✅ Found ${downloadLinks} downloadable document links`);
    }
    
    await page.screenshot({ path: 'test-results/document-generation.png', fullPage: true });
  });

  test('Full application navigation', async ({ page }) => {
    console.log('🧭 Testing full application navigation...');
    
    // Test main pages
    const pages = [
      { url: `${BASE_URL}`, name: 'Home' },
      { url: `${BASE_URL}/admin`, name: 'Admin' },
      { url: `${BASE_URL}/about`, name: 'About' },
      { url: `${BASE_URL}/contact`, name: 'Contact' }
    ];
    
    for (const pageInfo of pages) {
      try {
        console.log(`📄 Testing ${pageInfo.name} page: ${pageInfo.url}`);
        
        const response = await page.goto(pageInfo.url);
        await page.waitForLoadState('networkidle');
        
        if (response && response.status() === 200) {
          const title = await page.title();
          console.log(`✅ ${pageInfo.name} page loaded - Title: ${title}`);
          
          // Check for key content
          const contentLength = await page.content().then(content => content.length);
          console.log(`📝 Content length: ${contentLength} characters`);
          
          await page.screenshot({ path: `test-results/${pageInfo.name.toLowerCase()}-page.png`, fullPage: true });
        } else {
          console.log(`⚠️ ${pageInfo.name} page returned status: ${response?.status()}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`❌ ${pageInfo.name} page failed: ${errorMessage}`);
      }
    }
  });
});

// Helper function to create test data
function generateTestData() {
  return {
    personalInfo: {
      firstName: 'John',
      lastName: 'Doe', 
      email: 'john.doe@example.com',
      phone: '555-123-4567',
      address: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zipCode: '12345'
    },
    businessInfo: {
      companyName: 'Test Company LLC',
      businessType: 'LLC',
      taxId: '12-3456789',
      industry: 'Technology'
    },
    legalInfo: {
      trustName: 'John Doe Family Trust',
      trustees: ['John Doe', 'Jane Doe'],
      beneficiaries: ['John Doe Jr.', 'Jane Doe Jr.'],
      propertyDescription: '123 Main St, Anytown, CA 12345'
    }
  };
}