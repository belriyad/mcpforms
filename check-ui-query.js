// Check UI data using Admin SDK
const admin = require('firebase-admin')
const dotenv = require('dotenv')

dotenv.config()

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  })
}

const db = admin.firestore()

async function checkUIData() {
  console.log('🔍 Simulating UI data load (using managerId filter)...\n')
  
  const managerId = 'vodEJBzcX3Va3GzdiGYFwIpps6H3'
  
  // This is what the UI query does
  const snapshot = await db.collection('users')
    .where('managerId', '==', managerId)
    .get()
  
  console.log(`📊 Query returned: ${snapshot.size} documents\n`)
  
  const members = []
  snapshot.forEach(doc => {
    const data = doc.data()
    members.push({
      uid: doc.id,
      ...data
    })
  })
  
  console.log('📋 Members found:')
  members.forEach((m, i) => {
    console.log(`\n${i + 1}. ${m.name} (${m.email})`)
    console.log(`   UID: ${m.uid}`)
    console.log(`   inviteSentAt: ${m.inviteSentAt || '❌ NOT SET'}`)
    console.log(`   isActive: ${m.isActive}`)
    console.log(`   managerId: ${m.managerId}`)
  })
  
  const withInvites = members.filter(m => m.inviteSentAt)
  console.log(`\n\n✉️ Invites count: ${withInvites.length}`)
  
  if (withInvites.length === 0) {
    console.log('\n⚠️  PROBLEM FOUND!')
    console.log('The UI query is returning 0 members with invites.')
    console.log('\nPossible causes:')
    console.log('1. The inviteSentAt field is not being saved correctly')
    console.log('2. The managerId filter is too restrictive')
    console.log('3. The field name is misspelled')
  } else {
    console.log('\n✅ Data looks correct! The issue must be:')
    console.log('1. Browser cache')
    console.log('2. Page not reloading after data changes')
    console.log('3. Different user logged in')
  }
  
  process.exit(0)
}

checkUIData().catch(error => {
  console.error('❌ Error:', error)
  process.exit(1)
})
