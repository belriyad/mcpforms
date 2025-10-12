import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: '.env.test' });

const BASE_URL = process.env.TEST_BASE_URL || 'https://formgenai-4545.web.app';
const TEST_EMAIL = process.env.TEST_USER_EMAIL!;
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD!;

test.describe('UI Audit - Complete User Flow', () => {
  test('Audit entire user journey and capture UI screenshots', async ({ page }) => {
    console.log('\n🔍 UI AUDIT - COMPLETE FLOW');
    console.log('================================================\n');

    const timestamp = Date.now();
    const screenshotPath = (name: string) => `test-results/ui-audit/${timestamp}/${name}.png`;

    // Step 1: Login Page
    console.log('📸 STEP 1: LOGIN PAGE');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('domcontentloaded');
    await page.screenshot({ path: screenshotPath('01-login-page'), fullPage: true });
    
    // Capture login UI elements
    const loginElements = await page.evaluate(() => {
      return {
        hasLogo: !!document.querySelector('h1, [role="banner"]'),
        hasEmailInput: !!document.querySelector('input[type="email"]'),
        hasPasswordInput: !!document.querySelector('input[type="password"]'),
        hasSubmitButton: !!document.querySelector('button[type="submit"]'),
        hasSignupLink: !!document.querySelector('a[href*="signup"]'),
        pageTitle: document.title
      };
    });
    console.log('Login UI Elements:', loginElements);

    // Login
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.screenshot({ path: screenshotPath('02-login-filled'), fullPage: true });
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/**', { timeout: 15000 });
    console.log('✅ Login successful\n');

    // Step 2: Admin Dashboard
    console.log('📸 STEP 2: ADMIN DASHBOARD');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: screenshotPath('03-admin-dashboard'), fullPage: true });
    
    const dashboardElements = await page.evaluate(() => {
      const nav = document.querySelector('nav');
      const mainContent = document.querySelector('main');
      const buttons = Array.from(document.querySelectorAll('button, a[href]'));
      
      return {
        hasTopNav: !!nav,
        hasSidebar: !!document.querySelector('aside, [role="navigation"]'),
        navItems: buttons.map(b => ({
          text: b.textContent?.trim().substring(0, 30),
          href: (b as HTMLAnchorElement).href,
          isButton: b.tagName === 'BUTTON'
        })).filter(item => item.text),
        mainSections: Array.from(mainContent?.children || []).map(el => ({
          tag: el.tagName,
          class: el.className,
          text: el.textContent?.substring(0, 50)
        }))
      };
    });
    console.log('Dashboard Structure:', JSON.stringify(dashboardElements, null, 2));

    // Step 3: Templates Page
    console.log('📸 STEP 3: TEMPLATES PAGE');
    await page.goto(`${BASE_URL}/admin/templates`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: screenshotPath('04-templates-list'), fullPage: true });
    
    const templatesUI = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const hasUploadButton = buttons.some(b => b.textContent?.toLowerCase().includes('upload')) || 
                              !!document.querySelector('input[type="file"]');
      
      return {
        hasUploadButton,
        templateCount: document.querySelectorAll('[data-template-id], .template-card, .template-item').length,
        hasSearchBar: !!document.querySelector('input[type="search"]'),
        hasFilters: !!document.querySelector('select, [role="combobox"]'),
        layout: {
          hasGrid: !!document.querySelector('[class*="grid"]'),
          hasList: !!document.querySelector('[class*="list"]'),
          hasTable: !!document.querySelector('table')
        }
      };
    });
    console.log('Templates UI:', templatesUI);

    // Step 4: Services Page
    console.log('📸 STEP 4: SERVICES PAGE');
    await page.goto(`${BASE_URL}/admin/services`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: screenshotPath('05-services-list'), fullPage: true });
    
    const servicesUI = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const hasCreateButton = buttons.some(b => 
        b.textContent?.toLowerCase().includes('create') || 
        b.textContent?.toLowerCase().includes('new')
      );
      
      return {
        hasCreateButton,
        serviceCount: document.querySelectorAll('[data-service-id], .service-card, .service-item').length,
        hasSearchBar: !!document.querySelector('input[type="search"]'),
        layout: {
          hasGrid: !!document.querySelector('[class*="grid"]'),
          hasList: !!document.querySelector('[class*="list"]'),
          hasTable: !!document.querySelector('table')
        }
      };
    });
    console.log('Services UI:', servicesUI);

    // Step 5: Create Service Modal/Page
    console.log('📸 STEP 5: CREATE SERVICE FLOW');
    try {
      const createBtn = page.locator('button:has-text("Create Service"), button:has-text("New Service")').first();
      await createBtn.click({ timeout: 5000 });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: screenshotPath('06-create-service-modal'), fullPage: true });
      
      const createServiceUI = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return {
          isModal: !!document.querySelector('[role="dialog"], [class*="modal"]'),
          isPage: window.location.href.includes('/create'),
          formFields: Array.from(document.querySelectorAll('input, select, textarea')).map(el => ({
            type: el.tagName,
            name: (el as HTMLInputElement).name,
            placeholder: (el as HTMLInputElement).placeholder,
            required: (el as HTMLInputElement).required
          })),
          hasCancel: buttons.some(b => b.textContent?.toLowerCase().includes('cancel')),
          hasSubmit: !!document.querySelector('button[type="submit"]') || 
                     buttons.some(b => b.textContent?.toLowerCase().includes('create'))
        };
      });
      console.log('Create Service UI:', JSON.stringify(createServiceUI, null, 2));
    } catch (error) {
      console.log('⚠️  Could not capture create service UI');
    }

    // Step 6: Service Detail Page (if we have a test service)
    console.log('📸 STEP 6: SERVICE DETAIL PAGE');
    const testServiceId = process.env.TEST_SERVICE_ID;
    if (testServiceId) {
      await page.goto(`${BASE_URL}/admin/services/${testServiceId}`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: screenshotPath('07-service-detail'), fullPage: true });
      
      const serviceDetailUI = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const downloadButtons = buttons.filter(b => b.textContent?.toLowerCase().includes('download'));
        
        return {
          hasRegenerateButton: buttons.some(b => b.textContent?.toLowerCase().includes('regenerate')),
          hasDocumentsList: !!document.querySelector('[data-document-id]'),
          documentCount: document.querySelectorAll('[data-document-id]').length,
          hasDownloadButtons: downloadButtons.length,
          hasShareLink: !!document.querySelector('a[href*="/intake/"]') || 
                       !!document.querySelector('input[value*="/intake/"]'),
          layout: {
            hasTabs: !!document.querySelector('[role="tablist"]'),
            hasSidebar: !!document.querySelector('aside'),
            isCardBased: !!document.querySelector('[class*="card"]')
          }
        };
      });
      console.log('Service Detail UI:', JSON.stringify(serviceDetailUI, null, 2));
    }

    // Step 7: Settings/Profile
    console.log('📸 STEP 7: USER PROFILE/SETTINGS');
    try {
      const profileButton = page.locator('button').filter({ hasText: /profile/i }).or(page.locator('[aria-label*="Profile" i]'));
      const count = await profileButton.count();
      if (count > 0) {
        await profileButton.first().click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: screenshotPath('08-profile-menu'), fullPage: true });
      }
    } catch (error) {
      console.log('⚠️  Profile menu not found');
    }

    // Step 8: Navigation Analysis
    console.log('📸 STEP 8: NAVIGATION ANALYSIS');
    const navigationAnalysis = await page.evaluate(() => {
      const allLinks = Array.from(document.querySelectorAll('a[href]'));
      const allButtons = Array.from(document.querySelectorAll('button'));
      
      const routes = allLinks.map(a => {
        const url = new URL((a as HTMLAnchorElement).href);
        return url.pathname;
      });
      const uniqueRoutes = Array.from(new Set(routes));
      const buttons = Array.from(document.querySelectorAll('button'));
      
      return {
        totalLinks: allLinks.length,
        totalButtons: allButtons.length,
        uniqueRoutes: uniqueRoutes,
        navigationPatterns: {
          hasTopNav: !!document.querySelector('nav'),
          hasSideNav: !!document.querySelector('aside'),
          hasBreadcrumbs: !!document.querySelector('[class*="breadcrumb"]'),
          hasBackButton: buttons.some(b => b.textContent?.toLowerCase().includes('back'))
        }
      };
    });
    console.log('Navigation Analysis:', JSON.stringify(navigationAnalysis, null, 2));

    // Generate UI Audit Report
    console.log('\n📋 UI AUDIT REPORT');
    console.log('================================================');
    console.log(`Screenshots saved to: test-results/ui-audit/${timestamp}/`);
    console.log('\nKey Findings:');
    console.log('- Login UI:', loginElements.hasLogo && loginElements.hasEmailInput ? '✅' : '⚠️');
    console.log('- Dashboard:', dashboardElements.hasTopNav ? '✅' : '⚠️');
    console.log('- Templates:', templatesUI.hasUploadButton ? '✅' : '⚠️');
    console.log('- Services:', servicesUI.hasCreateButton ? '✅' : '⚠️');
    console.log('- Navigation:', navigationAnalysis.navigationPatterns.hasTopNav ? '✅' : '⚠️');
    console.log('================================================\n');
  });
});
