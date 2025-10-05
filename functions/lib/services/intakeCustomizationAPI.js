"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCustomClauseAI = generateCustomClauseAI;
exports.createCustomerOverride = createCustomerOverride;
exports.validateCustomerOverride = validateCustomerOverride;
exports.reviewOverride = reviewOverride;
exports.getOverrides = getOverrides;
exports.getEffectiveSchema = getEffectiveSchema;
exports.freezeIntakeVersion = freezeIntakeVersion;
exports.getOverrideSections = getOverrideSections;
exports.hasPendingOverrides = hasPendingOverrides;
exports.startIntakeWithOverrides = startIntakeWithOverrides;
exports.getIntakeWithOverrides = getIntakeWithOverrides;
const admin = __importStar(require("firebase-admin"));
const customerOverrideManager_1 = require("./customerOverrideManager");
const aiPlaceholderService_1 = require("./aiPlaceholderService");
const auditLogger_1 = require("./auditLogger");
const db = admin.firestore();
/**
 * Generate custom clause using AI
 */
async function generateCustomClauseAI(data, context) {
    try {
        const { intakeId, customerId, request, insertAfter } = data;
        // Get existing schema to check collisions
        const intakeDoc = await db.collection('intakes').doc(intakeId).get();
        if (!intakeDoc.exists) {
            throw new Error('Intake not found');
        }
        const intakeData = intakeDoc.data();
        const versionSnapshot = intakeData.versionSnapshot;
        const existingSchema = (versionSnapshot === null || versionSnapshot === void 0 ? void 0 : versionSnapshot.effectiveSchema) || [];
        // Generate clause with AI
        // For templateContext, we can use a summary or empty string for now
        const templateContextStr = 'Template context'; // TODO: Get actual template context
        const result = await aiPlaceholderService_1.aiPlaceholderService.generateCustomClause(request, templateContextStr, existingSchema);
        return {
            success: true,
            clause: {
                section_text: result.section_text,
                section_title: result.section_title,
                new_placeholders: result.new_placeholders,
                insert_after: insertAfter || 'end',
                reasoning: result.reasoning,
                warnings: result.warnings
            }
        };
    }
    catch (error) {
        console.error('Error generating custom clause:', error);
        return {
            success: false,
            error: error.message
        };
    }
}
/**
 * Create customer override
 */
async function createCustomerOverride(data, context) {
    try {
        const { intakeId, customerId, sections, userId, userName, reason } = data;
        // Create override
        const result = await (0, customerOverrideManager_1.createOverride)(intakeId, customerId, sections, userId, reason);
        // Count placeholders and collisions
        const totalPlaceholders = sections.reduce((sum, s) => sum + s.newPlaceholders.length, 0);
        const collisions = result.validation.errors
            .filter(e => e.type === 'duplicate')
            .map(e => e.field_key);
        // Log audit event
        await (0, auditLogger_1.logOverrideCreated)(intakeId, result.overrideId, customerId, userId, userName, sections.length, totalPlaceholders, collisions, reason);
        return {
            success: true,
            overrideId: result.overrideId,
            validation: result.validation,
            hasCollisions: collisions.length > 0,
            collisionCount: collisions.length
        };
    }
    catch (error) {
        console.error('Error creating override:', error);
        return {
            success: false,
            error: error.message
        };
    }
}
/**
 * Validate override before creation
 */
async function validateCustomerOverride(data, context) {
    try {
        const { intakeId, newPlaceholders } = data;
        const validation = await (0, customerOverrideManager_1.validateOverride)(intakeId, newPlaceholders);
        return {
            success: true,
            valid: validation.valid,
            errors: validation.errors,
            warnings: validation.warnings
        };
    }
    catch (error) {
        console.error('Error validating override:', error);
        return {
            success: false,
            error: error.message
        };
    }
}
/**
 * Review override (approve or reject)
 */
async function reviewOverride(data, context) {
    try {
        const { intakeId, overrideId, action, userId, userName, reviewNotes } = data;
        const status = action === 'approve' ? 'active' : 'rejected';
        // Update status
        await (0, customerOverrideManager_1.updateOverrideStatus)(intakeId, overrideId, status, userId, reviewNotes);
        // Log audit event
        if (action === 'approve') {
            await (0, auditLogger_1.logOverrideAccepted)(intakeId, overrideId, userId, userName, reviewNotes);
        }
        else {
            await (0, auditLogger_1.logOverrideRejected)(intakeId, overrideId, userId, userName, reviewNotes);
        }
        return {
            success: true,
            status,
            message: `Override ${action === 'approve' ? 'approved' : 'rejected'}`
        };
    }
    catch (error) {
        console.error('Error reviewing override:', error);
        return {
            success: false,
            error: error.message
        };
    }
}
/**
 * Get overrides for intake
 */
