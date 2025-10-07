import { NextRequest } from 'next/server'

/**
 * TEMPORARY: Get user ID from request body
 * In production, this should verify Firebase ID token
 * For now, we trust the client-side authentication
 * 
 * TODO: Implement proper server-side auth verification when Firebase Admin is configured
 */
export async function getAuthenticatedUserId(request: NextRequest): Promise<string | null> {
  try {
    // For now, get userId from request body
    // This requires client to pass their userId in the request
    const body = await request.json()
    return body.userId || body.createdBy || null
  } catch (error) {
    console.error('Error getting user ID:', error)
    return null
  }
}

/**
 * Verify request has a user ID
 * Throws error if not present
 */
export async function requireAuth(request: NextRequest): Promise<string> {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) {
    throw new Error('Unauthorized - userId required in request body')
  }
  return userId
}
