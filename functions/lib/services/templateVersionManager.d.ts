/**
 * Template Version Manager
 *
 * Handles template versioning, diff calculation, rollback, and concurrency control.
 *
 * Key Features:
 * - Auto-increment version numbers
 * - Calculate diffs (added/removed/renamed placeholders)
 * - Approve versions for production use
 * - Rollback to previous versions
 * - Soft editor locks (5-min TTL) with ETag concurrency control
 *
 * Storage Structure:
 * templates/{templateId}/
 *   - currentVersion: number
 *   - latestApprovedVersion: number
 *   - editorLock: { userId, expiresAt }
 *   versions/{versionId}/
 *     - version, diff, placeholders, status, etag, ...
 */
import { TemplateVersion, PlaceholderDiff, PlaceholderField } from '../types/versioning';
/**
 * Calculate diff between two placeholder schemas
 */
export declare function calculateDiff(oldPlaceholders: PlaceholderField[], newPlaceholders: PlaceholderField[]): PlaceholderDiff;
/**
 * Save a new template version
 */
export declare function saveVersion(templateId: string, placeholders: PlaceholderField[], userId: string, reason?: string, expectedETag?: string): Promise<{
    version: number;
    etag: string;
    diff: PlaceholderDiff;
}>;
/**
 * Approve a template version for production use
 */
export declare function approveVersion(templateId: string, version: number, userId: string, reason?: string): Promise<void>;
/**
 * Rollback to a previous version
 */
export declare function rollbackToVersion(templateId: string, targetVersion: number, userId: string, reason: string): Promise<{
    newVersion: number;
    etag: string;
}>;
/**
 * Acquire an editor lock
 */
export declare function acquireLock(templateId: string, userId: string): Promise<{
    acquired: boolean;
    expiresAt?: Date;
    currentHolder?: string;
}>;
/**
 * Release an editor lock
 */
export declare function releaseLock(templateId: string, userId: string): Promise<{
    released: boolean;
}>;
/**
 * Refresh an existing lock (extend TTL)
 */
export declare function refreshLock(templateId: string, userId: string): Promise<{
    refreshed: boolean;
    expiresAt?: Date;
}>;
/**
 * Get version history for a template
 */
export declare function getVersionHistory(templateId: string, limit?: number): Promise<TemplateVersion[]>;
/**
 * Get a specific version
 */
export declare function getVersion(templateId: string, version: number): Promise<TemplateVersion | null>;
/**
 * Get the latest approved version
 */
export declare function getLatestApprovedVersion(templateId: string): Promise<TemplateVersion | null>;
/**
 * Check if a user has the lock
 */
export declare function hasLock(templateId: string, userId: string): Promise<boolean>;
//# sourceMappingURL=templateVersionManager.d.ts.map