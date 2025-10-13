'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { getUserActivityLogs, type ActivityLogEntry, type ActivityLogType } from '@/lib/activity-log';
import { isFeatureEnabled } from '@/lib/feature-flags';

const TYPE_LABELS: Record<ActivityLogType, string> = {
  intake_submitted: 'Intake Submitted',
  doc_generated: 'Document Generated',
  email_sent: 'Email Sent',
  template_uploaded: 'Template Uploaded',
  service_created: 'Service Created',
  ai_section_generated: 'AI Section Generated',
};

const TYPE_COLORS: Record<ActivityLogType, string> = {
  intake_submitted: 'bg-blue-100 text-blue-800',
  doc_generated: 'bg-green-100 text-green-800',
  email_sent: 'bg-purple-100 text-purple-800',
  template_uploaded: 'bg-yellow-100 text-yellow-800',
  service_created: 'bg-indigo-100 text-indigo-800',
  ai_section_generated: 'bg-pink-100 text-pink-800',
};

export default function ActivityLogPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ActivityLogType | 'all'>('all');
  const featureEnabled = isFeatureEnabled('auditLog');

  useEffect(() => {
    if (!user || !featureEnabled) return;

    const fetchLogs = async () => {
      setLoading(true);
      try {
        const fetchedLogs = await getUserActivityLogs(user.uid, 50);
        setLogs(fetchedLogs);
      } catch (error) {
        console.error('Failed to fetch activity logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [user, featureEnabled]);

  const filteredLogs = filter === 'all' 
    ? logs 
    : logs.filter(log => log.type === filter);

  const formatTimestamp = (timestamp: any) => {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  if (!featureEnabled) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Feature Not Enabled</h1>
          <p className="text-gray-600 mb-4">
            Activity logging is currently disabled. Enable it in Admin → Labs.
          </p>
          <a
            href="/admin/labs"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go to Labs
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Activity Log</h1>
          <p className="text-gray-600 mt-2">
            Track intake submissions, document generations, and system events
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by type
          </label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as ActivityLogType | 'all')}
            className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Activities</option>
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <span className="ml-4 text-sm text-gray-500">
            Showing {filteredLogs.length} of {logs.length} entries
          </span>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading activity logs...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredLogs.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No activity yet</h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? 'Your activity will appear here as you use the platform'
                : `No ${TYPE_LABELS[filter as ActivityLogType]} activities found`
              }
            </p>
          </div>
        )}

        {/* Activity List */}
        {!loading && filteredLogs.length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <li key={log.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[log.type]}`}>
                          {TYPE_LABELS[log.type]}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatTimestamp(log.timestamp)}
                        </span>
                      </div>
                      
                      {/* Metadata */}
                      {log.meta && (
                        <div className="mt-2 text-sm text-gray-600 space-y-1">
                          {log.meta.documentName && (
                            <p>Document: <span className="font-medium">{log.meta.documentName}</span></p>
                          )}
                          {log.meta.serviceName && (
                            <p>Service: <span className="font-medium">{log.meta.serviceName}</span></p>
                          )}
                          {log.meta.templateName && (
                            <p>Template: <span className="font-medium">{log.meta.templateName}</span></p>
                          )}
                          {log.meta.clientEmail && (
                            <p>Client: <span className="font-medium">{log.meta.clientEmail}</span></p>
                          )}
                          {log.meta.emailTemplate && (
                            <p>Email Type: <span className="font-medium">{log.meta.emailTemplate}</span></p>
                          )}
                          {log.meta.placeholder && (
                            <p>Field: <span className="font-medium">{log.meta.placeholder}</span></p>
                          )}
                          {log.meta.error && (
                            <p className="text-red-600">Error: <span className="font-medium">{log.meta.error}</span></p>
                          )}
                        </div>
                      )}

                      {/* IDs for debugging */}
                      <div className="mt-2 text-xs text-gray-400 space-x-4">
                        {log.serviceId && <span>Service: {log.serviceId.slice(0, 8)}...</span>}
                        {log.intakeId && <span>Intake: {log.intakeId.slice(0, 8)}...</span>}
                        {log.templateId && <span>Template: {log.templateId.slice(0, 8)}...</span>}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
