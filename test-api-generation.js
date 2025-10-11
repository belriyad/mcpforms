// Quick check to see why generation is failing
async function checkService() {
  const serviceId = '2F3GSb5UJobtRzU9Vjvv'
  const url = `https://formgenai-4545.web.app/api/services/generate-documents`
  
  console.log('🔍 Checking why generation fails...\n')
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceId })
    })
    
    const data = await response.json()
    
    console.log('📊 API Response:')
    console.log(JSON.stringify(data, null, 2))
    
    if (data.summary) {
      console.log('\n📋 Summary:')
      console.log(`   Total: ${data.summary.total}`)
      console.log(`   Successful: ${data.summary.successful}`)
      console.log(`   Failed: ${data.summary.failed}`)
      
      if (data.summary.documentsWithoutUrls?.length) {
        console.log('\n❌ Documents that failed:')
        data.summary.documentsWithoutUrls.forEach(doc => {
          console.log(`   - ${doc.fileName}: ${doc.status}`)
        })
      }
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

checkService()
