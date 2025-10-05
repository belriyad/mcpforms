// Extended types for Template Versioning & Customer Overrides

import { Template, Intake } from './index';

export interface PlaceholderLocation {
  page?: number;
  section?: string;
  hint?: string;
  xpath?: string; // For DOCX: XPath to XML node
  anchor?: string; // For PDF: anchor identifier
}

export interface PlaceholderField {
  field_key: string; // ^[a-z0-9_]{2,64}$
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'enum' | 'address' | 'phone' | 'email';
  locations: PlaceholderLocation[];
  required?: boolean;
  description?: string;
  options?: string[]; // For enum type
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    format?: string;
  };
  confidence?: number; // 0-1, from AI suggestions
}

export interface PlaceholderDiff {
  added: PlaceholderField[];
  removed: PlaceholderField[];
  renamed: Array<{ from: string; to: string; reason?: string }>;
  modified?: Array<{ field_key: string; changes: Record<string, any> }>;
}

export interface TemplateVersion {
  version: number;
  templateId: string;
  tenantId?: string;
  placeholders: PlaceholderField[];
  status: 'draft' | 'approved' | 'archived';
  diff?: PlaceholderDiff; // Compared to previous version
  createdAt: Date;
  createdBy: string; // user ID
  approvedAt?: Date;
  approvedBy?: string;
  approvalReason?: string;
  reason?: string;
  etag: string; // For concurrency control
  isRollback?: boolean;
  rolledBackFrom?: number;
  rolledBackTo?: number;
}

export interface EditorLock {
  templateId?: string;
  userId: string;
  userName?: string;
  acquiredAt: Date;
  expiresAt: Date;
  ttl?: number; // milliseconds
}

export interface CustomerOverrideSection {
  section_id: string;
  title: string;
  content: string; // Rich text or markdown
  insert_after?: string; // Section ID or 'end'
  new_placeholders?: PlaceholderField[];
}

export interface CustomerOverride {
  overrideId: string;
  intakeId: string;
  customerId: string;
  tenantId?: string;
  sections: CustomerOverrideSection[];
  schema_delta: {
    added: PlaceholderField[];
    modified: PlaceholderField[];
    removed: string[]; // field_keys to remove
  };
  global_template_versions?: Record<string, number>; // templateId -> version
  status: 'active' | 'pending_review' | 'rejected';
  createdAt: Date;
  createdBy: string;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewNotes?: string;
  reason?: string;
  validationWarnings?: string[];
  collisions?: string[]; // field_keys with collisions
}

export interface IntakeVersionSnapshot {
  intakeId?: string;
  templateVersions: Record<string, number>; // templateId -> version number
  effectiveSchema: PlaceholderField[]; // global + overrides merged
  overrideId?: string;
  frozenAt: Date;
  frozenBy?: string;
}

export interface AuditEvent {
  id: string;
  tenantId: string;
  eventType: 
    | 'template.updated' 
    | 'template.version.approved' 
    | 'template.version.rolled_back'
    | 'intake.override.created' 
    | 'intake.override.accepted' 
    | 'intake.override.rejected'
    | 'placeholder.added'
    | 'placeholder.removed'
    | 'placeholder.renamed';
  resourceId: string; // templateId, intakeId, etc.
  actor: {
    userId: string;
    userName: string;
    email?: string;
  };
  timestamp: Date;
  diff?: any; // old -> new values
  reason?: string;
  metadata?: Record<string, any>;
}

export interface AIPlaceholderSuggestion {
  fields: PlaceholderField[];
  confidence_score: number; // Overall confidence
  reasoning?: string;
  warnings?: string[];
}

export interface AICustomClauseResponse {
  section_text: string;
  section_title: string;
  new_placeholders: PlaceholderField[];
  insert_after?: string;
  reasoning: string;
  warnings?: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: Array<{
    field_key: string;
    type: 'invalid_format' | 'duplicate' | 'orphan' | 'invalid_type' | 'missing_location';
    message: string;
  }>;
  warnings: Array<{
    field_key: string;
    type: 'unused' | 'low_confidence' | 'ambiguous_location';
    message: string;
  }>;
}

// Extended Template type with versioning
export interface TemplateWithVersioning extends Template {
  currentVersion: number;
  latestApprovedVersion?: number;
  versions?: TemplateVersion[]; // Summary list
  lock?: EditorLock;
}

// Extended Intake with version pinning
export interface IntakeWithVersion extends Intake {
  versionSnapshot?: IntakeVersionSnapshot;
  customerOverride?: CustomerOverride;
}

// Re-export base types
export * from './index';
