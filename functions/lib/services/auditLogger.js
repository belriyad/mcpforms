"use strict";
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
exports.logEvent = logEvent;
exports.logTemplateUpdate = logTemplateUpdate;
exports.logVersionApproval = logVersionApproval;
exports.logVersionRollback = logVersionRollback;
exports.logOverrideCreated = logOverrideCreated;
exports.logOverrideAccepted = logOverrideAccepted;
exports.logOverrideRejected = logOverrideRejected;
exports.logPlaceholderAdded = logPlaceholderAdded;
exports.logPlaceholderRemoved = logPlaceholderRemoved;
exports.logPlaceholderRenamed = logPlaceholderRenamed;
exports.getAuditTrailByResource = getAuditTrailByResource;
exports.getAuditTrailByEventType = getAuditTrailByEventType;
exports.getAuditTrailByTenant = getAuditTrailByTenant;
exports.getAuditTrailByTimeRange = getAuditTrailByTimeRange;
exports.getAuditTrailByActor = getAuditTrailByActor;
exports.getRecentAuditEvents = getRecentAuditEvents;
exports.getAuditStatistics = getAuditStatistics;
exports.searchAuditTrail = searchAuditTrail;
exports.deleteAuditLogsOlderThan = deleteAuditLogsOlderThan;
exports.exportAuditTrail = exportAuditTrail;
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
const AUDIT_COLLECTION = 'audit_logs';
/**
 * Log an audit event
 */
async function logEvent(eventType, resourceId, actor, options) {
    try {
        const eventId = db.collection(AUDIT_COLLECTION).doc().id;
        const event = {
            id: eventId,
            tenantId: (options === null || options === void 0 ? void 0 : options.tenantId) || 'default',
            eventType,
            resourceId,
            actor,
            timestamp: admin.firestore.Timestamp.now(),
            diff: options === null || options === void 0 ? void 0 : options.diff,
            reason: options === null || options === void 0 ? void 0 : options.reason,
            metadata: options === null || options === void 0 ? void 0 : options.metadata
        };
        await db.collection(AUDIT_COLLECTION).doc(eventId).set(event);
        console.log(`Audit event logged: ${eventType} for ${resourceId} by ${actor.userId}`);
        return eventId;
    }
    catch (error) {
        console.error('Error logging audit event:', error);
        // Don't throw - audit logging failures shouldn't break operations
        return '';
    }
}
/**
 * Log template update event
 */
async function logTemplateUpdate(templateId, userId, userName, oldData, newData, reason, tenantId) {
    const diff = calculateDiff(oldData, newData);
    return logEvent('template.updated', templateId, { userId, userName }, {
        tenantId,
        diff,
        reason,
        metadata: {
            oldVersion: oldData === null || oldData === void 0 ? void 0 : oldData.currentVersion,
            newVersion: newData === null || newData === void 0 ? void 0 : newData.currentVersion
        }
    });
}
/**
 * Log version approval event
 */
async function logVersionApproval(templateId, version, userId, userName, reason, tenantId) {
    return logEvent('template.version.approved', templateId, { userId, userName }, {
        tenantId,
        reason,
        metadata: {
            version,
            approvedAt: new Date().toISOString()
        }
    });
}
/**
 * Log version rollback event
 */
async function logVersionRollback(templateId, fromVersion, toVersion, userId, userName, reason, tenantId) {
    return logEvent('template.version.rolled_back', templateId, { userId, userName }, {
        tenantId,
        reason,
        metadata: {
            fromVersion,
            toVersion,
            rolledBackAt: new Date().toISOString()
        }
    });
}
/**
 * Log override creation event
 */
async function logOverrideCreated(intakeId, overrideId, customerId, userId, userName, sections, newPlaceholders, collisions, reason, tenantId) {
    return logEvent('intake.override.created', intakeId, { userId, userName }, {
        tenantId,
        reason,
        metadata: {
            overrideId,
            customerId,
            sectionsCount: sections,
            newPlaceholdersCount: newPlaceholders,
            collisions,
            hasCollisions: collisions.length > 0
        }
    });
}
/**
 * Log override acceptance event
 */
async function logOverrideAccepted(intakeId, overrideId, userId, userName, reviewNotes, tenantId) {
    return logEvent('intake.override.accepted', intakeId, { userId, userName }, {
        tenantId,
        reason: reviewNotes,
        metadata: {
            overrideId,
            acceptedAt: new Date().toISOString()
        }
    });
}
/**
 * Log override rejection event
 */
async function logOverrideRejected(intakeId, overrideId, userId, userName, reviewNotes, tenantId) {
    return logEvent('intake.override.rejected', intakeId, { userId, userName }, {
        tenantId,
        reason: reviewNotes,
        metadata: {
            overrideId,
            rejectedAt: new Date().toISOString()
        }
    });
}
/**
 * Log placeholder addition event
 */
