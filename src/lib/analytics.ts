/**
 * Comprehensive Analytics & Telemetry Service
 * 
 * Tracks user behavior, business metrics, and operational events
 * Sends to Firebase Analytics for real-time dashboards
 * Stores in Firestore for detailed analysis and funnel tracking
 */

import { getAnalytics, logEvent as firebaseLogEvent, setUserId, setUserProperties } from 'firebase/analytics';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db, app } from './firebase';

// Initialize analytics (client-side only)
let analytics: any = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

// ============================================================================
// EVENT TYPES - Comprehensive tracking categories
// ============================================================================

export type AnalyticsEventName =
  // Landing & Marketing
  | 'page_view'
  | 'landing_page_visit'
  | 'start_trial_clicked'
  | 'pricing_viewed'
  | 'feature_demo_viewed'
  
  // Onboarding & Auth
  | 'signup_started'
  | 'signup_completed'
  | 'signup_failed'
  | 'login_attempted'
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'password_reset_requested'
  | 'password_reset_completed'
  
  // Navigation & Engagement
  | 'dashboard_viewed'
  | 'navigation_clicked'
  | 'search_performed'
  | 'filter_applied'
  | 'help_clicked'
  
  // Templates
  | 'template_viewed'
  | 'template_created'
  | 'template_uploaded'
  | 'template_upload_file_selected'
  | 'template_upload_validation_failed'
  | 'template_upload_validation_passed'
  | 'template_upload_progress'
  | 'template_upload_parse_triggered'
  | 'template_edited'
  | 'template_deleted'
  | 'template_duplicated'
  | 'template_fields_extracted'
  
  // Services
  | 'service_viewed'
  | 'service_created'
  | 'service_edited'
  | 'service_deleted'
  | 'service_published'
  | 'service_unpublished'
  
  // Intake Forms
  | 'intake_form_created'
  | 'intake_form_customized'
  | 'intake_form_previewed'
  | 'intake_link_copied'
  | 'intake_link_sent'
  | 'intake_email_sent'
  | 'intake_form_opened'
  | 'intake_form_started'
  | 'intake_form_field_filled'
  | 'intake_form_saved'
  | 'intake_form_submitted'
  | 'intake_form_abandoned'
  
  // AI Features
  | 'ai_field_generation_started'
  | 'ai_field_generation_completed'
  | 'ai_field_generation_failed'
  | 'ai_section_generation_started'
  | 'ai_section_generation_completed'
  | 'ai_section_generation_failed'
  | 'ai_section_regenerated'
  | 'ai_section_accepted'
  | 'ai_section_rejected'
  | 'ai_confidence_low'
  | 'ai_confidence_high'
  | 'prompt_library_used'
  | 'prompt_saved'
  
  // Document Generation
  | 'document_generation_started'
  | 'document_generation_completed'
  | 'document_generation_failed'
  | 'document_preview_opened'
  | 'document_downloaded'
  | 'document_shared'
  | 'document_deleted'
  | 'bulk_generation_started'
  | 'bulk_generation_completed'
  
  // Team & Settings
  | 'team_member_invited'
  | 'team_member_removed'
  | 'settings_changed'
  | 'branding_updated'
  | 'notification_settings_changed'
  
  // Errors & Performance
  | 'error_occurred'
  | 'api_error'
  | 'slow_performance'
  | 'feature_unavailable';

export interface AnalyticsEventParams {
  // User context
  userId?: string;
  userRole?: 'lawyer' | 'admin' | 'client';
  organizationId?: string;
  
  // Event context
  category?: string;
  action?: string;
  label?: string;
  value?: number;
  
  // Page context
  page_path?: string;
  page_title?: string;
  page_referrer?: string;
  
  // Feature-specific
  templateId?: string;
  templateName?: string;
  serviceId?: string;
  serviceName?: string;
  intakeId?: string;
  documentId?: string;
  
  // AI-specific
  aiModel?: string;
  aiConfidence?: number;
  aiTokensUsed?: number;
  aiLatencyMs?: number;
  
  // Performance
  duration_ms?: number;
  success?: boolean;
  error_message?: string;
  error_code?: string;
  
  // Custom metadata
  [key: string]: any;
}

// ============================================================================
// CORE ANALYTICS FUNCTIONS
// ============================================================================

/**
 * Track event to Firebase Analytics AND Firestore
 */
