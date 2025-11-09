/**
 * React Hooks for Analytics Tracking
 * Automatic and manual tracking utilities
 */

'use client'

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Analytics, trackEvent, AnalyticsEventName, AnalyticsEventParams } from '../analytics';

/**
 * Automatically track page views when route changes
 * Usage: Add to root layout or each page
 */
export function usePageTracking() {
  const pathname = usePathname();
  const previousPathname = useRef<string | null>(null);

  useEffect(() => {
    if (pathname && pathname !== previousPathname.current) {
      // Get page title from document
      const pageTitle = typeof document !== 'undefined' ? document.title : pathname;
      
      Analytics.pageView(pathname, pageTitle);
      previousPathname.current = pathname;
    }
  }, [pathname]);
}

/**
 * Track user interactions (clicks, form submissions, etc.)
 * Usage: const track = useAnalytics(); track('button_clicked', { label: 'Start Trial' });
 */
export function useAnalytics() {
  return (eventName: AnalyticsEventName, params?: AnalyticsEventParams) => {
    trackEvent(eventName, params);
  };
}

/**
 * Track form field changes
 * Usage: const trackField = useFormFieldTracking(); <input onChange={() => trackField('email')} />
 */
export function useFormFieldTracking(formName: string) {
  return (fieldName: string) => {
    trackEvent('intake_form_field_filled', {
      label: `${formName}.${fieldName}`,
      category: 'form_interaction'
    });
  };
}

/**
 * Track time spent on page
 * Returns cleanup function to call when leaving page
 */
export function useTimeOnPage(pageName: string) {
  const startTime = useRef(Date.now());

  useEffect(() => {
    return () => {
      const duration = Date.now() - startTime.current;
      trackEvent('page_view', {
        page_title: pageName,
        duration_ms: duration
      });
    };
  }, [pageName]);
}

/**
 * Track external link clicks
 * Usage: const trackLink = useLinkTracking(); <a onClick={() => trackLink('https://example.com')}>
 */
export function useLinkTracking() {
  return (url: string, label?: string) => {
    trackEvent('navigation_clicked', {
      label: label || url,
      category: 'external_link'
    });
  };
}

/**
 * Track search queries
 * Usage: const trackSearch = useSearchTracking(); trackSearch('legal template');
 */
export function useSearchTracking() {
  return (query: string, results?: number) => {
    trackEvent('search_performed', {
      label: query,
      value: results
    });
  };
}

/**
 * Track errors with context
 * Usage: const trackError = useErrorTracking(); trackError(new Error('Failed'), 'document_generation');
 */
export function useErrorTracking() {
  return (error: Error, context?: string) => {
    Analytics.errorOccurred(
      error.name || 'Error',
      error.message,
      context
    );
  };
}
