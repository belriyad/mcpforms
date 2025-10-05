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

import * as admin from 'firebase-admin';
import {
  saveVersion,
  approveVersion,
  rollbackToVersion,
  acquireLock,
  releaseLock,
  refreshLock,
  getVersionHistory,
  getVersion,
  getLatestApprovedVersion,
  hasLock
} from './templateVersionManager';
import { placeholderValidator } from './placeholderValidator';
import { aiPlaceholderService } from './aiPlaceholderService';
import {
  logTemplateUpdate,
  logVersionApproval,
  logVersionRollback,
  getAuditTrailByResource
} from './auditLogger';
import { PlaceholderField } from '../types/versioning';

const db = admin.firestore();

/**
 * List all templates for a tenant
 */
export async function listTemplates(data: {
  tenantId: string;
  status?: 'active' | 'archived';
  limit?: number;
}, context: any) {
  try {
    // TODO: Add authentication check
    // if (!context.auth) {
    //   throw new Error('Unauthorized');
    // }

    const { tenantId, status, limit = 50 } = data;

    let query = db.collection('templates')
      .where('tenantId', '==', tenantId) as any;

    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query
      .orderBy('updatedAt', 'desc')
      .limit(limit)
      .get();

    const templates = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      hasLock: doc.data().editorLock ? true : false,
      lockExpired: doc.data().editorLock ? 
        doc.data().editorLock.expiresAt.toDate() < new Date() : 
        true
    }));

    return {
      success: true,
      templates,
      count: templates.length
    };

  } catch (error: any) {
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
export async function getTemplateWithPlaceholders(data: {
  templateId: string;
  version?: number;
}, context: any) {
  try {
    const { templateId, version } = data;

    // Get template
    const templateDoc = await db.collection('templates').doc(templateId).get();

    if (!templateDoc.exists) {
      throw new Error('Template not found');
    }

    const templateData = templateDoc.data();

    // Get placeholders from version
    let placeholders: PlaceholderField[] = [];
    let versionData = null;

    if (version) {
      versionData = await getVersion(templateId, version);
      if (versionData) {
        placeholders = versionData.placeholders;
      }
    } else {
      // Get latest version
      const currentVersion = (templateData as any).currentVersion || 0;
      if (currentVersion > 0) {
        versionData = await getVersion(templateId, currentVersion);
        if (versionData) {
          placeholders = versionData.placeholders;
        }
      }
    }

    // Check lock status
    const lock = (templateData as any).editorLock;
    const lockStatus = lock ? {
      isLocked: lock.expiresAt.toDate() > new Date(),
      lockedBy: lock.userId,
      expiresAt: lock.expiresAt.toDate()
    } : {
      isLocked: false
    };

    return {
      success: true,
      template: {
        id: templateId,
        ...templateData,
        placeholders,
        versionInfo: versionData ? {
          version: versionData.version,
          status: versionData.status,
          createdAt: versionData.createdAt,
          createdBy: versionData.createdBy,
          approvedAt: versionData.approvedAt,
          approvedBy: versionData.approvedBy
        } : null,
        lockStatus
      }
    };

  } catch (error: any) {
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
export async function suggestPlaceholdersAI(data: {
  templateId: string;
  templateContent?: string;
}, context: any) {
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
      const filePath = (templateData as any).filePath;

      if (!filePath) {
        throw new Error('Template has no file');
      }

      // TODO: Extract text from file
      throw new Error('Automatic content extraction not yet implemented. Please provide templateContent.');
    }

    // Call AI service
    const suggestions = await aiPlaceholderService.suggestPlaceholders(content, 'docx', []);

    return {
      success: true,
      suggestions: {
        fields: suggestions.fields,
        confidence_score: suggestions.confidence_score,
        reasoning: suggestions.reasoning,
        warnings: suggestions.warnings
      }
    };

  } catch (error: any) {
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
export async function saveTemplateDraft(data: {
  templateId: string;
  placeholders: PlaceholderField[];
  userId: string;
  userName: string;
  reason?: string;
  expectedETag?: string;
}, context: any) {
  try {
    const { templateId, placeholders, userId, userName, reason, expectedETag } = data;

    // Save new version
    const result = await saveVersion(
      templateId,
      placeholders,
      userId,
      reason,
      expectedETag
    );

    // Log audit event
    await logTemplateUpdate(
      templateId,
      userId,
      userName,
      null, // old data
      { currentVersion: result.version },
      reason
    );

    return {
      success: true,
      version: result.version,
      etag: result.etag,
      diff: result.diff
    };

  } catch (error: any) {
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
export async function approveTemplateVersion(data: {
  templateId: string;
  version: number;
  userId: string;
  userName: string;
  reason?: string;
}, context: any) {
  try {
    const { templateId, version, userId, userName, reason } = data;

    // Approve version
    await approveVersion(templateId, version, userId, reason);

    // Log audit event
    await logVersionApproval(
      templateId,
      version,
      userId,
      userName,
      reason
    );

    return {
      success: true,
      version,
      message: `Version ${version} approved`
    };

  } catch (error: any) {
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
export async function rollbackTemplate(data: {
  templateId: string;
  targetVersion: number;
  userId: string;
  userName: string;
  reason: string;
}, context: any) {
  try {
    const { templateId, targetVersion, userId, userName, reason } = data;

    // Get current version before rollback
    const templateDoc = await db.collection('templates').doc(templateId).get();
    const currentVersion = (templateDoc.data() as any)?.currentVersion || 0;

    // Rollback
    const result = await rollbackToVersion(
      templateId,
      targetVersion,
      userId,
      reason
    );

    // Log audit event
    await logVersionRollback(
      templateId,
      currentVersion,
      targetVersion,
      userId,
      userName,
      reason
    );

    return {
      success: true,
      newVersion: result.newVersion,
      etag: result.etag,
      message: `Rolled back to version ${targetVersion}, created new version ${result.newVersion}`
    };

  } catch (error: any) {
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
export async function acquireTemplateLock(data: {
  templateId: string;
  userId: string;
}, context: any) {
  try {
    const { templateId, userId } = data;

    const result = await acquireLock(templateId, userId);

    return {
      success: result.acquired,
      acquired: result.acquired,
      expiresAt: result.expiresAt,
      currentHolder: result.currentHolder,
      message: result.acquired ? 
        'Lock acquired' : 
        `Lock held by ${result.currentHolder} until ${result.expiresAt}`
    };

  } catch (error: any) {
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
export async function releaseTemplateLock(data: {
  templateId: string;
  userId: string;
}, context: any) {
  try {
    const { templateId, userId } = data;

    const result = await releaseLock(templateId, userId);

    return {
      success: result.released,
      released: result.released,
      message: result.released ? 'Lock released' : 'Lock not held by this user'
    };

  } catch (error: any) {
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
export async function refreshTemplateLock(data: {
  templateId: string;
  userId: string;
}, context: any) {
  try {
    const { templateId, userId } = data;

    const result = await refreshLock(templateId, userId);

    return {
      success: result.refreshed,
      refreshed: result.refreshed,
      expiresAt: result.expiresAt,
      message: result.refreshed ? 
        `Lock refreshed until ${result.expiresAt}` : 
        'Lock not held by this user or expired'
    };

  } catch (error: any) {
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
export async function getTemplateVersionHistory(data: {
  templateId: string;
  limit?: number;
}, context: any) {
  try {
    const { templateId, limit = 10 } = data;

    const versions = await getVersionHistory(templateId, limit);

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

  } catch (error: any) {
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
export async function getTemplateAuditTrail(data: {
  templateId: string;
  limit?: number;
}, context: any) {
  try {
    const { templateId, limit = 50 } = data;

    const events = await getAuditTrailByResource(templateId, limit);

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

  } catch (error: any) {
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
export async function validatePlaceholders(data: {
  placeholders: PlaceholderField[];
  templateContent?: string;
}, context: any) {
  try {
    const { placeholders, templateContent } = data;

    let validation;

    if (templateContent) {
      // Validate with content (checks orphans and unused)
      validation = placeholderValidator.validateWithContent(templateContent, placeholders);
    } else {
      // Validate schema only
      validation = placeholderValidator.validateSchema(placeholders);
    }

    return {
      success: validation.valid,
      valid: validation.valid,
      errors: validation.errors,
      warnings: validation.warnings
    };

  } catch (error: any) {
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
export async function checkTemplateLock(data: {
  templateId: string;
  userId: string;
}, context: any) {
  try {
    const { templateId, userId } = data;

    const hasUserLock = await hasLock(templateId, userId);

    // Get lock info
    const templateDoc = await db.collection('templates').doc(templateId).get();
    const lock = (templateDoc.data() as any)?.editorLock;

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

  } catch (error: any) {
    console.error('Error checking lock:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
