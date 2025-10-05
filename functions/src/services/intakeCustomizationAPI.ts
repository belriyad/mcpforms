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

import * as admin from 'firebase-admin';
import {
  createOverride,
  validateOverride as validateOverrideInternal,
  getOverrides as getOverridesInternal,
  updateOverrideStatus,
  getEffectiveSchema as getEffectiveSchemaInternal,
  freezeIntakeVersion as freezeIntakeVersionInternal,
  getOverrideSections as getOverrideSectionsInternal,
  hasPendingOverrides as hasPendingOverridesInternal
} from './customerOverrideManager';
import { aiPlaceholderService } from './aiPlaceholderService';
import {
  logOverrideCreated,
  logOverrideAccepted,
  logOverrideRejected
} from './auditLogger';
import { PlaceholderField } from '../types/versioning';

const db = admin.firestore();

/**
 * Generate custom clause using AI
 */
export async function generateCustomClauseAI(data: {
  intakeId: string;
  customerId: string;
  request: string;
  insertAfter?: string;
}, context: any) {
  try {
    const { intakeId, customerId, request, insertAfter } = data;

    // Get existing schema to check collisions
    const intakeDoc = await db.collection('intakes').doc(intakeId).get();
    if (!intakeDoc.exists) {
      throw new Error('Intake not found');
    }

    const intakeData = intakeDoc.data();
    const versionSnapshot = (intakeData as any).versionSnapshot;
    const existingSchema = versionSnapshot?.effectiveSchema || [];

    // Generate clause with AI
    // For templateContext, we can use a summary or empty string for now
    const templateContextStr = 'Template context'; // TODO: Get actual template context
    const result = await aiPlaceholderService.generateCustomClause(
      request,
      templateContextStr,
      existingSchema
    );

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

  } catch (error: any) {
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
export async function createCustomerOverride(data: {
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
}, context: any) {
  try {
    const { intakeId, customerId, sections, userId, userName, reason } = data;

    // Create override
    const result = await createOverride(
      intakeId,
      customerId,
      sections,
      userId,
      reason
    );

    // Count placeholders and collisions
    const totalPlaceholders = sections.reduce((sum, s) => sum + s.newPlaceholders.length, 0);
    const collisions = result.validation.errors
      .filter(e => e.type === 'duplicate')
      .map(e => e.field_key);

    // Log audit event
    await logOverrideCreated(
      intakeId,
      result.overrideId,
      customerId,
      userId,
      userName,
      sections.length,
      totalPlaceholders,
      collisions,
      reason
    );

    return {
      success: true,
      overrideId: result.overrideId,
      validation: result.validation,
      hasCollisions: collisions.length > 0,
      collisionCount: collisions.length
    };

  } catch (error: any) {
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
export async function validateCustomerOverride(data: {
  intakeId: string;
  newPlaceholders: PlaceholderField[];
}, context: any) {
  try {
    const { intakeId, newPlaceholders } = data;

    const validation = await validateOverrideInternal(intakeId, newPlaceholders);

    return {
      success: true,
      valid: validation.valid,
      errors: validation.errors,
      warnings: validation.warnings
    };

  } catch (error: any) {
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
export async function reviewOverride(data: {
  intakeId: string;
  overrideId: string;
  action: 'approve' | 'reject';
  userId: string;
  userName: string;
  reviewNotes?: string;
}, context: any) {
  try {
    const { intakeId, overrideId, action, userId, userName, reviewNotes } = data;

    const status = action === 'approve' ? 'active' : 'rejected';

    // Update status
    await updateOverrideStatus(
      intakeId,
      overrideId,
      status,
      userId,
      reviewNotes
    );

    // Log audit event
    if (action === 'approve') {
      await logOverrideAccepted(intakeId, overrideId, userId, userName, reviewNotes);
    } else {
      await logOverrideRejected(intakeId, overrideId, userId, userName, reviewNotes);
    }

    return {
      success: true,
      status,
      message: `Override ${action === 'approve' ? 'approved' : 'rejected'}`
    };

  } catch (error: any) {
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
export async function getOverrides(data: {
  intakeId: string;
  status?: 'active' | 'pending_review' | 'rejected';
}, context: any) {
  try {
    const { intakeId, status } = data;

    const overrides = await getOverridesInternal(intakeId, status);

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

  } catch (error: any) {
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
export async function getEffectiveSchema(data: {
  intakeId: string;
}, context: any) {
  try {
    const { intakeId } = data;

    const schema = await getEffectiveSchemaInternal(intakeId);

    return {
      success: true,
      schema,
      fieldCount: schema.length
    };

  } catch (error: any) {
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
export async function freezeIntakeVersion(data: {
  intakeId: string;
  templateIds: string[];
  useApprovedVersions?: boolean;
}, context: any) {
  try {
    const { intakeId, templateIds, useApprovedVersions = true } = data;

    const snapshot = await freezeIntakeVersionInternal(
      intakeId,
      templateIds,
      useApprovedVersions
    );

    return {
      success: true,
      versionSnapshot: {
        templateVersions: snapshot.templateVersions,
        effectiveSchemaCount: snapshot.effectiveSchema.length,
        frozenAt: snapshot.frozenAt
      }
    };

  } catch (error: any) {
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
export async function getOverrideSections(data: {
  intakeId: string;
}, context: any) {
  try {
    const { intakeId } = data;

    const sections = await getOverrideSectionsInternal(intakeId);

    return {
      success: true,
      sections,
      count: sections.length
    };

  } catch (error: any) {
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
export async function hasPendingOverrides(data: {
  intakeId: string;
}, context: any) {
  try {
    const { intakeId } = data;

    const hasPending = await hasPendingOverridesInternal(intakeId);

    return {
      success: true,
      hasPending
    };

  } catch (error: any) {
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
export async function startIntakeWithOverrides(data: {
  serviceId: string;
  customerId: string;
  templateIds: string[];
  useApprovedVersions?: boolean;
}, context: any) {
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
    const { intakeManager } = await import('./intakeManager');

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

  } catch (error: any) {
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
export async function getIntakeWithOverrides(data: {
  intakeId: string;
}, context: any) {
  try {
    const { intakeId } = data;

    // Get intake
    const intakeDoc = await db.collection('intakes').doc(intakeId).get();
    if (!intakeDoc.exists) {
      throw new Error('Intake not found');
    }

    const intakeData = intakeDoc.data();

    // Get overrides
    const overrides = await getOverridesInternal(intakeId);
    const activeOverrides = overrides.filter(o => o.status === 'active');
    const pendingOverrides = overrides.filter(o => o.status === 'pending_review');

    // Get effective schema
    const effectiveSchema = await getEffectiveSchemaInternal(intakeId);

    return {
      success: true,
      intake: {
        ...intakeData,
        overrides: {
          active: activeOverrides,
          pending: pendingOverrides,
          total: overrides.length
        },
        effectiveSchema,
        effectiveSchemaCount: effectiveSchema.length
      }
    };

  } catch (error: any) {
    console.error('Error getting intake with overrides:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
