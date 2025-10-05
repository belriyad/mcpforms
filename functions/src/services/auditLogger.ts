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

import * as admin from 'firebase-admin';
import { AuditEvent } from '../types/versioning';

const db = admin.firestore();
const AUDIT_COLLECTION = 'audit_logs';

/**
 * Log an audit event
 */
export async function logEvent(
  eventType: AuditEvent['eventType'],
  resourceId: string,
  actor: {
    userId: string;
    userName: string;
    email?: string;
  },
  options?: {
    tenantId?: string;
    diff?: any;
    reason?: string;
    metadata?: Record<string, any>;
  }
): Promise<string> {
  try {
    const eventId = db.collection(AUDIT_COLLECTION).doc().id;
    
    const event: AuditEvent = {
      id: eventId,
      tenantId: options?.tenantId || 'default',
      eventType,
      resourceId,
      actor,
      timestamp: admin.firestore.Timestamp.now() as any,
      diff: options?.diff,
      reason: options?.reason,
      metadata: options?.metadata
    };
    
    await db.collection(AUDIT_COLLECTION).doc(eventId).set(event);
    
    console.log(`Audit event logged: ${eventType} for ${resourceId} by ${actor.userId}`);
    
    return eventId;
    
  } catch (error: any) {
    console.error('Error logging audit event:', error);
    // Don't throw - audit logging failures shouldn't break operations
    return '';
  }
}

/**
 * Log template update event
 */
export async function logTemplateUpdate(
  templateId: string,
  userId: string,
  userName: string,
  oldData: any,
  newData: any,
  reason?: string,
  tenantId?: string
): Promise<string> {
  const diff = calculateDiff(oldData, newData);
  
  return logEvent(
    'template.updated',
    templateId,
    { userId, userName },
    {
      tenantId,
      diff,
      reason,
      metadata: {
        oldVersion: oldData?.currentVersion,
        newVersion: newData?.currentVersion
      }
    }
  );
}

/**
 * Log version approval event
 */
export async function logVersionApproval(
  templateId: string,
  version: number,
  userId: string,
  userName: string,
  reason?: string,
  tenantId?: string
): Promise<string> {
  return logEvent(
    'template.version.approved',
    templateId,
    { userId, userName },
    {
      tenantId,
      reason,
      metadata: {
        version,
        approvedAt: new Date().toISOString()
      }
    }
  );
}

/**
 * Log version rollback event
 */
export async function logVersionRollback(
  templateId: string,
  fromVersion: number,
  toVersion: number,
  userId: string,
  userName: string,
  reason: string,
  tenantId?: string
): Promise<string> {
  return logEvent(
    'template.version.rolled_back',
    templateId,
    { userId, userName },
    {
      tenantId,
      reason,
      metadata: {
        fromVersion,
        toVersion,
        rolledBackAt: new Date().toISOString()
      }
    }
  );
}

/**
 * Log override creation event
 */
export async function logOverrideCreated(
  intakeId: string,
  overrideId: string,
  customerId: string,
  userId: string,
  userName: string,
  sections: number,
  newPlaceholders: number,
  collisions: string[],
  reason?: string,
  tenantId?: string
): Promise<string> {
  return logEvent(
    'intake.override.created',
    intakeId,
    { userId, userName },
    {
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
    }
  );
}

/**
 * Log override acceptance event
 */
export async function logOverrideAccepted(
  intakeId: string,
  overrideId: string,
  userId: string,
  userName: string,
  reviewNotes?: string,
  tenantId?: string
): Promise<string> {
  return logEvent(
    'intake.override.accepted',
    intakeId,
    { userId, userName },
    {
      tenantId,
      reason: reviewNotes,
      metadata: {
        overrideId,
        acceptedAt: new Date().toISOString()
      }
    }
  );
}

/**
 * Log override rejection event
 */
export async function logOverrideRejected(
  intakeId: string,
  overrideId: string,
  userId: string,
  userName: string,
  reviewNotes?: string,
  tenantId?: string
): Promise<string> {
  return logEvent(
    'intake.override.rejected',
    intakeId,
    { userId, userName },
    {
      tenantId,
      reason: reviewNotes,
      metadata: {
        overrideId,
        rejectedAt: new Date().toISOString()
      }
    }
  );
}

/**
 * Log placeholder addition event
 */
export async function logPlaceholderAdded(
  templateId: string,
  placeholderKey: string,
  placeholderData: any,
  userId: string,
  userName: string,
  tenantId?: string
): Promise<string> {
  return logEvent(
    'placeholder.added',
    templateId,
    { userId, userName },
    {
      tenantId,
      metadata: {
        placeholderKey,
        placeholderType: placeholderData.type,
        placeholderLabel: placeholderData.label
      }
    }
  );
}

/**
 * Log placeholder removal event
 */
export async function logPlaceholderRemoved(
  templateId: string,
  placeholderKey: string,
  userId: string,
  userName: string,
  reason?: string,
  tenantId?: string
): Promise<string> {
  return logEvent(
    'placeholder.removed',
    templateId,
    { userId, userName },
    {
      tenantId,
      reason,
      metadata: {
        placeholderKey
      }
    }
  );
}

/**
 * Log placeholder rename event
 */
export async function logPlaceholderRenamed(
  templateId: string,
  oldKey: string,
  newKey: string,
  userId: string,
  userName: string,
  reason?: string,
  tenantId?: string
): Promise<string> {
  return logEvent(
    'placeholder.renamed',
    templateId,
    { userId, userName },
    {
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
    }
  );
}

/**
 * Query audit trail by resource
 */
