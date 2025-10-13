/**
 * Error State Component (MVP Feature #17)
 * 
 * Displays recoverable error state with retry CTA
 */

import React from 'react';

export interface ErrorStateProps {
  title?: string;
  message: string;
  error?: Error | string;
  onRetry?: () => void;
  retryLabel?: string;
  showDetails?: boolean;
  className?: string;
}

export default function ErrorState({
  title = 'Something went wrong',
  message,
  error,
  onRetry,
  retryLabel = 'Try Again',
  showDetails = false,
  className = '',
}: ErrorStateProps) {
  const [detailsExpanded, setDetailsExpanded] = React.useState(false);
  
  const errorDetails = error instanceof Error ? error.message : error;

  return (
    <div className={`text-center py-12 px-4 ${className}`}>
      {/* Error Icon */}
      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
        <svg
          className="h-6 w-6 text-red-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      {/* Title */}
      <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
      
      {/* Message */}
      <p className="mt-2 text-sm text-gray-600 max-w-md mx-auto">{message}</p>

      {/* Error Details (collapsible) */}
      {showDetails && errorDetails && (
        <div className="mt-4 max-w-lg mx-auto">
          <button
            onClick={() => setDetailsExpanded(!detailsExpanded)}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            {detailsExpanded ? 'Hide' : 'Show'} technical details
          </button>
          {detailsExpanded && (
            <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md text-left">
              <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                {errorDetails}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Retry Button */}
      {onRetry && (
        <div className="mt-6">
          <button
            onClick={onRetry}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg
              className="mr-2 -ml-1 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {retryLabel}
          </button>
        </div>
      )}
    </div>
  );
}
