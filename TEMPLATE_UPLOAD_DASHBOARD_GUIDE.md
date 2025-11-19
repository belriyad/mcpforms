# Template Upload Analytics Dashboard Guide

## Quick Start

### View Live Events
1. Navigate to `/admin/activity` (if Activity Log page exists)
2. Filter by event type: `template_upload_*`
3. See real-time funnel progression

### Firebase Console
1. Go to Firebase Console → Analytics → Events
2. Search for: `template_upload_progress`, `funnel_step`
3. View real-time event counts

### Firestore Console
1. Go to Firebase Console → Firestore → `analyticsEvents` collection
2. Filter: `eventName == 'funnel_step' AND funnel == 'template_upload'`
3. Sort by `createdAt desc`

## Building a Custom Dashboard

### 1. Funnel Visualization Component

```typescript
// components/analytics/TemplateUploadFunnel.tsx
import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface FunnelData {
  step: string
  count: number
  conversionRate: number
}

export function TemplateUploadFunnel({ dateRange = 7 }: { dateRange?: number }) {
  const [funnelData, setFunnelData] = useState<FunnelData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFunnelData()
  }, [dateRange])

  async function loadFunnelData() {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - dateRange)

    const steps = [
      'page_visited',
      'file_selected',
      'validation_passed',
      'name_entered',
      'firestore_created',
      'storage_uploaded',
      'metadata_updated',
      'parsing_triggered',
      'completed'
    ]

    const counts: Record<string, number> = {}

    // Get count for each funnel step
    for (const step of steps) {
      const q = query(
        collection(db, 'analyticsEvents'),
        where('eventName', '==', 'funnel_step'),
        where('funnel', '==', 'template_upload'),
        where('step', '==', step),
        where('createdAt', '>=', Timestamp.fromDate(startDate))
      )
      
      const snapshot = await getDocs(q)
      counts[step] = snapshot.size
    }

    // Calculate conversion rates
    const baseline = counts['page_visited'] || 1
    const data: FunnelData[] = steps.map(step => ({
      step: step.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count: counts[step] || 0,
      conversionRate: ((counts[step] || 0) / baseline) * 100
    }))

    setFunnelData(data)
    setLoading(false)
  }

  if (loading) return <div>Loading funnel data...</div>

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Template Upload Funnel (Last {dateRange} Days)</h2>
      
      <div className="space-y-2">
        {funnelData.map((item, index) => (
          <div key={item.step} className="flex items-center gap-4">
            <div className="w-48 text-sm font-medium">{item.step}</div>
            
            {/* Bar */}
            <div className="flex-1 bg-gray-200 rounded-full h-8 relative overflow-hidden">
              <div 
                className="bg-blue-600 h-full transition-all duration-500"
                style={{ width: `${item.conversionRate}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-between px-3 text-xs font-semibold">
                <span className="text-white">{item.count}</span>
                <span className="text-gray-700">{item.conversionRate.toFixed(1)}%</span>
              </div>
            </div>
            
            {/* Drop-off indicator */}
            {index > 0 && (
              <div className="w-16 text-xs text-red-600">
                -{(funnelData[index - 1].conversionRate - item.conversionRate).toFixed(1)}%
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-blue-600">
            {funnelData[funnelData.length - 1]?.conversionRate.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">Overall Conversion</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-green-600">
            {funnelData[funnelData.length - 1]?.count || 0}
          </div>
          <div className="text-sm text-gray-600">Completed Uploads</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-600">
            {funnelData[0]?.count || 0}
          </div>
          <div className="text-sm text-gray-600">Total Visits</div>
        </div>
      </div>
    </div>
  )
}
```

### 2. Performance Metrics Component

```typescript
// components/analytics/UploadPerformance.tsx
import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface PerformanceMetrics {
  avgDuration: number
  p50Duration: number
  p95Duration: number
  p99Duration: number
  totalUploads: number
}

export function UploadPerformance({ dateRange = 7 }: { dateRange?: number }) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMetrics()
  }, [dateRange])

  async function loadMetrics() {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - dateRange)

    const q = query(
      collection(db, 'analyticsEvents'),
      where('eventName', '==', 'funnel_step'),
      where('funnel', '==', 'template_upload'),
      where('step', '==', 'completed'),
      where('createdAt', '>=', Timestamp.fromDate(startDate))
    )
    
    const snapshot = await getDocs(q)
    const durations = snapshot.docs
      .map(doc => doc.data().duration as number)
      .filter(d => d > 0)
      .sort((a, b) => a - b)

    if (durations.length === 0) {
      setMetrics({
        avgDuration: 0,
        p50Duration: 0,
        p95Duration: 0,
        p99Duration: 0,
        totalUploads: 0
      })
      setLoading(false)
      return
    }

    const avg = durations.reduce((a, b) => a + b, 0) / durations.length
    const p50Index = Math.floor(durations.length * 0.5)
    const p95Index = Math.floor(durations.length * 0.95)
    const p99Index = Math.floor(durations.length * 0.99)

    setMetrics({
      avgDuration: avg,
      p50Duration: durations[p50Index],
      p95Duration: durations[p95Index],
      p99Duration: durations[p99Index],
      totalUploads: durations.length
    })
    setLoading(false)
  }

  function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms.toFixed(0)}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  if (loading) return <div>Loading performance data...</div>
  if (!metrics) return <div>No data available</div>

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Upload Performance (Last {dateRange} Days)</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600">
            {formatDuration(metrics.avgDuration)}
          </div>
          <div className="text-sm text-gray-600">Average</div>
        </div>

        <div className="text-center">
          <div className="text-3xl font-bold text-green-600">
            {formatDuration(metrics.p50Duration)}
          </div>
          <div className="text-sm text-gray-600">P50 (Median)</div>
        </div>

        <div className="text-center">
          <div className="text-3xl font-bold text-yellow-600">
            {formatDuration(metrics.p95Duration)}
          </div>
          <div className="text-sm text-gray-600">P95</div>
        </div>

        <div className="text-center">
          <div className="text-3xl font-bold text-red-600">
            {formatDuration(metrics.p99Duration)}
          </div>
          <div className="text-sm text-gray-600">P99</div>
        </div>

        <div className="text-center">
          <div className="text-3xl font-bold text-gray-600">
            {metrics.totalUploads}
          </div>
          <div className="text-sm text-gray-600">Total Uploads</div>
        </div>
      </div>

      {/* Performance indicator */}
      <div className="mt-4 p-4 rounded-lg bg-gray-50">
        {metrics.avgDuration < 10000 && (
          <div className="text-green-600 font-medium">✅ Excellent performance (avg &lt; 10s)</div>
        )}
        {metrics.avgDuration >= 10000 && metrics.avgDuration < 30000 && (
          <div className="text-yellow-600 font-medium">⚠️ Good performance (avg 10-30s)</div>
        )}
        {metrics.avgDuration >= 30000 && (
          <div className="text-red-600 font-medium">❌ Slow performance (avg &gt; 30s)</div>
        )}
      </div>
    </div>
  )
}
```

### 3. Error Analysis Component

```typescript
// components/analytics/UploadErrors.tsx
import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface ErrorCount {
  type: string
  count: number
  percentage: number
  examples: string[]
}

