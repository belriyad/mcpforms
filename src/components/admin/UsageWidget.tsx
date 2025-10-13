/**
 * Usage Metrics Widget (MVP Feature #32)
 * 
 * Displays document generation statistics for the current user
 */

'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/AuthProvider'
import { getTodayDocCount, getWeeklyTotal, getRecentUsageMetrics } from '@/lib/usage-metrics'
import { isFeatureEnabled } from '@/lib/feature-flags'
import { Card } from '@/components/ui/card'
import { TrendingUp, FileText, BarChart3, Loader2, AlertCircle } from 'lucide-react'

export default function UsageWidget() {
  const { user } = useAuth()
  const [todayCount, setTodayCount] = useState<number>(0)
  const [weeklyCount, setWeeklyCount] = useState<number>(0)
  const [recentMetrics, setRecentMetrics] = useState<Array<{ date: string; count: number }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check feature flag
  const enabled = isFeatureEnabled('usageMetrics')

  useEffect(() => {
    if (!user?.uid || !enabled) {
      setLoading(false)
      return
    }

    let mounted = true

    const loadMetrics = async () => {
      try {
        setLoading(true)
        setError(null)

        // Load today's count
        const today = await getTodayDocCount(user.uid)
        
        // Load weekly total
        const weekly = await getWeeklyTotal(user.uid)
        
        // Load recent metrics for chart (last 7 days)
        const recent = await getRecentUsageMetrics(user.uid, 7)
        
        if (mounted) {
          setTodayCount(today)
          setWeeklyCount(weekly)
          setRecentMetrics(
            recent.map(m => ({
              date: m.date,
              count: m.docGeneratedCount
            })).reverse() // Show oldest to newest
          )
        }
      } catch (err) {
        console.error('[UsageWidget] Failed to load metrics:', err)
        if (mounted) {
          setError('Failed to load usage metrics')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadMetrics()

    // Refresh every 30 seconds
    const intervalId = setInterval(loadMetrics, 30000)

    return () => {
      mounted = false
      clearInterval(intervalId)
    }
  }, [user?.uid, enabled])

  // Don't render if feature disabled
  if (!enabled) {
    return null
  }

  // Loading state
  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className="p-6 border-red-200 bg-red-50">
        <div className="flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Unable to Load Metrics</p>
            <p className="text-sm mt-1 text-red-600">{error}</p>
          </div>
        </div>
      </Card>
    )
  }

  // Calculate max for chart scaling
  const maxCount = Math.max(...recentMetrics.map(m => m.count), 1)

  // Format date for display (MM/DD)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  return (
    <Card className="overflow-hidden hover-scale transition-all duration-300">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Usage Metrics</h3>
              <p className="text-sm text-gray-500">Document generation</p>
            </div>
          </div>
          <div className="p-2 bg-green-100 rounded-lg">
            <BarChart3 className="w-5 h-5 text-green-600" />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Today's Count */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Today</span>
            </div>
            <div className="text-3xl font-bold text-blue-900">{todayCount}</div>
            <div className="text-xs text-blue-700 mt-1">Documents</div>
          </div>

          {/* Weekly Total */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">This Week</span>
            </div>
            <div className="text-3xl font-bold text-purple-900">{weeklyCount}</div>
            <div className="text-xs text-purple-700 mt-1">Documents</div>
          </div>
        </div>

        {/* Mini Bar Chart - Last 7 Days */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Last 7 Days</h4>
          <div className="flex items-end justify-between gap-2 h-24">
            {recentMetrics.map((metric, index) => {
              const height = maxCount > 0 ? (metric.count / maxCount) * 100 : 0
              const isToday = index === recentMetrics.length - 1
              
              return (
                <div key={metric.date} className="flex-1 flex flex-col items-center gap-2">
                  {/* Bar */}
                  <div className="w-full flex items-end justify-center" style={{ height: '60px' }}>
                    <div
                      className={`w-full rounded-t transition-all duration-300 ${
                        isToday 
                          ? 'bg-gradient-to-t from-blue-500 to-blue-400' 
                          : 'bg-gradient-to-t from-gray-300 to-gray-200'
                      }`}
                      style={{ height: `${height}%`, minHeight: metric.count > 0 ? '4px' : '0' }}
                      title={`${formatDate(metric.date)}: ${metric.count} docs`}
                    />
                  </div>
                  
                  {/* Count Badge */}
                  {metric.count > 0 && (
                    <div className={`text-xs font-semibold ${
                      isToday ? 'text-blue-600' : 'text-gray-600'
                    }`}>
                      {metric.count}
                    </div>
                  )}
                  
                  {/* Date Label */}
                  <div className={`text-xs ${
                    isToday ? 'font-semibold text-blue-600' : 'text-gray-500'
                  }`}>
                    {isToday ? 'Today' : formatDate(metric.date)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Empty State */}
        {todayCount === 0 && weeklyCount === 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <p className="text-sm text-gray-600 text-center">
              No documents generated yet. Generate your first document to start tracking usage!
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}
