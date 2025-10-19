import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { getAdminDb, isAdminInitialized } from '@/lib/firebase-admin'
import { UserProfile } from '@/types/permissions'

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    if (!isAdminInitialized()) {
      return NextResponse.json(
        { error: 'Firebase Admin not configured' },
        { status: 503 }
      )
    }

    const { userId } = params
    const { name, permissions, active } = await request.json()

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

    console.log('✏️ Updating user:', userId, 'by:', currentUserId)

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

    // Get the user to update
    const userToUpdateDoc = await adminDb.collection('users').doc(userId).get()
    
    if (!userToUpdateDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userToUpdate = userToUpdateDoc.data() as UserProfile

    // Verify that this user belongs to the current manager
    if (userToUpdate.managerId !== currentUserId && userToUpdate.uid !== currentUserId) {
      return NextResponse.json(
        { error: 'You can only manage your own team members' },
        { status: 403 }
      )
    }

    // Prevent manager from removing their own canManageUsers permission
    if (userId === currentUserId && permissions && !permissions.canManageUsers) {
      return NextResponse.json(
        { error: 'You cannot remove your own user management permission' },
        { status: 400 }
      )
    }

    // Update user profile
    const updates: Partial<UserProfile> = {
      ...(name && { name }),
      ...(permissions && { permissions }),
      ...(typeof active === 'boolean' && { active }),
    }

    await adminDb.collection('users').doc(userId).update(updates)

    // Update display name in Firebase Auth if name changed
    if (name) {
      try {
        await auth.updateUser(userId, { displayName: name })
      } catch (authError) {
        console.error('⚠️ Failed to update auth display name:', authError)
      }
    }

    // Disable/enable auth account if active status changed
    if (typeof active === 'boolean') {
      try {
        await auth.updateUser(userId, { disabled: !active })
      } catch (authError) {
        console.error('⚠️ Failed to update auth active status:', authError)
      }
    }

    console.log('✅ User updated successfully')

    return NextResponse.json({
      success: true,
      message: 'User updated successfully'
    })

  } catch (error: any) {
    console.error('❌ Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    if (!isAdminInitialized()) {
      return NextResponse.json(
        { error: 'Firebase Admin not configured' },
        { status: 503 }
      )
    }

    const { userId } = params

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

    // Prevent self-deletion
    if (userId === currentUserId) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      )
    }

    console.log('🗑️ Deleting user:', userId, 'by:', currentUserId)

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

    // Get the user to delete
    const userToDeleteDoc = await adminDb.collection('users').doc(userId).get()
    
    if (!userToDeleteDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userToDelete = userToDeleteDoc.data() as UserProfile

    // Verify that this user belongs to the current manager
    if (userToDelete.managerId !== currentUserId) {
      return NextResponse.json(
        { error: 'You can only delete your own team members' },
        { status: 403 }
      )
    }

    // Delete from Firestore
    await adminDb.collection('users').doc(userId).delete()

    // Delete from Firebase Auth
    try {
      await auth.deleteUser(userId)
    } catch (authError) {
      console.error('⚠️ Failed to delete from auth:', authError)
    }

    console.log('✅ User deleted successfully')

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })

  } catch (error: any) {
    console.error('❌ Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user', details: error.message },
      { status: 500 }
    )
  }
}
