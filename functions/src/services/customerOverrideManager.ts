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

import * as admin from 'firebase-admin';
import { 
  CustomerOverride, 
  PlaceholderField, 
  IntakeVersionSnapshot,
  ValidationResult
} from '../types/versioning';
import { Intake, Template } from '../types';
import { placeholderValidator } from './placeholderValidator';
import { getVersion, getLatestApprovedVersion } from './templateVersionManager';

const db = admin.firestore();

/**
 * Create a customer-specific override
 */
export async function createOverride(
  intakeId: string,
  customerId: string,
  sections: Array<{
    content: string;
    insertAfter: string;
    newPlaceholders: PlaceholderField[];
  }>,
  createdBy: string,
  reason?: string
): Promise<{ overrideId: string; validation: ValidationResult }> {
  try {
    const intakeRef = db.collection('intakes').doc(intakeId);
    const intakeDoc = await intakeRef.get();
    
    if (!intakeDoc.exists) {
      throw new Error(`Intake ${intakeId} not found`);
    }
    
    const intakeData = intakeDoc.data() as Intake;
    
    // Get global schema from intake's frozen version
    const versionSnapshot = (intakeData as any).versionSnapshot as IntakeVersionSnapshot | undefined;
    const globalSchema = versionSnapshot?.effectiveSchema || [];
    
    // Extract all new placeholders from sections
    const allNewPlaceholders: PlaceholderField[] = [];
    sections.forEach(section => {
      allNewPlaceholders.push(...section.newPlaceholders);
    });
    
    // Validate new placeholders
    const schemaValidation = placeholderValidator.validateSchema(allNewPlaceholders);
    if (schemaValidation.errors.length > 0) {
      throw new Error(`Override schema validation failed: ${schemaValidation.errors.map((e: any) => e.message).join(', ')}`);
    }
    
    // Detect collisions with global schema
    const collisions = placeholderValidator.detectCollisions(globalSchema, allNewPlaceholders);
    
    // Create override document
    const overrideId = db.collection('intakes').doc().id;
    const override: CustomerOverride = {
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
      createdAt: admin.firestore.Timestamp.now() as any,
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
          type: 'duplicate' as const
        }] : [],
        warnings: schemaValidation.warnings
      }
    };
    
  } catch (error: any) {
    console.error(`Error creating override:`, error);
    throw error;
  }
}

/**
 * Validate an override before creation
 */
export async function validateOverride(
  intakeId: string,
  newPlaceholders: PlaceholderField[]
): Promise<ValidationResult> {
  try {
    const intakeDoc = await db.collection('intakes').doc(intakeId).get();
    
    if (!intakeDoc.exists) {
      throw new Error(`Intake ${intakeId} not found`);
    }
    
    const intakeData = intakeDoc.data() as Intake;
    const versionSnapshot = (intakeData as any).versionSnapshot as IntakeVersionSnapshot | undefined;
    const globalSchema = versionSnapshot?.effectiveSchema || [];
    
    // Validate schema structure
    const schemaValidation = placeholderValidator.validateSchema(newPlaceholders);
    
    // Check for collisions
    const collisions = placeholderValidator.detectCollisions(globalSchema, newPlaceholders);
    
    const errors = [...schemaValidation.errors];
    if (collisions.length > 0) {
      errors.push({
        field_key: 'schema',
        message: `Found ${collisions.length} collision(s) with global schema: ${collisions.join(', ')}`,
        type: 'duplicate' as const
      });
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings: schemaValidation.warnings
    };
    
  } catch (error: any) {
    console.error(`Error validating override:`, error);
    throw error;
  }
}

/**
 * Apply override to merge global and customer schemas
 */
