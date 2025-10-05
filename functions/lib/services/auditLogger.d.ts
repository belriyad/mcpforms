/**
 * Audit Logger Service
 *
 * Provides comprehensive audit trail for all template, version, and override operations.
 *
 * Key Features:
 * - Log all significant events with actor, timestamp, diff
 * - Query audit trail by resource, event type, time range
 * - Support compliance requirements with immutable logs
 * - Track template updates, version approvals, override operations
 *
 * Event Types:
 * - template.updated: Template metadata or content changed
 * - template.version.approved: Version promoted to approved
 * - template.version.rolled_back: Version rolled back
 * - intake.override.created: Customer override created
 * - intake.override.accepted: Override approved
 * - intake.override.rejected: Override rejected
 * - placeholder.added: New placeholder added
 * - placeholder.removed: Placeholder removed
 * - placeholder.renamed: Placeholder renamed
 *
 * Storage Structure:
 * audit_logs/{eventId}/
 *   - eventType, resourceId, actor, timestamp, diff, reason, metadata
 */
import { AuditEvent } from '../types/versioning';
/**
 * Log an audit event
 */
export declare function logEvent(eventType: AuditEvent['eventType'], resourceId: string, actor: {
    userId: string;
    userName: string;
    email?: string;
}, options?: {
    tenantId?: string;
    diff?: any;
    reason?: string;
    metadata?: Record<string, any>;
}): Promise<string>;
/**
 * Log template update event
 */
export declare function logTemplateUpdate(templateId: string, userId: string, userName: string, oldData: any, newData: any, reason?: string, tenantId?: string): Promise<string>;
/**
 * Log version approval event
 */
export declare function logVersionApproval(templateId: string, version: number, userId: string, userName: string, reason?: string, tenantId?: string): Promise<string>;
/**
 * Log version rollback event
 */
export declare function logVersionRollback(templateId: string, fromVersion: number, toVersion: number, userId: string, userName: string, reason: string, tenantId?: string): Promise<string>;
/**
 * Log override creation event
 */
export declare function logOverrideCreated(intakeId: string, overrideId: string, customerId: string, userId: string, userName: string, sections: number, newPlaceholders: number, collisions: string[], reason?: string, tenantId?: string): Promise<string>;
/**
 * Log override acceptance event
 */
export declare function logOverrideAccepted(intakeId: string, overrideId: string, userId: string, userName: string, reviewNotes?: string, tenantId?: string): Promise<string>;
/**
 * Log override rejection event
 */
export declare function logOverrideRejected(intakeId: string, overrideId: string, userId: string, userName: string, reviewNotes?: string, tenantId?: string): Promise<string>;
/**
 * Log placeholder addition event
 */
export declare function logPlaceholderAdded(templateId: string, placeholderKey: string, placeholderData: any, userId: string, userName: string, tenantId?: string): Promise<string>;
/**
 * Log placeholder removal event
 */
export declare function logPlaceholderRemoved(templateId: string, placeholderKey: string, userId: string, userName: string, reason?: string, tenantId?: string): Promise<string>;
/**
 * Log placeholder rename event
 */
export declare function logPlaceholderRenamed(templateId: string, oldKey: string, newKey: string, userId: string, userName: string, reason?: string, tenantId?: string): Promise<string>;
/**
 * Query audit trail by resource
 */
export declare function getAuditTrailByResource(resourceId: string, limit?: number): Promise<AuditEvent[]>;
/**
 * Query audit trail by event type
 */
export declare function getAuditTrailByEventType(eventType: AuditEvent['eventType'], limit?: number): Promise<AuditEvent[]>;
/**
 * Query audit trail by tenant
 */
export declare function getAuditTrailByTenant(tenantId: string, limit?: number): Promise<AuditEvent[]>;
/**
 * Query audit trail by time range
 */
export declare function getAuditTrailByTimeRange(startTime: Date, endTime: Date, resourceId?: string, limit?: number): Promise<AuditEvent[]>;
/**
 * Query audit trail by actor (user)
 */
export declare function getAuditTrailByActor(userId: string, limit?: number): Promise<AuditEvent[]>;
/**
 * Get recent audit events across all resources
 */
export declare function getRecentAuditEvents(limit?: number, tenantId?: string): Promise<AuditEvent[]>;
/**
 * Get audit statistics for a resource
 */
export declare function getAuditStatistics(resourceId: string): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    uniqueActors: number;
    firstEvent?: Date;
    lastEvent?: Date;
}>;
/**
 * Search audit trail with filters
 */
export declare function searchAuditTrail(filters: {
    resourceId?: string;
    eventType?: AuditEvent['eventType'];
    userId?: string;
    tenantId?: string;
    startTime?: Date;
    endTime?: Date;
}, limit?: number): Promise<AuditEvent[]>;
/**
 * Delete old audit logs (for data retention policies)
 * BE CAREFUL: This permanently deletes audit data
 */
export declare function deleteAuditLogsOlderThan(cutoffDate: Date, dryRun?: boolean): Promise<{
    deletedCount: number;
    dryRun: boolean;
}>;
/**
 * Export audit trail to JSON (for compliance/backup)
 */
export declare function exportAuditTrail(filters: {
    resourceId?: string;
    startTime?: Date;
    endTime?: Date;
    tenantId?: string;
}): Promise<AuditEvent[]>;
//# sourceMappingURL=auditLogger.d.ts.map