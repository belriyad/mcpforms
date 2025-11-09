import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  User,
  updateProfile
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from './firebase'
import { Analytics } from './analytics'

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  role: 'lawyer' | 'admin'
  createdAt: string
  lastLogin: string
}

/**
 * Sign up a new user
 */
export async function signUp(email: string, password: string, displayName: string) {
  Analytics.signupStarted(); // Track signup attempt
  
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Update display name
    await updateProfile(user, { displayName })

    // Create user profile in Firestore
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email!,
      displayName,
      role: 'lawyer', // Default role
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    }

    await setDoc(doc(db, 'users', user.uid), userProfile)

    // Track successful signup
    Analytics.signupCompleted(user.uid);

    return { success: true, user: userProfile }
  } catch (error: any) {
    console.error('Sign up error:', error)
    
    // Track failed signup
    Analytics.signupFailed(error.code);
    
    return { 
      success: false, 
      error: error.code === 'auth/email-already-in-use' 
        ? 'Email already in use' 
        : error.code === 'auth/weak-password'
        ? 'Password should be at least 6 characters'
        : 'Failed to create account' 
    }
  }
}

/**
 * Sign in existing user
 */
export async function signIn(email: string, password: string) {
  Analytics.loginAttempted(email); // Track login attempt
  
  try {
    console.log('🔐 Attempting sign in for:', email)
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const user = userCredential.user
    console.log('✅ Sign in successful:', user.uid)

    // Fetch user profile to get role
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userProfile = userDoc.data() as UserProfile;

    // Track successful login
    Analytics.loginSuccess(user.uid, userProfile?.role || 'lawyer');

    // Update last login asynchronously (don't wait for it)
    setDoc(doc(db, 'users', user.uid), {
      lastLogin: new Date().toISOString()
    }, { merge: true }).catch(err => console.error('Failed to update lastLogin:', err))

    // Don't fetch profile here - AuthProvider will do it
    return { success: true }
  } catch (error: any) {
    console.error('❌ Sign in error:', error)
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)
    
    // Track failed login
    Analytics.loginFailed(error.code);
    
    // Map Firebase error codes to user-friendly messages
    const errorMessages: Record<string, string> = {
      'auth/user-not-found': 'No account found with this email',
      'auth/wrong-password': 'Incorrect password',
      'auth/invalid-email': 'Invalid email address',
      'auth/user-disabled': 'This account has been disabled',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later',
      'auth/network-request-failed': 'Network error. Please check your connection',
      'auth/invalid-credential': 'Invalid email or password'
    }
    
    return { 
      success: false, 
      error: errorMessages[error.code] || `Failed to sign in (${error.code})`
    }
  }
}

/**
 * Sign out current user
 */
export async function signOut() {
  try {
    await firebaseSignOut(auth)
    return { success: true }
  } catch (error) {
    console.error('Sign out error:', error)
    return { success: false, error: 'Failed to sign out' }
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string) {
  try {
    await sendPasswordResetEmail(auth, email)
    return { success: true }
  } catch (error: any) {
    console.error('Password reset error:', error)
    return { 
      success: false, 
      error: error.code === 'auth/user-not-found'
        ? 'No account found with this email'
        : 'Failed to send reset email' 
    }
  }
}

// Simple in-memory cache for user profiles
const profileCache = new Map<string, { profile: UserProfile, timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Get current user profile
 */
export async function getCurrentUserProfile(user: User): Promise<UserProfile | null> {
  try {
    // Check cache first
    const cached = profileCache.get(user.uid)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('Using cached profile for', user.uid)
      return cached.profile
    }

    const userDoc = await getDoc(doc(db, 'users', user.uid))
    if (userDoc.exists()) {
      const profile = userDoc.data() as UserProfile
      // Cache the profile
      profileCache.set(user.uid, { profile, timestamp: Date.now() })
      return profile
    }
    return null
  } catch (error) {
    console.error('Get user profile error:', error)
    return null
  }
}

/**
 * Clear profile cache (useful after profile updates)
 */
export function clearProfileCache(uid?: string) {
  if (uid) {
    profileCache.delete(uid)
  } else {
    profileCache.clear()
  }
}

/**
 * Check if user has required role
 */
export function hasRole(userProfile: UserProfile | null, requiredRole: 'lawyer' | 'admin'): boolean {
  if (!userProfile) return false
  if (requiredRole === 'lawyer') {
    return userProfile.role === 'lawyer' || userProfile.role === 'admin'
  }
  return userProfile.role === requiredRole
}
