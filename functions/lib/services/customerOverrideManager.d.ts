/**
 * Customer Override Manager
 *
 * Handles customer-specific template customizations and overrides.
 *
 * Key Features:
 * - Create and validate customer-specific overrides
 * - Merge global placeholder schema with customer deltas
 * - Detect collisions between global and override schemas
 * - Freeze template versions for intake consistency
 * - Apply overrides to templates during document generation
 *
 * Storage Structure:
 * intakes/{intakeId}/
 *   - versionSnapshot: { templateVersions, effectiveSchema, frozenAt }
 *   overrides/{overrideId}/
 *     - customerId, sections, schema_delta, status, collisions, ...
 */
import { CustomerOverride, PlaceholderField, IntakeVersionSnapshot, ValidationResult } from '../types/versioning';
/**
 * Create a customer-specific override
 */
export declare function createOverride(intakeId: string, customerId: string, sections: Array<{
    content: string;
    insertAfter: string;
    newPlaceholders: PlaceholderField[];
}>, createdBy: string, reason?: string): Promise<{
    overrideId: string;
    validation: ValidationResult;
}>;
/**
 * Validate an override before creation
 */
export declare function validateOverride(intakeId: string, newPlaceholders: PlaceholderField[]): Promise<ValidationResult>;
/**
 * Apply override to merge global and customer schemas
 */
export declare function applyOverride(intakeId: string, overrideId: string): Promise<PlaceholderField[]>;
/**
 * Freeze template versions for an intake
 * This pins specific template versions to ensure consistency
 */
export declare function freezeIntakeVersion(intakeId: string, templateIds: string[], useApprovedVersions?: boolean): Promise<IntakeVersionSnapshot>;
/**
 * Get all overrides for an intake
 */
export declare function getOverrides(intakeId: string, status?: 'active' | 'pending_review' | 'rejected'): Promise<CustomerOverride[]>;
/**
 * Update override status
 */
export declare function updateOverrideStatus(intakeId: string, overrideId: string, status: 'active' | 'pending_review' | 'rejected', reviewedBy: string, reviewNotes?: string): Promise<void>;
/**
 * Get effective schema for an intake (global + all active overrides)
 */
export declare function getEffectiveSchema(intakeId: string): Promise<PlaceholderField[]>;
/**
 * Delete an override
 */
export declare function deleteOverride(intakeId: string, overrideId: string): Promise<void>;
/**
 * Get override sections for document generation
 * Returns sections sorted by insertion order
 */
export declare function getOverrideSections(intakeId: string): Promise<Array<{
    content: string;
    insertAfter: string;
    placeholders: PlaceholderField[];
}>>;
/**
 * Check if intake has any pending overrides
 */
export declare function hasPendingOverrides(intakeId: string): Promise<boolean>;
//# sourceMappingURL=customerOverrideManager.d.ts.map