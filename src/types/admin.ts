/**
 * MCPForms - TypeScript Type Definitions
 * Auto-generated from Firestore schema
 */

import { Timestamp } from 'firebase/firestore';

// ============================================
// Core Types
// ============================================

export type UserRole = 'admin' | 'paralegal' | 'client';
export type ServiceStatus = 'draft' | 'active' | 'archived';
export type TemplateStatus = 'processing' | 'ready' | 'error';
export type IntakeStatus = 'draft' | 'active' | 'archived';
export type SubmissionStatus = 'pending' | 'processing' | 'completed' | 'error';
export type DocumentStatus = 'generating' | 'ready' | 'error';
export type EmailStatus = 'pending' | 'sent' | 'failed';
export type UserStatus = 'active' | 'pending' | 'suspended';
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled';
export type PlanType = 'trial' | 'basic' | 'pro' | 'enterprise';
export type BillingPeriod = 'monthly' | 'annual';

// ============================================
// User Types
// ============================================

export interface UserPermissions {
  // Service Management (5)
  canCreateServices: boolean;
  canEditServices: boolean;
  canDeleteServices: boolean;
  canViewServices: boolean;
  canPublishServices: boolean;
  
  // Template Management (5)
  canUploadTemplates: boolean;
  canEditTemplates: boolean;
  canDeleteTemplates: boolean;
  canViewTemplates: boolean;
  canExtractFields: boolean;
  
  // Intake Management (4)
  canCreateIntakes: boolean;
  canViewIntakes: boolean;
  canEditIntakes: boolean;
  canDeleteIntakes: boolean;
  
  // Document Management (4)
  canGenerateDocuments: boolean;
  canViewDocuments: boolean;
  canDownloadDocuments: boolean;
  canDeleteDocuments: boolean;
  
  // User Management (4)
  canCreateUsers: boolean;
  canEditUsers: boolean;
  canDeleteUsers: boolean;
  canViewUsers: boolean;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  organizationId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  permissions: UserPermissions;
  status: UserStatus;
  invitedBy?: string;
  invitedAt?: Timestamp;
  lastPasswordReset?: Timestamp;
  lastLogin?: Timestamp;
  
  // Subscription information
  subscription?: {
    tier: 'FREE' | 'PREMIUM';
    status: 'active' | 'past_due' | 'canceled' | 'trialing';
    startDate: Timestamp;
    endDate?: Timestamp;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    currentUsage: {
      templatesCount: number;
      servicesCount: number;
      usersCount: number;
    };
  };
}

// ============================================
// Service Types
// ============================================

export interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  templateId?: string;
  intakeFormId?: string;
  price: number; // in cents
  status: ServiceStatus;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  organizationId: string;
  
  // AI Configuration
  aiPrompt?: string;
  aiModel?: string;
  temperature?: number;
  
  // Metadata
  totalIntakes?: number;
  totalDocuments?: number;
}

// ============================================
// Template Types
// ============================================

export interface TemplateField {
  name: string;
  type: 'text' | 'date' | 'number' | 'email' | 'phone' | 'address';
  label: string;
  required: boolean;
  defaultValue?: string;
  placeholder?: string;
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  extractedFields: TemplateField[];
  status: TemplateStatus;
  errorMessage?: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  organizationId: string;
  usageCount?: number;
  lastUsed?: Timestamp;
}

// ============================================
// Intake Types
// ============================================

export interface IntakeFieldValidation {
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
}

export interface IntakeField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'email' | 'phone' | 'date' | 'select' | 'checkbox' | 'file';
  required: boolean;
  placeholder?: string;
  defaultValue?: string;
  options?: string[];
  validation?: IntakeFieldValidation;
  helpText?: string;
}

export interface IntakeCustomization {
  logoUrl?: string;
  accentColor?: string;
  headerText?: string;
  footerText?: string;
}

export interface Intake {
  id: string;
  name: string;
  description?: string;
  serviceId: string;
  fields: IntakeField[];
  customization?: IntakeCustomization;
  status: IntakeStatus;
  isPublic: boolean;
  publicUrl?: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  organizationId: string;
  submissionCount?: number;
  lastSubmission?: Timestamp;
}

// ============================================
// Submission Types
// ============================================

export interface IntakeSubmission {
  id: string;
  intakeId: string;
  serviceId: string;
  data: Record<string, any>;
  clientEmail?: string;
  clientName?: string;
  clientPhone?: string;
  status: SubmissionStatus;
  submittedAt: Timestamp;
  processedAt?: Timestamp;
  documentId?: string;
  documentGenerated: boolean;
  createdBy?: string;
  processedBy?: string;
  organizationId: string;
  ipAddress?: string;
  userAgent?: string;
}

// ============================================
// Document Types
// ============================================

export interface DocumentArtifact {
  id: string;
  name: string;
  templateId: string;
  intakeSubmissionId: string;
  serviceId: string;
  originalFileUrl: string;
  editedFileUrl?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  aiPrompt?: string;
  aiModel?: string;
  temperature?: number;
  confidence?: number;
  generationTime?: number;
  status: DocumentStatus;
  errorMessage?: string;
  generatedAt: Timestamp;
  generatedBy: string;
  lastEditedAt?: Timestamp;
  lastEditedBy?: string;
  organizationId: string;
  downloadCount?: number;
  lastDownloaded?: Timestamp;
}

// ============================================
// Activity Log Types
// ============================================

