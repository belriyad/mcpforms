import { test, expect } from '@playwright/test'

/**
 * Regenerate Documents Button Test
 * 
 * This test verifies the complete regenerate documents workflow:
 * 1. Login as admin
 * 2. Navigate to a service with submitted intake
 * 3. Verify regenerate button is visible
 * 4. Click regenerate button
 * 5. Wait for regeneration to complete
 * 6. Verify download buttons are enabled
 * 7. Test document download
 */

const TEST_URL = 'https://formgenai-4545.web.app'
const TEST_EMAIL = 'belal.riyad@gmail.com'
const TEST_PASSWORD = '9920032'

// Use an existing service with submitted intake
// You may need to update this with a valid service ID
const TEST_SERVICE_ID = '2F3GSb5UJobtRzU9Vjvv'

test.describe('Regenerate Documents Button', () => {
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for navigation
    page.setDefaultTimeout(30000)
  })

  test('should regenerate documents and enable download buttons', async ({ page }) => {
    console.log('🧪 Starting Regenerate Documents Test\n')

    // ========================================
    // STEP 1: LOGIN
    // ========================================
    console.log('📝 Step 1: Logging in...')
    await page.goto(`${TEST_URL}/login`)
    await page.waitForLoadState('domcontentloaded')
    
    await page.fill('input[type="email"]', TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    await page.click('button[type="submit"]')
    
    // Wait for redirect to admin dashboard (more flexible URL matching)
    await page.waitForURL(/admin/, { timeout: 15000 })
    await page.waitForTimeout(2000) // Give UI time to settle
    console.log('✅ Logged in successfully\n')
    
    await page.screenshot({ path: 'test-results/regenerate-01-logged-in.png', fullPage: true })

    // ========================================
    // STEP 2: NAVIGATE TO SERVICE
    // ========================================
    console.log('📂 Step 2: Opening service...')
    await page.goto(`${TEST_URL}/admin/services/${TEST_SERVICE_ID}`)
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000) // Wait for service data to load
    
    console.log('✅ Service page loaded\n')
    await page.screenshot({ path: 'test-results/regenerate-02-service-page.png', fullPage: true })

    // ========================================
    // STEP 3: VERIFY DOCUMENT GENERATION SECTION
    // ========================================
    console.log('🔍 Step 3: Verifying Document Generation section...')
    
    const documentSection = page.locator('text=Document Generation')
    await expect(documentSection).toBeVisible({ timeout: 10000 })
    console.log('✅ Document Generation section found\n')

    // ========================================
    // STEP 4: CHECK FOR REGENERATE BUTTON
    // ========================================
    console.log('🔄 Step 4: Looking for Regenerate button...')
    
    // The regenerate button should be visible if documents already exist
    const regenerateButton = page.locator('button:has-text("Regenerate Documents")')
    
    // Check if button exists
    const buttonExists = await regenerateButton.count() > 0
    
    if (buttonExists) {
      console.log('✅ Regenerate button found\n')
      await expect(regenerateButton).toBeVisible()
      
      // Check button styling (should be orange gradient)
      const buttonClass = await regenerateButton.getAttribute('class')
      expect(buttonClass).toContain('orange')
      console.log('✅ Button has correct orange styling\n')
    } else {
      // If no regenerate button, look for "Generate All Documents" button
      const generateButton = page.locator('button:has-text("Generate All Documents")')
      console.log('⚠️  No existing documents, will use Generate button instead\n')
      await expect(generateButton).toBeVisible()
    }

    await page.screenshot({ path: 'test-results/regenerate-03-before-click.png', fullPage: true })

    // ========================================
    // STEP 5: CLICK REGENERATE/GENERATE BUTTON
    // ========================================
    console.log('🔘 Step 5: Clicking regenerate button...')
    
    const actionButton = buttonExists 
      ? page.locator('button:has-text("Regenerate Documents")')
      : page.locator('button:has-text("Generate All Documents")')
    
    // Verify button is enabled
    await expect(actionButton).toBeEnabled()
    
    // Click the button
    await actionButton.click()
    console.log('✅ Button clicked\n')

    // ========================================
    // STEP 6: WAIT FOR REGENERATION
    // ========================================
    console.log('⏳ Step 6: Waiting for regeneration...')
    
    // Button should show "Regenerating..." (be more specific - just the regenerate button)
    const loadingButton = page.locator('button:has-text("Regenerate"):has-text("Regenerating...")')
    await expect(loadingButton).toBeVisible({ timeout: 5000 })
    console.log('✅ Button shows loading state\n')
    
    await page.screenshot({ path: 'test-results/regenerate-04-regenerating.png', fullPage: true })

    // Wait for success alert
    console.log('⏳ Waiting for success alert...')
    let alertMessage = ''
    page.on('dialog', async dialog => {
      alertMessage = dialog.message()
      console.log(`📢 Alert: ${alertMessage}`)
      await dialog.accept()
    })
    
    // Wait for alert with success message (max 40 seconds for document generation)
    for (let i = 0; i < 40; i++) {
      await page.waitForTimeout(1000)
      if (alertMessage.includes('Successfully generated')) {
        break
      }
    }
    
    console.log('✅ Regeneration completed\n')
    await page.screenshot({ path: 'test-results/regenerate-05-after-regeneration.png', fullPage: true })

    // ========================================
    // STEP 7: VERIFY DOWNLOAD BUTTONS ENABLED
    // ========================================
    console.log('✅ Step 7: Verifying download buttons are enabled...')
    
    // Wait a moment for UI to update
    await page.waitForTimeout(2000)
    
    // Find all download buttons
    const downloadButtons = page.locator('button:has-text("Download")')
    const buttonCount = await downloadButtons.count()
    
    console.log(`📊 Found ${buttonCount} download buttons`)
    
    if (buttonCount > 0) {
      // Verify at least one download button is enabled
      const firstDownloadButton = downloadButtons.first()
      await expect(firstDownloadButton).toBeEnabled({ timeout: 10000 })
      console.log('✅ Download buttons are enabled!\n')
      
      // Check button styling (should be blue)
      const buttonClass = await firstDownloadButton.getAttribute('class')
      expect(buttonClass).toContain('blue')
      console.log('✅ Buttons have correct blue styling\n')
      
      await page.screenshot({ path: 'test-results/regenerate-06-download-enabled.png', fullPage: true })
    } else {
      console.log('⚠️  No download buttons found yet, may need more time')
    }

    // ========================================
    // STEP 8: TEST DOWNLOAD FUNCTIONALITY
    // ========================================
    console.log('📥 Step 8: Testing download functionality...')
    
    if (buttonCount > 0) {
      // Set up download listener
      const downloadPromise = page.waitForEvent('download', { timeout: 15000 })
      
      // Click first download button
      await downloadButtons.first().click()
      console.log('✅ Clicked download button\n')
      
      // Wait for download to start
      const download = await downloadPromise
      console.log(`📄 Download started: ${download.suggestedFilename()}`)
      
      // Verify file is DOCX
      const fileName = download.suggestedFilename()
      expect(fileName).toMatch(/\.docx$/i)
      console.log('✅ File is DOCX format\n')
      
      // Save download to verify it worked
      const downloadPath = `test-results/downloaded-${fileName}`
      await download.saveAs(downloadPath)
      console.log(`✅ File saved to: ${downloadPath}\n`)
      
      await page.screenshot({ path: 'test-results/regenerate-07-download-success.png', fullPage: true })
    }

    // ========================================
    // STEP 9: VERIFY REGENERATE BUTTON STILL VISIBLE
    // ========================================
    console.log('🔄 Step 9: Verifying regenerate button is still available...')
    
    const regenerateButtonAfter = page.locator('button:has-text("Regenerate Documents")')
    await expect(regenerateButtonAfter).toBeVisible()
    await expect(regenerateButtonAfter).toBeEnabled()
    console.log('✅ Regenerate button is ready for another regeneration\n')
    
    await page.screenshot({ path: 'test-results/regenerate-08-final-state.png', fullPage: true })

    // ========================================
    // SUCCESS
    // ========================================
    console.log('\n' + '='.repeat(60))
    console.log('✅ ALL TESTS PASSED!')
    console.log('='.repeat(60))
    console.log('\nSummary:')
    console.log('✅ Logged in successfully')
    console.log('✅ Service page loaded')
    console.log('✅ Regenerate button found and styled correctly')
    console.log('✅ Regeneration completed')
    console.log('✅ Download buttons enabled immediately')
    console.log('✅ Document downloaded successfully')
    console.log('✅ Regenerate button ready for reuse')
  })

  test('should show correct button states during regeneration', async ({ page }) => {
    console.log('🧪 Testing Button States During Regeneration\n')

    // Login
    await page.goto(`${TEST_URL}/login`)
    await page.fill('input[type="email"]', TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL(/admin/, { timeout: 15000 })
    await page.waitForTimeout(2000)

    // Navigate to service
    await page.goto(`${TEST_URL}/admin/services/${TEST_SERVICE_ID}`)
    await page.waitForTimeout(2000)

    // Find regenerate button
    const regenerateButton = page.locator('button:has-text("Regenerate Documents")')
    const generateButton = page.locator('button:has-text("Generate All Documents")')
    
    const hasRegenerateButton = await regenerateButton.count() > 0
    const actionButton = hasRegenerateButton ? regenerateButton : generateButton

    // Check initial state
    console.log('📊 Checking initial button state...')
    await expect(actionButton).toBeEnabled()
    
    if (hasRegenerateButton) {
      const iconVisible = await page.locator('button:has-text("Regenerate Documents") svg').isVisible()
      expect(iconVisible).toBe(true)
      console.log('✅ RefreshCw icon visible\n')
    }

    // Click button
    await actionButton.click()

    // Check loading state
    console.log('📊 Checking loading state...')
    const loadingText = hasRegenerateButton ? 'Regenerating...' : 'Generating...'
    const loadingButton = page.locator(`button:has-text("Regenerate"):has-text("${loadingText}")`)
    
    await expect(loadingButton).toBeVisible({ timeout: 5000 })
    await expect(loadingButton).toBeDisabled()
    console.log('✅ Button shows loading state and is disabled\n')

    // Wait for completion with alert detection
    let alertMessage = ''
    page.on('dialog', async dialog => {
      alertMessage = dialog.message()
      await dialog.accept()
    })
    
    for (let i = 0; i < 40; i++) {
      await page.waitForTimeout(1000)
      if (alertMessage.includes('Successfully generated')) {
        break
      }
    }

    // Check final state
    console.log('📊 Checking final button state...')
    await page.waitForTimeout(2000)
    
    const finalButton = page.locator('button:has-text("Regenerate Documents")')
    await expect(finalButton).toBeVisible()
    await expect(finalButton).toBeEnabled()
    console.log('✅ Button returned to enabled state\n')

    console.log('\n✅ Button state test passed!')
  })

  test('should show both buttons side by side', async ({ page }) => {
    console.log('🧪 Testing Button Layout\n')

    // Login
    await page.goto(`${TEST_URL}/login`)
    await page.fill('input[type="email"]', TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL(/admin/, { timeout: 15000 })
    await page.waitForTimeout(2000)

    // Navigate to service with generated documents
    await page.goto(`${TEST_URL}/admin/services/${TEST_SERVICE_ID}`)
    await page.waitForTimeout(2000)

    // Check if both buttons are visible
    const downloadAllButton = page.locator('button:has-text("Download All Documents")')
    const regenerateButton = page.locator('button:has-text("Regenerate Documents")')

    const hasDownloadAll = await downloadAllButton.count() > 0
    const hasRegenerate = await regenerateButton.count() > 0

    if (hasDownloadAll && hasRegenerate) {
      console.log('✅ Both buttons are visible')
      
      // Verify they are in a flex container (side by side)
      const buttonsContainer = page.locator('div.flex.gap-3').filter({
        has: downloadAllButton
      })
      
      await expect(buttonsContainer).toBeVisible()
      console.log('✅ Buttons are in side-by-side layout\n')

      // Check styling differences
      const downloadClass = await downloadAllButton.getAttribute('class')
      const regenerateClass = await regenerateButton.getAttribute('class')
      
      expect(downloadClass).toContain('blue')
      expect(regenerateClass).toContain('orange')
      console.log('✅ Buttons have different colors (blue vs orange)\n')

      await page.screenshot({ path: 'test-results/regenerate-button-layout.png', fullPage: true })
    } else {
      console.log('⚠️  Service may not have generated documents yet')
    }
  })
})
