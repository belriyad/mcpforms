'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/AuthProvider'
import { useRouter } from 'next/navigation'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, Timestamp, orderBy, limit } from 'firebase/firestore'
import { 
  ChartBarIcon, 
  DocumentTextIcon, 
  InboxIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import { Crown } from 'lucide-react'

interface MetricCard {
  label: string
  value: string | number
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

interface RecentActivity {
  id: string
  type: 'service' | 'template' | 'intake' | 'document'
  name: string
  date: Date
  status?: string
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { isPremium, loading: subLoading } = useSubscription()
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d')
  
  // Metrics state
  const [metrics, setMetrics] = useState<MetricCard[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [statusBreakdown, setStatusBreakdown] = useState({
    services: { active: 0, draft: 0, total: 0 },
    intakes: { submitted: 0, pending: 0, total: 0 },
    documents: { ready: 0, generating: 0, total: 0 }
  })

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    // Redirect non-premium users
    if (!subLoading && !isPremium) {
      router.push('/admin')
      return
    }

    if (!subLoading && isPremium) {
      loadAnalyticsData()
    }
  }, [user, isPremium, subLoading, timeRange, router])

  const getTimeRangeDate = (): Date | null => {
    const now = new Date()
    switch (timeRange) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      case 'all':
        return null
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }
  }

  const loadAnalyticsData = async () => {
    setLoading(true)
    try {
      const startDate = getTimeRangeDate()
      
      // Load templates
      let templatesQuery = query(
        collection(db, 'templates'),
        where('createdBy', '==', user!.uid)
      )
      if (startDate) {
        templatesQuery = query(templatesQuery, where('createdAt', '>=', Timestamp.fromDate(startDate)))
      }
      const templatesSnapshot = await getDocs(templatesQuery)
      const templatesCount = templatesSnapshot.size
      
      // Load services
      let servicesQuery = query(
        collection(db, 'services'),
        where('createdBy', '==', user!.uid)
      )
      if (startDate) {
        servicesQuery = query(servicesQuery, where('createdAt', '>=', Timestamp.fromDate(startDate)))
      }
      const servicesSnapshot = await getDocs(servicesQuery)
      const servicesCount = servicesSnapshot.size
      
      // Count service statuses
      let activeServices = 0, draftServices = 0
      servicesSnapshot.docs.forEach(doc => {
        const status = doc.data().status
        if (status === 'active' || status === 'intake_sent' || status === 'documents_ready') {
          activeServices++
        } else if (status === 'draft') {
          draftServices++
        }
      })
      
      // Load intakes
      const intakesQuery = query(collection(db, 'intakes'))
      const intakesSnapshot = await getDocs(intakesQuery)
      
      // Filter intakes by service ownership
      const userServiceIds = servicesSnapshot.docs.map(doc => doc.id)
      let intakesCount = 0, submittedIntakes = 0, pendingIntakes = 0
      
      intakesSnapshot.docs.forEach(doc => {
        const intake = doc.data()
        if (userServiceIds.includes(intake.serviceId)) {
          intakesCount++
          if (intake.status === 'submitted' || intake.status === 'approved') {
            submittedIntakes++
          } else if (intake.status === 'link-generated' || intake.status === 'opened') {
            pendingIntakes++
          }
        }
      })
      
      // Count documents (generatedDocuments from services)
      let documentsCount = 0
      servicesSnapshot.docs.forEach(doc => {
        const generatedDocuments = doc.data().generatedDocuments || []
        documentsCount += generatedDocuments.length
      })

      // Set metrics
      setMetrics([
        {
          label: 'Total Templates',
          value: templatesCount,
          subtitle: 'Document templates uploaded',
          icon: DocumentTextIcon,
          color: 'blue'
        },
        {
          label: 'Total Services',
          value: servicesCount,
          subtitle: `${activeServices} active, ${draftServices} draft`,
          icon: Cog6ToothIcon,
          color: 'green'
        },
        {
          label: 'Total Intakes',
          value: intakesCount,
          subtitle: `${submittedIntakes} submitted`,
          icon: InboxIcon,
          color: 'purple'
        },
        {
          label: 'Documents Generated',
          value: documentsCount,
          subtitle: 'Across all services',
          icon: ChartBarIcon,
          color: 'orange'
        }
      ])

      setStatusBreakdown({
        services: { active: activeServices, draft: draftServices, total: servicesCount },
        intakes: { submitted: submittedIntakes, pending: pendingIntakes, total: intakesCount },
        documents: { ready: documentsCount, generating: 0, total: documentsCount }
      })

      // Load recent activity
      const activity: RecentActivity[] = []
      
      // Recent services
      const recentServicesQuery = query(
        collection(db, 'services'),
        where('createdBy', '==', user!.uid),
        orderBy('createdAt', 'desc'),
        limit(5)
      )
      const recentServices = await getDocs(recentServicesQuery)
      recentServices.docs.forEach(doc => {
        const data = doc.data()
        activity.push({
          id: doc.id,
          type: 'service',
          name: data.name || 'Untitled Service',
          date: data.createdAt?.toDate() || new Date(),
          status: data.status
        })
      })
      
      // Recent templates
      const recentTemplatesQuery = query(
        collection(db, 'templates'),
        where('createdBy', '==', user!.uid),
        orderBy('createdAt', 'desc'),
        limit(5)
      )
      const recentTemplates = await getDocs(recentTemplatesQuery)
      recentTemplates.docs.forEach(doc => {
        const data = doc.data()
        activity.push({
          id: doc.id,
          type: 'template',
          name: data.name || 'Untitled Template',
          date: data.createdAt?.toDate() || new Date(),
          status: data.status
        })
      })
      
      // Sort by date and limit
      activity.sort((a, b) => b.date.getTime() - a.date.getTime())
      setRecentActivity(activity.slice(0, 10))

    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getColorClass = (color: string) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      purple: 'from-purple-500 to-purple-600',
      orange: 'from-orange-500 to-orange-600'
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    
    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'service':
        return Cog6ToothIcon
      case 'template':
        return DocumentTextIcon
      case 'intake':
        return InboxIcon
      default:
        return ChartBarIcon
    }
  }

  if (subLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!isPremium) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <Crown className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Premium Feature</h2>
          <p className="text-gray-600 mb-6">
            Analytics is only available for Premium subscribers. Upgrade to access detailed insights about your templates, services, and documents.
          </p>
          <button
            onClick={() => router.push('/admin/settings')}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium"
          >
            Upgrade to Premium
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Real-time insights into your templates, services, and documents
            </p>
          </div>
          
          {/* Time Range Selector */}
          <div className="flex gap-2">
            {(['7d', '30d', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : 'All Time'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, index) => {
          const Icon = metric.icon
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-r ${getColorClass(metric.color)}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">{metric.label}</p>
              <p className="text-3xl font-bold text-gray-900 mb-2">{metric.value}</p>
              {metric.subtitle && (
                <p className="text-xs text-gray-500">{metric.subtitle}</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Services Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Active</span>
              <span className="font-semibold text-green-600">{statusBreakdown.services.active}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Draft</span>
              <span className="font-semibold text-gray-500">{statusBreakdown.services.draft}</span>
            </div>
            <div className="pt-3 border-t border-gray-200 flex justify-between">
              <span className="font-medium text-gray-900">Total</span>
              <span className="font-bold text-gray-900">{statusBreakdown.services.total}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Intakes Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Submitted</span>
              <span className="font-semibold text-green-600">{statusBreakdown.intakes.submitted}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pending</span>
              <span className="font-semibold text-yellow-600">{statusBreakdown.intakes.pending}</span>
            </div>
            <div className="pt-3 border-t border-gray-200 flex justify-between">
              <span className="font-medium text-gray-900">Total</span>
              <span className="font-bold text-gray-900">{statusBreakdown.intakes.total}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Ready</span>
              <span className="font-semibold text-green-600">{statusBreakdown.documents.ready}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Generating</span>
              <span className="font-semibold text-blue-600">{statusBreakdown.documents.generating}</span>
            </div>
            <div className="pt-3 border-t border-gray-200 flex justify-between">
              <span className="font-medium text-gray-900">Total</span>
              <span className="font-bold text-gray-900">{statusBreakdown.documents.total}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        {recentActivity.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No recent activity</p>
        ) : (
          <div className="space-y-4">
            {recentActivity.map((activity) => {
              const Icon = getTypeIcon(activity.type)
              return (
                <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Icon className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{activity.name}</p>
                      <p className="text-sm text-gray-500 capitalize">{activity.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {activity.status && (
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-1 ${
                        activity.status === 'active' || activity.status === 'ready' || activity.status === 'submitted'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {activity.status}
                      </span>
                    )}
                    <p className="text-xs text-gray-500">{formatDate(activity.date)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
