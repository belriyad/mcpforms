'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail
} from 'firebase/auth'
import { auth } from '../firebase'
import toast from 'react-hot-toast'

interface AuthContextType {
  user: User | null
  loading: boolean
  authError: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    console.log('🔐 AuthProvider: Initializing auth state')
    console.log('🔐 NODE_ENV:', process.env.NODE_ENV)
    console.log('🔐 hostname:', typeof window !== 'undefined' ? window.location.hostname : 'server')
    
    // Only use mock auth in test environment
    const isTestEnvironment = process.env.NODE_ENV === 'test' || 
                             (typeof window !== 'undefined' && window.location.hostname === '127.0.0.1');

    console.log('🔐 isTestEnvironment:', isTestEnvironment)

    if (isTestEnvironment) {
      // Listen for mock auth changes in test environment
      const handleMockAuth = (event: any) => {
        console.log('✅ Using mock authentication');
        setUser(event.detail);
        setLoading(false);
      };

      // Check for existing mock auth state
      const checkMockAuth = () => {
        const w = window as any;
        if (w.__MOCK_AUTH_USER__) {
          console.log('✅ Using existing mock authentication');
          setUser(w.__MOCK_AUTH_USER__);
          setLoading(w.__MOCK_AUTH_LOADING__ ?? false);
          return true;
        }
        return false;
      };

      // Set up mock auth listener
      window.addEventListener('mock-auth-change', handleMockAuth);

      // Use mock auth if available
      if (checkMockAuth()) {
        return () => {
          window.removeEventListener('mock-auth-change', handleMockAuth);
        };
      }

      // Clean up listener for test environment
      return () => {
        window.removeEventListener('mock-auth-change', handleMockAuth);
      };
    }

    // Production/Development: Use Firebase auth
    console.log('🔐 AuthProvider: Setting up Firebase auth listener')
    
    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      console.log('⚠️ AuthProvider: Auth loading timeout - forcing end of loading state')
      setLoading(false)
      setAuthError('Authentication timeout - check your connection and Firebase configuration')
    }, 10000) // 10 second timeout

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('🔐 AuthProvider: Auth state changed:', user ? 'User logged in' : 'No user')
      clearTimeout(loadingTimeout)
      setUser(user)
      setLoading(false)
      setAuthError(null)
    }, (error) => {
      console.error('🔐 AuthProvider: Auth error:', error)
      clearTimeout(loadingTimeout)
      setLoading(false)
      setAuthError(`Authentication error: ${error.message}`)
    })

    return () => {
      clearTimeout(loadingTimeout)
      unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
      toast.success('Signed in successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in')
      throw error
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password)
      toast.success('Account created successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account')
      throw error
    }
  }

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
      toast.success('Signed in with Google successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in with Google')
      throw error
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
      toast.success('Signed out successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign out')
      throw error
    }
  }

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email)
      toast.success('Password reset email sent!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to send password reset email')
      throw error
    }
  }

  const value = {
    user,
    loading,
    authError,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}