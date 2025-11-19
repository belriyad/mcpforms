/**
 * MCPForms - Subscription Enforcement Utilities
 * Helper functions to check and enforce subscription limits
 */

import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, getCountFromServer } from 'firebase/firestore'
import { UserSubscription, hasReachedLimit } from '@/lib/subscriptions'

/**
 * Check if user can upload more templates
 */
export async function canUploadTemplate(
  userId: string,
  subscription: UserSubscription | null
): Promise<{ allowed: boolean; message?: string; current: number; limit: number | 'unlimited' }> {
  // Count current templates
  const templatesQuery = query(
    collection(db, 'templates'),
    where('createdBy', '==', userId)
  )
  
  const snapshot = await getCountFromServer(templatesQuery)
  const current = snapshot.data().count
  
  const limitCheck = hasReachedLimit(subscription, 'templates')
  
  if (limitCheck.reached) {
    return {
      allowed: false,
      message: `You've reached your template limit (${limitCheck.limit}). Upgrade to Premium for unlimited templates.`,
      current,
      limit: limitCheck.limit
    }
  }
  
  return {
    allowed: true,
    current,
    limit: limitCheck.limit
  }
}

/**
 * Check if user can create more services
 */
export async function canCreateService(
  userId: string,
  subscription: UserSubscription | null
): Promise<{ allowed: boolean; message?: string; current: number; limit: number | 'unlimited' }> {
  // Count current services
  const servicesQuery = query(
    collection(db, 'services'),
    where('createdBy', '==', userId)
  )
  
  const snapshot = await getCountFromServer(servicesQuery)
  const current = snapshot.data().count
  
  const limitCheck = hasReachedLimit(subscription, 'services')
  
  if (limitCheck.reached) {
    return {
      allowed: false,
      message: `You've reached your service limit (${limitCheck.limit}). Upgrade to Premium for unlimited services.`,
      current,
      limit: limitCheck.limit
    }
  }
  
  return {
    allowed: true,
    current,
    limit: limitCheck.limit
  }
}

/**
 * Check if user can invite more team members
 */
export async function canInviteUser(
  organizationId: string,
  subscription: UserSubscription | null
): Promise<{ allowed: boolean; message?: string; current: number; limit: number }> {
  // Count current users
  const usersQuery = query(
    collection(db, 'users'),
    where('organizationId', '==', organizationId)
  )
  
  const snapshot = await getCountFromServer(usersQuery)
  const current = snapshot.data().count
  
  const limitCheck = hasReachedLimit(subscription, 'users')
  
  if (limitCheck.reached) {
    return {
      allowed: false,
      message: `You've reached your user limit (${limitCheck.limit}). Upgrade to Premium to add more team members.`,
      current,
      limit: limitCheck.limit as number
    }
  }
  
  return {
    allowed: true,
    current,
    limit: limitCheck.limit as number
  }
}

/**
 * Update user's current usage counts in Firestore
 */
export async function updateUsageCounts(userId: string, subscription: UserSubscription): Promise<void> {
  const { doc, updateDoc } = await import('firebase/firestore')
  
  await updateDoc(doc(db, 'users', userId), {
    'subscription.currentUsage': subscription.currentUsage
  })
}
