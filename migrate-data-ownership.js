/**
 * Migration Script: Add createdBy field to existing documents
 * 
 * This script updates all templates, services, and customizations
 * that don't have a createdBy/userId field.
 * 
 * Run this ONCE after deploying the new security rules.
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

// Your Firebase config (from .env.local)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)

async function migrateData() {
  console.log('🔄 Starting data migration...')
  console.log('⚠️  Make sure you are logged in as an admin user!')
  
  // Get current user (must be logged in)
  const currentUser = auth.currentUser
  if (!currentUser) {
    console.error('❌ No user logged in! Please login first.')
    console.log('Run this script from the browser console while logged in.')
    return
  }
  
  console.log('✅ Current user:', currentUser.email)
  const userId = currentUser.uid
  
  let updatedCount = 0
  let errorCount = 0

  // Migrate Templates
  console.log('\n📄 Migrating templates...')
  try {
    const templatesSnapshot = await getDocs(collection(db, 'templates'))
    
    for (const docSnapshot of templatesSnapshot.docs) {
      const data = docSnapshot.data()
      
      // Check if createdBy field is missing
      if (!data.createdBy) {
        try {
          await updateDoc(doc(db, 'templates', docSnapshot.id), {
            createdBy: userId,
            updatedAt: new Date()
          })
          console.log(`  ✅ Updated template: ${docSnapshot.id} (${data.name || 'Unnamed'})`)
          updatedCount++
        } catch (error) {
          console.error(`  ❌ Failed to update template ${docSnapshot.id}:`, error.message)
          errorCount++
        }
      } else {
        console.log(`  ⏭️  Template ${docSnapshot.id} already has createdBy`)
      }
    }
  } catch (error) {
    console.error('❌ Error migrating templates:', error)
  }

  // Migrate Services
  console.log('\n🔧 Migrating services...')
  try {
    const servicesSnapshot = await getDocs(collection(db, 'services'))
    
    for (const docSnapshot of servicesSnapshot.docs) {
      const data = docSnapshot.data()
      
      // Check if createdBy field is missing
      if (!data.createdBy) {
        try {
          await updateDoc(doc(db, 'services', docSnapshot.id), {
            createdBy: userId,
            updatedAt: new Date()
          })
          console.log(`  ✅ Updated service: ${docSnapshot.id} (${data.name || 'Unnamed'})`)
          updatedCount++
        } catch (error) {
          console.error(`  ❌ Failed to update service ${docSnapshot.id}:`, error.message)
          errorCount++
        }
      } else {
        console.log(`  ⏭️  Service ${docSnapshot.id} already has createdBy`)
      }
    }
  } catch (error) {
    console.error('❌ Error migrating services:', error)
  }

  // Migrate Intake Customizations
  console.log('\n⚙️  Migrating intake customizations...')
  try {
    const customizationsSnapshot = await getDocs(collection(db, 'intakeCustomizations'))
    
    for (const docSnapshot of customizationsSnapshot.docs) {
      const data = docSnapshot.data()
      
      // Check if userId field is missing
      if (!data.userId) {
        try {
          await updateDoc(doc(db, 'intakeCustomizations', docSnapshot.id), {
            userId: userId,
            updatedAt: new Date()
          })
          console.log(`  ✅ Updated customization: ${docSnapshot.id}`)
          updatedCount++
        } catch (error) {
          console.error(`  ❌ Failed to update customization ${docSnapshot.id}:`, error.message)
          errorCount++
        }
      } else {
        console.log(`  ⏭️  Customization ${docSnapshot.id} already has userId`)
      }
    }
  } catch (error) {
    console.error('❌ Error migrating customizations:', error)
  }

  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('📊 Migration Summary:')
  console.log('='.repeat(50))
  console.log(`✅ Documents updated: ${updatedCount}`)
  console.log(`❌ Errors: ${errorCount}`)
  console.log(`👤 All documents now owned by: ${currentUser.email}`)
  console.log('='.repeat(50))
  
  if (updatedCount > 0) {
    console.log('\n🎉 Migration complete! Your data is now properly owned.')
    console.log('💡 Refresh the page to see your data.')
  } else {
    console.log('\n✨ No migration needed - all documents already have owners!')
  }
}

// Auto-run if called directly
if (typeof window !== 'undefined') {
  console.log('🚀 To run migration, execute: migrateData()')
  // Expose function globally for console access
  window.migrateData = migrateData
} else {
  // Run directly if in Node.js environment
  migrateData().catch(console.error)
}

export { migrateData }
