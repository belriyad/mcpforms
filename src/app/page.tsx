import { FileText, ClipboardCheck, Zap, ArrowRight } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8 sm:py-16">
        <div className="text-center animate-fade-in" data-testid="hero-section">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-blue-200 shadow-sm mb-6">
            <Zap className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">AI-Powered Document Generation</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6">
            Smart Forms AI
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto px-4 leading-relaxed">
            AI-powered business document generator that transforms templates into dynamic forms
            and creates personalized documents automatically.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:space-x-4 sm:gap-0">
            <a
              href="/admin"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
            >
              Admin Dashboard
              <ArrowRight className="w-5 h-5" />
            </a>
            <a
              href="/demo"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 font-medium rounded-xl hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200"
            >
              View Demo
            </a>
          </div>
        </div>
        
        <div className="mt-8 sm:mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8" data-testid="features-grid">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 hover-scale transition-all duration-300 hover:shadow-xl">
            <div className="p-6">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">AI Template Parsing</h3>
              <p className="text-gray-600 leading-relaxed">
                Upload PDF or Word documents and let AI extract form fields automatically.
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 hover-scale transition-all duration-300 hover:shadow-xl">
            <div className="p-6">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                <ClipboardCheck className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Dynamic Forms</h3>
              <p className="text-gray-600 leading-relaxed">
                Generate beautiful, responsive intake forms with validation and progress saving.
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 hover-scale transition-all duration-300 hover:shadow-xl">
            <div className="p-6">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Auto Document Generation</h3>
              <p className="text-gray-600 leading-relaxed">
                Populate templates with form data and generate final documents automatically.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}