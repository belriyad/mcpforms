// Test AI Section Generation API
async function testAIGeneration() {
  console.log('🧪 Testing AI Section Generation API...\n')
  
  try {
    const testPayload = {
      serviceId: 'test-service-id',
      templateId: 'test-template-id',
      prompt: 'Generate a simple liability clause for a consulting agreement'
    }
    
    console.log('📤 Request:')
    console.log(JSON.stringify(testPayload, null, 2))
    
    const response = await fetch('http://localhost:3000/api/services/generate-ai-section', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    })
    
    console.log('\n📥 Response Status:', response.status, response.statusText)
    
    const result = await response.json()
    console.log('\n📦 Response Body:')
    console.log(JSON.stringify(result, null, 2))
    
    if (!response.ok) {
      console.log('\n❌ API returned an error')
    } else {
      console.log('\n✅ API call successful!')
    }
  } catch (error) {
    console.error('\n❌ Error calling API:', error.message)
  }
}

testAIGeneration()
