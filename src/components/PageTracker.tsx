/**
 * Page Tracking Component
 * Automatically tracks all page views across the application
 */

'use client'

import { usePageTracking } from '@/lib/hooks/useAnalytics';

export function PageTracker() {
  usePageTracking();
  return null;
}
