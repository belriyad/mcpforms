/**
 * MCPForms - Subscription Context
 * Provides subscription information and helpers throughout the app
 */

'use client'

import { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth/AuthProvider';
import { 
  SubscriptionTier, 
  UserSubscription, 
  canPerformAction, 
  hasReachedLimit,
  getSubscriptionPlan,
  SUBSCRIPTION_PLANS
} from '@/lib/subscriptions';

interface SubscriptionContextValue {
  subscription: UserSubscription | null;
  loading: boolean;
  
  // Helper functions
  canPerformAction: (action: keyof typeof SUBSCRIPTION_PLANS.FREE.features) => boolean;
  hasReachedLimit: (resource: 'templates' | 'services' | 'users') => {
    reached: boolean;
    current: number;
    limit: number | 'unlimited';
  };
  isPremium: boolean;
  plan: ReturnType<typeof getSubscriptionPlan>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    // Listen to user document for subscription changes
    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          
          if (userData.subscription) {
            // Convert Firestore Timestamp to Date
            const sub = userData.subscription;
            setSubscription({
              tier: sub.tier || 'FREE',
              status: sub.status || 'active',
              startDate: sub.startDate?.toDate?.() || new Date(),
              endDate: sub.endDate?.toDate?.(),
              stripeCustomerId: sub.stripeCustomerId,
              stripeSubscriptionId: sub.stripeSubscriptionId,
              currentUsage: sub.currentUsage || {
                templatesCount: 0,
                servicesCount: 0,
                usersCount: 1,
              },
            });
          } else {
            // Default to FREE plan
            setSubscription({
              tier: 'FREE',
              status: 'active',
              startDate: new Date(),
              currentUsage: {
                templatesCount: 0,
                servicesCount: 0,
                usersCount: 1,
              },
            });
          }
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error loading subscription:', error);
        // Default to FREE on error
        setSubscription({
          tier: 'FREE',
          status: 'active',
          startDate: new Date(),
          currentUsage: {
            templatesCount: 0,
            servicesCount: 0,
            usersCount: 1,
          },
        });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const value: SubscriptionContextValue = {
    subscription,
    loading,
    canPerformAction: (action) => canPerformAction(subscription, action),
    hasReachedLimit: (resource) => hasReachedLimit(subscription, resource),
    isPremium: subscription?.tier === 'PREMIUM',
    plan: getSubscriptionPlan(subscription?.tier || null),
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
