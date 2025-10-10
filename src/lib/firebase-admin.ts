import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'

// Initialize Firebase Admin (lazy initialization at runtime)
let adminInitialized = false
let app: App | null = null

function initializeAdminIfNeeded() {
  if (adminInitialized) return

  if (getApps().length > 0) {
    app = getApps()[0]
    adminInitialized = true
    return
  }

  try {
    // Support both FIREBASE_ and ADMIN_ prefixes (FIREBASE_ reserved in production)
    const projectId = process.env.ADMIN_PROJECT_ID || process.env.FIREBASE_PROJECT_ID
    const clientEmail = process.env.ADMIN_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL
    const privateKey = (process.env.ADMIN_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY)?.replace(/\\n/g, '\n')
    const storageBucket = process.env.ADMIN_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET

    // Debug logging
    console.log('🔍 Environment variables check:')
    console.log('  ADMIN_PROJECT_ID:', projectId ? '✓ Present' : '✗ Missing')
    console.log('  ADMIN_CLIENT_EMAIL:', clientEmail ? '✓ Present' : '✗ Missing')
    console.log('  ADMIN_PRIVATE_KEY:', privateKey ? `✓ Present (${privateKey.substring(0, 50)}...)` : '✗ Missing')
    console.log('  ADMIN_STORAGE_BUCKET:', storageBucket ? '✓ Present' : '✗ Missing')

    if (projectId && clientEmail && privateKey) {
      app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey
        }),
        storageBucket
      })
      adminInitialized = true
      console.log('✅ Firebase Admin initialized successfully')
    } else {
      console.warn('⚠️ Firebase Admin credentials not found - server-side features disabled')
      console.warn('  Missing:', [
        !projectId && 'projectId',
        !clientEmail && 'clientEmail',
        !privateKey && 'privateKey'
      ].filter(Boolean).join(', '))
    }
  } catch (error) {
    console.error('❌ Firebase admin initialization error:', error)
  }
}

// Export functions that initialize on-demand
export const getAdminDb = () => {
  initializeAdminIfNeeded()
  if (!adminInitialized || !app) {
    throw new Error('Firebase Admin not initialized. Please configure credentials.')
  }
  return getFirestore(app)
}

export const getAdminStorage = () => {
  initializeAdminIfNeeded()
  if (!adminInitialized || !app) {
    throw new Error('Firebase Admin not initialized. Please configure credentials.')
  }
  return getStorage(app)
}

export const isAdminInitialized = () => {
  initializeAdminIfNeeded()
  return adminInitialized
}

// Legacy exports (will initialize on first access)
export const adminDb = null // Deprecated: use getAdminDb() instead
export const adminStorage = null // Deprecated: use getAdminStorage() instead
