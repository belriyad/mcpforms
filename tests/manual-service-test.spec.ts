import { test, expect } from '@playwright/test'

test.describe('Pinpoint Service Creation Error', () => {
  test('Try manual service creation and capture error', async ({ page }) => {
    console.log('🔍 MANUAL SERVICE CREATION TEST')
    console.log('=' .repeat(80))

    // Capture API failures
    const apiErrors: any[] = []
    
    page.on('response', async (response) => {
      if (response.url().includes('/api/services/')) {
        const url = response.url()
        const status = response.status()
        const endpoint = url.split('/api/services/')[1].split('?')[0]
        
        if (!response.ok()) {
          try {
            const body = await response.json()
            apiErrors.push({ endpoint, status, error: body })
            console.log(`\n❌ API ERROR: /api/services/${endpoint}`)
            console.log(`   Status: ${status}`)
            console.log(`   Error: ${JSON.stringify(body, null, 2)}`)
          } catch (e) {
            const text = await response.text().catch(() => 'Could not read')
            apiErrors.push({ endpoint, status, error: text })
            console.log(`\n❌ API ERROR: /api/services/${endpoint}`)
            console.log(`   Status: ${status}`)
            console.log(`   Response: ${text}`)
          }
        } else {
          console.log(`✅ API OK: /api/services/${endpoint} (${status})`)
        }
      }
    })

    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('404') && !msg.text().includes('Firestore')) {
        console.log(`❌ Console: ${msg.text()}`)
      }
    })

    // Login
    await page.goto('https://formgenai-4545.web.app/login')
    await page.waitForLoadState('domcontentloaded')
    await page.getByPlaceholder(/you@example/i).fill('belal.riyad@gmail.com')
    await page.getByPlaceholder(/••••••••/i).fill('9920032')
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL(/\/admin/)
    console.log('✅ Logged in\n')

    // Go to service creation
    await page.goto('https://formgenai-4545.web.app/admin/services/create')
    await page.waitForTimeout(3000)

    // Step 1: Fill details
    const serviceName = `Debug Service ${Date.now()}`
    console.log(`📝 Step 1: Service Details`)
    console.log(`   Name: ${serviceName}`)
    
    await page.locator('input[placeholder*="Will Preparation"]').first().fill(serviceName)
    await page.locator('input[placeholder*="John Doe"]').first().fill('Debug Client')
    await page.locator('input[placeholder*="client@example"]').first().fill('debug@test.com')
    await page.waitForTimeout(500)
    
    // Click Next
    const nextButton1 = page.locator('button:has-text("Next")').first()
    await nextButton1.click()
    await page.waitForTimeout(2000)
    console.log('✅ Step 1 complete\n')

    // Step 2: Select template
    console.log(`📝 Step 2: Template Selection`)
    
    // Wait for templates to load
    await page.waitForTimeout(2000)
    
    // Find all template cards
    const templateDivs = page.locator('div[class*="border-"]').filter({
      has: page.locator('text=/fields/i')
    })
    
    const count = await templateDivs.count()
    console.log(`   Found ${count} template cards`)
    
    if (count > 0) {
      // Click the first template card
      const firstTemplate = templateDivs.first()
      await firstTemplate.click()
      await page.waitForTimeout(1000)
      console.log('   ✅ Clicked first template')
      
      // Verify selection by checking for "selected" badge
      const selectedBadge = page.locator('text=/template.*selected/i')
      const isSelected = await selectedBadge.isVisible().catch(() => false)
      console.log(`   Selection registered: ${isSelected}`)
      
      await page.screenshot({ path: 'test-results/manual-step2-selected.png' })
      
      // Try clicking Next
      const nextButton2 = page.locator('button:has-text("Next")').first()
      const isNextEnabled = await nextButton2.isEnabled()
      console.log(`   Next button enabled: ${isNextEnabled}`)
      
      if (isNextEnabled) {
        await nextButton2.click()
        await page.waitForTimeout(2000)
        console.log('✅ Step 2 complete\n')
        
        // Step 3: Customize
        console.log(`📝 Step 3: Customize`)
        await page.screenshot({ path: 'test-results/manual-step3.png' })
        const nextButton3 = page.locator('button:has-text("Next")').first()
        await nextButton3.click()
        await page.waitForTimeout(2000)
        console.log('✅ Step 3 complete\n')
        
        // Step 4: Review & Create
        console.log(`📝 Step 4: Review & Create`)
        await page.screenshot({ path: 'test-results/manual-step4-before.png' })
        
        // Find the Create button
        const createButton = page.locator('button:has-text("Create")').first()
        const buttonText = await createButton.textContent()
        console.log(`   Create button text: "${buttonText}"`)
        
        // Click it
        console.log('   🚀 Clicking Create button...')
        await createButton.click()
        
        // Wait and watch for errors
        console.log('   ⏳ Waiting for creation process...\n')
        await page.waitForTimeout(15000)
        
        await page.screenshot({ path: 'test-results/manual-step4-after.png' })
        
        // Check current URL
        const finalUrl = page.url()
        console.log(`📍 Final URL: ${finalUrl}`)
        
        if (finalUrl.includes('/services/') && !finalUrl.includes('/create')) {
          console.log('\n✅ SUCCESS! Service created successfully!')
          const serviceId = finalUrl.split('/services/')[1]
          console.log(`   Service ID: ${serviceId}`)
        } else {
          console.log('\n❌ FAILED! Still on creation page')
          
          // Look for toast/error messages
          const allText = await page.locator('body').textContent()
          if (allText?.includes('Failed')) {
            console.log('   Found "Failed" in page text')
          }
        }
        
      } else {
        console.log('❌ Next button still disabled after template selection!')
      }
      
    } else {
      console.log('❌ No templates found!')
    }

    // Summary
    console.log('\n' + '=' .repeat(80))
    if (apiErrors.length > 0) {
      console.log('❌ API ERRORS DETECTED:')
      apiErrors.forEach((err, i) => {
        console.log(`\n${i + 1}. ${err.endpoint} (${err.status})`)
        console.log(`   ${JSON.stringify(err.error, null, 2)}`)
      })
    } else {
      console.log('✅ No API errors detected')
    }
    console.log('=' .repeat(80))
  })
})
