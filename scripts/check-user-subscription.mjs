#!/usr/bin/env node

/**
 * View User Subscription Status
 * 
 * Usage:
 *   node scripts/check-user-subscription.mjs <userId>
 *   node scripts/check-user-subscription.mjs <email>
 * 
 * This script displays the current subscription status of a user.
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
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

async function checkUserSubscription(identifier) {
  try {
    console.log('\n🔍 Looking up user...')
    
    let userId
    let userEmail
    
    // Check if identifier is email or UID
    if (identifier.includes('@')) {
      const userRecord = await auth.getUserByEmail(identifier)
      userId = userRecord.uid
      userEmail = userRecord.email
    } else {
      userId = identifier
      const userRecord = await auth.getUser(userId)
      userEmail = userRecord.email
    }
    
    console.log(`\n👤 User: ${userEmail}`)
    console.log(`   ID: ${userId}`)
    
    // Get user document
    const userDoc = await db.collection('users').doc(userId).get()
    
    if (!userDoc.exists) {
      console.error('\n❌ User document not found in Firestore')
      console.log('   User may need to log in once to create their profile')
      process.exit(1)
    }
    
    const userData = userDoc.data()
    const subscription = userData?.subscription
    
    if (!subscription) {
      console.log('\n⚠️  No subscription found')
      console.log('   User may need to log in to initialize FREE subscription')
      return
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('📊 SUBSCRIPTION STATUS')
    console.log('='.repeat(60))
    
    console.log(`\n🎫 Tier: ${subscription.tier}`)
    console.log(`📍 Status: ${subscription.status}`)
    
    if (subscription.startDate) {
      console.log(`📅 Start Date: ${subscription.startDate.toDate().toLocaleString()}`)
    }
    
    if (subscription.endDate) {
      console.log(`🏁 End Date: ${subscription.endDate.toDate().toLocaleString()}`)
    }
    
    if (subscription.stripeCustomerId) {
      console.log(`💳 Stripe Customer: ${subscription.stripeCustomerId}`)
    }
    
    if (subscription.stripeSubscriptionId) {
      console.log(`🔗 Stripe Subscription: ${subscription.stripeSubscriptionId}`)
    }
    
    if (subscription.notes) {
      console.log(`📝 Notes: ${subscription.notes}`)
    }
    
    // Usage
    if (subscription.currentUsage) {
      const usage = subscription.currentUsage
      console.log('\n' + '-'.repeat(60))
      console.log('📈 CURRENT USAGE')
      console.log('-'.repeat(60))
      
      if (subscription.tier === 'FREE') {
        console.log(`\n📄 Templates: ${usage.templatesCount || 0} / 3`)
        console.log(`⚙️  Services: ${usage.servicesCount || 0} / 10`)
        console.log(`👥 Users: ${usage.usersCount || 0} / 1`)
      } else {
        console.log(`\n📄 Templates: ${usage.templatesCount || 0} (unlimited)`)
        console.log(`⚙️  Services: ${usage.servicesCount || 0} (unlimited)`)
        console.log(`👥 Users: ${usage.usersCount || 0} (unlimited)`)
      }
    }
    
    // Features
    console.log('\n' + '-'.repeat(60))
    console.log('✨ FEATURES')
    console.log('-'.repeat(60))
    
    if (subscription.tier === 'PREMIUM') {
      console.log('\n✅ Unlimited templates')
      console.log('✅ Unlimited services')
      console.log('✅ Unlimited team members')
      console.log('✅ Analytics dashboard')
      console.log('✅ Team management')
      console.log('\n💰 Price: $199/month')
    } else {
      console.log('\n✅ Up to 3 templates')
      console.log('✅ Up to 10 services')
      console.log('✅ 1 user (self only)')
      console.log('❌ Analytics dashboard')
      console.log('❌ Team management')
      console.log('\n💰 Price: FREE')
    }
    
    console.log('\n' + '='.repeat(60) + '\n')
    
  } catch (error) {
    console.error('\n❌ Error checking subscription:', error.message)
    if (error.code === 'auth/user-not-found') {
      console.log('   User not found in Firebase Auth')
    }
    process.exit(1)
  }
}

// Main execution
const identifier = process.argv[2]

if (!identifier) {
  console.error('\n❌ Usage: node scripts/check-user-subscription.mjs <userId or email>')
  console.log('\nExamples:')
  console.log('  node scripts/check-user-subscription.mjs user123456789')
  console.log('  node scripts/check-user-subscription.mjs user@example.com')
  process.exit(1)
}

checkUserSubscription(identifier)
  .then(() => {
    console.log('✨ Done!\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error)
    process.exit(1)
  })
