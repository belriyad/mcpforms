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

    return { success: true, user: userProfile }
  } catch (error: any) {
    console.error('Sign up error:', error)
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
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Update last login
    await setDoc(doc(db, 'users', user.uid), {
      lastLogin: new Date().toISOString()
    }, { merge: true })

    // Get user profile
    const userDoc = await getDoc(doc(db, 'users', user.uid))
    const userProfile = userDoc.data() as UserProfile

    return { success: true, user: userProfile }
  } catch (error: any) {
    console.error('Sign in error:', error)
    return { 
      success: false, 
      error: error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password'
        ? 'Invalid email or password' 
        : 'Failed to sign in' 
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

/**
 * Get current user profile
 */
export async function getCurrentUserProfile(user: User): Promise<UserProfile | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid))
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile
    }
    return null
  } catch (error) {
    console.error('Get user profile error:', error)
    return null
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
