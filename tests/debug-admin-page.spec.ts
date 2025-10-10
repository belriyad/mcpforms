import { test, expect } from '@playwright/test'

test.describe('Debug Admin Page After Login', () => {
  test('Check admin page state after login', async ({ page }) => {
    console.log('🔍 DEBUGGING ADMIN PAGE STATE')
    console.log('=' .repeat(80))

    // Login first
    await page.goto('https://formgenai-4545.web.app/login')
    await page.getByPlaceholder(/you@example/i).fill('belal.riyad@gmail.com')
    await page.getByPlaceholder(/••••••••/i).fill('9920032')
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Wait for redirect
    await page.waitForURL(/\/admin/, { timeout: 15000 })
    console.log('✅ Redirected to admin area')

    // Wait a bit for page to load
    await page.waitForTimeout(5000)

    const currentUrl = page.url()
    console.log(`📍 Current URL: ${currentUrl}`)

    // Take screenshot
    await page.screenshot({ path: 'test-results/admin-page-state.png', fullPage: true })
    console.log('📸 Full page screenshot saved')

    // Check for loading indicators
    const loadingSelectors = [
      'text=/loading/i',
      '[class*="loader"]',
      '[class*="spinner"]',
      '[class*="loading"]',
      'text=/please wait/i',
      'text=/processing/i'
    ]

    console.log('\n🔍 Checking for loading indicators:')
    for (const selector of loadingSelectors) {
      const visible = await page.locator(selector).first().isVisible().catch(() => false)
      if (visible) {
        const text = await page.locator(selector).first().textContent().catch(() => '')
        console.log(`  ⏳ Found: "${selector}" - Text: "${text}"`)
      }
    }

    // Check page title
    const title = await page.title()
    console.log(`\n📄 Page title: ${title}`)

    // Check for main content
    const hasServices = await page.locator('text=/services/i').isVisible().catch(() => false)
    const hasTemplates = await page.locator('text=/templates/i').isVisible().catch(() => false)
    const hasClients = await page.locator('text=/clients/i').isVisible().catch(() => false)

    console.log('\n📊 Content Check:')
    console.log(`  Services tab: ${hasServices}`)
    console.log(`  Templates tab: ${hasTemplates}`)
    console.log(`  Clients tab: ${hasClients}`)

    // Check for any visible text
    const bodyText = await page.locator('body').textContent()
    const visibleText = bodyText?.substring(0, 500) || ''
    console.log(`\n📝 Visible text (first 500 chars):\n${visibleText}`)

    // Check for errors in console
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    page.on('pageerror', error => {
      errors.push(error.message)
    })

    await page.waitForTimeout(2000)

    if (errors.length > 0) {
      console.log('\n❌ Console/Page Errors:')
      errors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err}`)
      })
    } else {
      console.log('\n✅ No console errors detected')
    }

    // Check network activity
    let networkActivity = 0
    page.on('request', () => networkActivity++)
    await page.waitForTimeout(2000)
    console.log(`\n📡 Network requests in last 2 seconds: ${networkActivity}`)

    // Check if we're stuck on a loading screen
    const pageHtml = await page.content()
    const hasMinimalContent = pageHtml.length < 1000
    console.log(`\n📏 Page HTML size: ${pageHtml.length} bytes`)
    console.log(`⚠️ Minimal content? ${hasMinimalContent}`)

    console.log('=' .repeat(80))
    console.log('✅ Debug complete!')
  })
})
