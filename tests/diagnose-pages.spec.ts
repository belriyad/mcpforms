import { test } from '@playwright/test';

test('Quick diagnosis - What error is showing?', async ({ page }) => {
  console.log('\n🔍 DETAILED ERROR DIAGNOSIS\n');
  
  const pagesToCheck = [
    { url: '/', name: 'Home' },
    { url: '/login', name: 'Login' },
    { url: '/signup', name: 'Signup' },
  ];
  
  for (const pageInfo of pagesToCheck) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📄 Checking: ${pageInfo.name} (${pageInfo.url})`);
    console.log('='.repeat(60));
    
    await page.goto(`https://formgenai-4545.web.app${pageInfo.url}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    await page.waitForTimeout(3000);
    
    // Get all text content
    const bodyText = await page.locator('body').textContent();
    console.log('\n📝 Full Page Text:');
    console.log(bodyText);
    
    // Check for specific error indicators
    console.log('\n🔎 Error Analysis:');
    
    if (bodyText?.includes('404')) {
      console.log('   ❌ Contains "404"');
    }
    if (bodyText?.includes('Error')) {
      console.log('   ❌ Contains "Error"');
    }
    if (bodyText?.includes('not found')) {
      console.log('   ❌ Contains "not found"');
    }
    if (bodyText?.includes('Firebase')) {
      console.log('   ⚠️  Contains "Firebase"');
    }
    if (bodyText?.includes('Application error')) {
      console.log('   ❌ Contains "Application error"');
    }
    
    // Get HTML title
    const title = await page.title();
    console.log(`\n📑 Page Title: "${title}"`);
    
    // Check for React/Next.js error overlay
    const hasErrorOverlay = await page.locator('[id*="error"], [class*="error-overlay"]').count();
    console.log(`\n🔧 React Error Overlay: ${hasErrorOverlay > 0 ? 'YES' : 'NO'}`);
    
    // Get console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(2000);
    
    if (consoleErrors.length > 0) {
      console.log(`\n🚨 Browser Console Errors (${consoleErrors.length}):`);
      consoleErrors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error.substring(0, 200)}`);
      });
    } else {
      console.log('\n✅ No browser console errors');
    }
    
    // Take detailed screenshot
    await page.screenshot({
      path: `test-results/diagnosis-${pageInfo.name.toLowerCase()}.png`,
      fullPage: true
    });
    
    console.log(`\n📸 Screenshot: diagnosis-${pageInfo.name.toLowerCase()}.png`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Diagnosis complete - check screenshots and output above');
  console.log('='.repeat(60));
});
