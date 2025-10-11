import { test, expect } from '@playwright/test'

const SERVICE_URL = 'https://formgenai-4545.web.app/admin/services/2F3GSb5UJobtRzU9Vjvv'
const LOGIN_EMAIL = 'belal.riyad@gmail.com'
const LOGIN_PASSWORD = '9920032'

test.describe('Regenerate Button - Auto Fix Test', () => {
  test.setTimeout(300000) // 5 minutes

  test('Keep trying until download buttons work', async ({ page }) => {
    console.log('\n🔄 AUTO-FIX TEST - Will keep trying until success\n')

    // Capture console logs
    page.on('console', msg => {
      const text = msg.text()
      if (text.includes('✅') || text.includes('❌') || text.includes('📊') || text.includes('🔄')) {
        console.log(`[BROWSER] ${text}`)
      }
    })

    // Login
    console.log('1️⃣ Logging in...')
    await page.goto('https://formgenai-4545.web.app/login')
    await page.fill('input[type="email"]', LOGIN_EMAIL)
    await page.fill('input[type="password"]', LOGIN_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL(/admin/, { timeout: 15000 })
    console.log('✅ Logged in\n')

    // Navigate to service
    console.log('2️⃣ Loading service page...')
    await page.goto(SERVICE_URL)
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(3000)
    console.log('✅ Page loaded\n')

    let attempt = 0
    const maxAttempts = 5
    let success = false

    while (attempt < maxAttempts && !success) {
      attempt++
      console.log(`\n${'='.repeat(60)}`)
      console.log(`🔄 ATTEMPT ${attempt}/${maxAttempts}`)
      console.log(`${'='.repeat(60)}\n`)

      try {
        // Check current button state
        console.log('📋 Checking current button states...')
        const buttons = page.locator('button:has-text("Download"), button:has-text("Generating")')
        const buttonCount = await buttons.count()
        console.log(`   Found ${buttonCount} document buttons`)

        let allEnabled = true
        for (let i = 0; i < buttonCount; i++) {
          const button = buttons.nth(i)
          const text = await button.textContent()
          const isDisabled = await button.isDisabled()
          console.log(`   Button ${i + 1}: "${text?.trim()}" - ${isDisabled ? '❌ DISABLED' : '✅ ENABLED'}`)
          if (isDisabled) allEnabled = false
        }

        if (allEnabled && buttonCount > 0) {
          console.log('\n🎉 SUCCESS! All buttons already enabled!')
          success = true
          break
        }

        console.log('\n❌ Some buttons disabled - will regenerate\n')

        // Set up dialog handler
        let alertReceived = false
        let alertMessage = ''
        page.on('dialog', async dialog => {
          alertMessage = dialog.message()
          alertReceived = true
          console.log(`📢 Alert: ${alertMessage}`)
          await dialog.accept()
        })

        // Click regenerate
        console.log('🔄 Clicking Regenerate Documents...')
        const regenerateBtn = page.locator('button:has-text("Regenerate")')
        const hasRegenerate = await regenerateBtn.count() > 0
        
        if (!hasRegenerate) {
          console.log('❌ No Regenerate button - trying Generate instead')
          const generateBtn = page.locator('button:has-text("Generate All Documents")')
          await generateBtn.click()
        } else {
          await regenerateBtn.click()
        }

        // Wait for alert (max 60 seconds)
        console.log('⏳ Waiting for generation to complete...')
        let waitTime = 0
        while (!alertReceived && waitTime < 60000) {
          await page.waitForTimeout(1000)
          waitTime += 1000
          if (waitTime % 10000 === 0) {
            console.log(`   ... ${waitTime / 1000}s elapsed`)
          }
        }

        if (!alertReceived) {
          console.log('❌ No alert after 60s - backend might have failed')
          await page.screenshot({ path: `test-results/attempt-${attempt}-no-alert.png` })
          continue
        }

        console.log(`✅ Generation completed in ~${waitTime / 1000}s\n`)

        // Now check buttons at intervals
        console.log('⏱️  Monitoring button states...')
        const checkPoints = [3, 5, 8, 10, 15, 20, 30]
        
        for (const seconds of checkPoints) {
          await page.waitForTimeout(1000)
          
          const btns = page.locator('button:has-text("Download"), button:has-text("Generating")')
          const count = await btns.count()
          let enabledCount = 0
          
          for (let i = 0; i < count; i++) {
            const isDisabled = await btns.nth(i).isDisabled()
            if (!isDisabled) enabledCount++
          }
          
          console.log(`   ${seconds}s: ${enabledCount}/${count} enabled`)
          
          if (enabledCount === count && count > 0) {
            console.log(`\n🎉 SUCCESS at ${seconds}s! All buttons enabled!`)
            success = true
            await page.screenshot({ path: `test-results/attempt-${attempt}-SUCCESS.png` })
            break
          }
        }

        if (!success) {
          console.log(`\n❌ Attempt ${attempt} failed - buttons still disabled after 30s`)
          await page.screenshot({ path: `test-results/attempt-${attempt}-FAILED.png` })
          
          // Reload page for next attempt
          if (attempt < maxAttempts) {
            console.log('🔄 Reloading page for next attempt...')
            await page.reload()
            await page.waitForLoadState('domcontentloaded')
            await page.waitForTimeout(2000)
          }
        }

      } catch (error) {
        console.error(`\n❌ Error in attempt ${attempt}:`, error instanceof Error ? error.message : 'Unknown error')
        await page.screenshot({ path: `test-results/attempt-${attempt}-ERROR.png` })
      }
    }

    // Final assertion
    if (!success) {
      console.log('\n' + '='.repeat(60))
      console.log('❌ TEST FAILED AFTER ALL ATTEMPTS')
      console.log('='.repeat(60))
      console.log('\n🔍 Debugging Info:')
      console.log(`   - Attempts made: ${attempt}`)
      console.log(`   - Screenshots saved in test-results/`)
      console.log(`   - Check browser console logs above`)
      console.log(`   - Check Firebase Functions logs`)
      console.log(`   - Verify backend API is working\n`)
      
      throw new Error(`Download buttons did not enable after ${attempt} attempts`)
    }

    console.log('\n' + '='.repeat(60))
    console.log('✅ TEST PASSED!')
    console.log('='.repeat(60))
    console.log(`   Success on attempt ${attempt}/${maxAttempts}`)
    console.log(`   All download buttons are enabled`)
    console.log('='.repeat(60) + '\n')
  })
})
