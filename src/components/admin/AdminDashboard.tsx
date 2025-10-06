'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth/AuthProvider'
import TemplateManager from './TemplateManager'
import ServiceManager from './ServiceManager'
import IntakeMonitor from './IntakeMonitor'
import IntakeCustomizationManager from './IntakeCustomizationManager'
import { FileText, Settings, Inbox, Sparkles, LogOut } from 'lucide-react'

type TabType = 'templates' | 'services' | 'intakes' | 'customizations'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('templates')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, signOut } = useAuth()

  const tabs = [
    { id: 'templates' as TabType, name: 'Templates', icon: FileText },
    { id: 'services' as TabType, name: 'Services', icon: Settings },
    { id: 'intakes' as TabType, name: 'Intakes', icon: Inbox },
    { id: 'customizations' as TabType, name: 'Customizations', icon: Sparkles },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40 backdrop-blur-lg bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl shadow-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Smart Forms AI</h1>
                <p className="text-xs text-gray-500">Admin Dashboard</p>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{user?.email}</span>
              </div>
              <button
                onClick={signOut}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>

            {/* Mobile Menu Toggle */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="mobile-menu-toggle p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                data-testid="mobile-menu-toggle"
                aria-label="Toggle mobile menu"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {!mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-2">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <div className="text-sm text-gray-700 px-3 py-2">
                  Welcome, {user?.email}
                </div>
                <button
                  onClick={signOut}
                  className="block w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-2 sm:space-x-8 overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    whitespace-nowrap py-2 px-2 sm:px-4 border-b-2 font-medium text-sm flex items-center space-x-1 sm:space-x-2 min-w-0 flex-shrink-0 transition-all
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <IconComponent className="w-5 h-5" />
                  <span className="hidden sm:inline">{tab.name}</span>
                  <span className="sm:hidden text-xs">{tab.name.slice(0, 4)}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'templates' && <TemplateManager />}
        {activeTab === 'services' && <ServiceManager />}
        {activeTab === 'intakes' && <IntakeMonitor />}
        {activeTab === 'customizations' && <IntakeCustomizationManager />}
      </main>
    </div>
  )
}