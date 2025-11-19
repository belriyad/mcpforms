#!/usr/bin/env node

/**
 * Manual Script: Downgrade User to FREE
 * 
 * Usage:
 *   node scripts/downgrade-user-to-free.mjs <userId>
 *   node scripts/downgrade-user-to-free.mjs <email>
 * 
 * This script manually downgrades a user from PREMIUM to FREE tier.
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, '..', 'serviceAccountKey.json'), 'utf8')
)

initializeApp({
  credential: cert(serviceAccount)
})

const db = getFirestore()
const auth = getAuth()

async function downgradeUserToFree(identifier) {
  try {
    console.log('\n🔍 Looking up user...')
    
    let userId
    let userEmail
    
    // Check if identifier is email or UID
    if (identifier.includes('@')) {
      const userRecord = await auth.getUserByEmail(identifier)
      userId = userRecord.uid
      userEmail = userRecord.email
      console.log(`✅ Found user: ${userEmail} (${userId})`)
    } else {
      userId = identifier
      const userRecord = await auth.getUser(userId)
      userEmail = userRecord.email
      console.log(`✅ Found user: ${userEmail} (${userId})`)
    }
    
    // Get current subscription
    const userDoc = await db.collection('users').doc(userId).get()
    
    if (!userDoc.exists) {
      console.error('❌ User document not found in Firestore')
      process.exit(1)
    }
    
    const currentData = userDoc.data()
    const currentTier = currentData?.subscription?.tier || 'FREE'
    
    console.log(`\n📊 Current Status:`)
    console.log(`   Tier: ${currentTier}`)
    console.log(`   Status: ${currentData?.subscription?.status || 'N/A'}`)
    
    if (currentTier === 'FREE') {
      console.log('\n⚠️  User is already on FREE tier')
      return
    }
    
    // Downgrade to FREE
    console.log('\n⬇️  Downgrading to FREE...')
    
    await db.collection('users').doc(userId).update({
      'subscription.tier': 'FREE',
      'subscription.status': 'active',
      'subscription.endDate': Timestamp.now(),
      'subscription.notes': `Manually downgraded to FREE on ${new Date().toISOString()}`,
      // Keep existing usage counts (they'll be enforced now)
      'subscription.currentUsage.templatesCount': currentData?.subscription?.currentUsage?.templatesCount || 0,
      'subscription.currentUsage.servicesCount': currentData?.subscription?.currentUsage?.servicesCount || 0,
      'subscription.currentUsage.usersCount': currentData?.subscription?.currentUsage?.usersCount || 1
    })
    
    console.log('\n✅ SUCCESS! User downgraded to FREE')
    console.log('\n📋 New Limits:')
    console.log('   📄 Templates: 3 max')
    console.log('   ⚙️  Services: 10 max')
    console.log('   👥 Team Members: 1 (self only)')
    console.log('   📊 Analytics: Hidden')
    console.log('   👥 Team Management: Hidden')
    
    console.log('\n💡 User should refresh their browser to see changes')
    
  } catch (error) {
    console.error('\n❌ Error downgrading user:', error.message)
    process.exit(1)
  }
}

// Main execution
const identifier = process.argv[2]

if (!identifier) {
  console.error('\n❌ Usage: node scripts/downgrade-user-to-free.mjs <userId or email>')
  console.log('\nExamples:')
  console.log('  node scripts/downgrade-user-to-free.mjs user123456789')
  console.log('  node scripts/downgrade-user-to-free.mjs user@example.com')
  process.exit(1)
}

downgradeUserToFree(identifier)
  .then(() => {
    console.log('\n✨ Done!\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error)
    process.exit(1)
  })
