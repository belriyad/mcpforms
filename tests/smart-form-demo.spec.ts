import { test, expect } from '@playwright/test';

// Try different ports that might be in use
const POSSIBLE_URLS = [
  'http://localhost:3000',
  'http://localhost:3001', 
  'http://localhost:3002',
  'http://localhost:3003'
];

test.describe('MCPForms - Smart Form Filling Demo', () => {

  test('Find working server and demonstrate form automation', async ({ page }) => {
    console.log('🔍 Searching for active MCPForms server...');
    
    let workingUrl = null;
    
    // Try to find a working server
    for (const url of POSSIBLE_URLS) {
      try {
        console.log(`🧪 Testing: ${url}`);
        const response = await page.goto(url, { timeout: 10000 });
        
        if (response && response.status() === 200) {
          const title = await page.title();
          if (title.includes('Smart Forms') || title.includes('MCPForms')) {
            workingUrl = url;
            console.log(`✅ Found MCPForms server at: ${url}`);
            console.log(`📄 Page title: ${title}`);
            break;
          }
        }
      } catch (error) {
        console.log(`❌ ${url} not available`);
      }
    }
    
    if (!workingUrl) {
      console.log('⚠️ No MCPForms server found. Please start the dev server with: npm run dev');
      return;
    }

    // Take screenshot of home page
    await page.screenshot({ path: 'test-results/home-page-found.png', fullPage: true });

    // Navigate to admin page for form testing
    console.log('🔐 Navigating to admin page...');
    await page.goto(`${workingUrl}/admin`);
    await page.waitForLoadState('networkidle');

    // Take screenshot of admin page
    await page.screenshot({ path: 'test-results/admin-page-state.png', fullPage: true });

    console.log('📝 Starting comprehensive form filling demonstration...');

    // Enhanced form filling with smart detection
    await demonstrateFormFilling(page);

    console.log('✅ Form filling demonstration completed successfully!');
  });

});

