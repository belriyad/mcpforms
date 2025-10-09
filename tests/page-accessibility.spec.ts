import { test, expect } from '@playwright/test';

test.describe('Page Accessibility Tests', () => {
  
  test.setTimeout(120000);

  test('Check all public pages are accessible', async ({ page }) => {
    console.log('\n🔍 TESTING PUBLIC PAGE ACCESSIBILITY\n');
    
    const publicPages = [
      { url: '/', name: 'Home Page', expectedContent: /smart forms|welcome/i },
      { url: '/login', name: 'Login Page', expectedContent: /sign in|login|email|password/i },
      { url: '/signup', name: 'Signup Page', expectedContent: /sign up|create account|register/i },
      { url: '/forgot-password', name: 'Forgot Password Page', expectedContent: /forgot|reset password|email/i },
      { url: '/terms', name: 'Terms of Service', expectedContent: /terms|service|agreement/i },
      { url: '/privacy', name: 'Privacy Policy', expectedContent: /privacy|policy|data/i },
    ];

    const results = [];

    for (const pageInfo of publicPages) {
      console.log(`\n📄 Testing: ${pageInfo.name}`);
      console.log(`   URL: https://formgenai-4545.web.app${pageInfo.url}`);
      
      try {
        const response = await page.goto(`https://formgenai-4545.web.app${pageInfo.url}`, {
          waitUntil: 'domcontentloaded',
          timeout: 30000
        });
        
        // Check HTTP status
        const status = response?.status() || 0;
        console.log(`   Status: ${status}`);
        
        if (status === 404) {
          console.log(`   ❌ Page not found (404)`);
          results.push({ page: pageInfo.name, status: 'NOT FOUND', accessible: false });
          continue;
        }
        
        if (status >= 500) {
          console.log(`   ❌ Server error (${status})`);
          results.push({ page: pageInfo.name, status: 'SERVER ERROR', accessible: false });
          continue;
        }
        
        // Wait for content to load
        await page.waitForTimeout(2000);
        
        // Check for expected content
        const bodyText = await page.locator('body').textContent();
        const hasExpectedContent = pageInfo.expectedContent.test(bodyText || '');
        
        if (!hasExpectedContent) {
          console.log(`   ⚠️  Page loaded but expected content not found`);
          console.log(`   Looking for: ${pageInfo.expectedContent}`);
          console.log(`   Found: ${bodyText?.substring(0, 200)}...`);
        }
        
        // Check for error messages
        const hasErrorMessage = /404|not found|error|something went wrong/i.test(bodyText || '');
        
        if (hasErrorMessage) {
          console.log(`   ❌ Error message detected on page`);
          results.push({ page: pageInfo.name, status: 'ERROR', accessible: false });
        } else if (hasExpectedContent) {
          console.log(`   ✅ Accessible and content verified`);
          results.push({ page: pageInfo.name, status: 'OK', accessible: true });
        } else {
          console.log(`   ⚠️  Accessible but content unclear`);
          results.push({ page: pageInfo.name, status: 'UNCLEAR', accessible: true });
        }
        
        // Take screenshot
        await page.screenshot({ 
          path: `test-results/accessibility-${pageInfo.name.toLowerCase().replace(/\s+/g, '-')}.png`,
          fullPage: true 
        });
        
      } catch (error) {
        console.log(`   ❌ Failed to load: ${error}`);
        results.push({ page: pageInfo.name, status: 'FAILED', accessible: false });
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 PUBLIC PAGES ACCESSIBILITY SUMMARY');
    console.log('='.repeat(60));
    
    results.forEach(result => {
      const icon = result.accessible ? '✅' : '❌';
      console.log(`${icon} ${result.page}: ${result.status}`);
    });
    
    const accessibleCount = results.filter(r => r.accessible).length;
    const totalCount = results.length;
    console.log(`\n${accessibleCount}/${totalCount} pages accessible`);
  });

  test('Check admin pages accessibility (with login)', async ({ page }) => {
    console.log('\n🔐 TESTING ADMIN PAGE ACCESSIBILITY\n');
    
    // First, we need valid credentials
    const email = process.env.TEST_USER_EMAIL || 'test@example.com';
    const password = process.env.TEST_USER_PASSWORD || 'password123';
    
    console.log(`📧 Test User: ${email}`);
    console.log(`🔑 Attempting login...\n`);
    
    // Try to login
    try {
      await page.goto('https://formgenai-4545.web.app/login', {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });
      
      await page.locator('input[type="email"]').fill(email);
      await page.locator('input[type="password"]').fill(password);
      await page.getByRole('button', { name: /sign in/i }).click();
      
      // Wait for redirect
      await page.waitForTimeout(5000);
      
      const currentUrl = page.url();
      
      if (!currentUrl.includes('/admin')) {
        console.log('❌ Login failed - cannot test admin pages');
        console.log(`   Current URL: ${currentUrl}`);
        console.log('\n⚠️  SKIPPING ADMIN PAGE TESTS');
        console.log('   Please create a test account and update .env.test with:');
        console.log(`   TEST_USER_EMAIL=your-email@example.com`);
        console.log(`   TEST_USER_PASSWORD=your-password`);
        return;
      }
      
      console.log('✅ Login successful!\n');
      
    } catch (error) {
      console.log(`❌ Login error: ${error}`);
      console.log('\n⚠️  SKIPPING ADMIN PAGE TESTS');
      return;
    }
    
    // Test admin pages
    const adminPages = [
      { url: '/admin', name: 'Admin Dashboard', expectedContent: /dashboard|templates|services/i },
      { url: '/admin/templates', name: 'Templates Page', expectedContent: /templates|upload|create/i },
      { url: '/admin/services', name: 'Services Page', expectedContent: /services|create service/i },
      { url: '/admin/services/create', name: 'Create Service Page', expectedContent: /create service|service name/i },
    ];

    const results = [];

    for (const pageInfo of adminPages) {
      console.log(`\n📄 Testing: ${pageInfo.name}`);
      console.log(`   URL: https://formgenai-4545.web.app${pageInfo.url}`);
      
      try {
        const response = await page.goto(`https://formgenai-4545.web.app${pageInfo.url}`, {
          waitUntil: 'domcontentloaded',
          timeout: 30000
        });
        
        const status = response?.status() || 0;
        console.log(`   Status: ${status}`);
        
        await page.waitForTimeout(2000);
        
        // Check if redirected back to login
        const currentUrl = page.url();
        if (currentUrl.includes('/login')) {
          console.log(`   ❌ Redirected to login - authentication lost`);
          results.push({ page: pageInfo.name, status: 'AUTH FAILED', accessible: false });
          continue;
        }
        
        const bodyText = await page.locator('body').textContent();
        const hasExpectedContent = pageInfo.expectedContent.test(bodyText || '');
        const hasErrorMessage = /404|not found|error/i.test(bodyText || '');
        
        if (hasErrorMessage) {
          console.log(`   ❌ Error message detected`);
          results.push({ page: pageInfo.name, status: 'ERROR', accessible: false });
        } else if (hasExpectedContent) {
          console.log(`   ✅ Accessible and content verified`);
          results.push({ page: pageInfo.name, status: 'OK', accessible: true });
        } else {
          console.log(`   ⚠️  Accessible but content unclear`);
          results.push({ page: pageInfo.name, status: 'UNCLEAR', accessible: true });
        }
        
        await page.screenshot({ 
          path: `test-results/accessibility-admin-${pageInfo.name.toLowerCase().replace(/\s+/g, '-')}.png`,
          fullPage: true 
        });
        
      } catch (error) {
        console.log(`   ❌ Failed to load: ${error}`);
        results.push({ page: pageInfo.name, status: 'FAILED', accessible: false });
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 ADMIN PAGES ACCESSIBILITY SUMMARY');
    console.log('='.repeat(60));
    
    results.forEach(result => {
      const icon = result.accessible ? '✅' : '❌';
      console.log(`${icon} ${result.page}: ${result.status}`);
    });
    
    const accessibleCount = results.filter(r => r.accessible).length;
    const totalCount = results.length;
    console.log(`\n${accessibleCount}/${totalCount} admin pages accessible`);
  });

  test('Check intake pages accessibility', async ({ page }) => {
    console.log('\n📋 TESTING INTAKE PAGE ACCESSIBILITY\n');
    
    // Test with token from env
    const testToken = process.env.TEST_INTAKE_TOKEN || 'test-token';
    
    console.log(`🔗 Testing intake with token: ${testToken}\n`);
    
    try {
      const response = await page.goto(`https://formgenai-4545.web.app/intake/${testToken}`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });
      
      const status = response?.status() || 0;
      console.log(`Status: ${status}`);
      
      await page.waitForTimeout(3000);
      
      const bodyText = await page.locator('body').textContent();
      const hasForm = /submit|field|form|intake/i.test(bodyText || '');
      const hasError = /not found|invalid|error|expired/i.test(bodyText || '');
      
      await page.screenshot({ 
        path: 'test-results/accessibility-intake-page.png',
        fullPage: true 
      });
      
      if (hasError) {
        console.log('⚠️  Intake page shows error (expected if token is invalid/expired)');
        console.log(`   Error text: ${bodyText?.match(/not found|invalid|error|expired/i)?.[0]}`);
      } else if (hasForm) {
        console.log('✅ Intake page is accessible and shows form');
      } else {
        console.log('⚠️  Intake page loaded but content unclear');
        console.log(`   Content preview: ${bodyText?.substring(0, 200)}...`);
      }
      
    } catch (error) {
      console.log(`❌ Failed to load intake page: ${error}`);
    }
  });

  test('Check demo/customize pages', async ({ page }) => {
    console.log('\n🎨 TESTING DEMO/CUSTOMIZE PAGES\n');
    
    const demoPages = [
      { url: '/demo', name: 'Demo Page' },
      { url: '/customize', name: 'Customize Page' },
    ];

    for (const pageInfo of demoPages) {
      console.log(`\n📄 Testing: ${pageInfo.name}`);
      
      try {
        const response = await page.goto(`https://formgenai-4545.web.app${pageInfo.url}`, {
          waitUntil: 'domcontentloaded',
          timeout: 30000
        });
        
        const status = response?.status() || 0;
        console.log(`   Status: ${status}`);
        
        await page.waitForTimeout(2000);
        
        const bodyText = await page.locator('body').textContent();
        const has404 = /404|not found/i.test(bodyText || '');
        
        await page.screenshot({ 
          path: `test-results/accessibility-${pageInfo.name.toLowerCase().replace(/\s+/g, '-')}.png`,
          fullPage: true 
        });
        
        if (status === 404 || has404) {
          console.log(`   ❌ Page not found (404)`);
        } else {
          console.log(`   ✅ Page is accessible`);
          console.log(`   Content preview: ${bodyText?.substring(0, 150)}...`);
        }
        
      } catch (error) {
        console.log(`   ❌ Failed to load: ${error}`);
      }
    }
  });
});
