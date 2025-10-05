/**
 * Template Editor API
 *
 * Firebase Functions for Template Editor and Versioning
 *
 * Endpoints:
 * - listTemplates: GET all templates for tenant
 * - getTemplateWithPlaceholders: GET template + current schema + lock status
 * - suggestPlaceholdersAI: POST AI placeholder extraction
 * - saveTemplateDraft: POST save new version as draft
 * - approveTemplateVersion: POST approve version
 * - rollbackTemplate: POST rollback to previous version
 * - acquireTemplateLock: POST acquire editor lock
 * - releaseTemplateLock: POST release editor lock
 * - refreshTemplateLock: POST refresh lock TTL
 * - getVersionHistory: GET version timeline
 * - getTemplateAuditTrail: GET audit events
 * - validatePlaceholders: POST validate placeholder schema
 */
import { PlaceholderField } from '../types/versioning';
/**
 * List all templates for a tenant
 */
export declare function listTemplates(data: {
    tenantId: string;
    status?: 'active' | 'archived';
    limit?: number;
}, context: any): Promise<{
    success: boolean;
    templates: any;
    count: any;
    error?: undefined;
} | {
    success: boolean;
    error: any;
    templates?: undefined;
    count?: undefined;
}>;
/**
 * Get template with placeholders and metadata
 */
export declare function getTemplateWithPlaceholders(data: {
    templateId: string;
    version?: number;
}, context: any): Promise<{
    success: boolean;
    template: {
        placeholders: PlaceholderField[];
        versionInfo: {
            version: number;
            status: "draft" | "approved" | "archived";
            createdAt: Date;
            createdBy: string;
            approvedAt: Date | undefined;
            approvedBy: string | undefined;
        } | null;
        lockStatus: {
            isLocked: boolean;
            lockedBy: any;
            expiresAt: any;
        } | {
            isLocked: boolean;
            lockedBy?: undefined;
            expiresAt?: undefined;
        };
        id: string;
    };
    error?: undefined;
} | {
    success: boolean;
    error: any;
    template?: undefined;
}>;
/**
 * AI-powered placeholder suggestion
 */
export declare function suggestPlaceholdersAI(data: {
    templateId: string;
    templateContent?: string;
}, context: any): Promise<{
    success: boolean;
    suggestions: {
        fields: PlaceholderField[];
        confidence_score: number;
        reasoning: string | undefined;
        warnings: string[] | undefined;
    };
    error?: undefined;
} | {
    success: boolean;
    error: any;
    suggestions?: undefined;
}>;
/**
 * Save template draft (new version)
 */
export declare function saveTemplateDraft(data: {
    templateId: string;
    placeholders: PlaceholderField[];
    userId: string;
    userName: string;
    reason?: string;
    expectedETag?: string;
}, context: any): Promise<{
    success: boolean;
    version: number;
    etag: string;
    diff: import("../types/versioning").PlaceholderDiff;
    error?: undefined;
} | {
    success: boolean;
    error: any;
    version?: undefined;
    etag?: undefined;
    diff?: undefined;
}>;
/**
 * Approve template version
 */
export declare function approveTemplateVersion(data: {
    templateId: string;
    version: number;
    userId: string;
    userName: string;
    reason?: string;
}, context: any): Promise<{
    success: boolean;
    version: number;
    message: string;
    error?: undefined;
} | {
    success: boolean;
    error: any;
    version?: undefined;
    message?: undefined;
}>;
/**
 * Rollback template to previous version
 */
export declare function rollbackTemplate(data: {
    templateId: string;
    targetVersion: number;
    userId: string;
    userName: string;
    reason: string;
}, context: any): Promise<{
    success: boolean;
    newVersion: number;
    etag: string;
    message: string;
    error?: undefined;
} | {
    success: boolean;
    error: any;
    newVersion?: undefined;
    etag?: undefined;
    message?: undefined;
}>;
/**
 * Acquire editor lock
 */
