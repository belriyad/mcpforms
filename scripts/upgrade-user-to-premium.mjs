#!/usr/bin/env node

/**
 * Manual Script: Upgrade User to PREMIUM
 * 
 * Usage:
 *   node scripts/upgrade-user-to-premium.mjs <userId>
 *   node scripts/upgrade-user-to-premium.mjs <email>
 * 
 * This script manually upgrades a user from FREE to PREMIUM tier.
 * Use this for:
 * - Testing the premium features
 * - Manual upgrades without Stripe
 * - Admin overrides
 * - Lifetime premium grants
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore'
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

async function upgradeUserToPremium(identifier) {
  try {
    console.log('\n🔍 Looking up user...')
    
    let userId
    let userEmail
    
    // Check if identifier is email or UID
    if (identifier.includes('@')) {
      // It's an email
      const userRecord = await auth.getUserByEmail(identifier)
      userId = userRecord.uid
      userEmail = userRecord.email
      console.log(`✅ Found user: ${userEmail} (${userId})`)
    } else {
      // It's a UID
      userId = identifier
      const userRecord = await auth.getUser(userId)
      userEmail = userRecord.email
      console.log(`✅ Found user: ${userEmail} (${userId})`)
    }
    
    // Get current subscription
    const userDoc = await db.collection('users').doc(userId).get()
    
    if (!userDoc.exists) {
      console.error('❌ User document not found in Firestore')
      console.log('   Creating user document...')
      
      await db.collection('users').doc(userId).set({
        email: userEmail,
        createdAt: Timestamp.now(),
        subscription: {
          tier: 'PREMIUM',
          status: 'active',
          startDate: Timestamp.now(),
          currentUsage: {
            templatesCount: 0,
            servicesCount: 0,
            usersCount: 1
          },
          notes: 'Manually upgraded to PREMIUM'
        }
      })
      
      console.log('✅ User upgraded to PREMIUM (new user document created)')
      return
    }
    
    const currentData = userDoc.data()
    const currentTier = currentData?.subscription?.tier || 'FREE'
    
    console.log(`\n📊 Current Status:`)
    console.log(`   Tier: ${currentTier}`)
    console.log(`   Status: ${currentData?.subscription?.status || 'N/A'}`)
    
    if (currentData?.subscription?.currentUsage) {
      console.log(`   Usage:`)
      console.log(`     - Templates: ${currentData.subscription.currentUsage.templatesCount || 0}`)
      console.log(`     - Services: ${currentData.subscription.currentUsage.servicesCount || 0}`)
      console.log(`     - Users: ${currentData.subscription.currentUsage.usersCount || 0}`)
    }
    
    if (currentTier === 'PREMIUM') {
      console.log('\n⚠️  User is already on PREMIUM tier')
      
      const confirm = process.argv.includes('--force')
      if (!confirm) {
        console.log('   Use --force to update anyway')
        return
      }
    }
    
    // Upgrade to PREMIUM
    console.log('\n⬆️  Upgrading to PREMIUM...')
    
    await db.collection('users').doc(userId).update({
      'subscription.tier': 'PREMIUM',
      'subscription.status': 'active',
      'subscription.startDate': Timestamp.now(),
      'subscription.notes': `Manually upgraded to PREMIUM on ${new Date().toISOString()}`,
      // Keep existing usage counts
      'subscription.currentUsage.templatesCount': currentData?.subscription?.currentUsage?.templatesCount || 0,
      'subscription.currentUsage.servicesCount': currentData?.subscription?.currentUsage?.servicesCount || 0,
      'subscription.currentUsage.usersCount': currentData?.subscription?.currentUsage?.usersCount || 1
    })
    
    console.log('\n✅ SUCCESS! User upgraded to PREMIUM')
    console.log('\n📋 New Status:')
    console.log(`   Tier: PREMIUM`)
    console.log(`   Status: active`)
    console.log(`   Start Date: ${new Date().toLocaleString()}`)
    console.log('\n🎉 User now has:')
    console.log('   ✅ Unlimited templates')
    console.log('   ✅ Unlimited services')
    console.log('   ✅ Unlimited team members')
    console.log('   ✅ Analytics dashboard')
    console.log('   ✅ Team management')
    
    console.log('\n💡 User should refresh their browser to see changes')
    
  } catch (error) {
    console.error('\n❌ Error upgrading user:', error.message)
    if (error.code === 'auth/user-not-found') {
      console.log('   User not found in Firebase Auth')
    }
    process.exit(1)
  }
}

// Main execution
const identifier = process.argv[2]

if (!identifier) {
  console.error('\n❌ Usage: node scripts/upgrade-user-to-premium.mjs <userId or email>')
  console.log('\nExamples:')
  console.log('  node scripts/upgrade-user-to-premium.mjs user123456789')
  console.log('  node scripts/upgrade-user-to-premium.mjs user@example.com')
  console.log('\nOptions:')
  console.log('  --force    Force upgrade even if already PREMIUM')
  process.exit(1)
}

upgradeUserToPremium(identifier)
  .then(() => {
    console.log('\n✨ Done!\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error)
    process.exit(1)
  })