async function logPlaceholderAdded(templateId, placeholderKey, placeholderData, userId, userName, tenantId) {
    return logEvent('placeholder.added', templateId, { userId, userName }, {
        tenantId,
        metadata: {
            placeholderKey,
            placeholderType: placeholderData.type,
            placeholderLabel: placeholderData.label
        }
    });
}
/**
 * Log placeholder removal event
 */
async function logPlaceholderRemoved(templateId, placeholderKey, userId, userName, reason, tenantId) {
    return logEvent('placeholder.removed', templateId, { userId, userName }, {
        tenantId,
        reason,
        metadata: {
            placeholderKey
        }
    });
}
/**
 * Log placeholder rename event
 */
async function logPlaceholderRenamed(templateId, oldKey, newKey, userId, userName, reason, tenantId) {
    return logEvent('placeholder.renamed', templateId, { userId, userName }, {
        tenantId,
        reason,
        diff: {
            oldKey,
            newKey
        },
        metadata: {
            oldKey,
            newKey
        }
    });
}
/**
 * Query audit trail by resource
 */
async function getAuditTrailByResource(resourceId, limit = 50) {
    try {
        const snapshot = await db
            .collection(AUDIT_COLLECTION)
            .where('resourceId', '==', resourceId)
            .orderBy('timestamp', 'desc')
            .limit(limit)
            .get();
        return snapshot.docs.map(doc => doc.data());
    }
    catch (error) {
        console.error('Error querying audit trail:', error);
        throw error;
    }
}
/**
 * Query audit trail by event type
 */
async function getAuditTrailByEventType(eventType, limit = 50) {
    try {
        const snapshot = await db
            .collection(AUDIT_COLLECTION)
            .where('eventType', '==', eventType)
            .orderBy('timestamp', 'desc')
            .limit(limit)
            .get();
        return snapshot.docs.map(doc => doc.data());
    }
    catch (error) {
        console.error('Error querying audit trail by event type:', error);
        throw error;
    }
}
/**
 * Query audit trail by tenant
 */
async function getAuditTrailByTenant(tenantId, limit = 100) {
    try {
        const snapshot = await db
            .collection(AUDIT_COLLECTION)
            .where('tenantId', '==', tenantId)
            .orderBy('timestamp', 'desc')
            .limit(limit)
            .get();
        return snapshot.docs.map(doc => doc.data());
    }
    catch (error) {
        console.error('Error querying audit trail by tenant:', error);
        throw error;
    }
}
/**
 * Query audit trail by time range
 */
async function getAuditTrailByTimeRange(startTime, endTime, resourceId, limit = 100) {
    try {
        let query = db
            .collection(AUDIT_COLLECTION)
            .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(startTime))
            .where('timestamp', '<=', admin.firestore.Timestamp.fromDate(endTime));
        if (resourceId) {
            query = query.where('resourceId', '==', resourceId);
        }
        const snapshot = await query
            .orderBy('timestamp', 'desc')
            .limit(limit)
            .get();
        return snapshot.docs.map((doc) => doc.data());
    }
    catch (error) {
        console.error('Error querying audit trail by time range:', error);
        throw error;
    }
}
/**
 * Query audit trail by actor (user)
 */
async function getAuditTrailByActor(userId, limit = 50) {
    try {
        const snapshot = await db
            .collection(AUDIT_COLLECTION)
            .where('actor.userId', '==', userId)
            .orderBy('timestamp', 'desc')
            .limit(limit)
            .get();
        return snapshot.docs.map(doc => doc.data());
    }
    catch (error) {
        console.error('Error querying audit trail by actor:', error);
        throw error;
    }
}
/**
 * Get recent audit events across all resources
 */
async function getRecentAuditEvents(limit = 50, tenantId) {
    try {
        let query = db.collection(AUDIT_COLLECTION);
        if (tenantId) {
            query = query.where('tenantId', '==', tenantId);
        }
        const snapshot = await query
            .orderBy('timestamp', 'desc')
            .limit(limit)
            .get();
        return snapshot.docs.map((doc) => doc.data());
    }
    catch (error) {
        console.error('Error getting recent audit events:', error);
        throw error;
    }
}
/**
 * Get audit statistics for a resource
 */
async function getAuditStatistics(resourceId) {
    try {
        const events = await getAuditTrailByResource(resourceId, 1000);
        const eventsByType = {};
        const actors = new Set();
        let firstEvent;
        let lastEvent;
        events.forEach(event => {
            // Count by type
            eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;
            // Track unique actors
            actors.add(event.actor.userId);
            // Track first and last
            const eventTime = event.timestamp.toDate();
            if (!firstEvent || eventTime < firstEvent) {
                firstEvent = eventTime;
            }
            if (!lastEvent || eventTime > lastEvent) {
                lastEvent = eventTime;
            }
        });
        return {
            totalEvents: events.length,
            eventsByType,
            uniqueActors: actors.size,
            firstEvent,
            lastEvent
        };
    }
    catch (error) {
        console.error('Error getting audit statistics:', error);
        throw error;
    }
}
/**
 * Search audit trail with filters
 */
