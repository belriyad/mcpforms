"use strict";
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
exports.createOverride = createOverride;
exports.validateOverride = validateOverride;
exports.applyOverride = applyOverride;
exports.freezeIntakeVersion = freezeIntakeVersion;
exports.getOverrides = getOverrides;
exports.updateOverrideStatus = updateOverrideStatus;
exports.getEffectiveSchema = getEffectiveSchema;
exports.deleteOverride = deleteOverride;
exports.getOverrideSections = getOverrideSections;
exports.hasPendingOverrides = hasPendingOverrides;
const admin = __importStar(require("firebase-admin"));
const placeholderValidator_1 = require("./placeholderValidator");
const templateVersionManager_1 = require("./templateVersionManager");
const db = admin.firestore();
/**
 * Create a customer-specific override
 */
async function createOverride(intakeId, customerId, sections, createdBy, reason) {
    try {
        const intakeRef = db.collection('intakes').doc(intakeId);
        const intakeDoc = await intakeRef.get();
        if (!intakeDoc.exists) {
            throw new Error(`Intake ${intakeId} not found`);
        }
        const intakeData = intakeDoc.data();
        // Get global schema from intake's frozen version
        const versionSnapshot = intakeData.versionSnapshot;
        const globalSchema = (versionSnapshot === null || versionSnapshot === void 0 ? void 0 : versionSnapshot.effectiveSchema) || [];
        // Extract all new placeholders from sections
        const allNewPlaceholders = [];
        sections.forEach(section => {
            allNewPlaceholders.push(...section.newPlaceholders);
        });
        // Validate new placeholders
        const schemaValidation = placeholderValidator_1.placeholderValidator.validateSchema(allNewPlaceholders);
        if (schemaValidation.errors.length > 0) {
            throw new Error(`Override schema validation failed: ${schemaValidation.errors.map((e) => e.message).join(', ')}`);
        }
        // Detect collisions with global schema
        const collisions = placeholderValidator_1.placeholderValidator.detectCollisions(globalSchema, allNewPlaceholders);
        // Create override document
        const overrideId = db.collection('intakes').doc().id;
        const override = {
            overrideId,
            intakeId,
            customerId,
            sections: sections.map(s => ({
                section_id: db.collection('sections').doc().id,
                title: s.insertAfter, // Use insertAfter as title for now
                content: s.content,
                insert_after: s.insertAfter,
                new_placeholders: s.newPlaceholders
            })),
            schema_delta: {
                added: allNewPlaceholders,
                modified: [],
                removed: []
            },
            status: collisions.length > 0 ? 'pending_review' : 'active',
            collisions: collisions.map(c => c.field_key),
            createdBy,
            createdAt: admin.firestore.Timestamp.now(),
            reason
        };
        // Save override
        await intakeRef.collection('overrides').doc(overrideId).set(override);
        console.log(`Created override ${overrideId} for intake ${intakeId}, customer ${customerId}`);
        return {
            overrideId,
            validation: {
                valid: collisions.length === 0,
                errors: collisions.length > 0 ? [{
                        field_key: 'schema_delta',
                        message: `Found ${collisions.length} collision(s) with global schema`,
                        type: 'duplicate'
                    }] : [],
                warnings: schemaValidation.warnings
            }
        };
    }
    catch (error) {
        console.error(`Error creating override:`, error);
        throw error;
    }
}
/**
 * Validate an override before creation
 */
async function validateOverride(intakeId, newPlaceholders) {
    try {
        const intakeDoc = await db.collection('intakes').doc(intakeId).get();
        if (!intakeDoc.exists) {
            throw new Error(`Intake ${intakeId} not found`);
        }
        const intakeData = intakeDoc.data();
        const versionSnapshot = intakeData.versionSnapshot;
        const globalSchema = (versionSnapshot === null || versionSnapshot === void 0 ? void 0 : versionSnapshot.effectiveSchema) || [];
        // Validate schema structure
        const schemaValidation = placeholderValidator_1.placeholderValidator.validateSchema(newPlaceholders);
        // Check for collisions
        const collisions = placeholderValidator_1.placeholderValidator.detectCollisions(globalSchema, newPlaceholders);
        const errors = [...schemaValidation.errors];
        if (collisions.length > 0) {
            errors.push({
                field_key: 'schema',
                message: `Found ${collisions.length} collision(s) with global schema: ${collisions.join(', ')}`,
                type: 'duplicate'
            });
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings: schemaValidation.warnings
        };
    }
    catch (error) {
        console.error(`Error validating override:`, error);
        throw error;
    }
}
/**
 * Apply override to merge global and customer schemas
 */
