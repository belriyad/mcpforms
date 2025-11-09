/**
 * Activity Log Table Component
 * Feature ID 22: Audit Logging
 */

'use client'

import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ActivityLog {
  id: string;
  type: string;
  action: string;
  userId: string;
  timestamp: Timestamp;
  severity?: 'info' | 'warning' | 'error';
}

interface ActivityLogTableProps {
  organizationId?: string;
  initialLimit?: number;
}

export const ActivityLogTable: React.FC<ActivityLogTableProps> = ({
  organizationId,
  initialLimit = 50
}) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivityLogs();
  }, [organizationId]);

  const fetchActivityLogs = async () => {
    setLoading(true);
    try {
      const logsRef = collection(db, 'activityLogs');
      let q = query(
        logsRef,
        orderBy('timestamp', 'desc'),
        limit(initialLimit)
      );

      const snapshot = await getDocs(q);
      const logsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ActivityLog[];

      setLogs(logsData);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Activity Logs</h2>
        <p className="text-sm text-gray-600 mt-1">
          Showing last {logs.length} activities
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Timestamp
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Action
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                User
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatTimestamp(log.timestamp)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                    {log.type.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {log.action}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {log.userId.substring(0, 8)}...
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {logs.length === 0 && (
        <div className="px-6 py-12 text-center text-gray-500">
          No activity logs found.
        </div>
      )}
    </div>
  );
};

export default ActivityLogTable;