export async function getAuditTrailByResource(
  resourceId: string,
  limit: number = 50
): Promise<AuditEvent[]> {
  try {
    const snapshot = await db
      .collection(AUDIT_COLLECTION)
      .where('resourceId', '==', resourceId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => doc.data() as AuditEvent);
    
  } catch (error: any) {
    console.error('Error querying audit trail:', error);
    throw error;
  }
}

/**
 * Query audit trail by event type
 */
export async function getAuditTrailByEventType(
  eventType: AuditEvent['eventType'],
  limit: number = 50
): Promise<AuditEvent[]> {
  try {
    const snapshot = await db
      .collection(AUDIT_COLLECTION)
      .where('eventType', '==', eventType)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => doc.data() as AuditEvent);
    
  } catch (error: any) {
    console.error('Error querying audit trail by event type:', error);
    throw error;
  }
}

/**
 * Query audit trail by tenant
 */
export async function getAuditTrailByTenant(
  tenantId: string,
  limit: number = 100
): Promise<AuditEvent[]> {
  try {
    const snapshot = await db
      .collection(AUDIT_COLLECTION)
      .where('tenantId', '==', tenantId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => doc.data() as AuditEvent);
    
  } catch (error: any) {
    console.error('Error querying audit trail by tenant:', error);
    throw error;
  }
}

/**
 * Query audit trail by time range
 */
export async function getAuditTrailByTimeRange(
  startTime: Date,
  endTime: Date,
  resourceId?: string,
  limit: number = 100
): Promise<AuditEvent[]> {
  try {
    let query = db
      .collection(AUDIT_COLLECTION)
      .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(startTime))
      .where('timestamp', '<=', admin.firestore.Timestamp.fromDate(endTime)) as any;
    
    if (resourceId) {
      query = query.where('resourceId', '==', resourceId);
    }
    
    const snapshot = await query
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map((doc: any) => doc.data() as AuditEvent);
    
  } catch (error: any) {
    console.error('Error querying audit trail by time range:', error);
    throw error;
  }
}

/**
 * Query audit trail by actor (user)
 */
export async function getAuditTrailByActor(
  userId: string,
  limit: number = 50
): Promise<AuditEvent[]> {
  try {
    const snapshot = await db
      .collection(AUDIT_COLLECTION)
      .where('actor.userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => doc.data() as AuditEvent);
    
  } catch (error: any) {
    console.error('Error querying audit trail by actor:', error);
    throw error;
  }
}

/**
 * Get recent audit events across all resources
 */
export async function getRecentAuditEvents(
  limit: number = 50,
  tenantId?: string
): Promise<AuditEvent[]> {
  try {
    let query = db.collection(AUDIT_COLLECTION) as any;
    
    if (tenantId) {
      query = query.where('tenantId', '==', tenantId);
    }
    
    const snapshot = await query
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map((doc: any) => doc.data() as AuditEvent);
    
  } catch (error: any) {
    console.error('Error getting recent audit events:', error);
    throw error;
  }
}

/**
 * Get audit statistics for a resource
 */
export async function getAuditStatistics(
  resourceId: string
): Promise<{
  totalEvents: number;
  eventsByType: Record<string, number>;
  uniqueActors: number;
  firstEvent?: Date;
  lastEvent?: Date;
}> {
  try {
    const events = await getAuditTrailByResource(resourceId, 1000);
    
    const eventsByType: Record<string, number> = {};
    const actors = new Set<string>();
    let firstEvent: Date | undefined;
    let lastEvent: Date | undefined;
    
    events.forEach(event => {
      // Count by type
      eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;
      
      // Track unique actors
      actors.add(event.actor.userId);
      
      // Track first and last
      const eventTime = (event.timestamp as any).toDate();
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
    
  } catch (error: any) {
    console.error('Error getting audit statistics:', error);
    throw error;
  }
}

/**
 * Search audit trail with filters
 */
export async function searchAuditTrail(
  filters: {
    resourceId?: string;
    eventType?: AuditEvent['eventType'];
    userId?: string;
    tenantId?: string;
    startTime?: Date;
    endTime?: Date;
  },
  limit: number = 50
): Promise<AuditEvent[]> {
  try {
    let query = db.collection(AUDIT_COLLECTION) as any;
    
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
    
    return snapshot.docs.map((doc: any) => doc.data() as AuditEvent);
    
  } catch (error: any) {
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
      let events = snapshot.docs.map((doc: any) => doc.data() as AuditEvent);
      
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
        events = events.filter(e => (e.timestamp as any).toDate() >= filters.startTime!);
      }
      if (filters.endTime) {
        events = events.filter(e => (e.timestamp as any).toDate() <= filters.endTime!);
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
function calculateDiff(oldData: any, newData: any): any {
  if (!oldData || !newData) {
    return { old: oldData, new: newData };
  }
  
  const diff: any = {
    changed: {},
    added: {},
    removed: {}
  };
  
  // Check for changes and additions
  for (const key in newData) {
    if (!(key in oldData)) {
      diff.added[key] = newData[key];
    } else if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
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
export async function deleteAuditLogsOlderThan(
  cutoffDate: Date,
  dryRun: boolean = true
): Promise<{ deletedCount: number; dryRun: boolean }> {
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
    
  } catch (error: any) {
    console.error('Error deleting old audit logs:', error);
    throw error;
  }
}

/**
 * Export audit trail to JSON (for compliance/backup)
 */
export async function exportAuditTrail(
  filters: {
    resourceId?: string;
    startTime?: Date;
    endTime?: Date;
    tenantId?: string;
  }
): Promise<AuditEvent[]> {
  try {
    const events = await searchAuditTrail(filters, 10000); // Large limit for export
    
    console.log(`Exported ${events.length} audit events`);
    
    return events;
    
  } catch (error: any) {
    console.error('Error exporting audit trail:', error);
    throw error;
  }
}