async function applyOverride(intakeId, overrideId) {
    try {
        const intakeRef = db.collection('intakes').doc(intakeId);
        const overrideDoc = await intakeRef.collection('overrides').doc(overrideId).get();
        if (!overrideDoc.exists) {
            throw new Error(`Override ${overrideId} not found`);
        }
        const override = overrideDoc.data();
        // Get global schema
        const intakeDoc = await intakeRef.get();
        const intakeData = intakeDoc.data();
        const versionSnapshot = intakeData.versionSnapshot;
        const globalSchema = (versionSnapshot === null || versionSnapshot === void 0 ? void 0 : versionSnapshot.effectiveSchema) || [];
        // Merge schemas: global + added - removed + modified
        const mergedSchema = [...globalSchema];
        // Add new fields from override
        if (override.schema_delta.added && override.schema_delta.added.length > 0) {
            override.schema_delta.added.forEach((field) => {
                // Only add if not already present (avoid duplicates)
                const exists = mergedSchema.some(f => f.field_key === field.field_key);
                if (!exists) {
                    mergedSchema.push(field);
                }
            });
        }
        // Remove fields marked for removal
        if (override.schema_delta.removed && override.schema_delta.removed.length > 0) {
            override.schema_delta.removed.forEach((removedKey) => {
                const index = mergedSchema.findIndex(f => f.field_key === removedKey);
                if (index !== -1) {
                    mergedSchema.splice(index, 1);
                }
            });
        }
        // Apply modifications
        if (override.schema_delta.modified && override.schema_delta.modified.length > 0) {
            override.schema_delta.modified.forEach((modified) => {
                const index = mergedSchema.findIndex(f => f.field_key === modified.field_key);
                if (index !== -1) {
                    mergedSchema[index] = modified;
                }
            });
        }
        console.log(`Applied override ${overrideId} to intake ${intakeId}, merged schema has ${mergedSchema.length} fields`);
        return mergedSchema;
    }
    catch (error) {
        console.error(`Error applying override:`, error);
        throw error;
    }
}
/**
 * Freeze template versions for an intake
 * This pins specific template versions to ensure consistency
 */
async function freezeIntakeVersion(intakeId, templateIds, useApprovedVersions = true) {
    try {
        const intakeRef = db.collection('intakes').doc(intakeId);
        // Collect template versions
        const templateVersions = {};
        const allPlaceholders = [];
        for (const templateId of templateIds) {
            let version;
            let placeholders;
            if (useApprovedVersions) {
                // Use latest approved version
                const approvedVersion = await (0, templateVersionManager_1.getLatestApprovedVersion)(templateId);
                if (!approvedVersion) {
                    throw new Error(`No approved version found for template ${templateId}`);
                }
                version = approvedVersion.version;
                placeholders = approvedVersion.placeholders;
            }
            else {
                // Use current version
                const templateDoc = await db.collection('templates').doc(templateId).get();
                if (!templateDoc.exists) {
                    throw new Error(`Template ${templateId} not found`);
                }
                const templateData = templateDoc.data();
                version = templateData.currentVersion || 1;
                const versionData = await (0, templateVersionManager_1.getVersion)(templateId, version);
                if (!versionData) {
                    throw new Error(`Version ${version} not found for template ${templateId}`);
                }
                placeholders = versionData.placeholders;
            }
            templateVersions[templateId] = version;
            // Collect all placeholders (remove duplicates by field_key)
            placeholders.forEach(p => {
                const exists = allPlaceholders.some(existing => existing.field_key === p.field_key);
                if (!exists) {
                    allPlaceholders.push(p);
                }
            });
        }
        // Create version snapshot
        const snapshot = {
            templateVersions,
            effectiveSchema: allPlaceholders,
            frozenAt: admin.firestore.Timestamp.now()
        };
        // Save to intake
        await intakeRef.update({
            versionSnapshot: snapshot
        });
        console.log(`Froze versions for intake ${intakeId}:`, templateVersions);
        return snapshot;
    }
    catch (error) {
        console.error(`Error freezing intake version:`, error);
        throw error;
    }
}
/**
 * Get all overrides for an intake
 */