export function UploadErrors({ dateRange = 7 }: { dateRange?: number }) {
  const [errors, setErrors] = useState<ErrorCount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadErrors()
  }, [dateRange])

  async function loadErrors() {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - dateRange)

    const q = query(
      collection(db, 'analyticsEvents'),
      where('eventName', '==', 'funnel_step'),
      where('funnel', '==', 'template_upload'),
      where('step', '==', 'failed'),
      where('createdAt', '>=', Timestamp.fromDate(startDate))
    )
    
    const snapshot = await getDocs(q)
    const errorMap: Record<string, { count: number; messages: Set<string> }> = {}
    
    snapshot.docs.forEach(doc => {
      const data = doc.data()
      const type = data.errorType || 'unknown'
      const message = data.errorMessage || 'No message'
      
      if (!errorMap[type]) {
        errorMap[type] = { count: 0, messages: new Set() }
      }
      errorMap[type].count++
      errorMap[type].messages.add(message)
    })

    const totalErrors = snapshot.size
    const errorList: ErrorCount[] = Object.entries(errorMap).map(([type, data]) => ({
      type,
      count: data.count,
      percentage: (data.count / totalErrors) * 100,
      examples: Array.from(data.messages).slice(0, 3)
    }))
    .sort((a, b) => b.count - a.count)

    setErrors(errorList)
    setLoading(false)
  }

  if (loading) return <div>Loading error data...</div>

  if (errors.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Upload Errors (Last {dateRange} Days)</h2>
        <div className="text-green-600 font-medium">✅ No errors detected!</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Upload Errors (Last {dateRange} Days)</h2>
      
      <div className="space-y-4">
        {errors.map(error => (
          <div key={error.type} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold text-lg">{error.type.replace(/_/g, ' ')}</div>
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold text-red-600">{error.count}</span>
                <span className="text-sm text-gray-600">{error.percentage.toFixed(1)}%</span>
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              <div className="font-medium mb-1">Example messages:</div>
              <ul className="list-disc list-inside space-y-1">
                {error.examples.map((msg, i) => (
                  <li key={i} className="text-xs">{msg}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 4. Validation Failures Component

```typescript
// components/analytics/ValidationFailures.tsx
import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export function ValidationFailures({ dateRange = 7 }: { dateRange?: number }) {
  const [failures, setFailures] = useState<{ type: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFailures()
  }, [dateRange])

  async function loadFailures() {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - dateRange)

    const q = query(
      collection(db, 'analyticsEvents'),
      where('eventName', '==', 'template_upload_validation_failed'),
      where('createdAt', '>=', Timestamp.fromDate(startDate))
    )
    
    const snapshot = await getDocs(q)
    const failureMap: Record<string, number> = {}
    
    snapshot.docs.forEach(doc => {
      const reason = doc.data().error_code || 'unknown'
      failureMap[reason] = (failureMap[reason] || 0) + 1
    })

    const failureList = Object.entries(failureMap)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)

    setFailures(failureList)
    setLoading(false)
  }

  if (loading) return <div>Loading validation data...</div>

  if (failures.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Validation Failures (Last {dateRange} Days)</h2>
        <div className="text-green-600 font-medium">✅ All files passed validation!</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Validation Failures (Last {dateRange} Days)</h2>
      
      <div className="space-y-2">
        {failures.map(failure => (
          <div key={failure.type} className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <span className="font-medium">{failure.type.replace(/_/g, ' ')}</span>
            <span className="text-xl font-bold text-red-600">{failure.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

## Using the Dashboard Components

### Create Analytics Dashboard Page

```typescript
// app/admin/analytics/templates/page.tsx
'use client'

import { useState } from 'react'
import { TemplateUploadFunnel } from '@/components/analytics/TemplateUploadFunnel'
import { UploadPerformance } from '@/components/analytics/UploadPerformance'
import { UploadErrors } from '@/components/analytics/UploadErrors'
import { ValidationFailures } from '@/components/analytics/ValidationFailures'

export default function TemplateAnalyticsPage() {
  const [dateRange, setDateRange] = useState(7)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Template Upload Analytics</h1>
          
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(Number(e.target.value))}
            className="px-4 py-2 border rounded-lg"
          >
            <option value={1}>Last 24 hours</option>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>

        <div className="space-y-8">
          <TemplateUploadFunnel dateRange={dateRange} />
          <UploadPerformance dateRange={dateRange} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <UploadErrors dateRange={dateRange} />
            <ValidationFailures dateRange={dateRange} />
          </div>
        </div>
      </div>
    </div>
  )
}
```

## SQL-like Queries for Firestore

### Most Common Upload Paths
```typescript
// Find most common sequences of steps users take
const sequences: Record<string, number> = {}

const sessions = await db.collection('analyticsEvents')
  .where('funnel', '==', 'template_upload')
  .orderBy('createdAt')
  .get()

// Group by session_id and create sequence strings
const sessionMap: Record<string, string[]> = {}
sessions.docs.forEach(doc => {
  const data = doc.data()
  const sessionId = data.session_id
  if (!sessionMap[sessionId]) sessionMap[sessionId] = []
  sessionMap[sessionId].push(data.step)
})

Object.values(sessionMap).forEach(steps => {
  const sequence = steps.join(' → ')
  sequences[sequence] = (sequences[sequence] || 0) + 1
})

console.table(sequences)
```

### Time Between Steps
```typescript
// Calculate average time between each funnel step
const stepTimes: Record<string, number[]> = {}

Object.values(sessionMap).forEach(sessionSteps => {
  for (let i = 0; i < sessionSteps.length - 1; i++) {
    const key = `${sessionSteps[i]} → ${sessionSteps[i + 1]}`
    // Would need timestamps from actual docs to calculate
  }
})
```

## Export Data for Analysis

### Download CSV
```typescript
async function exportUploadDataCSV(dateRange: number) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - dateRange)

  const q = query(
    collection(db, 'analyticsEvents'),
    where('funnel', '==', 'template_upload'),
    where('createdAt', '>=', Timestamp.fromDate(startDate))
  )
  
  const snapshot = await getDocs(q)
  
  const headers = ['Timestamp', 'User ID', 'Step', 'Template ID', 'Duration', 'Error']
  const rows = snapshot.docs.map(doc => {
    const data = doc.data()
    return [
      data.timestamp,
      data.userId,
      data.step,
      data.templateId || '',
      data.duration || '',
      data.errorMessage || ''
    ]
  })

  const csv = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  // Download
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `template-upload-analytics-${new Date().toISOString()}.csv`
  a.click()
}
```

## Integration with Monitoring Tools

### Send to Slack
```typescript
// Cloud Function triggered on upload failures
export const notifyUploadFailure = functions.firestore
  .document('analyticsEvents/{eventId}')
  .onCreate(async (snap) => {
    const data = snap.data()
    
    if (
      data.eventName === 'funnel_step' &&
      data.funnel === 'template_upload' &&
      data.step === 'failed'
    ) {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `⚠️ Template Upload Failed`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Error:* ${data.errorType}\n*Message:* ${data.errorMessage}\n*User:* ${data.userId}`
              }
            }
          ]
        })
      })
    }
  })
```

### DataDog Integration
```typescript
import { datadogRum } from '@datadog/browser-rum'

// Track upload metrics to DataDog
Funnel.templateUploadCompleted = (userId, templateId, duration) => {
  trackFunnelStep('template_upload', 'completed', userId, { templateId, duration })
  
  datadogRum.addAction('template_upload_completed', {
    templateId,
    duration,
    userId
  })
}
```
