import { test } from '@playwright/test';

test('debug form structure', async ({ page }) => {
  console.log('🔍 Debugging form structure');

  // Go to app and navigate to services
  await page.goto('http://localhost:3002');
  await page.click('a:has-text("Admin Dashboard")');
  await page.waitForTimeout(2000);
  await page.click('text=Services');
  await page.waitForTimeout(2000);
  
  console.log('📸 Taking screenshot before clicking Create Service');
  await page.screenshot({ path: 'debug-before-create.png' });
  
  // Click create service
  await page.locator('button:has-text("Create Service")').first().click();
  await page.waitForTimeout(2000);
  
  console.log('📸 Taking screenshot after clicking Create Service');
  await page.screenshot({ path: 'debug-after-create.png' });
  
  // Get the HTML content
  const bodyHTML = await page.locator('body').innerHTML();
  console.log('📄 Full body HTML:');
  console.log(bodyHTML);
  
  // Look for all forms
  const forms = page.locator('form');
  const formCount = await forms.count();
  console.log(`📝 Found ${formCount} forms`);
  
  for (let i = 0; i < formCount; i++) {
    const form = forms.nth(i);
    const formHTML = await form.innerHTML();
    console.log(`📝 Form ${i} HTML:`, formHTML.substring(0, 500));
  }
  
  // Look for all inputs with their attributes
  const inputs = page.locator('input');
  const inputCount = await inputs.count();
  console.log(`📝 Found ${inputCount} inputs`);
  
  for (let i = 0; i < inputCount; i++) {
    const input = inputs.nth(i);
    const type = await input.getAttribute('type');
    const name = await input.getAttribute('name');
    const id = await input.getAttribute('id');
    const placeholder = await input.getAttribute('placeholder');
    const visible = await input.isVisible();
    console.log(`📝 Input ${i}: type="${type}", name="${name}", id="${id}", placeholder="${placeholder}", visible=${visible}`);
  }
});