import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'

// Initialize Firebase Admin (optional - only if credentials are available)
let adminInitialized = false

if (!getApps().length) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

    if (projectId && clientEmail && privateKey) {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey
        }),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET
      })
      adminInitialized = true
      console.log('✅ Firebase Admin initialized successfully')
    } else {
      console.warn('⚠️ Firebase Admin credentials not found - server-side features disabled')
    }
  } catch (error) {
    console.error('❌ Firebase admin initialization error:', error)
  }
}

// Export functions that check for initialization
export const getAdminDb = () => {
  if (!adminInitialized) {
    throw new Error('Firebase Admin not initialized. Please configure credentials.')
  }
  return getFirestore()
}

export const getAdminStorage = () => {
  if (!adminInitialized) {
    throw new Error('Firebase Admin not initialized. Please configure credentials.')
  }
  return getStorage()
}

export const adminDb = adminInitialized ? getFirestore() : null
export const adminStorage = adminInitialized ? getStorage() : null
export const isAdminInitialized = () => adminInitialized
