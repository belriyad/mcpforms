// Check service and template data from Firestore
import { getAdminDb } from './src/lib/firebase-admin.ts'

async function checkServiceData() {
  try {
    const db = getAdminDb()
    const serviceId = '2F3GSb5UJobtRzU9Vjvv'
    
    console.log('🔍 Fetching service data...\n')
    
    const serviceDoc = await db.collection('services').doc(serviceId).get()
    
    if (!serviceDoc.exists) {
      console.log('❌ Service not found!')
      process.exit(1)
    }
    
    const service = serviceDoc.data()
    
    console.log('📋 Service Info:')
    console.log(`   Name: ${service.name}`)
    console.log(`   Client: ${service.clientName}`)
    console.log(`   Status: ${service.status}`)
    console.log(`   Templates Count: ${service.templates?.length || 0}\n`)
    
    if (service.templates && service.templates.length > 0) {
      console.log('📄 Templates:')
      service.templates.forEach((template, index) => {
        console.log(`\n   Template ${index + 1}:`)
        console.log(`   - Template ID: ${template.templateId}`)
        console.log(`   - Name: ${template.name}`)
        console.log(`   - File Name: ${template.fileName || 'N/A'}`)
        console.log(`   - Storage Path: ${template.storagePath || '❌ MISSING'}`)
        console.log(`   - Has Extracted Fields: ${!!template.extractedFields}`)
        console.log(`   - Extracted Fields Count: ${template.extractedFields?.length || 0}`)
      })
    } else {
      console.log('❌ No templates found!')
    }
    
    if (service.generatedDocuments && service.generatedDocuments.length > 0) {
      console.log('\n\n📦 Generated Documents:')
      service.generatedDocuments.forEach((doc, index) => {
        console.log(`\n   Document ${index + 1}:`)
        console.log(`   - File Name: ${doc.fileName}`)
        console.log(`   - Status: ${doc.status}`)
        console.log(`   - Has Download URL: ${!!doc.downloadUrl}`)
        console.log(`   - Download URL: ${doc.downloadUrl || 'NULL'}`)
      })
    }
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

checkServiceData()
