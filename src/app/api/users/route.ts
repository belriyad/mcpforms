import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { getAdminDb, isAdminInitialized } from '@/lib/firebase-admin'
import { UserProfile, DEFAULT_MANAGER_PERMISSIONS } from '@/types/permissions'

export async function GET(request: NextRequest) {
  try {
    if (!isAdminInitialized()) {
      return NextResponse.json(
        { error: 'Firebase Admin not configured' },
        { status: 503 }
      )
    }

    // Get current user from authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const auth = getAuth()
    const decodedToken = await auth.verifyIdToken(token)
    const currentUserId = decodedToken.uid

    console.log('📋 Fetching users for manager:', currentUserId)

    // Get current user's profile
    const adminDb = getAdminDb()
    const currentUserDoc = await adminDb.collection('users').doc(currentUserId).get()
    
    if (!currentUserDoc.exists) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    const currentUser = currentUserDoc.data() as UserProfile

    // Check if user has permission to manage users
    if (!currentUser.permissions?.canManageUsers) {
      return NextResponse.json(
        { error: 'You do not have permission to manage users' },
        { status: 403 }
      )
    }

    // Get all users where this user is the manager, or the user themselves
    const usersSnapshot = await adminDb
      .collection('users')
      .where('managerId', '==', currentUserId)
      .get()

    const teamMembers: UserProfile[] = []
    usersSnapshot.forEach(doc => {
      teamMembers.push({ uid: doc.id, ...doc.data() } as UserProfile)
    })

    // Also include the current user (manager)
    teamMembers.unshift({
      uid: currentUserDoc.id,
      ...currentUser
    } as UserProfile)

    console.log(`✅ Found ${teamMembers.length} users`)

    return NextResponse.json({
      users: teamMembers
    })

  } catch (error: any) {
    console.error('❌ Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isAdminInitialized()) {
      return NextResponse.json(
        { error: 'Firebase Admin not configured' },
        { status: 503 }
      )
    }

    const { email, name, permissions, sendInvitation } = await request.json()

    if (!email || !name || !permissions) {
      return NextResponse.json(
        { error: 'Email, name, and permissions are required' },
        { status: 400 }
      )
    }

    // Get current user from authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const auth = getAuth()
    const decodedToken = await auth.verifyIdToken(token)
    const currentUserId = decodedToken.uid

    console.log('👤 Creating new team member:', { email, name, creator: currentUserId })

    // Get current user's profile
    const adminDb = getAdminDb()
    const currentUserDoc = await adminDb.collection('users').doc(currentUserId).get()
    
    if (!currentUserDoc.exists) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    const currentUser = currentUserDoc.data() as UserProfile

    // Check if user has permission to manage users
    if (!currentUser.permissions?.canManageUsers) {
      return NextResponse.json(
        { error: 'You do not have permission to manage users' },
        { status: 403 }
      )
    }

    // Create Firebase Auth user with temporary password
    const tempPassword = Math.random().toString(36).slice(-12) + 'Aa1!'
    
    let newUser
    try {
      newUser = await auth.createUser({
        email,
        password: tempPassword,
        displayName: name,
        emailVerified: false,
      })
    } catch (authError: any) {
      if (authError.code === 'auth/email-already-exists') {
        return NextResponse.json(
          { error: 'A user with this email already exists' },
          { status: 409 }
        )
      }
      throw authError
    }

    console.log('✅ Created Firebase Auth user:', newUser.uid)

    // Create user profile in Firestore
    const newUserProfile: UserProfile = {
      uid: newUser.uid,
      email,
      name,
      accountType: 'team_member',
      managerId: currentUserId,
      createdAt: new Date().toISOString(),
      createdBy: currentUserId,
      permissions,
      active: true,
    }

    await adminDb.collection('users').doc(newUser.uid).set(newUserProfile)

    console.log('✅ Created user profile in Firestore')

    // Generate password reset link for invitation email
    let resetLink = null
    if (sendInvitation) {
      try {
        resetLink = await auth.generatePasswordResetLink(email)
        console.log('✅ Generated password reset link')
      } catch (linkError) {
        console.error('⚠️ Failed to generate reset link:', linkError)
      }
    }

    return NextResponse.json({
      success: true,
      user: newUserProfile,
      resetLink,
      message: sendInvitation 
        ? 'User created successfully. Invitation email will be sent.'
        : 'User created successfully. Please share login credentials manually.'
    })

  } catch (error: any) {
    console.error('❌ Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user', details: error.message },
      { status: 500 }
    )
  }
}
