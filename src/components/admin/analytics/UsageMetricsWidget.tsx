/**
 * Usage Metrics Widget - MCPForms Integration
 * Feature ID 32: Usage Logs / Metrics
 */

'use client'

import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UsageMetric } from '@/types/admin';

interface UsageMetricsWidgetProps {
  userId?: string;
  organizationId: string;
  days?: number;
}

export const UsageMetricsWidget: React.FC<UsageMetricsWidgetProps> = ({
  userId,
  organizationId,
  days = 7
}) => {
  const [metrics, setMetrics] = useState<UsageMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({
    documentsGenerated: 0,
    intakesSubmitted: 0,
    templatesUploaded: 0,
    servicesCreated: 0,
    emailsSent: 0
  });

  useEffect(() => {
    fetchUsageMetrics();
  }, [userId, organizationId, days]);

  const fetchUsageMetrics = async () => {
    setLoading(true);
    try {
      const metricsRef = collection(db, 'usageMetrics');

      let q = userId
        ? query(
            metricsRef,
            where('userId', '==', userId),
            orderBy('date', 'desc'),
            limit(days)
          )
        : query(
            metricsRef,
            where('organizationId', '==', organizationId),
            orderBy('date', 'desc'),
            limit(days * 10)
          );

      const snapshot = await getDocs(q);
      const metricsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UsageMetric[];

      setMetrics(metricsData);

      const totals = metricsData.reduce(
        (acc, metric) => ({
          documentsGenerated: acc.documentsGenerated + (metric.documentsGenerated || 0),
          intakesSubmitted: acc.intakesSubmitted + (metric.intakesSubmitted || 0),
          templatesUploaded: acc.templatesUploaded + (metric.templatesUploaded || 0),
          servicesCreated: acc.servicesCreated + (metric.servicesCreated || 0),
          emailsSent: acc.emailsSent + (metric.emailsSent || 0)
        }),
        {
          documentsGenerated: 0,
          intakesSubmitted: 0,
          templatesUploaded: 0,
          servicesCreated: 0,
          emailsSent: 0
        }
      );

      setTotals(totals);
    } catch (error) {
      console.error('Error fetching usage metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600">
        <h3 className="text-lg font-semibold text-white">
          Usage Metrics - Last {days} Days
        </h3>
        <p className="text-blue-100 text-sm mt-1">
          {userId ? 'User Activity' : 'Organization Activity'}
        </p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Documents Generated */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Documents</p>
                <p className="text-2xl font-bold text-green-900 mt-1">
                  {totals.documentsGenerated}
                </p>
              </div>
              <div className="bg-green-500 rounded-full p-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Intakes Submitted */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Intakes</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {totals.intakesSubmitted}
                </p>
              </div>
              <div className="bg-blue-500 rounded-full p-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          {/* Templates Uploaded */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Templates</p>
                <p className="text-2xl font-bold text-purple-900 mt-1">
                  {totals.templatesUploaded}
                </p>
              </div>
              <div className="bg-purple-500 rounded-full p-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Services Created */}
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Services</p>
                <p className="text-2xl font-bold text-yellow-900 mt-1">
                  {totals.servicesCreated}
                </p>
              </div>
              <div className="bg-yellow-500 rounded-full p-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Emails Sent */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Emails</p>
                <p className="text-2xl font-bold text-red-900 mt-1">
                  {totals.emailsSent}
                </p>
              </div>
              <div className="bg-red-500 rounded-full p-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {metrics.length === 0 && (
          <div className="mt-6 text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No usage data yet</p>
            <p className="text-sm text-gray-400 mt-2">
              Metrics will appear once Cloud Functions are deployed
            </p>
            <p className="text-xs mt-4 text-blue-600">
              ✨ Feature ID 32: Usage Metrics - Ready to track!
            </p>
          </div>
        )}

        {metrics.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Daily Breakdown</h4>
            <div className="space-y-2">
              {metrics.slice(0, 7).map((metric) => (
                <div key={metric.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">{metric.date}</span>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span>Docs: {metric.documentsGenerated}</span>
                    <span>Intakes: {metric.intakesSubmitted}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsageMetricsWidget;
