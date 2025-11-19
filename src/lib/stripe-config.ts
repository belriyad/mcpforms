/**
 * MCPForms - Stripe Configuration
 * Ready for Stripe payment integration
 */

// Stripe configuration - Set these in .env.local
export const stripeConfig = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  secretKey: process.env.STRIPE_SECRET_KEY || '',
  
  // Product and Price IDs (create these in Stripe Dashboard)
  products: {
    premium: {
      productId: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRODUCT_ID || '',
      priceId: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID || '',
    }
  },
  
  // Webhook secret for handling Stripe events
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
}

/**
 * Initialize Stripe (client-side)
 * Usage: const stripe = await getStripe()
 * Note: Install @stripe/stripe-js package first: npm install @stripe/stripe-js
 */
export async function getStripe() {
  if (typeof window === 'undefined') return null
  
  try {
    // TODO: Uncomment after installing @stripe/stripe-js
    // const { loadStripe } = await import('@stripe/stripe-js')
    // return loadStripe(stripeConfig.publishableKey)
    
    console.warn('Stripe not configured. Install @stripe/stripe-js to enable payments.')
    return null
  } catch (error) {
    console.error('Stripe not installed. Run: npm install @stripe/stripe-js')
    return null
  }
}

/**
 * Create a Stripe checkout session (server-side)
 * This function should be called from an API route
 */
export async function createCheckoutSession(
  userId: string,
  userEmail: string,
  priceId: string
) {
  // This is a placeholder - implement in /api/stripe/create-checkout-session route
  const response = await fetch('/api/stripe/create-checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      userEmail,
      priceId,
    }),
  })
  
  return response.json()
}

/**
 * Create a Stripe customer portal session (server-side)
 * Allows users to manage their subscription
 */
export async function createCustomerPortalSession(customerId: string) {
  // This is a placeholder - implement in /api/stripe/create-portal-session route
  const response = await fetch('/api/stripe/create-portal-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customerId,
    }),
  })
  
  return response.json()
}

// Environment variables to add to .env.local:
/*
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Product/Price IDs (create in Stripe Dashboard)
NEXT_PUBLIC_STRIPE_PREMIUM_PRODUCT_ID=prod_...
NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID=price_...
*/
