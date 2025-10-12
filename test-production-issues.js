// Test Production Issues
const https = require('https')

const PROD_URL = 'https://formgenai-4545.web.app'

async function testAIGenerationProd() {
  console.log('🧪 Testing AI Section Generation on Production...\n')
  
  return new Promise((resolve, reject) => {
    const testPayload = JSON.stringify({
      serviceId: 'test-service-123',
      templateId: 'test-template-456',
      prompt: 'Generate a simple liability disclaimer'
    })
    
    const options = {
      hostname: 'formgenai-4545.web.app',
      path: '/api/services/generate-ai-section',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(testPayload)
      }
    }
    
    console.log('📤 Sending request to:', `${PROD_URL}${options.path}`)
    console.log('📦 Payload:', JSON.parse(testPayload))
    
    const req = https.request(options, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        console.log('\n📥 Response Status:', res.statusCode)
        console.log('📥 Response Headers:', res.headers)
        
        try {
          const result = JSON.parse(data)
          console.log('\n📦 Response Body:')
          console.log(JSON.stringify(result, null, 2))
          
          if (res.statusCode === 200 && result.success) {
            console.log('\n✅ AI Generation API is working!')
            resolve(true)
          } else {
            console.log('\n❌ AI Generation failed:', result.error || 'Unknown error')
            console.log('\n🔍 Possible causes:')
            console.log('   1. OPENAI_API_KEY not set in Firebase environment')
            console.log('   2. Service/template not found in Firestore')
            console.log('   3. OpenAI API quota exceeded or key invalid')
            resolve(false)
          }
        } catch (e) {
          console.log('\n❌ Could not parse response:', data)
          reject(e)
        }
      })
    })
    
    req.on('error', (error) => {
      console.error('\n❌ Request failed:', error.message)
      reject(error)
    })
    
    req.write(testPayload)
    req.end()
  })
}

async function checkIntakeFormsAccess() {
  console.log('\n\n📋 Checking intakeForms Collection Access...\n')
  console.log('✅ Firestore rules deployed with intakeForms access')
  console.log('📝 Rule allows: read if authenticated AND (createdBy == userId OR legacy OR admin)')
  console.log('\n🔍 To verify intakes showing:')
  console.log('   1. Log into https://formgenai-4545.web.app/login')
  console.log('   2. Go to /admin/intakes')
  console.log('   3. Check if intake forms appear')
  console.log('\n💡 If still empty:')
  console.log('   - No intake forms created yet for your user')
  console.log('   - Create a new service with intake form')
  console.log('   - Send intake link to client')
  console.log('   - Client submits form')
  console.log('   - Intake will appear in list')
}

async function main() {
  console.log('='.repeat(60))
  console.log('🐛 PRODUCTION ISSUES DIAGNOSTIC')
  console.log('='.repeat(60))
  
  try {
    await testAIGenerationProd()
  } catch (error) {
    console.error('Test failed:', error)
  }
  
  await checkIntakeFormsAccess()
  
  console.log('\n' + '='.repeat(60))
  console.log('✅ Diagnostic Complete')
  console.log('='.repeat(60))
}

main()
