'use client';

import { useState, useEffect } from 'react';
import { 
  getAllFeatureFlags, 
  toggleFeature, 
  resetAllFeatures,
  type FeatureFlag 
} from '@/lib/feature-flags';

export default function LabsPage() {
  const [flags, setFlags] = useState(getAllFeatureFlags());
  const [isDev, setIsDev] = useState(false);

  useEffect(() => {
    setIsDev(process.env.NODE_ENV === 'development');
    setFlags(getAllFeatureFlags());
  }, []);

  const handleToggle = (flag: FeatureFlag) => {
    toggleFeature(flag, !flags.find(f => f.key === flag)?.enabled);
    setFlags(getAllFeatureFlags());
  };

  const handleResetAll = () => {
    if (confirm('Reset all feature flags to defaults?')) {
      resetAllFeatures();
      setFlags(getAllFeatureFlags());
      window.location.reload();
    }
  };

  if (!isDev) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Labs Unavailable</h1>
          <p className="text-gray-600">
            Feature flags can only be toggled in development mode.
            In production, use environment variables.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Labs</h1>
              <p className="text-gray-600 mt-2">
                Toggle MVP features for testing (Development Only)
              </p>
            </div>
            <button
              onClick={handleResetAll}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Reset All
            </button>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Development Feature Flags
              </h3>
              <p className="mt-1 text-sm text-yellow-700">
                Changes take effect immediately. Some features may require backend updates.
                Settings are stored in localStorage and reset on browser clear.
              </p>
            </div>
          </div>
        </div>

        {/* Feature Flags List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {flags.map((flag) => (
              <li key={flag.key} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {flag.name}
                      </h3>
                      {flag.requiresBackend && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Backend Required
                        </span>
                      )}
                      {flag.enabled && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {flag.description}
                    </p>
                    <p className="text-xs text-gray-500 font-mono">
                      Flag: {flag.key}
                    </p>
                  </div>
                  
                  {/* Toggle Switch */}
                  <button
                    onClick={() => handleToggle(flag.key)}
                    className={`ml-4 relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      flag.enabled ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                    role="switch"
                    aria-checked={flag.enabled}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                        flag.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            How to use feature flags
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Toggle features on/off for local testing</li>
            <li>• Changes are stored in browser localStorage</li>
            <li>• Backend features require Firestore schema updates first</li>
            <li>• Production uses environment variables (NEXT_PUBLIC_FEATURE_*)</li>
            <li>• Check MVP_TASK_LIST.md for implementation status</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
