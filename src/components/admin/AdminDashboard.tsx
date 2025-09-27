'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth/AuthProvider'
import TemplateManager from './TemplateManager'
import ServiceManager from './ServiceManager'
import IntakeMonitor from './IntakeMonitor'

type TabType = 'templates' | 'services' | 'intakes'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('templates')
  const { user, signOut } = useAuth()

  const tabs = [
    { id: 'templates' as TabType, name: 'Templates', icon: '📄' },
    { id: 'services' as TabType, name: 'Services', icon: '⚙️' },
    { id: 'intakes' as TabType, name: 'Intakes', icon: '📝' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Smart Forms AI Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Welcome, {user?.email}</span>
              <button
                onClick={signOut}
                className="btn btn-outline btn-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2
                  ${activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'templates' && <TemplateManager />}
        {activeTab === 'services' && <ServiceManager />}
        {activeTab === 'intakes' && <IntakeMonitor />}
      </main>
    </div>
  )
}