import { test, expect, Page } from '@playwright/test'

const TEST_SERVICE_URL = 'https://formgenai-4545.web.app/admin/services/2F3GSb5UJobtRzU9Vjvv'
const LOGIN_EMAIL = 'belal.riyad@gmail.com'
const LOGIN_PASSWORD = '9920032'

test.describe('Regenerate Button Debug Test', () => {
  let page: Page

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage()
    
    // Enable console log capture
    page.on('console', msg => {
      const text = msg.text()
      if (text.includes('🔄') || text.includes('📊') || text.includes('✅') || text.includes('⏳')) {
        console.log(`[BROWSER CONSOLE] ${text}`)
      }
    })
  })

  test('Regenerate documents and verify buttons enable', async () => {
    console.log('\n🚀 Starting Regenerate Button Debug Test\n')

    // Step 1: Login
    console.log('📝 Step 1: Logging in...')
    await page.goto('https://formgenai-4545.web.app/login')
    await page.waitForLoadState('domcontentloaded')
    
    await page.fill('input[type="email"]', LOGIN_EMAIL)
    await page.fill('input[type="password"]', LOGIN_PASSWORD)
    await page.click('button[type="submit"]')
    
    // Wait for redirect
    await page.waitForURL(/admin/, { timeout: 10000 })
    console.log('✅ Login successful')

    // Step 2: Navigate to service
    console.log('\n📝 Step 2: Navigating to service...')
    await page.goto(TEST_SERVICE_URL)
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)
    console.log('✅ Service page loaded')

    // Step 3: Check initial state
    console.log('\n📝 Step 3: Checking initial button states...')
    
    // Find all download buttons
    const downloadButtons = page.locator('button:has-text("Download"), button:has-text("Generating")')
    const buttonCount = await downloadButtons.count()
    console.log(`Found ${buttonCount} document buttons`)

    // Check initial state
    for (let i = 0; i < buttonCount; i++) {
      const button = downloadButtons.nth(i)
      const text = await button.textContent()
      const isDisabled = await button.isDisabled()
      console.log(`  Button ${i + 1}: "${text?.trim()}" - Disabled: ${isDisabled}`)
    }

    // Step 4: Check if Regenerate button exists
    console.log('\n📝 Step 4: Looking for Regenerate button...')
    const regenerateButton = page.locator('button:has-text("Regenerate")')
    const regenerateExists = await regenerateButton.count() > 0
    
    if (!regenerateExists) {
      console.log('❌ Regenerate button not found - documents might not be generated yet')
      
      // Try to generate documents first
      const generateButton = page.locator('button:has-text("Generate All Documents")')
      const generateExists = await generateButton.count() > 0
      
      if (generateExists) {
        console.log('📄 Found "Generate All Documents" button - clicking it first...')
        await generateButton.click()
        
        // Wait for alert
        page.on('dialog', async dialog => {
          console.log(`Alert: ${dialog.message()}`)
          await dialog.accept()
        })
        
        console.log('⏳ Waiting 30 seconds for initial document generation...')
        await page.waitForTimeout(30000)
        
        // Reload page to see generated documents
        await page.reload()
        await page.waitForLoadState('domcontentloaded')
        await page.waitForTimeout(2000)
      } else {
        console.log('❌ Neither Generate nor Regenerate button found')
        throw new Error('No document generation buttons found')
      }
    }

    // Step 5: Click Regenerate
    console.log('\n📝 Step 5: Clicking Regenerate button...')
    
    // Set up alert handler
    let alertMessage = ''
    page.on('dialog', async dialog => {
      alertMessage = dialog.message()
      console.log(`📢 Alert: ${alertMessage}`)
      await dialog.accept()
    })

    // Click regenerate
    const finalRegenerateButton = page.locator('button:has-text("Regenerate")')
    await finalRegenerateButton.click()
    console.log('✅ Regenerate button clicked')

    // Step 6: Wait for alert and document generation
    console.log('\n📝 Step 6: Waiting for document generation...')
    console.log('⏳ Waiting up to 45 seconds for backend processing...')
    
    // Wait for alert to appear (backend finished)
    let waitTime = 0
    while (!alertMessage && waitTime < 45000) {
      await page.waitForTimeout(1000)
      waitTime += 1000
      if (waitTime % 5000 === 0) {
        console.log(`  ... ${waitTime / 1000}s elapsed`)
      }
    }

    if (!alertMessage) {
      console.log('❌ No alert received after 45 seconds')
      throw new Error('Document generation timeout - no alert received')
    }

    console.log(`✅ Alert received after ~${waitTime / 1000}s: ${alertMessage}`)

    // Step 7: Check button states over time
    console.log('\n📝 Step 7: Monitoring button states...')
    
    const checkTimes = [0, 3000, 5000, 8000, 10000, 15000, 20000]
    
    for (const delay of checkTimes) {
      if (delay > 0) {
        await page.waitForTimeout(delay - (checkTimes[checkTimes.indexOf(delay) - 1] || 0))
      }
      
      console.log(`\n⏱️  At ${delay / 1000}s after alert:`)
      
      // Re-query buttons
      const buttons = page.locator('button:has-text("Download"), button:has-text("Generating")')
      const count = await buttons.count()
      
      let enabledCount = 0
      for (let i = 0; i < count; i++) {
        const button = buttons.nth(i)
        const text = await button.textContent()
        const isDisabled = await button.isDisabled()
        const status = isDisabled ? '❌ DISABLED' : '✅ ENABLED'
        console.log(`  Button ${i + 1}: "${text?.trim()}" - ${status}`)
        if (!isDisabled) enabledCount++
      }
      
      console.log(`  Summary: ${enabledCount}/${count} buttons enabled`)
      
      // Success condition
      if (enabledCount === count && count > 0) {
        console.log(`\n🎉 SUCCESS! All buttons enabled after ${delay / 1000}s`)
        break
      }
    }

    // Step 8: Final check and detailed state
    console.log('\n📝 Step 8: Final state check...')
    
    const finalButtons = page.locator('button:has-text("Download"), button:has-text("Generating")')
    const finalCount = await finalButtons.count()
    let allEnabled = true
    
    for (let i = 0; i < finalCount; i++) {
      const button = finalButtons.nth(i)
      const isDisabled = await button.isDisabled()
      if (isDisabled) {
        allEnabled = false
        console.log(`❌ Button ${i + 1} still disabled`)
      }
    }

    // Step 9: Check Firestore data via page evaluation
    console.log('\n📝 Step 9: Checking client-side state...')
    
    const clientState = await page.evaluate(() => {
      // Try to find React state
      const serviceData = (window as any).__SERVICE_DATA || null
      return {
        hasServiceData: !!serviceData,
        documentCount: serviceData?.generatedDocuments?.length || 0,
        documents: serviceData?.generatedDocuments?.map((d: any) => ({
          fileName: d.fileName,
          hasDownloadUrl: !!d.downloadUrl,
          downloadUrl: d.downloadUrl?.substring(0, 50) + '...' || 'null'
        })) || []
      }
    })
    
    console.log('Client-side state:', JSON.stringify(clientState, null, 2))

    // Step 10: Take screenshot
    console.log('\n📝 Step 10: Taking screenshot...')
    await page.screenshot({ 
      path: 'test-results/regenerate-debug-final.png',
      fullPage: true 
    })
    console.log('📸 Screenshot saved to test-results/regenerate-debug-final.png')

    // Step 11: Assertions
    console.log('\n📝 Step 11: Final assertions...')
    
    if (!allEnabled) {
      console.log('\n❌ TEST FAILED: Some buttons still disabled after 20 seconds')
      console.log('\n🔍 Debugging suggestions:')
      console.log('   1. Check browser console logs above for errors')
      console.log('   2. Check if Firestore update succeeded')
      console.log('   3. Check if downloadUrls are in the response')
      console.log('   4. Check if React state is updating')
      console.log('   5. Open screenshot: test-results/regenerate-debug-final.png')
      
      throw new Error('Download buttons did not enable within 20 seconds')
    }

    console.log('\n✅ TEST PASSED! All download buttons enabled successfully')
  })

  test.afterAll(async () => {
    if (page) {
      await page.close()
    }
  })
})
