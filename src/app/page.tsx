

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 sm:py-16">
        <div className="text-center" data-testid="hero-section">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
            Smart Forms AI
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            AI-powered business document generator that transforms templates into dynamic forms
            and creates personalized documents automatically.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:space-x-4 sm:gap-0">
            <a
              href="/admin"
              className="btn btn-primary btn-lg"
            >
              Admin Dashboard
            </a>
            <a
              href="/demo"
              className="btn btn-outline btn-lg"
            >
              View Demo
            </a>
          </div>
        </div>
        
        <div className="mt-8 sm:mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8" data-testid="features-grid">
          <div className="card">
            <div className="card-content">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">AI Template Parsing</h3>
              <p className="text-gray-600">
                Upload PDF or Word documents and let AI extract form fields automatically.
              </p>
            </div>
          </div>
          
          <div className="card">
            <div className="card-content">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Dynamic Forms</h3>
              <p className="text-gray-600">
                Generate beautiful, responsive intake forms with validation and progress saving.
              </p>
            </div>
          </div>
          
          <div className="card">
            <div className="card-content">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Auto Document Generation</h3>
              <p className="text-gray-600">
                Populate templates with form data and generate final documents automatically.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}