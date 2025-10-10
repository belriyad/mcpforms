import { test, expect } from '@playwright/test'

test.describe('Debug Login Issue', () => {
  test('Debug login stuck issue', async ({ page }) => {
    console.log('🔍 DEBUGGING LOGIN ISSUE')
    console.log('=' .repeat(80))

    // Go to login page
    await page.goto('https://formgenai-4545.web.app/login')
    console.log('✅ Login page loaded')

    // Fill in credentials
    const email = 'belal.riyad@gmail.com'
    const password = '9920032'
    
    await page.getByPlaceholder(/you@example/i).fill(email)
    await page.getByPlaceholder(/••••••••/i).fill(password)
    console.log(`✅ Filled credentials: ${email}`)

    // Take screenshot before clicking
    await page.screenshot({ path: 'test-results/login-before-click.png' })
    console.log('📸 Screenshot: Before clicking Sign In')

    // Click Sign In
    await page.getByRole('button', { name: /sign in/i }).click()
    console.log('✅ Clicked Sign In button')

    // Wait a bit and check the state
    await page.waitForTimeout(3000)
    
    // Take screenshot after clicking
    await page.screenshot({ path: 'test-results/login-after-click.png' })
    console.log('📸 Screenshot: After clicking Sign In')

    // Check current URL
    const currentUrl = page.url()
    console.log(`📍 Current URL: ${currentUrl}`)

    // Check for loading spinner
    const hasLoader = await page.locator('text=/signing in/i').isVisible().catch(() => false)
    console.log(`🔄 Loading spinner visible: ${hasLoader}`)

    // Check for error message
    const hasError = await page.locator('text=/failed|error|invalid/i').isVisible().catch(() => false)
    console.log(`❌ Error message visible: ${hasError}`)
    
    if (hasError) {
      const errorText = await page.locator('text=/failed|error|invalid/i').textContent()
      console.log(`❌ Error text: ${errorText}`)
    }

    // Check console logs
    const consoleLogs: string[] = []
    const consoleErrors: string[] = []
    
    page.on('console', msg => {
      const text = msg.text()
      if (msg.type() === 'error') {
        consoleErrors.push(text)
      } else {
        consoleLogs.push(text)
      }
    })

    // Wait longer to see if redirect happens
    console.log('⏳ Waiting 10 seconds to see if redirect happens...')
    await page.waitForTimeout(10000)
    
    const finalUrl = page.url()
    console.log(`📍 Final URL: ${finalUrl}`)
    
    // Take final screenshot
    await page.screenshot({ path: 'test-results/login-final-state.png' })
    console.log('📸 Screenshot: Final state')

    // Check network requests
    const requests = await page.evaluate(() => {
      return performance.getEntriesByType('resource')
        .map((r: any) => ({ name: r.name, duration: r.duration }))
        .filter((r: any) => r.name.includes('firestore') || r.name.includes('firebase'))
    })
    
    console.log(`📡 Firebase/Firestore requests: ${requests.length}`)
    requests.forEach((req: any, i: number) => {
      console.log(`  ${i + 1}. ${req.name} (${Math.round(req.duration)}ms)`)
    })

    console.log('\n💡 Console Logs:')
    consoleLogs.forEach((log, i) => {
      if (i < 20) console.log(`  ${i + 1}. ${log}`)
    })

    if (consoleErrors.length > 0) {
      console.log('\n❌ Console Errors:')
      consoleErrors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err}`)
      })
    }

    console.log('=' .repeat(80))
    console.log('✅ Debug complete!')
  })
})