export type ActivityLogType = 
  | 'user_created' | 'user_updated' | 'user_deleted'
  | 'service_created' | 'service_updated' | 'service_deleted'
  | 'template_uploaded' | 'template_deleted'
  | 'intake_created' | 'intake_submitted'
  | 'document_generated' | 'document_downloaded'
  | 'settings_updated' | 'email_sent'
  | 'login' | 'logout' | 'password_reset';

export type ActivityLogTargetType = 'user' | 'service' | 'template' | 'intake' | 'document';
export type ActivityLogSeverity = 'info' | 'warning' | 'error';

export interface ActivityLog {
  id: string;
  type: ActivityLogType;
  action: string;
  userId: string;
  targetId?: string;
  targetType?: ActivityLogTargetType;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  organizationId: string;
  timestamp: Timestamp;
  severity?: ActivityLogSeverity;
}

// ============================================
// Usage Metrics Types
// ============================================

export interface UsageMetric {
  id: string;
  userId: string;
  organizationId: string;
  date: string; // ISO format: "2025-11-09"
  documentsGenerated: number;
  intakesSubmitted: number;
  templatesUploaded: number;
  servicesCreated: number;
  emailsSent: number;
  firstActivity: Timestamp;
  lastActivity: Timestamp;
  updatedAt: Timestamp;
}

// ============================================
// Prompt Library Types
// ============================================

export interface PromptTemplate {
  id: string;
  name: string;
  description?: string;
  prompt: string;
  category?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  isPublic: boolean;
  usageCount: number;
  lastUsed?: Timestamp;
  createdBy: string;
  organizationId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  tags?: string[];
}

// ============================================
// User Settings Types
// ============================================

export interface BrandingSettings {
  logoUrl?: string;
  logoFileName?: string;
  accentColor?: string;
  primaryColor?: string;
  secondaryColor?: string;
  customCss?: string;
}

export interface NotificationSettings {
  onIntakeSubmission: boolean;
  onDocumentGeneration: boolean;
  onUserInvite: boolean;
  weeklyDigest: boolean;
}

export interface UserSettings {
  id: string;
  userId: string;
  organizationId: string;
  branding: BrandingSettings;
  notifications: NotificationSettings;
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================
// Email Queue Types
// ============================================

export type EmailType = 
  | 'intake_submission' 
  | 'document_ready' 
  | 'user_invite' 
  | 'password_reset' 
  | 'weekly_digest';

export interface EmailQueueItem {
  id: string;
  to: string;
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  templateId?: string;
  type: EmailType;
  status: EmailStatus;
  attempts: number;
  maxAttempts: number;
  errorMessage?: string;
  userId?: string;
  organizationId: string;
  metadata?: Record<string, any>;
  createdAt: Timestamp;
  scheduledFor?: Timestamp;
  sentAt?: Timestamp;
  lastAttemptAt?: Timestamp;
}

// ============================================
// AI Generation History Types
// ============================================

export type UserAction = 'accepted' | 'regenerated' | 'edited' | 'rejected';
export type ConfidenceMethod = 'heuristic' | 'model_output' | 'human_override';

export interface AIGeneration {
  id: string;
  prompt: string;
  templateId?: string;
  intakeData?: Record<string, any>;
  model: string;
  temperature: number;
  maxTokens?: number;
  generatedContent: string;
  confidence: number; // 0-100
  confidenceMethod: ConfidenceMethod;
  userAction: UserAction;
  finalContent?: string;
  editedAt?: Timestamp;
  documentId?: string;
  userId: string;
  organizationId: string;
  latency: number; // milliseconds
  tokensUsed?: number;
  cost?: number; // in cents
  generatedAt: Timestamp;
}

// ============================================
// Organization Types
// ============================================

export interface OrganizationAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface OrganizationFeatures {
  aiGeneration: boolean;
  customBranding: boolean;
  apiAccess: boolean;
  whiteLabel: boolean;
}

export interface OrganizationUsage {
  documentsGenerated: number;
  intakesSubmitted: number;
  storageUsed: number; // in bytes
}

export interface Organization {
  id: string;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  address?: OrganizationAddress;
  plan: PlanType;
  subscriptionStatus: SubscriptionStatus;
  subscriptionPrice: number; // in cents
  billingPeriod: BillingPeriod;
  maxUsers: number;
  maxTemplates: number;
  maxDocumentsPerMonth: number;
  features: OrganizationFeatures;
  ownerId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  currentUsage: OrganizationUsage;
}

// ============================================
// Dashboard Specific Types
// ============================================

export interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  totalServices: number;
  activeServices: number;
  totalDocuments: number;
  documentsToday: number;
  totalIntakes: number;
  intakesToday: number;
  averageConfidence: number;
  systemHealth: 'healthy' | 'degraded' | 'down';
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface ActivityLogFilter {
  type?: ActivityLogType[];
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  severity?: ActivityLogSeverity;
  limit?: number;
}

export interface UsageMetricsFilter {
  userId?: string;
  organizationId?: string;
  startDate?: string;
  endDate?: string;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================
// Form Types
// ============================================

export interface CreateServiceForm {
  name: string;
  description: string;
  category: string;
  templateId?: string;
  price: number;
  aiPrompt?: string;
}

export interface CreateUserForm {
  email: string;
  displayName: string;
  role: UserRole;
  permissions: Partial<UserPermissions>;
}

export interface UpdateBrandingForm {
  logoUrl?: string;
  accentColor?: string;
  primaryColor?: string;
  secondaryColor?: string;
}
