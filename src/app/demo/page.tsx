'use client'

import { useState } from 'react'
import { 
  LoadingSpinner, 
  ProgressIndicator, 
  SkeletonCard, 
  SkeletonText,
  PulseDots 
} from '@/components/ui/loading-components'
import { 
  showSuccessToast, 
  showErrorToast, 
  showInfoToast, 
  showWarningToast,
  showLoadingToast 
} from '@/lib/toast-helpers'
import { 
  Sparkles, 
  Zap, 
  Shield, 
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Save,
  Lock,
  Settings,
  FileText,
  Inbox
} from 'lucide-react'

export default function DemoPage() {
  const [progress, setProgress] = useState(0)
  const [showSkeletons, setShowSkeletons] = useState(false)
  
  const incrementProgress = () => {
    setProgress(prev => Math.min(prev + 10, 100))
  }
  
  const decrementProgress = () => {
    setProgress(prev => Math.max(prev - 10, 0))
  }

  const simulateLoading = async () => {
    showLoadingToast('Processing your request...')
    await new Promise(resolve => setTimeout(resolve, 2000))
    showSuccessToast('Operation completed successfully!')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-4 animate-fade-in">
            <Sparkles className="w-10 h-10" />
            <h1 className="text-5xl font-bold">Component Showcase</h1>
          </div>
          <p className="text-xl text-blue-100 max-w-2xl animate-slide-in">
            Explore all the enhanced UI components, animations, and interactions implemented in Smart Forms AI
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
        
        {/* Loading Components */}
        <section className="space-y-6 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Loading Components</h2>
              <p className="text-gray-600">Beautiful loading states for better UX</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="card hover-scale">
              <div className="card-content">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Loading Spinner</h3>
                <div className="space-y-6">
                  <div className="flex flex-col items-center gap-4 p-6 bg-gray-50 rounded-lg">
                    <LoadingSpinner size="sm" />
                    <LoadingSpinner size="md" message="Processing..." />
                    <LoadingSpinner size="lg" message="Loading data..." />
                  </div>
                </div>
              </div>
            </div>

            <div className="card hover-scale">
              <div className="card-content">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Indicator</h3>
                <div className="space-y-4">
                  <ProgressIndicator 
                    progress={progress} 
                    total={100} 
                    label="Upload Progress" 
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={decrementProgress}
                      className="btn btn-secondary text-sm"
                    >
                      -10%
                    </button>
                    <button 
                      onClick={incrementProgress}
                      className="btn btn-primary text-sm"
                    >
                      +10%
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="card hover-scale">
              <div className="card-content">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pulse Dots</h3>
                <div className="flex items-center justify-center p-6 bg-gray-50 rounded-lg">
                  <PulseDots />
                </div>
              </div>
            </div>

            <div className="card hover-scale">
              <div className="card-content">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Skeleton Loaders</h3>
                <button 
                  onClick={() => setShowSkeletons(!showSkeletons)}
                  className="btn btn-secondary text-sm mb-4"
                >
                  {showSkeletons ? 'Hide' : 'Show'} Skeletons
                </button>
                {showSkeletons && (
                  <div className="space-y-4">
                    <SkeletonCard />
                    <SkeletonText lines={3} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Toast Notifications */}
        <section className="space-y-6 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Toast Notifications</h2>
              <p className="text-gray-600">Beautiful feedback messages with animations</p>
            </div>
          </div>

          <div className="card hover-scale">
            <div className="card-content">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button 
                  onClick={() => showSuccessToast('Success! Operation completed')}
                  className="btn btn-primary bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                >
                  <CheckCircle className="w-4 h-4" />
                  Success Toast
                </button>
                
                <button 
                  onClick={() => showErrorToast('Error! Something went wrong')}
                  className="btn btn-primary bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
                >
                  <AlertCircle className="w-4 h-4" />
                  Error Toast
                </button>
                
                <button 
                  onClick={() => showInfoToast('Info: Here is some helpful information')}
                  className="btn btn-primary bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                >
                  <Sparkles className="w-4 h-4" />
                  Info Toast
                </button>
                
                <button 
                  onClick={() => showWarningToast('Warning: Please review your input')}
                  className="btn btn-primary bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                >
                  <AlertCircle className="w-4 h-4" />
                  Warning Toast
                </button>
                
                <button 
                  onClick={simulateLoading}
                  className="btn btn-primary bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  <Zap className="w-4 h-4" />
                  Loading Toast
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Icon Library */}
        <section className="space-y-6 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Icon Library</h2>
              <p className="text-gray-600">Professional lucide-react icons used throughout the app</p>
            </div>
          </div>

          <div className="card hover-scale">
            <div className="card-content">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {[
                  { icon: Sparkles, name: 'Sparkles', color: 'from-blue-500 to-cyan-500' },
                  { icon: Zap, name: 'Zap', color: 'from-yellow-500 to-orange-500' },
                  { icon: Shield, name: 'Shield', color: 'from-green-500 to-emerald-500' },
                  { icon: TrendingUp, name: 'Trending', color: 'from-purple-500 to-pink-500' },
                  { icon: CheckCircle, name: 'Check', color: 'from-green-500 to-teal-500' },
                  { icon: AlertCircle, name: 'Alert', color: 'from-red-500 to-pink-500' },
                  { icon: Save, name: 'Save', color: 'from-blue-500 to-indigo-500' },
                  { icon: Lock, name: 'Lock', color: 'from-purple-500 to-indigo-500' },
                  { icon: Settings, name: 'Settings', color: 'from-gray-500 to-gray-600' },
                  { icon: FileText, name: 'Document', color: 'from-cyan-500 to-blue-500' },
                  { icon: Inbox, name: 'Inbox', color: 'from-orange-500 to-red-500' },
                ].map(({ icon: Icon, name, color }) => (
                  <div key={name} className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs font-medium text-gray-600">{name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Buttons & Cards */}
        <section className="space-y-6 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Buttons & Cards</h2>
              <p className="text-gray-600">Interactive elements with hover effects and animations</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="card hover-scale">
              <div className="card-content">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Button Variants</h3>
                <div className="space-y-3">
                  <button className="btn btn-primary w-full hover-scale">
                    Primary Button
                  </button>
                  <button className="btn btn-secondary w-full hover-scale">
                    Secondary Button
                  </button>
                  <button className="btn btn-primary w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover-scale">
                    <Sparkles className="w-4 h-4" />
                    Gradient Button
                  </button>
                </div>
              </div>
            </div>

            <div className="card hover-scale">
              <div className="card-content">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Card Variations</h3>
                <div className="space-y-3">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                    <p className="text-sm font-medium text-gray-900">Gradient Background Card</p>
                  </div>
                  <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-sm font-medium text-gray-900">Hover Shadow Card</p>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg text-white">
                    <p className="text-sm font-medium">Colored Gradient Card</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Animations */}
        <section className="space-y-6 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">CSS Animations</h2>
              <p className="text-gray-600">Smooth transitions and keyframe animations</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="card hover-scale animate-fade-in">
              <div className="card-content text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900">Fade In</h3>
                <p className="text-sm text-gray-600 mt-2">animate-fade-in</p>
              </div>
            </div>

            <div className="card hover-scale animate-slide-in">
              <div className="card-content text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900">Slide In</h3>
                <p className="text-sm text-gray-600 mt-2">animate-slide-in</p>
              </div>
            </div>

            <div className="card hover-scale">
              <div className="card-content text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-orange-500 rounded-full mx-auto mb-4 animate-float" />
                <h3 className="text-lg font-semibold text-gray-900">Float</h3>
                <p className="text-sm text-gray-600 mt-2">animate-float</p>
              </div>
            </div>
          </div>
        </section>

        {/* Form Elements */}
        <section className="space-y-6 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Form Elements</h2>
              <p className="text-gray-600">Enhanced form fields with validation icons</p>
            </div>
          </div>

          <div className="card hover-scale">
            <div className="card-content">
              <div className="space-y-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    Full Name
                    <span className="text-red-500">*</span>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </label>
                  <input 
                    type="text" 
                    placeholder="John Doe"
                    className="form-input w-full"
                    defaultValue="John Doe"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    Email Address
                    <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="email" 
                    placeholder="john@example.com"
                    className="form-input w-full border-red-300"
                  />
                  <div className="flex items-center gap-1 mt-2 animate-slide-in">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-600">Please enter a valid email address</p>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </label>
                  <input 
                    type="tel" 
                    placeholder="+1 (555) 000-0000"
                    className="form-input w-full"
                    defaultValue="+1 (555) 123-4567"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Badges */}
        <section className="space-y-6 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Trust Badges</h2>
              <p className="text-gray-600">Security and compliance indicators</p>
            </div>
          </div>

          <div className="card hover-scale">
            <div className="card-content">
              <div className="flex flex-wrap items-center justify-center gap-6 py-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="font-medium">Secure & Encrypted</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Lock className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="font-medium">GDPR Compliant</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Save className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="font-medium">Auto-Saved</span>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-600">
            All components are built with <span className="font-semibold text-blue-600">React</span>, 
            <span className="font-semibold text-purple-600"> Tailwind CSS</span>, and 
            <span className="font-semibold text-pink-600"> lucide-react</span>
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Powered by Smart Forms AI
          </p>
        </div>
      </div>
    </div>
  )
}
