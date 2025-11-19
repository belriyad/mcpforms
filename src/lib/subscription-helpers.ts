/**
 * MCPForms - Subscription Helpers
 * Utilities for managing user subscriptions end-to-end
 */

import { doc, updateDoc, getDoc, serverTimestamp, increment } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { SubscriptionTier, UserSubscription } from './subscriptions'

/**
 * Initialize a FREE subscription for a new user
 * Call this when a user signs up
 */
export async function initializeFreeSubscription(userId: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId)
    
    await updateDoc(userRef, {
      subscription: {
        tier: 'FREE',
        status: 'active',
        startDate: serverTimestamp(),
        currentUsage: {
          templatesCount: 0,
          servicesCount: 0,
          usersCount: 1
        }
      }
    })
    
    console.log('✅ FREE subscription initialized for user:', userId)
  } catch (error) {
    console.error('❌ Error initializing subscription:', error)
    throw error
  }
}

/**
 * Upgrade user to Premium
 * Call this after successful Stripe payment
 */
export async function upgradeToPremium(
  userId: string,
  stripeCustomerId: string,
  stripeSubscriptionId: string
): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId)
    
    await updateDoc(userRef, {
      'subscription.tier': 'PREMIUM',
      'subscription.status': 'active',
      'subscription.startDate': serverTimestamp(),
      'subscription.stripeCustomerId': stripeCustomerId,
      'subscription.stripeSubscriptionId': stripeSubscriptionId
    })
    
    console.log('✅ User upgraded to PREMIUM:', userId)
  } catch (error) {
    console.error('❌ Error upgrading to premium:', error)
    throw error
  }
}

/**
 * Downgrade user to Free
 * Call this when subscription is canceled
 */
export async function downgradeToFree(userId: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId)
    const userDoc = await getDoc(userRef)
    
    if (!userDoc.exists()) {
      throw new Error('User not found')
    }
    
    const currentUsage = userDoc.data().subscription?.currentUsage || {
      templatesCount: 0,
      servicesCount: 0,
      usersCount: 1
    }
    
    await updateDoc(userRef, {
      'subscription.tier': 'FREE',
      'subscription.status': 'canceled',
      'subscription.endDate': serverTimestamp(),
      'subscription.currentUsage': currentUsage
    })
    
    console.log('✅ User downgraded to FREE:', userId)
  } catch (error) {
    console.error('❌ Error downgrading to free:', error)
    throw error
  }
}

/**
 * Update subscription status (from Stripe webhooks)
 */
export async function updateSubscriptionStatus(
  userId: string,
  status: 'active' | 'past_due' | 'canceled' | 'trialing'
): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId)
    
    await updateDoc(userRef, {
      'subscription.status': status,
      updatedAt: serverTimestamp()
    })
    
    console.log(`✅ Subscription status updated to ${status} for user:`, userId)
  } catch (error) {
    console.error('❌ Error updating subscription status:', error)
    throw error
  }
}

/**
 * Increment usage counter
 * Call this after creating templates, services, or inviting users
 */
export async function incrementUsage(
  userId: string,
  type: 'templates' | 'services' | 'users'
): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId)
    const field = `subscription.currentUsage.${type}Count`
    
    await updateDoc(userRef, {
      [field]: increment(1)
    })
    
    console.log(`✅ ${type} count incremented for user:`, userId)
  } catch (error) {
    console.error(`❌ Error incrementing ${type} count:`, error)
    throw error
  }
}

/**
 * Decrement usage counter
 * Call this when deleting templates, services, or removing users
 */
export async function decrementUsage(
  userId: string,
  type: 'templates' | 'services' | 'users'
): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId)
    const field = `subscription.currentUsage.${type}Count`
    
    await updateDoc(userRef, {
      [field]: increment(-1)
    })
    
    console.log(`✅ ${type} count decremented for user:`, userId)
  } catch (error) {
    console.error(`❌ Error decrementing ${type} count:`, error)
    throw error
  }
}

/**
 * Get user's current subscription
 */
export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
  try {
    const userRef = doc(db, 'users', userId)
    const userDoc = await getDoc(userRef)
    
    if (!userDoc.exists()) {
      return null
    }
    
    const data = userDoc.data()
    
    if (!data.subscription) {
      return null
    }
    
    return {
      tier: data.subscription.tier || 'FREE',
      status: data.subscription.status || 'active',
      startDate: data.subscription.startDate?.toDate() || new Date(),
      endDate: data.subscription.endDate?.toDate(),
      stripeCustomerId: data.subscription.stripeCustomerId,
      stripeSubscriptionId: data.subscription.stripeSubscriptionId,
      currentUsage: data.subscription.currentUsage || {
        templatesCount: 0,
        servicesCount: 0,
        usersCount: 1
      }
    }
  } catch (error) {
    console.error('❌ Error getting user subscription:', error)
    return null
  }
}

/**
 * Check if user can perform action based on current usage
 */
export async function canPerformActionWithUsage(
  userId: string,
  action: 'createTemplate' | 'createService' | 'inviteUser'
): Promise<{ allowed: boolean; reason?: string; current: number; limit: number | 'unlimited' }> {
  try {
    const subscription = await getUserSubscription(userId)
    
    if (!subscription) {
      return { allowed: false, reason: 'No subscription found', current: 0, limit: 0 }
    }
    
    const { tier, currentUsage } = subscription
    
    // Premium users have unlimited access
    if (tier === 'PREMIUM') {
      return { allowed: true, current: 0, limit: 'unlimited' }
    }
    
    // Free tier limits
    const limits = {
      createTemplate: { max: 3, current: currentUsage.templatesCount, name: 'templates' },
      createService: { max: 10, current: currentUsage.servicesCount, name: 'services' },
      inviteUser: { max: 1, current: currentUsage.usersCount, name: 'users' }
    }
    
    const limit = limits[action]
    
    if (limit.current >= limit.max) {
      return {
        allowed: false,
        reason: `You've reached your ${limit.name} limit (${limit.max}). Upgrade to Premium for unlimited access.`,
        current: limit.current,
        limit: limit.max
      }
    }
    
    return { allowed: true, current: limit.current, limit: limit.max }
  } catch (error) {
    console.error('❌ Error checking action permission:', error)
    return { allowed: false, reason: 'Error checking permissions', current: 0, limit: 0 }
  }
}
