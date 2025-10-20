/**
 * Check managerId values using Firebase CLI authenticated connection
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore'

// Firebase config from your project
const firebaseConfig = {
  apiKey: "AIzaSyDzIiV0KDX_OcL2LqJL3QVDXHQqLt0sBeo",
  authDomain: "formgenai-4545.firebaseapp.com",
  projectId: "formgenai-4545",
  storageBucket: "formgenai-4545.firebasestorage.app",
  messagingSenderId: "651764488974",
  appId: "1:651764488974:web:fac7f3bc76eb44d96cd53d",
  measurementId: "G-WBKJH4WKLS"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function checkManagerIds() {
  console.log('\n🔍 Checking managerId for ALL users with inviteSentAt...\n')

  try {
    // Get ALL users first to see the data
    const allUsersSnapshot = await getDocs(collection(db, 'users'))
    
    console.log(`📊 Total users in database: ${allUsersSnapshot.size}\n`)
    
    const invitedMembers = []
    
    allUsersSnapshot.forEach(doc => {
      const data = doc.data()
      if (data.inviteSentAt) {
        invitedMembers.push({
          id: doc.id,
          email: data.email,
          name: data.name,
          inviteSentAt: data.inviteSentAt,
          managerId: data.managerId,
          accountType: data.accountType
        })
      }
    })

    if (invitedMembers.length === 0) {
      console.log('❌ No invited members found!')
      process.exit(0)
    }

    console.log(`✅ Found ${invitedMembers.length} member(s) with inviteSentAt:\n`)

    invitedMembers.forEach(member => {
      console.log(`👤 ${member.name} (${member.email})`)
      console.log(`   User ID: ${member.id}`)
      console.log(`   Invite Sent: ${member.inviteSentAt}`)
      console.log(`   ManagerId: ${member.managerId || '⚠️  NOT SET'}`)
      console.log(`   Account Type: ${member.accountType}`)
      console.log('')
    })

    // Now test the UI query with the expected managerId
    const expectedManagerId = 'vodEJBzcX3Va3GzdiGYFwIpps6H3'
    console.log(`\n🔍 Testing UI query with managerId: ${expectedManagerId}\n`)

    const uiQuery = query(
      collection(db, 'users'),
      where('managerId', '==', expectedManagerId)
    )
    
    const uiQuerySnapshot = await getDocs(uiQuery)

    console.log(`📊 UI Query Results: ${uiQuerySnapshot.size} member(s) found\n`)

    if (uiQuerySnapshot.size === 0) {
      console.log('❌ PROBLEM FOUND: No members returned when filtering by managerId!')
      console.log('   This explains why the UI shows 0 invites sent.\n')
      
      console.log('🔍 Diagnosis:')
      const uniqueManagerIds = [...new Set(invitedMembers.map(m => m.managerId).filter(Boolean))]
      if (uniqueManagerIds.length === 0) {
        console.log('   ⚠️  None of the invited members have a managerId set!')
      } else {
        console.log(`   The invited members have these managerId values:`)
        uniqueManagerIds.forEach(id => console.log(`     - ${id}`))
        console.log(`   But the UI is filtering by: ${expectedManagerId}`)
      }
      
      console.log('\n💡 Solutions:')
      console.log('   1. Update invited members to have correct managerId')
      console.log('   2. Change UI query to not filter by managerId for invites')
      console.log('   3. Fix user creation/invite to set managerId correctly')
    } else {
      console.log('✅ UI Query works! Members found:')
      const uiMembers = []
      uiQuerySnapshot.forEach(doc => {
        const data = doc.data()
        uiMembers.push(data)
      })
      
      const withInvites = uiMembers.filter(m => m.inviteSentAt)
      console.log(`   Total: ${uiMembers.length}`)
      console.log(`   With invites: ${withInvites.length}\n`)
      
      withInvites.forEach(m => {
        console.log(`   - ${m.name} (${m.email}) - Invite sent: ${m.inviteSentAt}`)
      })
    }

    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error)
    process.exit(1)
  }
}

checkManagerIds()
