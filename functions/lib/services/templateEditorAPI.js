"use strict";
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
exports.listTemplates = listTemplates;
exports.getTemplateWithPlaceholders = getTemplateWithPlaceholders;
exports.suggestPlaceholdersAI = suggestPlaceholdersAI;
exports.saveTemplateDraft = saveTemplateDraft;
exports.approveTemplateVersion = approveTemplateVersion;
exports.rollbackTemplate = rollbackTemplate;
exports.acquireTemplateLock = acquireTemplateLock;
exports.releaseTemplateLock = releaseTemplateLock;
exports.refreshTemplateLock = refreshTemplateLock;
exports.getTemplateVersionHistory = getTemplateVersionHistory;
exports.getTemplateAuditTrail = getTemplateAuditTrail;
exports.validatePlaceholders = validatePlaceholders;
exports.checkTemplateLock = checkTemplateLock;
const admin = __importStar(require("firebase-admin"));
const templateVersionManager_1 = require("./templateVersionManager");
const placeholderValidator_1 = require("./placeholderValidator");
const aiPlaceholderService_1 = require("./aiPlaceholderService");
const auditLogger_1 = require("./auditLogger");
const db = admin.firestore();
/**
 * List all templates for a tenant
 */
async function listTemplates(data, context) {
    try {
        // TODO: Add authentication check
        // if (!context.auth) {
        //   throw new Error('Unauthorized');
        // }
        const { tenantId, status, limit = 50 } = data;
        let query = db.collection('templates')
            .where('tenantId', '==', tenantId);
        if (status) {
            query = query.where('status', '==', status);
        }
        const snapshot = await query
            .orderBy('updatedAt', 'desc')
            .limit(limit)
            .get();
        const templates = snapshot.docs.map((doc) => (Object.assign(Object.assign({ id: doc.id }, doc.data()), { hasLock: doc.data().editorLock ? true : false, lockExpired: doc.data().editorLock ?
                doc.data().editorLock.expiresAt.toDate() < new Date() :
                true })));
        return {
            success: true,
            templates,
            count: templates.length
        };
    }
    catch (error) {
        console.error('Error listing templates:', error);
        return {
            success: false,
            error: error.message
        };
    }
}
/**
 * Get template with placeholders and metadata
 */
async function getTemplateWithPlaceholders(data, context) {
    try {
        const { templateId, version } = data;
        // Get template
        const templateDoc = await db.collection('templates').doc(templateId).get();
        if (!templateDoc.exists) {
            throw new Error('Template not found');
        }
        const templateData = templateDoc.data();
        // Get placeholders from version
        let placeholders = [];
        let versionData = null;
        if (version) {
            versionData = await (0, templateVersionManager_1.getVersion)(templateId, version);
            if (versionData) {
                placeholders = versionData.placeholders;
            }
        }
        else {
            // Get latest version
            const currentVersion = templateData.currentVersion || 0;
            if (currentVersion > 0) {
                versionData = await (0, templateVersionManager_1.getVersion)(templateId, currentVersion);
                if (versionData) {
                    placeholders = versionData.placeholders;
                }
            }
        }
        // Check lock status
        const lock = templateData.editorLock;
        const lockStatus = lock ? {
            isLocked: lock.expiresAt.toDate() > new Date(),
            lockedBy: lock.userId,
            expiresAt: lock.expiresAt.toDate()
        } : {
            isLocked: false
        };
        return {
            success: true,
            template: Object.assign(Object.assign({ id: templateId }, templateData), { placeholders, versionInfo: versionData ? {
                    version: versionData.version,
                    status: versionData.status,
                    createdAt: versionData.createdAt,
                    createdBy: versionData.createdBy,
                    approvedAt: versionData.approvedAt,
                    approvedBy: versionData.approvedBy
                } : null, lockStatus })
        };
    }
    catch (error) {
        console.error('Error getting template:', error);
        return {
            success: false,
            error: error.message
        };
    }
}
/**
 * AI-powered placeholder suggestion
 */