export async function trackEvent(
  eventName: AnalyticsEventName,
  params?: AnalyticsEventParams
) {
  try {
    const enrichedParams = {
      ...params,
      timestamp: new Date().toISOString(),
      session_id: getSessionId(),
      user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
    };

    // Send to Firebase Analytics (for real-time dashboards)
    if (analytics) {
      firebaseLogEvent(analytics, eventName as any, enrichedParams);
    }

    // Store in Firestore (for detailed analysis)
    await storeEventInFirestore(eventName, enrichedParams);

    // Console log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Analytics Event:', eventName, enrichedParams);
    }
  } catch (error) {
    console.error('Analytics error:', error);
    // Don't let analytics errors break the app
  }
}

/**
 * Store event in Firestore for advanced querying and funnel analysis
 */
async function storeEventInFirestore(
  eventName: AnalyticsEventName,
  params: AnalyticsEventParams & { timestamp: string; session_id: string }
) {
  try {
    await addDoc(collection(db, 'analyticsEvents'), {
      eventName,
      ...params,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    // Silently fail to not disrupt user experience
    console.debug('Failed to store analytics event:', error);
  }
}

/**
 * Set user ID for tracking across sessions
 */
export function setAnalyticsUserId(userId: string) {
  if (analytics) {
    setUserId(analytics, userId);
  }
}

/**
 * Set user properties for segmentation
 */
export function setAnalyticsUserProperties(properties: {
  role?: string;
  plan?: string;
  organization?: string;
  signupDate?: string;
  [key: string]: any;
}) {
  if (analytics) {
    setUserProperties(analytics, properties);
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS - Pre-built tracking for common flows
// ============================================================================

export const Analytics = {
  // Landing & Marketing
  landingPageVisit: () => trackEvent('landing_page_visit'),
  startTrialClicked: () => trackEvent('start_trial_clicked'),
  
  // Auth & Onboarding
  signupStarted: () => trackEvent('signup_started'),
  signupCompleted: (userId: string) => trackEvent('signup_completed', { userId }),
  signupFailed: (errorCode: string) => trackEvent('signup_failed', { error_code: errorCode }),
  
  loginAttempted: (email: string) => trackEvent('login_attempted', { label: email }),
  loginSuccess: (userId: string, role: string) => {
    setAnalyticsUserId(userId);
    setAnalyticsUserProperties({ role });
    trackEvent('login_success', { userId, userRole: role as any });
  },
  loginFailed: (errorCode: string) => trackEvent('login_failed', { error_code: errorCode }),
  
  // Page Views
  pageView: (pagePath: string, pageTitle: string) => 
    trackEvent('page_view', { page_path: pagePath, page_title: pageTitle }),
  
  // Templates
  templateCreated: (templateId: string, templateName: string) =>
    trackEvent('template_created', { templateId, templateName }),
  templateUploaded: (templateId: string, fileSize: number) =>
    trackEvent('template_uploaded', { templateId, value: fileSize }),
  templateUploadFileSelected: (fileName: string, fileSize: number, fileType: string) =>
    trackEvent('template_upload_file_selected', { label: fileName, value: fileSize, category: fileType }),
  templateUploadValidationFailed: (reason: string, fileName: string, details?: any) =>
    trackEvent('template_upload_validation_failed', { error_code: reason, label: fileName, ...details }),
  templateUploadValidationPassed: (fileName: string, fileSize: number) =>
    trackEvent('template_upload_validation_passed', { label: fileName, value: fileSize }),
  templateUploadProgress: (templateId: string, progress: number, step: string) =>
    trackEvent('template_upload_progress', { templateId, value: progress, label: step }),
  templateUploadParseTriggered: (templateId: string) =>
    trackEvent('template_upload_parse_triggered', { templateId }),
  templateEdited: (templateId: string) =>
    trackEvent('template_edited', { templateId }),
  templateDeleted: (templateId: string) =>
    trackEvent('template_deleted', { templateId }),
  
  // Services
  serviceCreated: (serviceId: string, serviceName: string) =>
    trackEvent('service_created', { serviceId, serviceName }),
  serviceEdited: (serviceId: string) =>
    trackEvent('service_edited', { serviceId }),
  servicePublished: (serviceId: string) =>
    trackEvent('service_published', { serviceId }),
  
  // Intake Forms
  intakeFormCreated: (serviceId: string, intakeId: string) =>
    trackEvent('intake_form_created', { serviceId, intakeId }),
  intakeFormCustomized: (intakeId: string, customizationType: string) =>
    trackEvent('intake_form_customized', { intakeId, label: customizationType }),
  intakeLinkCopied: (intakeId: string) =>
    trackEvent('intake_link_copied', { intakeId }),
  intakeEmailSent: (intakeId: string, recipientEmail: string) =>
    trackEvent('intake_email_sent', { intakeId, label: recipientEmail }),
  
  // Client Intake Journey
  intakeFormOpened: (intakeId: string, serviceId: string) =>
    trackEvent('intake_form_opened', { intakeId, serviceId }),
  intakeFormStarted: (intakeId: string) =>
    trackEvent('intake_form_started', { intakeId }),
  intakeFormFieldFilled: (intakeId: string, fieldName: string) =>
    trackEvent('intake_form_field_filled', { intakeId, label: fieldName }),
  intakeFormSaved: (intakeId: string, progress: number) =>
    trackEvent('intake_form_saved', { intakeId, value: progress }),
  intakeFormSubmitted: (intakeId: string, duration: number) =>
    trackEvent('intake_form_submitted', { intakeId, duration_ms: duration }),
  intakeFormAbandoned: (intakeId: string, progress: number) =>
    trackEvent('intake_form_abandoned', { intakeId, value: progress }),
  
  // AI Features
  aiFieldGenerationStarted: (serviceId: string) =>
    trackEvent('ai_field_generation_started', { serviceId }),
  aiFieldGenerationCompleted: (serviceId: string, fieldsCount: number, duration: number) =>
    trackEvent('ai_field_generation_completed', { 
      serviceId, 
      value: fieldsCount,
      duration_ms: duration 
    }),
  aiFieldGenerationFailed: (serviceId: string, error: string) =>
    trackEvent('ai_field_generation_failed', { serviceId, error_message: error }),
  
  aiSectionGenerationStarted: (serviceId: string, sectionName: string) =>
    trackEvent('ai_section_generation_started', { serviceId, label: sectionName }),
  aiSectionGenerationCompleted: (
    serviceId: string, 
    sectionName: string, 
    confidence: number,
    tokensUsed: number,
    latency: number
  ) =>
    trackEvent('ai_section_generation_completed', { 
      serviceId,
      label: sectionName,
      aiConfidence: confidence,
      aiTokensUsed: tokensUsed,
      aiLatencyMs: latency,
      success: true
    }),
  aiSectionAccepted: (serviceId: string, sectionName: string, confidence: number) =>
    trackEvent('ai_section_accepted', { serviceId, label: sectionName, aiConfidence: confidence }),
  aiSectionRegenerated: (serviceId: string, sectionName: string) =>
    trackEvent('ai_section_regenerated', { serviceId, label: sectionName }),
  
  // Document Generation
  documentGenerationStarted: (serviceId: string, documentType: string) =>
    trackEvent('document_generation_started', { serviceId, label: documentType }),
  documentGenerationCompleted: (
    serviceId: string,
    documentId: string,
    duration: number
  ) =>
    trackEvent('document_generation_completed', { 
      serviceId,
      documentId,
      duration_ms: duration,
      success: true
    }),
  documentGenerationFailed: (serviceId: string, error: string) =>
    trackEvent('document_generation_failed', { serviceId, error_message: error }),
  documentDownloaded: (documentId: string, format: string) =>
    trackEvent('document_downloaded', { documentId, label: format }),
  
  // Settings & Configuration
  brandingUpdated: (userId: string) =>
    trackEvent('branding_updated', { userId }),
  teamMemberInvited: (invitedEmail: string) =>
    trackEvent('team_member_invited', { label: invitedEmail }),
  
  // Errors
  errorOccurred: (errorType: string, errorMessage: string, context?: string) =>
    trackEvent('error_occurred', { 
      category: errorType,
      error_message: errorMessage,
      label: context
    }),
};

// ============================================================================
// FUNNEL TRACKING
// ============================================================================

export interface FunnelStep {
  step: string;
  timestamp: Date;
  metadata?: any;
}

/**
 * Track funnel progression (e.g., signup → create service → send intake)
 */
export async function trackFunnelStep(
  funnelName: string,
  stepName: string,
  userId: string,
  metadata?: any
) {
  await addDoc(collection(db, 'funnelEvents'), {
    funnelName,
    stepName,
    userId,
    metadata,
    timestamp: serverTimestamp(),
  });
}

/**
 * Track complete user journey from signup to document generation
 */
export const Funnel = {
  // Onboarding Funnel
  onboardingStarted: (userId: string) => 
    trackFunnelStep('onboarding', 'started', userId),
  onboardingTemplateUploaded: (userId: string, templateId: string) =>
    trackFunnelStep('onboarding', 'template_uploaded', userId, { templateId }),
  onboardingServiceCreated: (userId: string, serviceId: string) =>
    trackFunnelStep('onboarding', 'service_created', userId, { serviceId }),
  onboardingIntakeSent: (userId: string, intakeId: string) =>
    trackFunnelStep('onboarding', 'intake_sent', userId, { intakeId }),
  onboardingCompleted: (userId: string, documentId: string) =>
    trackFunnelStep('onboarding', 'completed', userId, { documentId }),
  
  // Template Upload Funnel
  templateUploadStarted: (userId: string) =>
    trackFunnelStep('template_upload', 'page_visited', userId),
  templateUploadFileSelected: (userId: string, fileName: string, fileSize: number) =>
    trackFunnelStep('template_upload', 'file_selected', userId, { fileName, fileSize }),
  templateUploadNameEntered: (userId: string, templateName: string) =>
    trackFunnelStep('template_upload', 'name_entered', userId, { templateName }),
  templateUploadValidationPassed: (userId: string) =>
    trackFunnelStep('template_upload', 'validation_passed', userId),
  templateUploadFirestoreCreated: (userId: string, templateId: string) =>
    trackFunnelStep('template_upload', 'firestore_created', userId, { templateId }),
  templateUploadStorageUploaded: (userId: string, templateId: string) =>
    trackFunnelStep('template_upload', 'storage_uploaded', userId, { templateId }),
  templateUploadMetadataUpdated: (userId: string, templateId: string) =>
    trackFunnelStep('template_upload', 'metadata_updated', userId, { templateId }),
  templateUploadParsingTriggered: (userId: string, templateId: string) =>
    trackFunnelStep('template_upload', 'parsing_triggered', userId, { templateId }),
  templateUploadCompleted: (userId: string, templateId: string, duration: number) =>
    trackFunnelStep('template_upload', 'completed', userId, { templateId, duration }),
  templateUploadFailed: (userId: string, errorType: string, errorMessage: string) =>
    trackFunnelStep('template_upload', 'failed', userId, { errorType, errorMessage }),
  
  // Document Generation Funnel
  docGenStarted: (serviceId: string, userId: string) =>
    trackFunnelStep('document_generation', 'started', userId, { serviceId }),
  docGenIntakeReceived: (serviceId: string, userId: string, intakeId: string) =>
    trackFunnelStep('document_generation', 'intake_received', userId, { serviceId, intakeId }),
  docGenAIProcessing: (serviceId: string, userId: string) =>
    trackFunnelStep('document_generation', 'ai_processing', userId, { serviceId }),
  docGenCompleted: (serviceId: string, userId: string, documentId: string) =>
    trackFunnelStep('document_generation', 'completed', userId, { serviceId, documentId }),
  docGenDownloaded: (serviceId: string, userId: string, documentId: string) =>
    trackFunnelStep('document_generation', 'downloaded', userId, { serviceId, documentId }),
};

// ============================================================================
// SESSION TRACKING
// ============================================================================

let sessionId: string | null = null;

function getSessionId(): string {
  if (!sessionId) {
    sessionId = typeof window !== 'undefined' 
      ? sessionStorage.getItem('analytics_session_id') || generateSessionId()
      : generateSessionId();
    
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
  }
  return sessionId;
}

function generateSessionId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

// ============================================================================
// PERFORMANCE TRACKING
// ============================================================================

export function trackPerformance(metricName: string, durationMs: number, metadata?: any) {
  trackEvent('slow_performance' as AnalyticsEventName, {
    label: metricName,
    duration_ms: durationMs,
    ...metadata
  });
}

/**
 * Timer utility for tracking operation duration
 */
export class PerformanceTimer {
  private startTime: number;
  private metricName: string;

  constructor(metricName: string) {
    this.metricName = metricName;
    this.startTime = Date.now();
  }

  end(metadata?: any) {
    const duration = Date.now() - this.startTime;
    trackPerformance(this.metricName, duration, metadata);
    return duration;
  }
}
