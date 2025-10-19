'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth/AuthProvider'
import { signOut } from '@/lib/auth'
import { useRouter, usePathname } from 'next/navigation'
import { 
  LayoutDashboard,
  FileText, 
  Settings, 
  Inbox, 
  Sparkles,
  Activity,
  Users,
  LogOut,
  Menu,
  X,
  Palette,
  FlaskConical,
  ChevronDown
} from 'lucide-react'
import { isFeatureEnabled } from '@/lib/featureFlags'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { user, userProfile } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/admin', 
      icon: LayoutDashboard,
      current: pathname === '/admin'
    },
    { 
      name: 'Templates', 
      href: '/admin/templates', 
      icon: FileText,
      current: pathname?.startsWith('/admin/templates')
    },
    { 
      name: 'Services', 
      href: '/admin/services', 
      icon: Settings,
      current: pathname?.startsWith('/admin/services')
    },
    { 
      name: 'Intakes', 
      href: '/admin/intakes', 
      icon: Inbox,
      current: pathname?.startsWith('/admin/intakes')
    },
    ...(isFeatureEnabled('promptLibrary') ? [{ 
      name: 'AI Prompts', 
      href: '/admin/prompts', 
      icon: Sparkles,
      current: pathname?.startsWith('/admin/prompts')
    }] : []),
    ...(isFeatureEnabled('auditLog') ? [{ 
      name: 'Activity', 
      href: '/admin/activity', 
      icon: Activity,
      current: pathname?.startsWith('/admin/activity')
    }] : [])
  ]

  const settingsNavigation = [
    {
      name: 'General',
      href: '/admin/settings',
      icon: Settings,
      current: pathname === '/admin/settings'
    },
    ...(isFeatureEnabled('brandingBasic') ? [{
      name: 'Branding',
      href: '/admin/settings/branding',
      icon: Palette,
      current: pathname?.startsWith('/admin/settings/branding')
    }] : []),
    {
      name: 'Team',
      href: '/admin/settings/users',
      icon: Users,
      current: pathname?.startsWith('/admin/settings/users')
    },
    {
      name: 'Labs',
      href: '/admin/labs',
      icon: FlaskConical,
      current: pathname?.startsWith('/admin/labs')
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl shadow-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">MCPForms</h1>
                <p className="text-xs text-gray-500">Legal Automation</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    router.push(item.href)
                    setSidebarOpen(false)
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
                    ${item.current 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg' 
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </button>
              )
            })}

            {/* Settings Section */}
            <div className="pt-4 mt-4 border-t border-gray-200">
              <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                className={`
                  w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all
                  ${pathname?.startsWith('/admin/settings') || pathname?.startsWith('/admin/labs')
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5" />
                  <span>Settings</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${settingsOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {settingsOpen && (
                <div className="mt-1 ml-4 space-y-1">
                  {settingsNavigation.map((item) => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.name}
                        onClick={() => {
                          router.push(item.href)
                          setSidebarOpen(false)
                        }}
                        className={`
                          w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-all
                          ${item.current 
                            ? 'bg-blue-50 text-blue-700 font-medium' 
                            : 'text-gray-600 hover:bg-gray-50'
                          }
                        `}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                {(userProfile?.displayName || user?.email)?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {userProfile?.displayName || user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar for mobile */}
        <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-700"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Page content */}
        <main>{children}</main>
      </div>
    </div>
  )
}
