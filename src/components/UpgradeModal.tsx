/**
 * MCPForms - Upgrade Modal Component
 * Prompts users to upgrade to Premium when they hit limits
 */

'use client'

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, Crown, Check } from 'lucide-react'
import { SUBSCRIPTION_PLANS } from '@/lib/subscriptions'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  reason?: 'templates' | 'services' | 'users' | 'analytics'
  currentCount?: number
  limit?: number | 'unlimited'
}

export default function UpgradeModal({ isOpen, onClose, reason, currentCount, limit }: UpgradeModalProps) {
  const premiumPlan = SUBSCRIPTION_PLANS.PREMIUM
  const freePlan = SUBSCRIPTION_PLANS.FREE

  const getReasonMessage = () => {
    switch (reason) {
      case 'templates':
        return `You've reached your template limit (${limit}/${limit})`
      case 'services':
        return `You've reached your service limit (${limit}/${limit})`
      case 'users':
        return `You've reached your team member limit (${limit}/${limit})`
      case 'analytics':
        return 'Analytics is a Premium feature'
      default:
        return 'Upgrade to Premium for unlimited access'
    }
  }

  const handleUpgrade = async () => {
    // TODO: Integrate with Stripe Checkout
    console.log('Initiating Stripe checkout for Premium plan')
    
    // Placeholder for Stripe integration
    alert('Stripe checkout coming soon! For now, contact support to upgrade.')
    
    /* Example Stripe integration code:
    const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
    const response = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId: premiumPlan.stripePriceId })
    })
    const session = await response.json()
    await stripe?.redirectToCheckout({ sessionId: session.id })
    */
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-8 text-left align-middle shadow-xl transition-all">
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>

                {/* Header */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 mb-4">
                    <Crown className="w-8 h-8 text-white" />
                  </div>
                  <Dialog.Title as="h3" className="text-3xl font-bold text-gray-900 mb-2">
                    Upgrade to Premium
                  </Dialog.Title>
                  <p className="text-gray-600 text-lg">{getReasonMessage()}</p>
                </div>

                {/* Pricing comparison */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  {/* Free Plan */}
                  <div className="border-2 border-gray-200 rounded-xl p-6 bg-gray-50">
                    <h4 className="text-xl font-bold text-gray-900 mb-2">Free Plan</h4>
                    <p className="text-3xl font-bold text-gray-900 mb-4">
                      $0<span className="text-lg text-gray-600 font-normal">/month</span>
                    </p>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">Up to {freePlan.features.maxTemplates} templates</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">Up to {freePlan.features.maxServices} services</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">1 user only</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <X className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-500">No analytics</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <X className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-500">No team management</span>
                      </li>
                    </ul>
                  </div>

                  {/* Premium Plan */}
                  <div className="border-2 border-yellow-400 rounded-xl p-6 bg-gradient-to-br from-yellow-50 to-orange-50 relative">
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                        RECOMMENDED
                      </span>
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 mb-2">Premium Plan</h4>
                    <p className="text-3xl font-bold text-gray-900 mb-4">
                      ${premiumPlan.price}<span className="text-lg text-gray-600 font-normal">/month</span>
                    </p>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-900 font-medium">Unlimited templates</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-900 font-medium">Unlimited services</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-900 font-medium">Unlimited team members</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-900 font-medium">Advanced analytics dashboard</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-900 font-medium">Team management tools</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-900 font-medium">Priority support</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={onClose}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
                  >
                    Maybe Later
                  </button>
                  <button
                    onClick={handleUpgrade}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all font-medium shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    <Crown className="w-5 h-5" />
                    Upgrade Now
                  </button>
                </div>

                {/* Note */}
                <p className="text-center text-sm text-gray-500 mt-6">
                  Cancel anytime. No long-term contracts.
                </p>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
