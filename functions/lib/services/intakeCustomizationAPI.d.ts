/**
 * Intake Customization API
 *
 * Firebase Functions for Customer Overrides and Intake Customization
 *
 * Endpoints:
 * - generateCustomClauseAI: POST AI-generate custom clause
 * - createCustomerOverride: POST create override
 * - validateCustomerOverride: POST pre-validate override
 * - reviewOverride: POST approve/reject override
 * - getOverrides: GET list overrides for intake
 * - getEffectiveSchema: GET merged global + overrides schema
 * - freezeIntakeVersion: POST pin template versions
 * - getOverrideSections: GET sections for document generation
 */
import { PlaceholderField } from '../types/versioning';
/**
 * Generate custom clause using AI
 */
export declare function generateCustomClauseAI(data: {
    intakeId: string;
    customerId: string;
    request: string;
    insertAfter?: string;
}, context: any): Promise<{
    success: boolean;
    clause: {
        section_text: string;
        section_title: string;
        new_placeholders: PlaceholderField[];
        insert_after: string;
        reasoning: string;
        warnings: string[] | undefined;
    };
    error?: undefined;
} | {
    success: boolean;
    error: any;
    clause?: undefined;
}>;
/**
 * Create customer override
 */
export declare function createCustomerOverride(data: {
    intakeId: string;
    customerId: string;
    sections: Array<{
        content: string;
        insertAfter: string;
        newPlaceholders: PlaceholderField[];
    }>;
    userId: string;
    userName: string;
    reason?: string;
}, context: any): Promise<{
    success: boolean;
    overrideId: string;
    validation: import("../types/versioning").ValidationResult;
    hasCollisions: boolean;
    collisionCount: number;
    error?: undefined;
} | {
    success: boolean;
    error: any;
    overrideId?: undefined;
    validation?: undefined;
    hasCollisions?: undefined;
    collisionCount?: undefined;
}>;
/**
 * Validate override before creation
 */
export declare function validateCustomerOverride(data: {
    intakeId: string;
    newPlaceholders: PlaceholderField[];
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
 * Review override (approve or reject)
 */
export declare function reviewOverride(data: {
    intakeId: string;
    overrideId: string;
    action: 'approve' | 'reject';
    userId: string;
    userName: string;
    reviewNotes?: string;
}, context: any): Promise<{
    success: boolean;
    status: string;
    message: string;
    error?: undefined;
} | {
    success: boolean;
    error: any;
    status?: undefined;
    message?: undefined;
}>;
/**
 * Get overrides for intake
 */
export declare function getOverrides(data: {
    intakeId: string;
    status?: 'active' | 'pending_review' | 'rejected';
}, context: any): Promise<{
    success: boolean;
    overrides: {
        overrideId: string;
        customerId: string;
        sections: import("../types/versioning").CustomerOverrideSection[];
        schema_delta: {
            added: PlaceholderField[];
            modified: PlaceholderField[];
            removed: string[];
        };
        status: "active" | "rejected" | "pending_review";
        collisions: string[] | undefined;
        createdAt: Date;
        createdBy: string;
        reviewedAt: Date | undefined;
        reviewedBy: string | undefined;
        reviewNotes: string | undefined;
        reason: string | undefined;
    }[];
    count: number;
    error?: undefined;
} | {
    success: boolean;
    error: any;
    overrides?: undefined;
    count?: undefined;
}>;
/**
 * Get effective schema (global + all active overrides)
 */
export declare function getEffectiveSchema(data: {
    intakeId: string;
}, context: any): Promise<{
    success: boolean;
    schema: PlaceholderField[];
    fieldCount: number;
    error?: undefined;
} | {
    success: boolean;
    error: any;
    schema?: undefined;
    fieldCount?: undefined;
}>;
/**
 * Freeze template versions for intake
 */
export declare function freezeIntakeVersion(data: {
    intakeId: string;
    templateIds: string[];
    useApprovedVersions?: boolean;
}, context: any): Promise<{
    success: boolean;
    versionSnapshot: {
        templateVersions: Record<string, number>;
        effectiveSchemaCount: number;
        frozenAt: Date;
    };
    error?: undefined;
} | {
    success: boolean;
    error: any;
    versionSnapshot?: undefined;
}>;
/**
 * Get override sections for document generation
 */
export declare function getOverrideSections(data: {
    intakeId: string;
}, context: any): Promise<{
    success: boolean;
    sections: {
        content: string;
        insertAfter: string;
        placeholders: PlaceholderField[];
    }[];
    count: number;
    error?: undefined;
} | {
    success: boolean;
    error: any;
    sections?: undefined;
    count?: undefined;
}>;
/**
 * Check if intake has pending overrides
 */
export declare function hasPendingOverrides(data: {
    intakeId: string;
}, context: any): Promise<{
    success: boolean;
    hasPending: boolean;
    error?: undefined;
} | {
    success: boolean;
    error: any;
    hasPending?: undefined;
}>;
/**
 * Start intake with overrides
 * Combines template selection, version freezing, and override initialization
 */
export declare function startIntakeWithOverrides(data: {
    serviceId: string;
    customerId: string;
    templateIds: string[];
    useApprovedVersions?: boolean;
}, context: any): Promise<{
    success: boolean;
    data: {
        intakeId: string;
        intakeUrl: string;
    } | undefined;
    message: string;
    error?: undefined;
} | {
    success: boolean;
    error: any;
    data?: undefined;
    message?: undefined;
}>;
/**
 * Get intake with override information
 */
export declare function getIntakeWithOverrides(data: {
    intakeId: string;
}, context: any): Promise<{
    success: boolean;
    intake: {
        overrides: {
            active: import("../types/versioning").CustomerOverride[];
            pending: import("../types/versioning").CustomerOverride[];
            total: number;
        };
        effectiveSchema: PlaceholderField[];
        effectiveSchemaCount: number;
    };
    error?: undefined;
} | {
    success: boolean;
    error: any;
    intake?: undefined;
}>;
//# sourceMappingURL=intakeCustomizationAPI.d.ts.map