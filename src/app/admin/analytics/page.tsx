'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/AuthProvider'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore'
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  DocumentTextIcon, 
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  FunnelIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface MetricCard {
  label: string
  value: string | number
  change?: number
  trend?: 'up' | 'down'
  icon: React.ComponentType<{ className?: string }>
}

interface AnalyticsEvent {
  id: string
  eventName: string
  timestamp: string
  userId?: string
  sessionId?: string
  parameters?: Record<string, any>
}

interface FunnelStep {
  step: string
  count: number
  percentage: number
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d')
  
  // Metrics state
  const [metrics, setMetrics] = useState<MetricCard[]>([])
  const [recentEvents, setRecentEvents] = useState<AnalyticsEvent[]>([])
  const [onboardingFunnel, setOnboardingFunnel] = useState<FunnelStep[]>([])
  const [documentFunnel, setDocumentFunnel] = useState<FunnelStep[]>([])
  const [topEvents, setTopEvents] = useState<{ name: string; count: number }[]>([])
  const [errorEvents, setErrorEvents] = useState<AnalyticsEvent[]>([])

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    loadAnalyticsData()
  }, [user, timeRange])

  const getTimeRangeDate = () => {
    const now = new Date()
    switch (timeRange) {
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000)
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }
  }

  const loadAnalyticsData = async () => {
    setLoading(true)
    try {
      const startDate = getTimeRangeDate()
      
      // Load recent events
      const eventsQuery = query(
        collection(db, 'analyticsEvents'),
        where('timestamp', '>=', startDate.toISOString()),
        orderBy('timestamp', 'desc'),
        limit(100)
      )
      
      const eventsSnapshot = await getDocs(eventsQuery)
      const events = eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AnalyticsEvent[]

      setRecentEvents(events.slice(0, 10))

      // Calculate metrics
      await calculateMetrics(events)
      
      // Calculate funnels
      await calculateFunnels(events)
      
      // Get top events
      calculateTopEvents(events)
      
      // Get error events
      const errors = events.filter(e => 
        e.eventName.includes('failed') || 
        e.eventName.includes('error')
      ).slice(0, 5)
      setErrorEvents(errors)

    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateMetrics = async (events: AnalyticsEvent[]) => {
    const uniqueUsers = new Set(events.map(e => e.userId).filter(Boolean)).size
    const totalEvents = events.length
    const landingVisits = events.filter(e => e.eventName === 'landing_page_visit').length
    const signups = events.filter(e => e.eventName === 'signup_completed').length
    const logins = events.filter(e => e.eventName === 'login_success').length
    const servicesCreated = events.filter(e => e.eventName === 'service_created').length
    const intakesSubmitted = events.filter(e => e.eventName === 'intake_form_submitted').length
    const docsGenerated = events.filter(e => e.eventName === 'document_generated').length

    const conversionRate = landingVisits > 0 
      ? ((signups / landingVisits) * 100).toFixed(1) 
      : '0'

    setMetrics([
      {
        label: 'Active Users',
        value: uniqueUsers,
        icon: UserGroupIcon,
        trend: 'up',
        change: 12
      },
      {
        label: 'Total Events',
        value: totalEvents.toLocaleString(),
        icon: ChartBarIcon,
        trend: 'up',
        change: 8
      },
      {
        label: 'Signups',
        value: signups,
        icon: ArrowTrendingUpIcon,
        trend: 'up',
        change: 15
      },
      {
        label: 'Conversion Rate',
        value: `${conversionRate}%`,
        icon: FunnelIcon,
        trend: signups > logins ? 'up' : 'down',
        change: 5
      },
      {
        label: 'Services Created',
        value: servicesCreated,
        icon: DocumentTextIcon,
        trend: 'up',
        change: 10
      },
      {
        label: 'Intakes Submitted',
        value: intakesSubmitted,
        icon: DocumentTextIcon,
        trend: 'up',
        change: 7
      },
      {
        label: 'Documents Generated',
        value: docsGenerated,
        icon: DocumentTextIcon,
        trend: 'up',
        change: 9
      },
      {
        label: 'Avg. Session Time',
        value: '5:32',
        icon: ClockIcon,
        trend: 'up',
        change: 3
      }
    ])
  }

  const calculateFunnels = async (events: AnalyticsEvent[]) => {
    // Onboarding funnel
    const landingVisits = events.filter(e => e.eventName === 'landing_page_visit').length
    const startTrialClicks = events.filter(e => e.eventName === 'start_trial_clicked').length
    const signupsStarted = events.filter(e => e.eventName === 'signup_started').length
    const signupsCompleted = events.filter(e => e.eventName === 'signup_completed').length
    const logins = events.filter(e => e.eventName === 'login_success').length
    const servicesCreated = events.filter(e => e.eventName === 'service_created').length

    const onboardingSteps: FunnelStep[] = [
      { step: 'Landing Visit', count: landingVisits, percentage: 100 },
      { 
        step: 'Start Trial Click', 
        count: startTrialClicks, 
        percentage: landingVisits > 0 ? (startTrialClicks / landingVisits) * 100 : 0 
      },
      { 
        step: 'Signup Started', 
        count: signupsStarted, 
        percentage: landingVisits > 0 ? (signupsStarted / landingVisits) * 100 : 0 
      },
      { 
        step: 'Signup Completed', 
        count: signupsCompleted, 
        percentage: landingVisits > 0 ? (signupsCompleted / landingVisits) * 100 : 0 
      },
      { 
        step: 'Login Success', 
        count: logins, 
        percentage: landingVisits > 0 ? (logins / landingVisits) * 100 : 0 
      },
      { 
        step: 'Service Created', 
        count: servicesCreated, 
        percentage: landingVisits > 0 ? (servicesCreated / landingVisits) * 100 : 0 
      }
    ]

    setOnboardingFunnel(onboardingSteps)

    // Document funnel
    const intakesOpened = events.filter(e => e.eventName === 'intake_form_opened').length
    const intakesStarted = events.filter(e => e.eventName === 'intake_form_started').length
    const intakesSaved = events.filter(e => e.eventName === 'intake_form_saved').length
    const intakesSubmitted = events.filter(e => e.eventName === 'intake_form_submitted').length
    const docsGenerated = events.filter(e => e.eventName === 'document_generated').length
    const docsDownloaded = events.filter(e => e.eventName === 'document_downloaded').length

    const documentSteps: FunnelStep[] = [
      { step: 'Intake Opened', count: intakesOpened, percentage: 100 },
      { 
        step: 'Intake Started', 
        count: intakesStarted, 
        percentage: intakesOpened > 0 ? (intakesStarted / intakesOpened) * 100 : 0 
      },
      { 
        step: 'Progress Saved', 
        count: intakesSaved, 
        percentage: intakesOpened > 0 ? (intakesSaved / intakesOpened) * 100 : 0 
      },
      { 
        step: 'Intake Submitted', 
        count: intakesSubmitted, 
        percentage: intakesOpened > 0 ? (intakesSubmitted / intakesOpened) * 100 : 0 
      },
      { 
        step: 'Doc Generated', 
        count: docsGenerated, 
        percentage: intakesOpened > 0 ? (docsGenerated / intakesOpened) * 100 : 0 
      },
      { 
        step: 'Doc Downloaded', 
        count: docsDownloaded, 
        percentage: intakesOpened > 0 ? (docsDownloaded / intakesOpened) * 100 : 0 
      }
    ]

    setDocumentFunnel(documentSteps)
  }

  const calculateTopEvents = (events: AnalyticsEvent[]) => {
    const eventCounts = events.reduce((acc, event) => {
      acc[event.eventName] = (acc[event.eventName] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const sorted = Object.entries(eventCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    setTopEvents(sorted)
  }

  const formatEventName = (eventName: string) => {
    return eventName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return `${Math.floor(diffMins / 1440)}d ago`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="mt-2 text-gray-600">
                Comprehensive tracking and insights for your platform
              </p>
            </div>
            
            {/* Time Range Selector */}
            <div className="flex gap-2">
              {(['24h', '7d', '30d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    timeRange === range
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {range === '24h' ? '24 Hours' : range === '7d' ? '7 Days' : '30 Days'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{metric.label}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{metric.value}</p>
                  {metric.change !== undefined && (
                    <div className="mt-2 flex items-center">
                      {metric.trend === 'up' ? (
                        <ArrowTrendingUpIcon className="h-4 w-4 text-green-600" />
                      ) : (
                        <ArrowTrendingDownIcon className="h-4 w-4 text-red-600" />
                      )}
                      <span className={`ml-1 text-sm ${
                        metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {metric.change}%
                      </span>
                    </div>
                  )}
                </div>
                <metric.icon className="h-10 w-10 text-blue-600" />
              </div>
            </div>
          ))}
        </div>

        {/* Funnels Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Onboarding Funnel */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Onboarding Funnel</h2>
            <div className="space-y-3">
              {onboardingFunnel.map((step, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{step.step}</span>
                    <span className="text-gray-900 font-medium">
                      {step.count} ({step.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${step.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Document Funnel */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Document Funnel</h2>
            <div className="space-y-3">
              {documentFunnel.map((step, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{step.step}</span>
                    <span className="text-gray-900 font-medium">
                      {step.count} ({step.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${step.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Events & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Events */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Top Events</h2>
            <div className="space-y-2">
              {topEvents.map((event, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-500 w-6">{index + 1}</span>
                    <span className="text-sm text-gray-900">{formatEventName(event.name)}</span>
                  </div>
                  <span className="text-sm font-bold text-blue-600">{event.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {recentEvents.map((event) => (
                <div key={event.id} className="flex items-start justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {formatEventName(event.eventName)}
                    </p>
                    {event.userId && (
                      <p className="text-xs text-gray-500 mt-1">
                        User: {event.userId.substring(0, 8)}...
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatTimestamp(event.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Error Events */}
        {errorEvents.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-2" />
              <h2 className="text-xl font-bold text-gray-900">Recent Errors</h2>
            </div>
            <div className="space-y-3">
              {errorEvents.map((event) => (
                <div key={event.id} className="bg-red-50 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-900">
                        {formatEventName(event.eventName)}
                      </p>
                      {event.parameters?.error && (
                        <p className="text-xs text-red-700 mt-1">
                          {event.parameters.error}
                        </p>
                      )}
                      {event.userId && (
                        <p className="text-xs text-red-600 mt-1">
                          User: {event.userId.substring(0, 8)}...
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-red-600">
                      {formatTimestamp(event.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Export Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={() => {
              const data = JSON.stringify({ metrics, onboardingFunnel, documentFunnel, topEvents, recentEvents }, null, 2)
              const blob = new Blob([data], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `analytics-${new Date().toISOString()}.json`
              a.click()
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Export Data
          </button>
        </div>
      </div>
    </div>
  )
}