export declare function acquireTemplateLock(data: {
    templateId: string;
    userId: string;
}, context: any): Promise<{
    success: boolean;
    acquired: boolean;
    expiresAt: Date | undefined;
    currentHolder: string | undefined;
    message: string;
    error?: undefined;
} | {
    success: boolean;
    error: any;
    acquired?: undefined;
    expiresAt?: undefined;
    currentHolder?: undefined;
    message?: undefined;
}>;
/**
 * Release editor lock
 */
export declare function releaseTemplateLock(data: {
    templateId: string;
    userId: string;
}, context: any): Promise<{
    success: boolean;
    released: boolean;
    message: string;
    error?: undefined;
} | {
    success: boolean;
    error: any;
    released?: undefined;
    message?: undefined;
}>;
/**
 * Refresh editor lock (extend TTL)
 */
export declare function refreshTemplateLock(data: {
    templateId: string;
    userId: string;
}, context: any): Promise<{
    success: boolean;
    refreshed: boolean;
    expiresAt: Date | undefined;
    message: string;
    error?: undefined;
} | {
    success: boolean;
    error: any;
    refreshed?: undefined;
    expiresAt?: undefined;
    message?: undefined;
}>;
/**
 * Get version history
 */
export declare function getTemplateVersionHistory(data: {
    templateId: string;
    limit?: number;
}, context: any): Promise<{
    success: boolean;
    versions: {
        version: number;
        status: "draft" | "approved" | "archived";
        diff: import("../types/versioning").PlaceholderDiff | undefined;
        createdAt: Date;
        createdBy: string;
        approvedAt: Date | undefined;
        approvedBy: string | undefined;
        reason: string | undefined;
        isRollback: boolean | undefined;
        rolledBackFrom: number | undefined;
        rolledBackTo: number | undefined;
        placeholderCount: number;
    }[];
    count: number;
    error?: undefined;
} | {
    success: boolean;
    error: any;
    versions?: undefined;
    count?: undefined;
}>;
/**
 * Get audit trail for template
 */
export declare function getTemplateAuditTrail(data: {
    templateId: string;
    limit?: number;
}, context: any): Promise<{
    success: boolean;
    events: {
        id: string;
        eventType: "template.updated" | "template.version.approved" | "template.version.rolled_back" | "intake.override.created" | "intake.override.accepted" | "intake.override.rejected" | "placeholder.added" | "placeholder.removed" | "placeholder.renamed";
        actor: {
            userId: string;
            userName: string;
            email?: string;
        };
        timestamp: Date;
        diff: any;
        reason: string | undefined;
        metadata: Record<string, any> | undefined;
    }[];
    count: number;
    error?: undefined;
} | {
    success: boolean;
    error: any;
    events?: undefined;
    count?: undefined;
}>;
/**
 * Validate placeholder schema
 */
export declare function validatePlaceholders(data: {
    placeholders: PlaceholderField[];
    templateContent?: string;
}, context: any): Promise<{
    success: boolean;
    valid: boolean;
    errors: {
        field_key: string;
        type: "invalid_format" | "duplicate" | "orphan" | "invalid_type" | "missing_location";
        message: string;
    }[];
    warnings: {
        field_key: string;
        type: "unused" | "low_confidence" | "ambiguous_location";
        message: string;
    }[];
    error?: undefined;
} | {
    success: boolean;
    error: any;
    valid?: undefined;
    errors?: undefined;
    warnings?: undefined;
}>;
/**
 * Check if user has lock
 */
export declare function checkTemplateLock(data: {
    templateId: string;
    userId: string;
}, context: any): Promise<{
    success: boolean;
    hasLock: boolean;
    isLocked: boolean;
    lockedBy: any;
    expiresAt: any;
    isExpired: boolean;
    error?: undefined;
} | {
    success: boolean;
    hasLock: boolean;
    isLocked: boolean;
    lockedBy?: undefined;
    expiresAt?: undefined;
    isExpired?: undefined;
    error?: undefined;
} | {
    success: boolean;
    error: any;
    hasLock?: undefined;
    isLocked?: undefined;
    lockedBy?: undefined;
    expiresAt?: undefined;
    isExpired?: undefined;
}>;
//# sourceMappingURL=templateEditorAPI.d.ts.map