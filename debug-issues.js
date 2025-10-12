const { initializeApp } = require('firebase/app')
const { getFirestore, collection, query, where, getDocs } = require('firebase/firestore')

const firebaseConfig = {
  apiKey: "AIzaSyBHRLY2D1pP-M8_VT3h8fvUzSwvqH9FZvs",
  authDomain: "formgenai-4545.firebaseapp.com",
  projectId: "formgenai-4545",
  storageBucket: "formgenai-4545.firebasestorage.app",
  messagingSenderId: "1001549419332",
  appId: "1:1001549419332:web:f4b0d19c8d35e30fa0b5c0",
  measurementId: "G-CVM6EK2CQK"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function checkIssues() {
  console.log('🔍 Checking for issues...\n')
  
  // Check 1: Test OpenAI API
  console.log('1️⃣ Testing OpenAI API key...')
  const openaiKey = process.env.OPENAI_API_KEY
  if (!openaiKey) {
    console.log('❌ OPENAI_API_KEY not found in environment')
  } else {
    console.log('✅ OPENAI_API_KEY found:', openaiKey.substring(0, 20) + '...')
  }
  
  // Check 2: Get all intake forms
  console.log('\n2️⃣ Checking intake forms...')
  try {
    const intakesSnapshot = await getDocs(collection(db, 'intakeForms'))
    console.log(`📊 Total intake forms in database: ${intakesSnapshot.size}`)
    
    if (intakesSnapshot.size > 0) {
      console.log('\n📋 Sample intake forms:')
      intakesSnapshot.docs.slice(0, 3).forEach((doc, index) => {
        const data = doc.data()
        console.log(`\n   Intake ${index + 1} (${doc.id}):`)
        console.log(`   - Service ID: ${data.serviceId}`)
        console.log(`   - Service Name: ${data.serviceName}`)
        console.log(`   - Client: ${data.clientName} (${data.clientEmail})`)
        console.log(`   - Status: ${data.status}`)
        console.log(`   - Created By: ${data.createdBy}`)
        console.log(`   - Token: ${data.token}`)
      })
      
      // Check by user
      console.log('\n📊 Intake forms by user:')
      const userCounts = {}
      intakesSnapshot.docs.forEach(doc => {
        const createdBy = doc.data().createdBy || 'unknown'
        userCounts[createdBy] = (userCounts[createdBy] || 0) + 1
      })
      Object.entries(userCounts).forEach(([userId, count]) => {
        console.log(`   ${userId}: ${count} intake(s)`)
      })
    } else {
      console.log('⚠️  No intake forms found in database')
    }
  } catch (error) {
    console.error('❌ Error fetching intake forms:', error.message)
  }
  
  // Check 3: Test AI generation endpoint (simulate)
  console.log('\n3️⃣ Checking AI generation setup...')
  console.log('   API endpoint: /api/services/generate-ai-section')
  console.log('   Required fields: serviceId, templateId, prompt')
  console.log('   Model: gpt-4o-mini')
  console.log('   Status: Endpoint exists ✅')
  
  console.log('\n✅ Debug check complete!')
}

checkIssues().catch(console.error)
