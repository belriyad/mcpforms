// Debug script to check what the UI is seeing
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore'
import * as dotenv from 'dotenv'

dotenv.config()

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function checkUIData() {
  console.log('🔍 Checking what the UI would see...\n')
  
  const managerId = 'vodEJBzcX3Va3GzdiGYFwIpps6H3' // Your UID
  
  // This is exactly what the UI does
  const membersQuery = query(
    collection(db, 'users'),
    where('managerId', '==', managerId)
  )
  
  const snapshot = await getDocs(membersQuery)
  const members = []
  
  snapshot.forEach(doc => {
    const data = doc.data()
    members.push({ 
      uid: doc.id, 
      ...data 
    })
  })
  
  console.log(`📊 Total members loaded: ${members.length}`)
  console.log(`✉️ Members with inviteSentAt: ${members.filter(m => m.inviteSentAt).length}`)
  console.log(`✅ Active members: ${members.filter(m => m.isActive).length}`)
  console.log(`❌ Inactive members: ${members.filter(m => !m.isActive).length}\n`)
  
  console.log('📋 Detailed member data:\n')
  
  members.forEach((member, index) => {
    console.log(`Member ${index + 1}:`)
    console.log(`  Name: ${member.name}`)
    console.log(`  Email: ${member.email}`)
    console.log(`  inviteSentAt: ${member.inviteSentAt || 'NOT SET'}`)
    console.log(`  isActive: ${member.isActive}`)
    console.log(`  createdAt: ${member.createdAt}`)
    console.log(`  Fields in document: ${Object.keys(member).join(', ')}\n`)
  })
  
  // Check specific filtering
  const invitedMembers = members.filter(m => m.inviteSentAt)
  console.log('✉️ Invited members details:')
  invitedMembers.forEach(m => {
    console.log(`  - ${m.name} (${m.email}): ${m.inviteSentAt}`)
  })
  
  if (invitedMembers.length === 0) {
    console.log('  ⚠️ NO INVITED MEMBERS FOUND!')
    console.log('  This is why the UI shows 0')
  }
  
  process.exit(0)
}

checkUIData().catch(error => {
  console.error('Error:', error)
  process.exit(1)
})
