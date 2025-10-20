/**
 * Check managerId values for invited members
 */

require('dotenv').config()
const admin = require('firebase-admin')

// Initialize with service account
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
})

const db = admin.firestore()

async function checkManagerIds() {
  console.log('\n🔍 Checking managerId for invited members...\n')

  try {
    // Get ALL users with inviteSentAt field
    const snapshot = await db.collection('users')
      .where('inviteSentAt', '!=', null)
      .get()

    if (snapshot.empty) {
      console.log('❌ No invited members found!')
      process.exit(0)
    }

    console.log(`✅ Found ${snapshot.size} invited member(s)\n`)

    snapshot.forEach(doc => {
      const data = doc.data()
      console.log(`👤 User ID: ${doc.id}`)
      console.log(`   Email: ${data.email}`)
      console.log(`   Name: ${data.name}`)
      console.log(`   Invite Sent: ${data.inviteSentAt}`)
      console.log(`   ManagerId: ${data.managerId || '⚠️  NOT SET'}`)
      console.log(`   Account Type: ${data.accountType}`)
      console.log('')
    })

    // Now test the UI query with the expected managerId
    const expectedManagerId = 'vodEJBzcX3Va3GzdiGYFwIpps6H3'
    console.log(`\n🔍 Testing UI query with managerId: ${expectedManagerId}\n`)

    const uiQuerySnapshot = await db.collection('users')
      .where('managerId', '==', expectedManagerId)
      .get()

    console.log(`📊 UI Query Results: ${uiQuerySnapshot.size} member(s) found`)

    if (uiQuerySnapshot.empty) {
      console.log('\n❌ PROBLEM FOUND: No members returned when filtering by managerId!')
      console.log('   This explains why the UI shows 0 invites sent.')
      console.log('\n💡 Solutions:')
      console.log('   1. Update invited members to have correct managerId')
      console.log('   2. Change UI query to not filter by managerId')
      console.log('   3. Fix user creation to set managerId correctly')
    } else {
      console.log('\n✅ UI Query works! Members found:')
      uiQuerySnapshot.forEach(doc => {
        const data = doc.data()
        console.log(`   - ${data.name} (${data.email}) - Invite: ${data.inviteSentAt ? '✉️ Sent' : '⚠️ Not sent'}`)
      })
    }

    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

checkManagerIds()