export async function applyOverride(
  intakeId: string,
  overrideId: string
): Promise<PlaceholderField[]> {
  try {
    const intakeRef = db.collection('intakes').doc(intakeId);
    const overrideDoc = await intakeRef.collection('overrides').doc(overrideId).get();
    
    if (!overrideDoc.exists) {
      throw new Error(`Override ${overrideId} not found`);
    }
    
    const override = overrideDoc.data() as CustomerOverride;
    
    // Get global schema
    const intakeDoc = await intakeRef.get();
    const intakeData = intakeDoc.data() as Intake;
    const versionSnapshot = (intakeData as any).versionSnapshot as IntakeVersionSnapshot | undefined;
    const globalSchema = versionSnapshot?.effectiveSchema || [];
    
    // Merge schemas: global + added - removed + modified
    const mergedSchema = [...globalSchema];
    
    // Add new fields from override
    if (override.schema_delta.added && override.schema_delta.added.length > 0) {
      override.schema_delta.added.forEach((field: PlaceholderField) => {
        // Only add if not already present (avoid duplicates)
        const exists = mergedSchema.some(f => f.field_key === field.field_key);
        if (!exists) {
          mergedSchema.push(field);
        }
      });
    }
    
    // Remove fields marked for removal
    if (override.schema_delta.removed && override.schema_delta.removed.length > 0) {
      override.schema_delta.removed.forEach((removedKey: string) => {
        const index = mergedSchema.findIndex(f => f.field_key === removedKey);
        if (index !== -1) {
          mergedSchema.splice(index, 1);
        }
      });
    }
    
    // Apply modifications
    if (override.schema_delta.modified && override.schema_delta.modified.length > 0) {
      override.schema_delta.modified.forEach((modified: PlaceholderField) => {
        const index = mergedSchema.findIndex(f => f.field_key === modified.field_key);
        if (index !== -1) {
          mergedSchema[index] = modified;
        }
      });
    }
    
    console.log(`Applied override ${overrideId} to intake ${intakeId}, merged schema has ${mergedSchema.length} fields`);
    
    return mergedSchema;
    
  } catch (error: any) {
    console.error(`Error applying override:`, error);
    throw error;
  }
}

/**
 * Freeze template versions for an intake
 * This pins specific template versions to ensure consistency
 */
