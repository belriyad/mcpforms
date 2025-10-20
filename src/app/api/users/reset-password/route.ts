import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth } from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
  try {
    const { userId, email } = await request.json()

    if (!userId && !email) {
      return NextResponse.json(
        { error: 'User ID or email is required' },
        { status: 400 }
      )
    }

    // Verify authorization
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const auth = getAdminAuth()
    
    // Verify the requesting user
    const decodedToken = await auth.verifyIdToken(token)
    console.log('🔐 Password reset requested by:', decodedToken.uid)

    // Generate password reset link
    let resetEmail = email
    if (userId && !email) {
      const userRecord = await auth.getUser(userId)
      resetEmail = userRecord.email || ''
    }

    if (!resetEmail) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 404 }
      )
    }

    const resetLink = await auth.generatePasswordResetLink(resetEmail)
    
    console.log('✅ Password reset link generated for:', resetEmail)

    return NextResponse.json({
      success: true,
      resetLink,
      email: resetEmail,
      message: 'Password reset link generated successfully'
    })

  } catch (error: any) {
    console.error('❌ Password reset error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate password reset link' },
      { status: 500 }
    )
  }
}