async function suggestPlaceholdersAI(data, context) {
    try {
        const { templateId, templateContent } = data;
        let content = templateContent;
        // If no content provided, try to get from storage
        if (!content) {
            const templateDoc = await db.collection('templates').doc(templateId).get();
            if (!templateDoc.exists) {
                throw new Error('Template not found');
            }
            const templateData = templateDoc.data();
            const filePath = templateData.filePath;
            if (!filePath) {
                throw new Error('Template has no file');
            }
            // TODO: Extract text from file
            throw new Error('Automatic content extraction not yet implemented. Please provide templateContent.');
        }
        // Call AI service
        const suggestions = await aiPlaceholderService_1.aiPlaceholderService.suggestPlaceholders(content, 'docx', []);
        return {
            success: true,
            suggestions: {
                fields: suggestions.fields,
                confidence_score: suggestions.confidence_score,
                reasoning: suggestions.reasoning,
                warnings: suggestions.warnings
            }
        };
    }
    catch (error) {
        console.error('Error suggesting placeholders:', error);
        return {
            success: false,
            error: error.message
        };
    }
}
/**
 * Save template draft (new version)
 */
async function saveTemplateDraft(data, context) {
    try {
        const { templateId, placeholders, userId, userName, reason, expectedETag } = data;
        // Save new version
        const result = await (0, templateVersionManager_1.saveVersion)(templateId, placeholders, userId, reason, expectedETag);
        // Log audit event
        await (0, auditLogger_1.logTemplateUpdate)(templateId, userId, userName, null, // old data
        { currentVersion: result.version }, reason);
        return {
            success: true,
            version: result.version,
            etag: result.etag,
            diff: result.diff
        };
    }
    catch (error) {
        console.error('Error saving template draft:', error);
        return {
            success: false,
            error: error.message
        };
    }
}
/**
 * Approve template version
 */
async function approveTemplateVersion(data, context) {
    try {
        const { templateId, version, userId, userName, reason } = data;
        // Approve version
        await (0, templateVersionManager_1.approveVersion)(templateId, version, userId, reason);
        // Log audit event
        await (0, auditLogger_1.logVersionApproval)(templateId, version, userId, userName, reason);
        return {
            success: true,
            version,
            message: `Version ${version} approved`
        };
    }
    catch (error) {
        console.error('Error approving version:', error);
        return {
            success: false,
            error: error.message
        };
    }
}
/**
 * Rollback template to previous version
 */
async function rollbackTemplate(data, context) {
    var _a;
    try {
        const { templateId, targetVersion, userId, userName, reason } = data;
        // Get current version before rollback
        const templateDoc = await db.collection('templates').doc(templateId).get();
        const currentVersion = ((_a = templateDoc.data()) === null || _a === void 0 ? void 0 : _a.currentVersion) || 0;
        // Rollback
        const result = await (0, templateVersionManager_1.rollbackToVersion)(templateId, targetVersion, userId, reason);
        // Log audit event
        await (0, auditLogger_1.logVersionRollback)(templateId, currentVersion, targetVersion, userId, userName, reason);
        return {
            success: true,
            newVersion: result.newVersion,
            etag: result.etag,
            message: `Rolled back to version ${targetVersion}, created new version ${result.newVersion}`
        };
    }
    catch (error) {
        console.error('Error rolling back template:', error);
        return {
            success: false,
            error: error.message
        };
    }
}
/**
 * Acquire editor lock
 */
async function acquireTemplateLock(data, context) {
    try {
        const { templateId, userId } = data;
        const result = await (0, templateVersionManager_1.acquireLock)(templateId, userId);
        return {
            success: result.acquired,
            acquired: result.acquired,
            expiresAt: result.expiresAt,
            currentHolder: result.currentHolder,
            message: result.acquired ?
                'Lock acquired' :
                `Lock held by ${result.currentHolder} until ${result.expiresAt}`
        };
    }
    catch (error) {
        console.error('Error acquiring lock:', error);
        return {
            success: false,
            error: error.message
        };
    }
}
/**
 * Release editor lock
 */
