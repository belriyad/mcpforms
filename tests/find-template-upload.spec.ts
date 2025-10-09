import { test } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

test('Find where to upload templates', async ({ page }) => {
  test.setTimeout(120000);
  
  const email = process.env.TEST_USER_EMAIL!;
  const password = process.env.TEST_USER_PASSWORD!;
  
  console.log('\n🔍 FINDING TEMPLATE UPLOAD LOCATION\n');
  
  // Login
  await page.goto('https://formgenai-4545.web.app/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForFunction(() => window.location.pathname.includes('admin'), { timeout: 30000 });
  await page.waitForTimeout(3000);
  
  console.log('✅ Logged in');
  console.log('📄 Current URL:', page.url());
  
  // Take screenshot of admin area
  await page.screenshot({ path: 'test-results/admin-dashboard.png', fullPage: true });
  console.log('📸 Screenshot: admin-dashboard.png');
  
  // Find all navigation links
  console.log('\n🔗 Navigation Links:');
  const navLinks = await page.locator('nav a, [role="navigation"] a, a[href*="/admin"]').all();
  for (let i = 0; i < navLinks.length; i++) {
    const link = navLinks[i];
    const text = await link.textContent();
    const href = await link.getAttribute('href');
    console.log(`  ${i + 1}. "${text?.trim()}" → ${href}`);
  }
  
  // Check if there's a services page and look for upload there
  console.log('\n📋 Checking Services Page:');
  await page.goto('https://formgenai-4545.web.app/admin/services');
  await page.waitForTimeout(2000);
  console.log('   URL:', page.url());
  
  // Take screenshot
  await page.screenshot({ path: 'test-results/services-page.png', fullPage: true });
  console.log('   📸 Screenshot: services-page.png');
  
  // Look for any upload or template buttons
  console.log('\n🔘 Looking for upload/template options:');
  const allButtons = await page.locator('button').all();
  for (let i = 0; i < allButtons.length; i++) {
    const btn = allButtons[i];
    const text = await btn.textContent();
    if (text && (text.toLowerCase().includes('template') || 
                 text.toLowerCase().includes('upload') ||
                 text.toLowerCase().includes('document'))) {
      console.log(`   Found: "${text}"`);
    }
  }
  
  // Try clicking on a service to see if template upload is there
  const services = await page.locator('[class*="service"], [class*="card"]').all();
  if (services.length > 0) {
    console.log(`\n📝 Found ${services.length} services, checking first one...`);
    await services[0].click();
    await page.waitForTimeout(2000);
    
    console.log('   Service detail URL:', page.url());
    await page.screenshot({ path: 'test-results/service-detail.png', fullPage: true });
    console.log('   📸 Screenshot: service-detail.png');
    
    // Look for template or document upload options
    const detailButtons = await page.locator('button').all();
    for (let i = 0; i < detailButtons.length; i++) {
      const btn = detailButtons[i];
      const text = await btn.textContent();
      console.log(`   Button: "${text}"`);
    }
  }
  
  console.log('\n✅ Investigation complete - check screenshots\n');
});
