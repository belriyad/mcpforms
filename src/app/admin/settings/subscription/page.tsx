'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/AuthProvider'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { useRouter } from 'next/navigation'
import { 
  Crown, 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  Users,
  FileText,
  Settings as SettingsIcon,
  Loader2,
  ExternalLink,
  AlertCircle
} from 'lucide-react'
import { SUBSCRIPTION_PLANS, formatLimit, getUsagePercentage } from '@/lib/subscriptions'
import UpgradeModal from '@/components/UpgradeModal'

export default function SubscriptionSettingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { subscription, isPremium, plan, loading: subLoading } = useSubscription()
  const [loading, setLoading] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [managingBilling, setManagingBilling] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  const handleUpgrade = () => {
    setShowUpgradeModal(true)
  }

  const handleManageBilling = async () => {
    setManagingBilling(true)
    try {
      // TODO: Redirect to Stripe Customer Portal
      // const response = await fetch('/api/stripe/create-portal-session', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ customerId: subscription?.stripeCustomerId })
      // })
      // const { url } = await response.json()
      // window.location.href = url
      
      alert('Stripe Customer Portal coming soon! You\'ll be able to manage your subscription, update payment methods, and view invoices.')
    } catch (error) {
      console.error('Error opening billing portal:', error)
      alert('Failed to open billing portal. Please try again.')
    } finally {
      setManagingBilling(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your Premium subscription? You\'ll lose access to premium features at the end of your billing period.')) {
      return
    }

    setLoading(true)
    try {
      // TODO: Cancel via Stripe
      alert('Cancellation will be available soon via Stripe Customer Portal')
    } catch (error) {
      console.error('Error canceling subscription:', error)
      alert('Failed to cancel subscription. Please contact support.')
    } finally {
      setLoading(false)
    }
  }

  if (subLoading || !subscription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading subscription...</p>
        </div>
      </div>
    )
  }

  const currentPlan = SUBSCRIPTION_PLANS[subscription.tier]
  const otherPlan = subscription.tier === 'FREE' ? SUBSCRIPTION_PLANS.PREMIUM : SUBSCRIPTION_PLANS.FREE

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Subscription & Billing</h1>
        <p className="text-gray-600">Manage your plan, usage, and billing information</p>
      </div>

      {/* Current Plan Card */}
      <div className={`rounded-xl shadow-lg p-8 mb-8 border-2 ${
        isPremium 
          ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-400' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-xl ${
              isPremium 
                ? 'bg-gradient-to-r from-yellow-400 to-orange-500' 
                : 'bg-gray-200'
            }`}>
              <Crown className={`w-8 h-8 ${isPremium ? 'text-white' : 'text-gray-600'}`} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{currentPlan.name}</h2>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                ${currentPlan.price}
                <span className="text-lg text-gray-600 font-normal">/month</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
              subscription.status === 'active' 
                ? 'bg-green-100 text-green-800' 
                : subscription.status === 'past_due'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {subscription.status === 'active' && (
                <>
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  Active
                </>
              )}
              {subscription.status === 'past_due' && (
                <>
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  Payment Due
                </>
              )}
              {subscription.status === 'canceled' && (
                <>
                  <XCircle className="w-4 h-4 inline mr-1" />
                  Canceled
                </>
              )}
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-gray-700">
              <strong>{formatLimit(currentPlan.features.maxTemplates)}</strong> templates
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-gray-700">
              <strong>{formatLimit(currentPlan.features.maxServices)}</strong> services
            </span>
          </div>
          <div className="flex items-center gap-2">
            {currentPlan.features.canViewAnalytics ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-gray-400" />
            )}
            <span className={currentPlan.features.canViewAnalytics ? 'text-gray-700' : 'text-gray-400'}>
              Analytics dashboard
            </span>
          </div>
          <div className="flex items-center gap-2">
            {currentPlan.features.canManageUsers ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-gray-400" />
            )}
            <span className={currentPlan.features.canManageUsers ? 'text-gray-700' : 'text-gray-400'}>
              Team management
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {!isPremium && (
            <button
              onClick={handleUpgrade}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all font-medium shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <Crown className="w-5 h-5" />
              Upgrade to Premium
            </button>
          )}
          
          {isPremium && (
            <>
              <button
                onClick={handleManageBilling}
                disabled={managingBilling}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {managingBilling ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Opening...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Manage Billing
                    <ExternalLink className="w-4 h-4" />
                  </>
                )}
              </button>
              
              <button
                onClick={handleCancelSubscription}
                disabled={loading}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium disabled:opacity-50"
              >
                Cancel Plan
              </button>
            </>
          )}
        </div>
      </div>

      {/* Usage Statistics (Free Plan Only) */}
      {!isPremium && subscription.currentUsage && (
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8 border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Current Usage</h3>
          
          <div className="space-y-6">
            {/* Templates */}
            <div>
              <div className="flex justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-gray-900">Templates</span>
                </div>
                <span className="text-sm text-gray-600">
                  {subscription.currentUsage.templatesCount} / {formatLimit(currentPlan.features.maxTemplates)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    getUsagePercentage(subscription.currentUsage.templatesCount, currentPlan.features.maxTemplates) >= 100
                      ? 'bg-red-600'
                      : getUsagePercentage(subscription.currentUsage.templatesCount, currentPlan.features.maxTemplates) >= 80
                      ? 'bg-yellow-600'
                      : 'bg-blue-600'
                  }`}
                  style={{ width: `${Math.min(100, getUsagePercentage(subscription.currentUsage.templatesCount, currentPlan.features.maxTemplates))}%` }}
                />
              </div>
            </div>

            {/* Services */}
            <div>
              <div className="flex justify-between mb-2">
                <div className="flex items-center gap-2">
                  <SettingsIcon className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-gray-900">Services</span>
                </div>
                <span className="text-sm text-gray-600">
                  {subscription.currentUsage.servicesCount} / {formatLimit(currentPlan.features.maxServices)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    getUsagePercentage(subscription.currentUsage.servicesCount, currentPlan.features.maxServices) >= 100
                      ? 'bg-red-600'
                      : getUsagePercentage(subscription.currentUsage.servicesCount, currentPlan.features.maxServices) >= 80
                      ? 'bg-yellow-600'
                      : 'bg-green-600'
                  }`}
                  style={{ width: `${Math.min(100, getUsagePercentage(subscription.currentUsage.servicesCount, currentPlan.features.maxServices))}%` }}
                />
              </div>
            </div>

            {/* Users */}
            <div>
              <div className="flex justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-gray-900">Team Members</span>
                </div>
                <span className="text-sm text-gray-600">
                  {subscription.currentUsage.usersCount} / {formatLimit(currentPlan.features.maxUsers)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    getUsagePercentage(subscription.currentUsage.usersCount, currentPlan.features.maxUsers) >= 100
                      ? 'bg-red-600'
                      : getUsagePercentage(subscription.currentUsage.usersCount, currentPlan.features.maxUsers) >= 80
                      ? 'bg-yellow-600'
                      : 'bg-purple-600'
                  }`}
                  style={{ width: `${Math.min(100, getUsagePercentage(subscription.currentUsage.usersCount, currentPlan.features.maxUsers))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Upgrade CTA */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">Need more?</p>
                <p className="text-sm text-blue-700">Upgrade to Premium for unlimited templates, services, and team members.</p>
              </div>
              <button
                onClick={handleUpgrade}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium"
              >
                Upgrade
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Billing History (Premium Only) */}
      {isPremium && (
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Billing History</h3>
          <p className="text-gray-600 mb-4">
            Manage your payment methods and view invoice history in the Stripe Customer Portal.
          </p>
          <button
            onClick={handleManageBilling}
            disabled={managingBilling}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium flex items-center gap-2 disabled:opacity-50"
          >
            {managingBilling ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Opening Portal...
              </>
            ) : (
              <>
                <ExternalLink className="w-5 h-5" />
                Open Billing Portal
              </>
            )}
          </button>
        </div>
      )}

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </div>
  )
}
