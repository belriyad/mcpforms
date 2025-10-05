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

import * as admin from 'firebase-admin';
import { 
  TemplateVersion, 
  PlaceholderDiff, 
  PlaceholderField, 
  EditorLock,
  ValidationResult 
} from '../types/versioning';
import { Template } from '../types';
import { validateSchema } from './placeholderValidator';

const db = admin.firestore();

// Constants
const LOCK_TTL_MS = 5 * 60 * 1000; // 5 minutes
const VERSION_COLLECTION = 'versions';

/**
 * Generate a unique ETag for concurrency control
 */
function generateETag(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Calculate diff between two placeholder schemas
 */
export function calculateDiff(
  oldPlaceholders: PlaceholderField[],
  newPlaceholders: PlaceholderField[]
): PlaceholderDiff {
  const oldKeys = new Set(oldPlaceholders.map(p => p.field_key));
  const newKeys = new Set(newPlaceholders.map(p => p.field_key));
  
  // Find added placeholders
  const added = newPlaceholders.filter(p => !oldKeys.has(p.field_key));
  
  // Find removed placeholders
  const removed = oldPlaceholders.filter(p => !newKeys.has(p.field_key));
  
  // Find renamed placeholders (same location, different key)
  const renamed: Array<{ from: string; to: string; reason?: string }> = [];
  
  // Create location maps for comparison
  const oldLocationMap = new Map<string, PlaceholderField>();
  const newLocationMap = new Map<string, PlaceholderField>();
  
  oldPlaceholders.forEach(p => {
    const locKey = p.locations.sort().join('|');
    oldLocationMap.set(locKey, p);
  });
  
  newPlaceholders.forEach(p => {
    const locKey = p.locations.sort().join('|');
    newLocationMap.set(locKey, p);
  });
  
  // Check for renames (same location, different key)
  for (const [locKey, newField] of newLocationMap.entries()) {
    const oldField = oldLocationMap.get(locKey);
    if (oldField && oldField.field_key !== newField.field_key) {
      renamed.push({
        from: oldField.field_key,
        to: newField.field_key,
        reason: 'Same location, different key'
      });
    }
  }
  
  return { added, removed, renamed };
}

/**
 * Save a new template version
 */
export async function saveVersion(
  templateId: string,
  placeholders: PlaceholderField[],
  userId: string,
  reason?: string,
  expectedETag?: string
): Promise<{ version: number; etag: string; diff: PlaceholderDiff }> {
  // Validate placeholders first
  const validation = validateSchema(placeholders);
  if (validation.errors.length > 0) {
    throw new Error(`Placeholder validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
  }
  
  const templateRef = db.collection('templates').doc(templateId);
  const versionsRef = templateRef.collection(VERSION_COLLECTION);
  
  try {
    // Use transaction for atomic version increment and ETag check
    const result = await db.runTransaction(async (transaction) => {
      const templateDoc = await transaction.get(templateRef);
      
      if (!templateDoc.exists) {
        throw new Error(`Template ${templateId} not found`);
      }
      
      const templateData = templateDoc.data() as Template;
      
      // Check ETag if provided (optimistic locking)
      if (expectedETag && templateData.etag !== expectedETag) {
        throw new Error('Concurrent modification detected. Please refresh and try again.');
      }
      
      // Get current version number
      const currentVersion = templateData.currentVersion || 0;
      const newVersion = currentVersion + 1;
      
      // Get previous placeholders for diff calculation
      let oldPlaceholders: PlaceholderField[] = [];
      if (currentVersion > 0) {
        const prevVersionDoc = await transaction.get(
          versionsRef.doc(currentVersion.toString())
        );
        if (prevVersionDoc.exists) {
          oldPlaceholders = prevVersionDoc.data()?.placeholders || [];
        }
      }
      
      // Calculate diff
      const diff = calculateDiff(oldPlaceholders, placeholders);
      
      // Generate new ETag
      const newETag = generateETag();
      
      // Create version document
      const versionData: TemplateVersion = {
        version: newVersion,
        templateId,
        placeholders,
        diff,
        status: 'draft',
        createdBy: userId,
        createdAt: admin.firestore.Timestamp.now() as any,
        etag: newETag,
        reason
      };
      
      // Save version
      transaction.set(versionsRef.doc(newVersion.toString()), versionData);
      
      // Update template metadata
      transaction.update(templateRef, {
        currentVersion: newVersion,
        etag: newETag,
        updatedAt: admin.firestore.Timestamp.now(),
        updatedBy: userId
      });
      
      return { version: newVersion, etag: newETag, diff };
    });
    
    console.log(`Saved template ${templateId} version ${result.version}`);
    return result;
    
  } catch (error: any) {
    console.error(`Error saving template version:`, error);
    throw error;
  }
}

/**
 * Approve a template version for production use
 */
export async function approveVersion(
  templateId: string,
  version: number,
  userId: string,
  reason?: string
): Promise<void> {
  const templateRef = db.collection('templates').doc(templateId);
  const versionRef = templateRef.collection(VERSION_COLLECTION).doc(version.toString());
  
  try {
    await db.runTransaction(async (transaction) => {
      const versionDoc = await transaction.get(versionRef);
      
      if (!versionDoc.exists) {
        throw new Error(`Version ${version} not found for template ${templateId}`);
      }
      
      const versionData = versionDoc.data() as TemplateVersion;
      
      if (versionData.status === 'approved') {
        throw new Error(`Version ${version} is already approved`);
      }
      
      // Update version status
      transaction.update(versionRef, {
        status: 'approved',
        approvedBy: userId,
        approvedAt: admin.firestore.Timestamp.now(),
        approvalReason: reason
      });
      
      // Update template to track latest approved version
      transaction.update(templateRef, {
        latestApprovedVersion: version,
        updatedAt: admin.firestore.Timestamp.now(),
        updatedBy: userId
      });
    });
    
    console.log(`Approved template ${templateId} version ${version}`);
    
  } catch (error: any) {
    console.error(`Error approving version:`, error);
    throw error;
  }
}

/**
 * Rollback to a previous version
 */
export async function rollbackToVersion(
  templateId: string,
  targetVersion: number,
  userId: string,
  reason: string
): Promise<{ newVersion: number; etag: string }> {
  const templateRef = db.collection('templates').doc(templateId);
  const versionsRef = templateRef.collection(VERSION_COLLECTION);
  
  try {
    const result = await db.runTransaction(async (transaction) => {
      // Get target version
      const targetVersionDoc = await transaction.get(
        versionsRef.doc(targetVersion.toString())
      );
      
      if (!targetVersionDoc.exists) {
        throw new Error(`Target version ${targetVersion} not found`);
      }
      
      const targetVersionData = targetVersionDoc.data() as TemplateVersion;
      
      // Get current template
      const templateDoc = await transaction.get(templateRef);
      if (!templateDoc.exists) {
        throw new Error(`Template ${templateId} not found`);
      }
      
      const templateData = templateDoc.data() as Template;
      const currentVersion = templateData.currentVersion || 0;
      const newVersion = currentVersion + 1;
      
      // Create new version with rollback placeholders
      const newETag = generateETag();
      const rollbackVersionData: TemplateVersion = {
        version: newVersion,
        templateId,
        placeholders: targetVersionData.placeholders,
        diff: {
          added: [],
          removed: [],
          renamed: []
        },
        status: 'draft',
        createdBy: userId,
        createdAt: admin.firestore.Timestamp.now() as any,
        etag: newETag,
        reason: `Rollback to version ${targetVersion}: ${reason}`,
        isRollback: true,
        rolledBackFrom: currentVersion,
        rolledBackTo: targetVersion
      };
      
      // Save rollback version
      transaction.set(versionsRef.doc(newVersion.toString()), rollbackVersionData);
      
      // Update template
      transaction.update(templateRef, {
        currentVersion: newVersion,
        etag: newETag,
        updatedAt: admin.firestore.Timestamp.now(),
        updatedBy: userId
      });
      
      return { newVersion, etag: newETag };
    });
    
    console.log(`Rolled back template ${templateId} from version ${targetVersion}, new version: ${result.newVersion}`);
    return result;
    
  } catch (error: any) {
    console.error(`Error rolling back version:`, error);
    throw error;
  }
}

/**
 * Acquire an editor lock
 */
export async function acquireLock(
  templateId: string,
  userId: string
): Promise<{ acquired: boolean; expiresAt?: Date; currentHolder?: string }> {
  const templateRef = db.collection('templates').doc(templateId);
  
  try {
    const result = await db.runTransaction(async (transaction) => {
      const templateDoc = await transaction.get(templateRef);
      
      if (!templateDoc.exists) {
        throw new Error(`Template ${templateId} not found`);
      }
      
      const templateData = templateDoc.data() as Template & { editorLock?: EditorLock };
      const existingLock = templateData.editorLock;
      
      const now = new Date();
      
      // Check if there's an existing lock
      if (existingLock) {
        const lockExpiry = existingLock.expiresAt instanceof Date 
          ? existingLock.expiresAt 
          : (existingLock.expiresAt as any).toDate();
        
        // If lock is still valid and held by someone else
        if (lockExpiry > now && existingLock.userId !== userId) {
          return {
            acquired: false,
            expiresAt: lockExpiry,
            currentHolder: existingLock.userId
          };
        }
        
        // If lock is held by the same user, refresh it
        if (existingLock.userId === userId) {
          const newExpiry = new Date(now.getTime() + LOCK_TTL_MS);
          transaction.update(templateRef, {
            'editorLock.expiresAt': admin.firestore.Timestamp.fromDate(newExpiry),
            'editorLock.acquiredAt': admin.firestore.Timestamp.now()
          });
          
          return {
            acquired: true,
            expiresAt: newExpiry
          };
        }
      }
      
      // Acquire new lock (no valid lock exists)
      const newExpiry = new Date(now.getTime() + LOCK_TTL_MS);
      const newLock: EditorLock = {
        userId,
        acquiredAt: admin.firestore.Timestamp.now() as any,
        expiresAt: admin.firestore.Timestamp.fromDate(newExpiry) as any
      };
      
      transaction.update(templateRef, {
        editorLock: newLock
      });
      
      return {
        acquired: true,
        expiresAt: newExpiry
      };
    });
    
    if (result.acquired) {
      console.log(`Lock acquired for template ${templateId} by user ${userId}`);
    } else {
      console.log(`Lock acquisition failed for template ${templateId}, held by ${result.currentHolder}`);
    }
    
    return result;
    
  } catch (error: any) {
    console.error(`Error acquiring lock:`, error);
    throw error;
  }
}

/**
 * Release an editor lock
 */
export async function releaseLock(
  templateId: string,
  userId: string
): Promise<{ released: boolean }> {
  const templateRef = db.collection('templates').doc(templateId);
  
  try {
    const result = await db.runTransaction(async (transaction) => {
      const templateDoc = await transaction.get(templateRef);
      
      if (!templateDoc.exists) {
        throw new Error(`Template ${templateId} not found`);
      }
      
      const templateData = templateDoc.data() as Template & { editorLock?: EditorLock };
      const existingLock = templateData.editorLock;
      
      // Only release if the lock is held by this user
      if (existingLock && existingLock.userId === userId) {
        transaction.update(templateRef, {
          editorLock: admin.firestore.FieldValue.delete()
        });
        
        return { released: true };
      }
      
      return { released: false };
    });
    
    if (result.released) {
      console.log(`Lock released for template ${templateId} by user ${userId}`);
    }
    
    return result;
    
  } catch (error: any) {
    console.error(`Error releasing lock:`, error);
    throw error;
  }
}

/**
 * Refresh an existing lock (extend TTL)
 */
export async function refreshLock(
  templateId: string,
  userId: string
): Promise<{ refreshed: boolean; expiresAt?: Date }> {
  const templateRef = db.collection('templates').doc(templateId);
  
  try {
    const result = await db.runTransaction(async (transaction) => {
      const templateDoc = await transaction.get(templateRef);
      
      if (!templateDoc.exists) {
        throw new Error(`Template ${templateId} not found`);
      }
      
      const templateData = templateDoc.data() as Template & { editorLock?: EditorLock };
      const existingLock = templateData.editorLock;
      
      const now = new Date();
      
      // Only refresh if the lock is held by this user and still valid
      if (existingLock && existingLock.userId === userId) {
        const lockExpiry = existingLock.expiresAt instanceof Date 
          ? existingLock.expiresAt 
          : (existingLock.expiresAt as any).toDate();
        
        if (lockExpiry > now) {
          const newExpiry = new Date(now.getTime() + LOCK_TTL_MS);
          transaction.update(templateRef, {
            'editorLock.expiresAt': admin.firestore.Timestamp.fromDate(newExpiry)
          });
          
          return {
            refreshed: true,
            expiresAt: newExpiry
          };
        }
      }
      
      return { refreshed: false };
    });
    
    if (result.refreshed) {
      console.log(`Lock refreshed for template ${templateId} by user ${userId}`);
    }
    
    return result;
    
  } catch (error: any) {
    console.error(`Error refreshing lock:`, error);
    throw error;
  }
}

/**
 * Get version history for a template
 */
export async function getVersionHistory(
  templateId: string,
  limit: number = 10
): Promise<TemplateVersion[]> {
  try {
    const versionsSnapshot = await db
      .collection('templates')
      .doc(templateId)
      .collection(VERSION_COLLECTION)
      .orderBy('version', 'desc')
      .limit(limit)
      .get();
    
    return versionsSnapshot.docs.map(doc => doc.data() as TemplateVersion);
    
  } catch (error: any) {
    console.error(`Error getting version history:`, error);
    throw error;
  }
}

/**
 * Get a specific version
 */
export async function getVersion(
  templateId: string,
  version: number
): Promise<TemplateVersion | null> {
  try {
    const versionDoc = await db
      .collection('templates')
      .doc(templateId)
      .collection(VERSION_COLLECTION)
      .doc(version.toString())
      .get();
    
    if (!versionDoc.exists) {
      return null;
    }
    
    return versionDoc.data() as TemplateVersion;
    
  } catch (error: any) {
    console.error(`Error getting version:`, error);
    throw error;
  }
}

/**
 * Get the latest approved version
 */
export async function getLatestApprovedVersion(
  templateId: string
): Promise<TemplateVersion | null> {
  try {
    const templateDoc = await db.collection('templates').doc(templateId).get();
    
    if (!templateDoc.exists) {
      return null;
    }
    
    const templateData = templateDoc.data() as Template;
    const latestApprovedVersion = (templateData as any).latestApprovedVersion;
    
    if (!latestApprovedVersion) {
      return null;
    }
    
    return getVersion(templateId, latestApprovedVersion);
    
  } catch (error: any) {
    console.error(`Error getting latest approved version:`, error);
    throw error;
  }
}

/**
 * Check if a user has the lock
 */
export async function hasLock(
  templateId: string,
  userId: string
): Promise<boolean> {
  try {
    const templateDoc = await db.collection('templates').doc(templateId).get();
    
    if (!templateDoc.exists) {
      return false;
    }
    
    const templateData = templateDoc.data() as Template & { editorLock?: EditorLock };
    const lock = templateData.editorLock;
    
    if (!lock) {
      return false;
    }
    
    const now = new Date();
    const lockExpiry = lock.expiresAt instanceof Date 
      ? lock.expiresAt 
      : (lock.expiresAt as any).toDate();
    
    return lock.userId === userId && lockExpiry > now;
    
  } catch (error: any) {
    console.error(`Error checking lock:`, error);
    return false;
  }
}