async function getOverrides(data, context) {
    try {
        const { intakeId, status } = data;
        const overrides = await (0, customerOverrideManager_1.getOverrides)(intakeId, status);
        return {
            success: true,
            overrides: overrides.map(o => ({
                overrideId: o.overrideId,
                customerId: o.customerId,
                sections: o.sections,
                schema_delta: o.schema_delta,
                status: o.status,
                collisions: o.collisions,
                createdAt: o.createdAt,
                createdBy: o.createdBy,
                reviewedAt: o.reviewedAt,
                reviewedBy: o.reviewedBy,
                reviewNotes: o.reviewNotes,
                reason: o.reason
            })),
            count: overrides.length
        };
    }
    catch (error) {
        console.error('Error getting overrides:', error);
        return {
            success: false,
            error: error.message
        };
    }
}
/**
 * Get effective schema (global + all active overrides)
 */
async function getEffectiveSchema(data, context) {
    try {
        const { intakeId } = data;
        const schema = await (0, customerOverrideManager_1.getEffectiveSchema)(intakeId);
        return {
            success: true,
            schema,
            fieldCount: schema.length
        };
    }
    catch (error) {
        console.error('Error getting effective schema:', error);
        return {
            success: false,
            error: error.message
        };
    }
}
/**
 * Freeze template versions for intake
 */
async function freezeIntakeVersion(data, context) {
    try {
        const { intakeId, templateIds, useApprovedVersions = true } = data;
        const snapshot = await (0, customerOverrideManager_1.freezeIntakeVersion)(intakeId, templateIds, useApprovedVersions);
        return {
            success: true,
            versionSnapshot: {
                templateVersions: snapshot.templateVersions,
                effectiveSchemaCount: snapshot.effectiveSchema.length,
                frozenAt: snapshot.frozenAt
            }
        };
    }
    catch (error) {
        console.error('Error freezing intake version:', error);
        return {
            success: false,
            error: error.message
        };
    }
}
/**
 * Get override sections for document generation
 */
async function getOverrideSections(data, context) {
    try {
        const { intakeId } = data;
        const sections = await (0, customerOverrideManager_1.getOverrideSections)(intakeId);
        return {
            success: true,
            sections,
            count: sections.length
        };
    }
    catch (error) {
        console.error('Error getting override sections:', error);
        return {
            success: false,
            error: error.message
        };
    }
}
/**
 * Check if intake has pending overrides
 */
async function hasPendingOverrides(data, context) {
    try {
        const { intakeId } = data;
        const hasPending = await (0, customerOverrideManager_1.hasPendingOverrides)(intakeId);
        return {
            success: true,
            hasPending
        };
    }
    catch (error) {
        console.error('Error checking pending overrides:', error);
        return {
            success: false,
            error: error.message
        };
    }
}
/**
 * Start intake with overrides
 * Combines template selection, version freezing, and override initialization
 */
async function startIntakeWithOverrides(data, context) {
    try {
        const { serviceId, customerId, templateIds, useApprovedVersions = true } = data;
        if (!serviceId || !customerId) {
            return {
                success: false,
                error: 'Service ID and Customer ID are required'
            };
        }
        console.log(`🚀 [INTAKE-START] Starting intake with overrides for customer ${customerId}`);
        // Import intakeManager dynamically to avoid circular dependencies
        const { intakeManager } = await Promise.resolve().then(() => __importStar(require('./intakeManager')));
        // Use the new generateIntakeLinkWithOverrides function
        const result = await intakeManager.generateIntakeLinkWithOverrides({
            serviceId,
            customerId,
            templateIds,
            useApprovedVersions
        });
        if (!result.success) {
            return {
                success: false,
                error: result.error || 'Failed to create intake with overrides'
            };
        }
        console.log(`✅ [INTAKE-START] Intake created successfully:`, result.data);
        return {
            success: true,
            data: result.data,
            message: 'Intake created with frozen template versions and overrides'
        };
    }
    catch (error) {
        console.error('Error starting intake with overrides:', error);
        return {
            success: false,
            error: error.message
        };
    }
}
/**
 * Get intake with override information
 */
async function getIntakeWithOverrides(data, context) {
    try {
        const { intakeId } = data;
        // Get intake
        const intakeDoc = await db.collection('intakes').doc(intakeId).get();
        if (!intakeDoc.exists) {
            throw new Error('Intake not found');
        }
        const intakeData = intakeDoc.data();
        // Get overrides
        const overrides = await (0, customerOverrideManager_1.getOverrides)(intakeId);
        const activeOverrides = overrides.filter(o => o.status === 'active');
        const pendingOverrides = overrides.filter(o => o.status === 'pending_review');
        // Get effective schema
        const effectiveSchema = await (0, customerOverrideManager_1.getEffectiveSchema)(intakeId);
        return {
            success: true,
            intake: Object.assign(Object.assign({}, intakeData), { overrides: {
                    active: activeOverrides,
                    pending: pendingOverrides,
                    total: overrides.length
                }, effectiveSchema, effectiveSchemaCount: effectiveSchema.length })
        };
    }
    catch (error) {
        console.error('Error getting intake with overrides:', error);
        return {
            success: false,
            error: error.message
        };
    }
}
//# sourceMappingURL=intakeCustomizationAPI.js.map