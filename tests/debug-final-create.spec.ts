import { test, expect } from '@playwright/test'

test.describe('Debug Final Service Creation Step', () => {
  test('Capture exact error during service creation', async ({ page }) => {
    console.log('🔍 DEBUGGING FINAL SERVICE CREATION STEP')
    console.log('=' .repeat(80))

    // Capture all network requests
    const apiRequests: any[] = []
    const failedRequests: any[] = []
    
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        apiRequests.push({
          method: request.method(),
          url: request.url(),
          postData: request.postData()
        })
      }
    })

    page.on('response', async (response) => {
      if (response.url().includes('/api/')) {
        const status = response.status()
        const url = response.url()
        try {
          const body = await response.text()
          if (!response.ok()) {
            failedRequests.push({ url, status, body })
            console.log(`\n❌ API ERROR: ${url}`)
            console.log(`   Status: ${status}`)
            console.log(`   Response: ${body}`)
          } else {
            console.log(`✅ API SUCCESS: ${url.split('/api/')[1]} (${status})`)
          }
        } catch (e) {
          console.log(`⚠️  Could not read response from ${url}`)
        }
      }
    })

    // Capture console errors
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
        console.log(`❌ Console Error: ${msg.text()}`)
      }
    })

    // Login
    await page.goto('https://formgenai-4545.web.app/login')
    await page.getByPlaceholder(/you@example/i).fill('belal.riyad@gmail.com')
    await page.getByPlaceholder(/••••••••/i).fill('9920032')
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL(/\/admin/, { timeout: 15000 })
    console.log('✅ Logged in')

    // Navigate to service creation
    await page.goto('https://formgenai-4545.web.app/admin/services/create')
    await page.waitForTimeout(3000)
    console.log('✅ On service creation page')

    // Fill Step 1
    const serviceName = `Test Service ${Date.now()}`
    console.log(`\n📝 Step 1: Filling service details...`)
    await page.getByPlaceholder(/will preparation/i).first().fill(serviceName)
    await page.getByPlaceholder(/john doe/i).first().fill('Test Client')
    await page.getByPlaceholder(/client@example/i).first().fill('test@example.com')
    console.log(`   Service: ${serviceName}`)
    await page.screenshot({ path: 'test-results/final-step1.png' })
    
    await page.getByRole('button', { name: /next/i }).click()
    await page.waitForTimeout(2000)
    console.log('✅ Step 1 complete')

    // Step 2: Select template
    console.log(`\n📝 Step 2: Selecting template...`)
    await page.waitForTimeout(2000)
    
    const templateCards = await page.locator('div').filter({ hasText: /fields.*Last updated/i }).count()
    console.log(`   Found ${templateCards} template(s)`)
    
    if (templateCards > 0) {
      await page.locator('div').filter({ hasText: /fields.*Last updated/i }).first().click()
      console.log('✅ Template selected')
      await page.screenshot({ path: 'test-results/final-step2.png' })
      
      await page.getByRole('button', { name: /next/i }).click()
      await page.waitForTimeout(2000)
      console.log('✅ Step 2 complete')

      // Step 3: Customize
      console.log(`\n📝 Step 3: Customize...`)
      await page.screenshot({ path: 'test-results/final-step3.png' })
      await page.getByRole('button', { name: /next/i }).click()
      await page.waitForTimeout(2000)
      console.log('✅ Step 3 complete')

      // Step 4: Review & Create
      console.log(`\n📝 Step 4: Review & Create...`)
      await page.screenshot({ path: 'test-results/final-step4-before.png' })
      
      // Check what button text we have
      const buttons = await page.locator('button').all()
      console.log(`\n🔍 Available buttons:`)
      for (const btn of buttons) {
        const text = await btn.textContent().catch(() => '')
        const visible = await btn.isVisible().catch(() => false)
        if (visible && text) {
          console.log(`   - "${text.trim()}"`)
        }
      }

      console.log(`\n🚀 Clicking "Create & Send" button...`)
      
      // Try multiple selectors
      const createButtonSelectors = [
        'button:has-text("Create & Send")',
        'button:has-text("Create and Send")',
        'button:has-text("Create Service")',
        'button:has-text("Send")',
      ]

      let clicked = false
      for (const selector of createButtonSelectors) {
        try {
          const btn = page.locator(selector).first()
          if (await btn.isVisible().catch(() => false)) {
            console.log(`   Trying selector: ${selector}`)
            await btn.click()
            clicked = true
            break
          }
        } catch (e) {
          // Try next selector
        }
      }

      if (!clicked) {
        console.log('❌ Could not find Create button!')
        await page.screenshot({ path: 'test-results/final-step4-no-button.png' })
      }

      // Wait for the creation process
      console.log(`\n⏳ Waiting for service creation...`)
      await page.waitForTimeout(10000)

      await page.screenshot({ path: 'test-results/final-step4-after.png' })

      const currentUrl = page.url()
      console.log(`\n📍 Current URL: ${currentUrl}`)

      if (currentUrl.includes('/services/') && !currentUrl.includes('/create')) {
        console.log(`✅ SUCCESS! Service created!`)
        console.log(`   Service ID: ${currentUrl.split('/services/')[1]}`)
      } else {
        console.log(`❌ FAILED! Still on creation page`)
        
        // Check for error messages
        const errorElements = await page.locator('text=/failed|error/i').all()
        if (errorElements.length > 0) {
          console.log(`\n❌ Error messages found:`)
          for (const el of errorElements) {
            const text = await el.textContent().catch(() => '')
            if (text) console.log(`   - ${text}`)
          }
        }
      }

      // Summary of API calls
      console.log(`\n📊 API Call Summary:`)
      console.log(`   Total API requests: ${apiRequests.length}`)
      apiRequests.forEach((req, i) => {
        console.log(`\n   ${i + 1}. ${req.method} ${req.url.split('/api/')[1]}`)
        if (req.postData) {
          console.log(`      Data: ${req.postData.substring(0, 100)}...`)
        }
      })

      if (failedRequests.length > 0) {
        console.log(`\n❌ FAILED API REQUESTS (${failedRequests.length}):`)
        failedRequests.forEach((req, i) => {
          console.log(`\n   ${i + 1}. ${req.url}`)
          console.log(`      Status: ${req.status}`)
          console.log(`      Body: ${req.body}`)
        })
      } else {
        console.log(`\n✅ All API requests succeeded`)
      }

      if (consoleErrors.length > 0) {
        console.log(`\n❌ CONSOLE ERRORS (${consoleErrors.length}):`)
        consoleErrors.forEach((err, i) => {
          console.log(`   ${i + 1}. ${err}`)
        })
      }

    } else {
      console.log('❌ No templates found! Cannot proceed.')
    }

    console.log('\n' + '=' .repeat(80))
    console.log('✅ Debug complete!')
  })
})