export async function freezeIntakeVersion(
  intakeId: string,
  templateIds: string[],
  useApprovedVersions: boolean = true
): Promise<IntakeVersionSnapshot> {
  try {
    const intakeRef = db.collection('intakes').doc(intakeId);
    
    // Collect template versions
    const templateVersions: { [templateId: string]: number } = {};
    const allPlaceholders: PlaceholderField[] = [];
    
    for (const templateId of templateIds) {
      let version: number;
      let placeholders: PlaceholderField[];
      
      if (useApprovedVersions) {
        // Use latest approved version
        const approvedVersion = await getLatestApprovedVersion(templateId);
        if (!approvedVersion) {
          throw new Error(`No approved version found for template ${templateId}`);
        }
        version = approvedVersion.version;
        placeholders = approvedVersion.placeholders;
      } else {
        // Use current version
        const templateDoc = await db.collection('templates').doc(templateId).get();
        if (!templateDoc.exists) {
          throw new Error(`Template ${templateId} not found`);
        }
        const templateData = templateDoc.data() as Template;
        version = (templateData as any).currentVersion || 1;
        
        const versionData = await getVersion(templateId, version);
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
    const snapshot: IntakeVersionSnapshot = {
      templateVersions,
      effectiveSchema: allPlaceholders,
      frozenAt: admin.firestore.Timestamp.now() as any
    };
    
    // Save to intake
    await intakeRef.update({
      versionSnapshot: snapshot
    });
    
    console.log(`Froze versions for intake ${intakeId}:`, templateVersions);
    
    return snapshot;
    
  } catch (error: any) {
    console.error(`Error freezing intake version:`, error);
    throw error;
  }
}

/**
 * Get all overrides for an intake
 */
export async function getOverrides(
  intakeId: string,
  status?: 'active' | 'pending_review' | 'rejected'
): Promise<CustomerOverride[]> {
  try {
    let query = db.collection('intakes').doc(intakeId).collection('overrides') as any;
    
    if (status) {
      query = query.where('status', '==', status);
    }
    
    const snapshot = await query.get();
    return snapshot.docs.map((doc: any) => doc.data() as CustomerOverride);
    
  } catch (error: any) {
    console.error(`Error getting overrides:`, error);
    throw error;
  }
}

/**
 * Update override status
 */
export async function updateOverrideStatus(
  intakeId: string,
  overrideId: string,
  status: 'active' | 'pending_review' | 'rejected',
  reviewedBy: string,
  reviewNotes?: string
): Promise<void> {
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
    
  } catch (error: any) {
    console.error(`Error updating override status:`, error);
    throw error;
  }
}

/**
 * Get effective schema for an intake (global + all active overrides)
 */
export async function getEffectiveSchema(
  intakeId: string
): Promise<PlaceholderField[]> {
  try {
    const intakeRef = db.collection('intakes').doc(intakeId);
    const intakeDoc = await intakeRef.get();
    
    if (!intakeDoc.exists) {
      throw new Error(`Intake ${intakeId} not found`);
    }
    
    const intakeData = intakeDoc.data() as Intake;
    const versionSnapshot = (intakeData as any).versionSnapshot as IntakeVersionSnapshot | undefined;
    let effectiveSchema = versionSnapshot?.effectiveSchema || [];
    
    // Get all active overrides
    const overrides = await getOverrides(intakeId, 'active');
    
    // Apply each override
    for (const override of overrides) {
      // Add new fields
      if (override.schema_delta.added && override.schema_delta.added.length > 0) {
        override.schema_delta.added.forEach((field: PlaceholderField) => {
          const exists = effectiveSchema.some(f => f.field_key === field.field_key);
          if (!exists) {
            effectiveSchema.push(field);
          }
        });
      }
      
      // Remove fields
      if (override.schema_delta.removed && override.schema_delta.removed.length > 0) {
        override.schema_delta.removed.forEach((removedKey: string) => {
          effectiveSchema = effectiveSchema.filter(f => f.field_key !== removedKey);
        });
      }
      
      // Modify fields
      if (override.schema_delta.modified && override.schema_delta.modified.length > 0) {
        override.schema_delta.modified.forEach((modified: PlaceholderField) => {
          const index = effectiveSchema.findIndex(f => f.field_key === modified.field_key);
          if (index !== -1) {
            effectiveSchema[index] = modified;
          }
        });
      }
    }
    
    return effectiveSchema;
    
  } catch (error: any) {
    console.error(`Error getting effective schema:`, error);
    throw error;
  }
}

/**
 * Delete an override
 */
export async function deleteOverride(
  intakeId: string,
  overrideId: string
): Promise<void> {
  try {
    await db
      .collection('intakes')
      .doc(intakeId)
      .collection('overrides')
      .doc(overrideId)
      .delete();
    
    console.log(`Deleted override ${overrideId} from intake ${intakeId}`);
    
  } catch (error: any) {
    console.error(`Error deleting override:`, error);
    throw error;
  }
}

/**
 * Get override sections for document generation
 * Returns sections sorted by insertion order
 */
export async function getOverrideSections(
  intakeId: string
): Promise<Array<{
  content: string;
  insertAfter: string;
  placeholders: PlaceholderField[];
}>> {
  try {
    const overrides = await getOverrides(intakeId, 'active');
    
    const sections: Array<{
      content: string;
      insertAfter: string;
      placeholders: PlaceholderField[];
    }> = [];
    
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
    
  } catch (error: any) {
    console.error(`Error getting override sections:`, error);
    throw error;
  }
}

/**
 * Check if intake has any pending overrides
 */
export async function hasPendingOverrides(
  intakeId: string
): Promise<boolean> {
  try {
    const pendingOverrides = await getOverrides(intakeId, 'pending_review');
    return pendingOverrides.length > 0;
    
  } catch (error: any) {
    console.error(`Error checking pending overrides:`, error);
    throw error;
  }
}
