import { Template, Intake } from './index';
export interface PlaceholderLocation {
    page?: number;
    section?: string;
    hint?: string;
    xpath?: string;
    anchor?: string;
}
export interface PlaceholderField {
    field_key: string;
    label: string;
    type: 'string' | 'number' | 'date' | 'boolean' | 'enum' | 'address' | 'phone' | 'email';
    locations: PlaceholderLocation[];
    required?: boolean;
    description?: string;
    options?: string[];
    validation?: {
        min?: number;
        max?: number;
        pattern?: string;
        format?: string;
    };
    confidence?: number;
}
export interface PlaceholderDiff {
    added: PlaceholderField[];
    removed: PlaceholderField[];
    renamed: Array<{
        from: string;
        to: string;
        reason?: string;
    }>;
    modified?: Array<{
        field_key: string;
        changes: Record<string, any>;
    }>;
}
export interface TemplateVersion {
    version: number;
    templateId: string;
    tenantId?: string;
    placeholders: PlaceholderField[];
    status: 'draft' | 'approved' | 'archived';
    diff?: PlaceholderDiff;
    createdAt: Date;
    createdBy: string;
    approvedAt?: Date;
    approvedBy?: string;
    approvalReason?: string;
    reason?: string;
    etag: string;
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
    ttl?: number;
}
export interface CustomerOverrideSection {
    section_id: string;
    title: string;
    content: string;
    insert_after?: string;
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
        removed: string[];
    };
    global_template_versions?: Record<string, number>;
    status: 'active' | 'pending_review' | 'rejected';
    createdAt: Date;
    createdBy: string;
    reviewedAt?: Date;
    reviewedBy?: string;
    reviewNotes?: string;
    reason?: string;
    validationWarnings?: string[];
    collisions?: string[];
}
export interface IntakeVersionSnapshot {
    intakeId?: string;
    templateVersions: Record<string, number>;
    effectiveSchema: PlaceholderField[];
    overrideId?: string;
    frozenAt: Date;
    frozenBy?: string;
}
export interface AuditEvent {
    id: string;
    tenantId: string;
    eventType: 'template.updated' | 'template.version.approved' | 'template.version.rolled_back' | 'intake.override.created' | 'intake.override.accepted' | 'intake.override.rejected' | 'placeholder.added' | 'placeholder.removed' | 'placeholder.renamed';
    resourceId: string;
    actor: {
        userId: string;
        userName: string;
        email?: string;
    };
    timestamp: Date;
    diff?: any;
    reason?: string;
    metadata?: Record<string, any>;
}
export interface AIPlaceholderSuggestion {
    fields: PlaceholderField[];
    confidence_score: number;
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
export interface TemplateWithVersioning extends Template {
    currentVersion: number;
    latestApprovedVersion?: number;
    versions?: TemplateVersion[];
    lock?: EditorLock;
}
export interface IntakeWithVersion extends Intake {
    versionSnapshot?: IntakeVersionSnapshot;
    customerOverride?: CustomerOverride;
}
export * from './index';
//# sourceMappingURL=versioning.d.ts.map