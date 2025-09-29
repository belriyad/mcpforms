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
    console.log('� AUTH DISABLED FOR DEBUGGING: Using mock user always')
    
    // TEMPORARY: Always use mock user for debugging
    const mockUser = {
      uid: 'debug-admin-user',
      email: 'admin@debug.com',
      displayName: 'Debug Admin',
      emailVerified: true,
      isAnonymous: false,
      providerId: 'debug',
      metadata: {
        creationTime: new Date().toISOString(),
        lastSignInTime: new Date().toISOString(),
      },
      phoneNumber: null,
      photoURL: null,
      providerData: [],
      refreshToken: 'debug-refresh-token',
      tenantId: null,
      delete: async () => {},
      getIdToken: async () => 'debug-id-token',
      getIdTokenResult: async () => ({
        token: 'debug-id-token',
        authTime: new Date().toISOString(),
        issuedAtTime: new Date().toISOString(),
        expirationTime: new Date(Date.now() + 3600000).toISOString(),
        signInProvider: 'debug',
        signInSecondFactor: null,
        claims: { admin: true },
      }),
      reload: async () => {},
      toJSON: () => ({}),
    } as User;
    
    setUser(mockUser);
    setLoading(false);
    setAuthError(null);
    
    console.log('✅ Mock user authenticated:', mockUser.email);
  }, [])

  const signIn = async (email: string, password: string) => {
    console.log('🔧 AUTH DISABLED: Mock sign in')
    toast.success('Mock sign in successful!')
  }

  const signUp = async (email: string, password: string) => {
    console.log('🔧 AUTH DISABLED: Mock sign up')
    toast.success('Mock account created!')
  }

  const signInWithGoogle = async () => {
    console.log('🔧 AUTH DISABLED: Mock Google sign in')
    toast.success('Mock Google sign in successful!')
  }

  const signOut = async () => {
    console.log('🔧 AUTH DISABLED: Mock sign out')
    toast.success('Mock sign out successful!')
  }

  const resetPassword = async (email: string) => {
    console.log('🔧 AUTH DISABLED: Mock password reset')
    toast.success('Mock password reset email sent!')
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