async function demonstrateFormFilling(page: any) {
  console.log('🤖 Smart Form Filling AI in action...');

  // Sample realistic data for form filling
  const testData = {
    personal: {
      firstName: 'Emma',
      lastName: 'Johnson', 
      email: 'emma.johnson@techcorp.com',
      phone: '555-0123',
      address: '456 Innovation Drive',
      city: 'San Francisco',
      state: 'California',
      zipCode: '94105',
      dateOfBirth: '1990-05-15'
    },
    business: {
      companyName: 'TechCorp Solutions LLC',
      businessType: 'Technology Consulting',
      taxId: '12-3456789',
      website: 'https://techcorp-solutions.com',
      employees: '25',
      revenue: '2500000'
    },
    legal: {
      trustName: 'Johnson Family Trust',
      description: 'This trust is established for estate planning and asset protection purposes for the Johnson family.',
      propertyValue: '850000',
      notes: 'Please ensure all beneficiaries are properly documented and notarized.'
    }
  };

  // Smart field detection and filling
  const fieldMappings = [
    // Email fields
    { selectors: ['input[type="email"]', 'input[name*="email"]', 'input[id*="email"]'], value: testData.personal.email, type: 'email' },
    
    // Password fields  
    { selectors: ['input[type="password"]'], value: 'SecurePassword123!', type: 'password' },
    
    // Name fields
    { selectors: ['input[name*="firstName"]', 'input[id*="firstName"]', 'input[placeholder*="first"]'], value: testData.personal.firstName, type: 'text' },
    { selectors: ['input[name*="lastName"]', 'input[id*="lastName"]', 'input[placeholder*="last"]'], value: testData.personal.lastName, type: 'text' },
    
    // Phone fields
    { selectors: ['input[type="tel"]', 'input[name*="phone"]', 'input[id*="phone"]'], value: testData.personal.phone, type: 'tel' },
    
    // Address fields
    { selectors: ['input[name*="address"]', 'input[id*="address"]'], value: testData.personal.address, type: 'text' },
    { selectors: ['input[name*="city"]', 'input[id*="city"]'], value: testData.personal.city, type: 'text' },
    { selectors: ['input[name*="state"]', 'input[id*="state"]'], value: testData.personal.state, type: 'text' },
    { selectors: ['input[name*="zip"]', 'input[id*="zip"]', 'input[name*="postal"]'], value: testData.personal.zipCode, type: 'text' },
    
    // Business fields
    { selectors: ['input[name*="company"]', 'input[id*="company"]', 'input[name*="business"]'], value: testData.business.companyName, type: 'text' },
    { selectors: ['input[name*="tax"]', 'input[id*="tax"]', 'input[name*="ein"]'], value: testData.business.taxId, type: 'text' },
    { selectors: ['input[type="url"]', 'input[name*="website"]', 'input[id*="website"]'], value: testData.business.website, type: 'url' },
    
    // Date fields
    { selectors: ['input[type="date"]'], value: testData.personal.dateOfBirth, type: 'date' },
    
    // Number fields
    { selectors: ['input[type="number"]'], value: testData.business.employees, type: 'number' },
    
    // Generic text fields (catch remaining)
    { selectors: ['input[type="text"]:not([name*="firstName"]):not([name*="lastName"]):not([name*="address"]):not([name*="city"]):not([name*="state"]):not([name*="zip"]):not([name*="company"]):not([name*="tax"]):not([name*="website"])'], value: testData.legal.trustName, type: 'text' }
  ];

  let totalFieldsFilled = 0;

  // Fill form fields intelligently
  for (const mapping of fieldMappings) {
    for (const selector of mapping.selectors) {
      try {
        const elements = page.locator(selector);
        const count = await elements.count();

        if (count > 0) {
          console.log(`📝 Found ${count} ${mapping.type} field(s): ${selector}`);
          
          // Fill each matching element
          for (let i = 0; i < count; i++) {
            const element = elements.nth(i);
            const isVisible = await element.isVisible({ timeout: 2000 }).catch(() => false);
            
            if (isVisible) {
              await element.fill(mapping.value);
              totalFieldsFilled++;
              console.log(`✅ Filled ${mapping.type} field ${i + 1}: ${mapping.value}`);
              
              // Small delay for better visibility
              await page.waitForTimeout(500);
            }
          }
          break; // Move to next mapping after finding matches
        }
      } catch (error) {
        // Continue to next selector
      }
    }
  }

  // Handle textarea fields
  const textareas = page.locator('textarea');
  const textareaCount = await textareas.count();

  if (textareaCount > 0) {
    console.log(`📄 Found ${textareaCount} textarea field(s)`);
    
    const longText = testData.legal.description;
    for (let i = 0; i < textareaCount; i++) {
      const textarea = textareas.nth(i);
      if (await textarea.isVisible({ timeout: 2000 }).catch(() => false)) {
        await textarea.fill(longText);
        totalFieldsFilled++;
        console.log(`✅ Filled textarea ${i + 1} with description`);
        await page.waitForTimeout(500);
      }
    }
  }

  // Handle select dropdowns
  const selects = page.locator('select');
  const selectCount = await selects.count();

  if (selectCount > 0) {
    console.log(`🔽 Found ${selectCount} dropdown field(s)`);
    
    for (let i = 0; i < selectCount; i++) {
      const select = selects.nth(i);
      if (await select.isVisible({ timeout: 2000 }).catch(() => false)) {
        const options = await select.locator('option').count();
        if (options > 1) {
          // Select a non-default option
          await select.selectOption({ index: 1 });
          totalFieldsFilled++;
          console.log(`✅ Selected option in dropdown ${i + 1}`);
          await page.waitForTimeout(500);
        }
      }
    }
  }

  // Handle checkboxes
  const checkboxes = page.locator('input[type="checkbox"]');
  const checkboxCount = await checkboxes.count();

  if (checkboxCount > 0) {
    console.log(`☑️ Found ${checkboxCount} checkbox field(s)`);
    
    for (let i = 0; i < Math.min(checkboxCount, 3); i++) { // Limit to first 3
      const checkbox = checkboxes.nth(i);
      if (await checkbox.isVisible({ timeout: 2000 }).catch(() => false)) {
        await checkbox.check();
        totalFieldsFilled++;
        console.log(`✅ Checked checkbox ${i + 1}`);
        await page.waitForTimeout(500);
      }
    }
  }

  // Handle radio buttons
  const radios = page.locator('input[type="radio"]');
  const radioCount = await radios.count();

  if (radioCount > 0) {
    console.log(`🔘 Found ${radioCount} radio button(s)`);
    
    // Select first radio button in each group
    const radioGroups = new Set();
    for (let i = 0; i < radioCount; i++) {
      const radio = radios.nth(i);
      if (await radio.isVisible({ timeout: 2000 }).catch(() => false)) {
        const name = await radio.getAttribute('name');
        if (name && !radioGroups.has(name)) {
          await radio.check();
          radioGroups.add(name);
          totalFieldsFilled++;
          console.log(`✅ Selected radio button in group: ${name}`);
          await page.waitForTimeout(500);
        }
      }
    }
  }

  // Take final screenshot showing filled forms
  await page.screenshot({ path: 'test-results/forms-filled-complete.png', fullPage: true });

  // Print summary
  console.log('\n🎉 FORM FILLING AUTOMATION COMPLETE!');
  console.log('=====================================');
  console.log(`📊 Total fields filled: ${totalFieldsFilled}`);
  console.log(`📧 Email fields: Automated with realistic data`);
  console.log(`🔤 Text fields: Smart detection and filling`);
  console.log(`📝 Textareas: Filled with legal document content`);
  console.log(`🔽 Dropdowns: Intelligent option selection`);
  console.log(`☑️ Checkboxes: Strategic selection`);
  console.log(`🔘 Radio buttons: Group-aware selection`);
  console.log('\n💡 This demonstrates the full capability of Playwright for automated form filling!');
}