async function releaseTemplateLock(data, context) {
    try {
        const { templateId, userId } = data;
        const result = await (0, templateVersionManager_1.releaseLock)(templateId, userId);
        return {
            success: result.released,
            released: result.released,
            message: result.released ? 'Lock released' : 'Lock not held by this user'
        };
    }
    catch (error) {
        console.error('Error releasing lock:', error);
        return {
            success: false,
            error: error.message
        };
    }
}
/**
 * Refresh editor lock (extend TTL)
 */
async function refreshTemplateLock(data, context) {
    try {
        const { templateId, userId } = data;
        const result = await (0, templateVersionManager_1.refreshLock)(templateId, userId);
        return {
            success: result.refreshed,
            refreshed: result.refreshed,
            expiresAt: result.expiresAt,
            message: result.refreshed ?
                `Lock refreshed until ${result.expiresAt}` :
                'Lock not held by this user or expired'
        };
    }
    catch (error) {
        console.error('Error refreshing lock:', error);
        return {
            success: false,
            error: error.message
        };
    }
}
/**
 * Get version history
 */
async function getTemplateVersionHistory(data, context) {
    try {
        const { templateId, limit = 10 } = data;
        const versions = await (0, templateVersionManager_1.getVersionHistory)(templateId, limit);
        return {
            success: true,
            versions: versions.map(v => ({
                version: v.version,
                status: v.status,
                diff: v.diff,
                createdAt: v.createdAt,
                createdBy: v.createdBy,
                approvedAt: v.approvedAt,
                approvedBy: v.approvedBy,
                reason: v.reason,
                isRollback: v.isRollback,
                rolledBackFrom: v.rolledBackFrom,
                rolledBackTo: v.rolledBackTo,
                placeholderCount: v.placeholders.length
            })),
            count: versions.length
        };
    }
    catch (error) {
        console.error('Error getting version history:', error);
        return {
            success: false,
            error: error.message
        };
    }
}
/**
 * Get audit trail for template
 */
async function getTemplateAuditTrail(data, context) {
    try {
        const { templateId, limit = 50 } = data;
        const events = await (0, auditLogger_1.getAuditTrailByResource)(templateId, limit);
        return {
            success: true,
            events: events.map(e => ({
                id: e.id,
                eventType: e.eventType,
                actor: e.actor,
                timestamp: e.timestamp,
                diff: e.diff,
                reason: e.reason,
                metadata: e.metadata
            })),
            count: events.length
        };
    }
    catch (error) {
        console.error('Error getting audit trail:', error);
        return {
            success: false,
            error: error.message
        };
    }
}
/**
 * Validate placeholder schema
 */
async function validatePlaceholders(data, context) {
    try {
        const { placeholders, templateContent } = data;
        let validation;
        if (templateContent) {
            // Validate with content (checks orphans and unused)
            validation = placeholderValidator_1.placeholderValidator.validateWithContent(templateContent, placeholders);
        }
        else {
            // Validate schema only
            validation = placeholderValidator_1.placeholderValidator.validateSchema(placeholders);
        }
        return {
            success: validation.valid,
            valid: validation.valid,
            errors: validation.errors,
            warnings: validation.warnings
        };
    }
    catch (error) {
        console.error('Error validating placeholders:', error);
        return {
            success: false,
            error: error.message
        };
    }
}
/**
 * Check if user has lock
 */
async function checkTemplateLock(data, context) {
    var _a;
    try {
        const { templateId, userId } = data;
        const hasUserLock = await (0, templateVersionManager_1.hasLock)(templateId, userId);
        // Get lock info
        const templateDoc = await db.collection('templates').doc(templateId).get();
        const lock = (_a = templateDoc.data()) === null || _a === void 0 ? void 0 : _a.editorLock;
        if (lock) {
            const isExpired = lock.expiresAt.toDate() < new Date();
            return {
                success: true,
                hasLock: hasUserLock,
                isLocked: !isExpired,
                lockedBy: lock.userId,
                expiresAt: lock.expiresAt.toDate(),
                isExpired
            };
        }
        return {
            success: true,
            hasLock: false,
            isLocked: false
        };
    }
    catch (error) {
        console.error('Error checking lock:', error);
        return {
            success: false,
            error: error.message
        };
    }
}
//# sourceMappingURL=templateEditorAPI.js.map