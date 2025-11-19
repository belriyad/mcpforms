/**
 * MCPForms - Subscription Management
 * Handles subscription plans, feature limits, and access control
 */

export type SubscriptionTier = 'FREE' | 'PREMIUM';

export interface SubscriptionPlan {
  tier: SubscriptionTier;
  name: string;
  price: number; // in dollars per month
  features: {
    maxTemplates: number | 'unlimited';
    maxServices: number | 'unlimited';
    maxUsers: number;
    canManageUsers: boolean;
    canViewAnalytics: boolean;
    canUseAIFormatting: boolean;
    canCustomizeBranding: boolean;
    canAccessAdvancedFeatures: boolean;
  };
  stripeProductId?: string;
  stripePriceId?: string;
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  FREE: {
    tier: 'FREE',
    name: 'Free Plan',
    price: 0,
    features: {
      maxTemplates: 3,
      maxServices: 10,
      maxUsers: 1,
      canManageUsers: false,
      canViewAnalytics: false,
      canUseAIFormatting: true,
      canCustomizeBranding: false,
      canAccessAdvancedFeatures: false,
    },
  },
  PREMIUM: {
    tier: 'PREMIUM',
    name: 'Premium Plan',
    price: 199,
    features: {
      maxTemplates: 'unlimited',
      maxServices: 'unlimited',
      maxUsers: 999, // Effectively unlimited
      canManageUsers: true,
      canViewAnalytics: true,
      canUseAIFormatting: true,
      canCustomizeBranding: true,
      canAccessAdvancedFeatures: true,
    },
    // These will be set from environment variables
    stripeProductId: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRODUCT_ID,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID,
  },
};

export interface UserSubscription {
  tier: SubscriptionTier;
  status: 'active' | 'past_due' | 'canceled' | 'trialing';
  startDate: Date;
  endDate?: Date;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  
  // Usage tracking
  currentUsage: {
    templatesCount: number;
    servicesCount: number;
    usersCount: number;
  };
}

/**
 * Check if user can perform an action based on their subscription
 */
export function canPerformAction(
  subscription: UserSubscription | null,
  action: keyof SubscriptionPlan['features']
): boolean {
  const tier = subscription?.tier || 'FREE';
  const plan = SUBSCRIPTION_PLANS[tier];
  
  return plan.features[action] as boolean;
}

/**
 * Check if user has reached their limit for a resource
 */
export function hasReachedLimit(
  subscription: UserSubscription | null,
  resource: 'templates' | 'services' | 'users'
): { reached: boolean; current: number; limit: number | 'unlimited' } {
  const tier = subscription?.tier || 'FREE';
  const plan = SUBSCRIPTION_PLANS[tier];
  const current = subscription?.currentUsage?.[`${resource}Count`] || 0;
  
  let limit: number | 'unlimited';
  switch (resource) {
    case 'templates':
      limit = plan.features.maxTemplates;
      break;
    case 'services':
      limit = plan.features.maxServices;
      break;
    case 'users':
      limit = plan.features.maxUsers;
      break;
  }
  
  const reached = limit !== 'unlimited' && current >= limit;
  
  return { reached, current, limit };
}

/**
 * Get user's subscription plan details
 */
export function getSubscriptionPlan(tier: SubscriptionTier | null): SubscriptionPlan {
  return SUBSCRIPTION_PLANS[tier || 'FREE'];
}

/**
 * Format limit for display
 */
export function formatLimit(limit: number | 'unlimited'): string {
  return limit === 'unlimited' ? 'Unlimited' : limit.toString();
}

/**
 * Calculate usage percentage
 */
export function getUsagePercentage(current: number, limit: number | 'unlimited'): number {
  if (limit === 'unlimited') return 0;
  return Math.min(100, (current / limit) * 100);
}
