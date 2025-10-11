// Simple check using existing Firebase admin setup
import { getAdminDb } from './src/lib/firebase-admin'

async function checkDocs() {
  try {
    const db = getAdminDb()
    const serviceDoc = await db.collection('services').doc('2F3GSb5UJobtRzU9Vjvv').get()
    
    if (!serviceDoc.exists) {
      console.log('Service not found')
      process.exit(1)
    }
    
    const data = serviceDoc.data()
    console.log('\n=== SERVICE DATA ===')
    console.log('Name:', data.name)
    console.log('Status:', data.status)
    console.log('\n=== GENERATED DOCUMENTS ===')
    
    if (!data.generatedDocuments) {
      console.log('No documents found')
      process.exit(0)
    }
    
    data.generatedDocuments.forEach((doc, i) => {
      console.log(`\nDoc ${i + 1}: ${doc.fileName}`)
      console.log(`  Download URL: ${doc.downloadUrl ? 'EXISTS' : '❌ MISSING'}`)
      console.log(`  URL: ${doc.downloadUrl || 'null'}`)
    })
    
    process.exit(0)
  } catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
}

checkDocs()