async function getOverrides(intakeId, status) {
    try {
        let query = db.collection('intakes').doc(intakeId).collection('overrides');
        if (status) {
            query = query.where('status', '==', status);
        }
        const snapshot = await query.get();
        return snapshot.docs.map((doc) => doc.data());
    }
    catch (error) {
        console.error(`Error getting overrides:`, error);
        throw error;
    }
}
/**
 * Update override status
 */
async function updateOverrideStatus(intakeId, overrideId, status, reviewedBy, reviewNotes) {
    try {
        const overrideRef = db
            .collection('intakes')
            .doc(intakeId)
            .collection('overrides')
            .doc(overrideId);
        await overrideRef.update({
            status,
            reviewedBy,
            reviewedAt: admin.firestore.Timestamp.now(),
            reviewNotes
        });
        console.log(`Updated override ${overrideId} status to ${status}`);
    }
    catch (error) {
        console.error(`Error updating override status:`, error);
        throw error;
    }
}
/**
 * Get effective schema for an intake (global + all active overrides)
 */
async function getEffectiveSchema(intakeId) {
    try {
        const intakeRef = db.collection('intakes').doc(intakeId);
        const intakeDoc = await intakeRef.get();
        if (!intakeDoc.exists) {
            throw new Error(`Intake ${intakeId} not found`);
        }
        const intakeData = intakeDoc.data();
        const versionSnapshot = intakeData.versionSnapshot;
        let effectiveSchema = (versionSnapshot === null || versionSnapshot === void 0 ? void 0 : versionSnapshot.effectiveSchema) || [];
        // Get all active overrides
        const overrides = await getOverrides(intakeId, 'active');
        // Apply each override
        for (const override of overrides) {
            // Add new fields
            if (override.schema_delta.added && override.schema_delta.added.length > 0) {
                override.schema_delta.added.forEach((field) => {
                    const exists = effectiveSchema.some(f => f.field_key === field.field_key);
                    if (!exists) {
                        effectiveSchema.push(field);
                    }
                });
            }
            // Remove fields
            if (override.schema_delta.removed && override.schema_delta.removed.length > 0) {
                override.schema_delta.removed.forEach((removedKey) => {
                    effectiveSchema = effectiveSchema.filter(f => f.field_key !== removedKey);
                });
            }
            // Modify fields
            if (override.schema_delta.modified && override.schema_delta.modified.length > 0) {
                override.schema_delta.modified.forEach((modified) => {
                    const index = effectiveSchema.findIndex(f => f.field_key === modified.field_key);
                    if (index !== -1) {
                        effectiveSchema[index] = modified;
                    }
                });
            }
        }
        return effectiveSchema;
    }
    catch (error) {
        console.error(`Error getting effective schema:`, error);
        throw error;
    }
}
/**
 * Delete an override
 */
async function deleteOverride(intakeId, overrideId) {
    try {
        await db
            .collection('intakes')
            .doc(intakeId)
            .collection('overrides')
            .doc(overrideId)
            .delete();
        console.log(`Deleted override ${overrideId} from intake ${intakeId}`);
    }
    catch (error) {
        console.error(`Error deleting override:`, error);
        throw error;
    }
}
/**
 * Get override sections for document generation
 * Returns sections sorted by insertion order
 */
async function getOverrideSections(intakeId) {
    try {
        const overrides = await getOverrides(intakeId, 'active');
        const sections = [];
        overrides.forEach(override => {
            override.sections.forEach(section => {
                sections.push({
                    content: section.content,
                    insertAfter: section.insert_after || 'end',
                    placeholders: section.new_placeholders || []
                });
            });
        });
        return sections;
    }
    catch (error) {
        console.error(`Error getting override sections:`, error);
        throw error;
    }
}
/**
 * Check if intake has any pending overrides
 */
async function hasPendingOverrides(intakeId) {
    try {
        const pendingOverrides = await getOverrides(intakeId, 'pending_review');
        return pendingOverrides.length > 0;
    }
    catch (error) {
        console.error(`Error checking pending overrides:`, error);
        throw error;
    }
}
//# sourceMappingURL=customerOverrideManager.js.map