async function searchAuditTrail(filters, limit = 50) {
    try {
        let query = db.collection(AUDIT_COLLECTION);
        // Apply filters
        if (filters.resourceId) {
            query = query.where('resourceId', '==', filters.resourceId);
        }
        if (filters.eventType) {
            query = query.where('eventType', '==', filters.eventType);
        }
        if (filters.userId) {
            query = query.where('actor.userId', '==', filters.userId);
        }
        if (filters.tenantId) {
            query = query.where('tenantId', '==', filters.tenantId);
        }
        if (filters.startTime) {
            query = query.where('timestamp', '>=', admin.firestore.Timestamp.fromDate(filters.startTime));
        }
        if (filters.endTime) {
            query = query.where('timestamp', '<=', admin.firestore.Timestamp.fromDate(filters.endTime));
        }
        const snapshot = await query
            .orderBy('timestamp', 'desc')
            .limit(limit)
            .get();
        return snapshot.docs.map((doc) => doc.data());
    }
    catch (error) {
        console.error('Error searching audit trail:', error);
        // If query fails due to missing index, try a simpler query
        if (error.code === 'failed-precondition' || error.code === 9) {
            console.log('Falling back to simple query without compound filters');
            const snapshot = await db
                .collection(AUDIT_COLLECTION)
                .orderBy('timestamp', 'desc')
                .limit(limit)
                .get();
            // Filter in memory
            let events = snapshot.docs.map((doc) => doc.data());
            if (filters.resourceId) {
                events = events.filter(e => e.resourceId === filters.resourceId);
            }
            if (filters.eventType) {
                events = events.filter(e => e.eventType === filters.eventType);
            }
            if (filters.userId) {
                events = events.filter(e => e.actor.userId === filters.userId);
            }
            if (filters.tenantId) {
                events = events.filter(e => e.tenantId === filters.tenantId);
            }
            if (filters.startTime) {
                events = events.filter(e => e.timestamp.toDate() >= filters.startTime);
            }
            if (filters.endTime) {
                events = events.filter(e => e.timestamp.toDate() <= filters.endTime);
            }
            return events.slice(0, limit);
        }
        throw error;
    }
}
/**
 * Calculate diff between two objects
 * Returns changes in a structured format
 */
function calculateDiff(oldData, newData) {
    if (!oldData || !newData) {
        return { old: oldData, new: newData };
    }
    const diff = {
        changed: {},
        added: {},
        removed: {}
    };
    // Check for changes and additions
    for (const key in newData) {
        if (!(key in oldData)) {
            diff.added[key] = newData[key];
        }
        else if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
            diff.changed[key] = {
                old: oldData[key],
                new: newData[key]
            };
        }
    }
    // Check for removals
    for (const key in oldData) {
        if (!(key in newData)) {
            diff.removed[key] = oldData[key];
        }
    }
    return diff;
}
/**
 * Delete old audit logs (for data retention policies)
 * BE CAREFUL: This permanently deletes audit data
 */
async function deleteAuditLogsOlderThan(cutoffDate, dryRun = true) {
    try {
        const snapshot = await db
            .collection(AUDIT_COLLECTION)
            .where('timestamp', '<', admin.firestore.Timestamp.fromDate(cutoffDate))
            .get();
        if (dryRun) {
            console.log(`DRY RUN: Would delete ${snapshot.size} audit logs older than ${cutoffDate.toISOString()}`);
            return { deletedCount: snapshot.size, dryRun: true };
        }
        // Delete in batches
        const batchSize = 500;
        let deletedCount = 0;
        for (let i = 0; i < snapshot.docs.length; i += batchSize) {
            const batch = db.batch();
            const batchDocs = snapshot.docs.slice(i, i + batchSize);
            batchDocs.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            deletedCount += batchDocs.length;
            console.log(`Deleted ${deletedCount} of ${snapshot.size} audit logs`);
        }
        console.log(`Deleted ${deletedCount} audit logs older than ${cutoffDate.toISOString()}`);
        return { deletedCount, dryRun: false };
    }
    catch (error) {
        console.error('Error deleting old audit logs:', error);
        throw error;
    }
}
/**
 * Export audit trail to JSON (for compliance/backup)
 */
async function exportAuditTrail(filters) {
    try {
        const events = await searchAuditTrail(filters, 10000); // Large limit for export
        console.log(`Exported ${events.length} audit events`);
        return events;
    }
    catch (error) {
        console.error('Error exporting audit trail:', error);
        throw error;
    }
}
//# sourceMappingURL=auditLogger.js.map