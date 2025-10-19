'use client'

import { useState, useEffect } from 'react'
import { collection, query, onSnapshot, where, orderBy, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/lib/auth/AuthProvider'
import { useRouter } from 'next/navigation'
import { 
  FileText, 
  Settings, 
  Inbox, 
  Sparkles, 
  Users,
  FileCheck,
  TrendingUp,
  TrendingDown,
  Activity,
  Plus,
  Send,
  Upload,
  Eye,
  Clock,
  CheckCircle2,
  BarChart3,
  Zap
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { isFeatureEnabled } from '@/lib/featureFlags'

interface Stats {
  templates: number
  services: number
  intakes: number
  documents: number
  prompts: number
  teamMembers: number
}

interface ActivityItem {
  id: string
  type: 'intake_submitted' | 'doc_generated' | 'email_sent' | 'template_created' | 'service_created'
  timestamp: any
  description: string
  userId?: string
  serviceId?: string
}

export default function ModernDashboard() {
  const [stats, setStats] = useState<Stats>({
    templates: 0,
    services: 0,
    intakes: 0,
    documents: 0,
    prompts: 0,
    teamMembers: 0
  })
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const { user, userProfile } = useAuth()
  const router = useRouter()

  // Load stats
  useEffect(() => {
    if (!user?.uid) return
    
    const unsubscribers: (() => void)[] = []

    // Templates
    const templatesQuery = query(
      collection(db, 'templates'),
      where('createdBy', '==', user.uid)
    )
    unsubscribers.push(onSnapshot(templatesQuery, (snapshot) => {
      setStats(prev => ({ ...prev, templates: snapshot.size }))
    }))

    // Services
    const servicesQuery = query(
      collection(db, 'services'),
      where('createdBy', '==', user.uid)
    )
    unsubscribers.push(onSnapshot(servicesQuery, (snapshot) => {
      setStats(prev => ({ ...prev, services: snapshot.size }))
      
      // Count intakes and documents
      let intakeCount = 0
      let docCount = 0
      snapshot.docs.forEach(doc => {
        const data = doc.data()
        if (data.intakeForm) intakeCount++
        if (data.documents?.length) docCount += data.documents.length
      })
      setStats(prev => ({ ...prev, intakes: intakeCount, documents: docCount }))
    }))

    // Prompts (if feature enabled)
    if (isFeatureEnabled('promptLibrary')) {
      const promptsQuery = query(
        collection(db, 'userSettings'),
        where('__name__', '==', user.uid)
      )
      unsubscribers.push(onSnapshot(promptsQuery, (snapshot) => {
        const promptsCount = snapshot.docs[0]?.data()?.prompts?.length || 0
        setStats(prev => ({ ...prev, prompts: promptsCount }))
      }))
    }

    // Team members
    const usersQuery = query(collection(db, 'users'))
    unsubscribers.push(onSnapshot(usersQuery, (snapshot) => {
      setStats(prev => ({ ...prev, teamMembers: snapshot.size }))
    }))

    setLoading(false)

    return () => unsubscribers.forEach(unsub => unsub())
  }, [user?.uid])

  // Load recent activity
  useEffect(() => {
    if (!user?.uid || !isFeatureEnabled('auditLog')) return

    const activitiesQuery = query(
      collection(db, 'activityLogs'),
      where('userId', '==', user.uid),
      orderBy('ts', 'desc'),
      limit(10)
    )

    const unsubscribe = onSnapshot(activitiesQuery, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ActivityItem[]
      setActivities(items)
    })

    return () => unsubscribe()
  }, [user?.uid])

  const metricCards = [
    {
      title: 'Templates',
      value: stats.templates,
      icon: FileText,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-700',
      trend: '+12%',
      trendUp: true,
      path: '/admin/templates'
    },
    {
      title: 'Active Services',
      value: stats.services,
      icon: Settings,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-700',
      trend: '+8%',
      trendUp: true,
      path: '/admin/services'
    },
    {
      title: 'Intakes',
      value: stats.intakes,
      icon: Inbox,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-100',
      textColor: 'text-green-700',
      trend: '+24%',
      trendUp: true,
      path: '/admin/intakes'
    },
    {
      title: 'Documents',
      value: stats.documents,
      icon: FileCheck,
      color: 'from-orange-500 to-amber-500',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-700',
      trend: '+15%',
      trendUp: true,
      path: '/admin/services'
    },
    {
      title: 'AI Prompts',
      value: stats.prompts,
      icon: Sparkles,
      color: 'from-indigo-500 to-blue-500',
      bgColor: 'bg-indigo-100',
      textColor: 'text-indigo-700',
      trend: '+5%',
      trendUp: true,
      path: '/admin/prompts'
    },
    {
      title: 'Team Members',
      value: stats.teamMembers,
      icon: Users,
      color: 'from-rose-500 to-red-500',
      bgColor: 'bg-rose-100',
      textColor: 'text-rose-700',
      trend: '0%',
      trendUp: false,
      path: '/admin/settings/users'
    }
  ]

  const quickActions = [
    {
      title: 'New Service',
      description: 'Start a new client service',
      icon: Plus,
      color: 'from-blue-500 to-cyan-500',
      action: () => router.push('/admin/services/create')
    },
    {
      title: 'Upload Template',
      description: 'Add a new document template',
      icon: Upload,
      color: 'from-purple-500 to-pink-500',
      action: () => router.push('/admin/templates')
    },
    {
      title: 'Send Intake',
      description: 'Send intake form to client',
      icon: Send,
      color: 'from-green-500 to-emerald-500',
      action: () => router.push('/admin/services')
    },
    {
      title: 'View Activity',
      description: 'Check recent activity logs',
      icon: Activity,
      color: 'from-orange-500 to-amber-500',
      action: () => router.push('/admin/activity')
    }
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'intake_submitted': return CheckCircle2
      case 'doc_generated': return FileCheck
      case 'email_sent': return Send
      case 'template_created': return FileText
      case 'service_created': return Settings
      default: return Activity
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'intake_submitted': return 'text-green-600 bg-green-100'
      case 'doc_generated': return 'text-blue-600 bg-blue-100'
      case 'email_sent': return 'text-purple-600 bg-purple-100'
      case 'template_created': return 'text-orange-600 bg-orange-100'
      case 'service_created': return 'text-indigo-600 bg-indigo-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'Just now'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Welcome Banner */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {userProfile?.displayName || user?.email?.split('@')[0] || 'User'}! 👋
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your legal forms automation today.
          </p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {metricCards.map((metric) => {
            const IconComponent = metric.icon
            const TrendIcon = metric.trendUp ? TrendingUp : TrendingDown
            
            return (
              <Card 
                key={metric.title}
                className="hover:shadow-lg transition-all duration-300 cursor-pointer hover:-translate-y-1"
                onClick={() => router.push(metric.path)}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 bg-gradient-to-br ${metric.color} rounded-xl shadow-lg`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div className={`px-2.5 py-1 ${metric.bgColor} ${metric.textColor} rounded-full text-xs font-medium flex items-center gap-1`}>
                      <TrendIcon className="w-3 h-3" />
                      {metric.trend}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{metric.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{metric.value}</p>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    Quick Actions
                  </h2>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {quickActions.map((action) => {
                    const ActionIcon = action.icon
                    return (
                      <button
                        key={action.title}
                        onClick={action.action}
                        className="flex items-start gap-4 p-4 bg-gradient-to-br from-gray-50 to-white hover:from-white hover:to-gray-50 border border-gray-200 rounded-xl transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 text-left group"
                      >
                        <div className={`p-3 bg-gradient-to-br ${action.color} rounded-lg shadow-lg group-hover:scale-110 transition-transform`}>
                          <ActionIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                          <p className="text-sm text-gray-600">{action.description}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </Card>
          </div>

          {/* Recent Activity */}
          <div>
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-500" />
                    Recent Activity
                  </h2>
                  {isFeatureEnabled('auditLog') && (
                    <button
                      onClick={() => router.push('/admin/activity')}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View All
                    </button>
                  )}
                </div>

                {isFeatureEnabled('auditLog') && activities.length > 0 ? (
                  <div className="space-y-3">
                    {activities.slice(0, 5).map((activity) => {
                      const ActivityIcon = getActivityIcon(activity.type)
                      const colorClass = getActivityColor(activity.type)
                      
                      return (
                        <div key={activity.id} className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${colorClass}`}>
                            <ActivityIcon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 truncate">{activity.description}</p>
                            <p className="text-xs text-gray-500">{formatTimestamp(activity.timestamp)}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No recent activity</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {isFeatureEnabled('auditLog') ? 'Your activity will appear here' : 'Enable audit logging in Labs'}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Usage Chart (if enabled) */}
        {isFeatureEnabled('usageMetrics') && (
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-500" />
                  Usage Overview
                </h2>
                <select className="text-sm border border-gray-300 rounded-lg px-3 py-1.5">
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>Last 90 days</option>
                </select>
              </div>
              
              {/* Placeholder for usage chart */}
              <div className="h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">Usage Chart Coming Soon</p>
                  <p className="text-sm text-gray-500 mt-1">Document generation trends and analytics</p>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
