# Template Editor & Intake Customization API Documentation

**Version:** 1.0.0  
**Base URL:** `https://YOUR-PROJECT.cloudfunctions.net/`  
**Authentication:** Firebase Auth (context.auth)

---

## 📋 Table of Contents

1. [Template Editor APIs](#template-editor-apis) (11 endpoints)
2. [Intake Customization APIs](#intake-customization-apis) (10 endpoints)
3. [Response Formats](#response-formats)
4. [Error Handling](#error-handling)
5. [Usage Examples](#usage-examples)

---

## Template Editor APIs

### 1. List Templates
**Function:** `listTemplates`  
**Method:** Firebase Callable  
**Description:** Get all templates for a tenant

**Request:**
```typescript
{
  tenantId: string;
  status?: 'active' | 'archived';
  limit?: number; // default: 50
}
```

**Response:**
```typescript
{
  success: boolean;
  templates: Array<{
    id: string;
    name: string;
    status: string;
    currentVersion: number;
    latestApprovedVersion?: number;
    hasLock: boolean;
    lockExpired: boolean;
    updatedAt: Date;
    updatedBy: string;
    ...
  }>;
  count: number;
}
```

---

### 2. Get Template with Placeholders
**Function:** `getTemplateWithPlaceholders`  
**Method:** Firebase Callable  
**Description:** Get template with current placeholder schema and lock status

**Request:**
```typescript
{
  templateId: string;
  version?: number; // optional, defaults to current version
}
```

**Response:**
```typescript
{
  success: boolean;
  template: {
    id: string;
    name: string;
    placeholders: PlaceholderField[];
    versionInfo: {
      version: number;
      status: 'draft' | 'approved' | 'archived';
      createdAt: Date;
      createdBy: string;
      approvedAt?: Date;
      approvedBy?: string;
    };
    lockStatus: {
      isLocked: boolean;
      lockedBy?: string;
      expiresAt?: Date;
    };
    ...
  };
}
```

---

### 3. AI Placeholder Suggestions
**Function:** `suggestPlaceholdersAI`  
**Method:** Firebase Callable (with OPENAI_API_KEY)  
**Description:** Extract placeholders from template content using AI

**Request:**
```typescript
{
  templateId: string;
  templateContent?: string; // optional, extracted from storage if not provided
}
```

**Response:**
```typescript
{
  success: boolean;
  suggestions: {
    fields: PlaceholderField[];
    confidence_score: number; // 0-1
    reasoning?: string;
    warnings?: string[];
  };
}
```

**PlaceholderField Structure:**
```typescript
{
  field_key: string; // ^[a-z0-9_]{2,64}$
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'enum' | 'address' | 'phone' | 'email';
  locations: Array<{
    page?: number;
    section?: string;
    hint?: string;
  }>;
  required?: boolean;
  confidence?: number; // 0-1 from AI
}
```

---

### 4. Save Template Draft
**Function:** `saveTemplateDraft`  
**Method:** Firebase Callable  
**Description:** Save new version as draft with placeholder schema

**Request:**
```typescript
{
  templateId: string;
  placeholders: PlaceholderField[];
  userId: string;
  userName: string;
  reason?: string;
  expectedETag?: string; // for optimistic locking
}
```

**Response:**
```typescript
{
  success: boolean;
  version: number;
  etag: string;
  diff: {
    added: PlaceholderField[];
    removed: PlaceholderField[];
    renamed: Array<{ from: string; to: string; reason?: string }>;
  };
}
```

---

### 5. Approve Template Version
**Function:** `approveTemplateVersion`  
**Method:** Firebase Callable  
**Description:** Promote version from draft → approved

**Request:**
```typescript
{
  templateId: string;
  version: number;
  userId: string;
  userName: string;
  reason?: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  version: number;
  message: string;
}
```

---

### 6. Rollback Template
**Function:** `rollbackTemplate`  
**Method:** Firebase Callable  
**Description:** Restore previous version (creates new version)

**Request:**
```typescript
{
  templateId: string;
  targetVersion: number;
  userId: string;
  userName: string;
  reason: string; // required
}
```

**Response:**
```typescript
{
  success: boolean;
  newVersion: number;
  etag: string;
  message: string;
}
```

---

### 7-9. Lock Management
**Functions:** `acquireTemplateLock`, `releaseTemplateLock`, `refreshTemplateLock`  
**Method:** Firebase Callable  
**Description:** Manage 5-minute editor locks for concurrent editing prevention

**Acquire Lock Request:**
```typescript
{
  templateId: string;
  userId: string;
}
```

**Acquire Lock Response:**
```typescript
{
  success: boolean;
  acquired: boolean;
  expiresAt?: Date;
  currentHolder?: string;
  message: string;
}
```

**Release/Refresh Lock:** Same request format, different response

---

### 10. Check Lock Status
**Function:** `checkTemplateLock`  
**Method:** Firebase Callable  
**Description:** Check if user has lock or if template is locked

**Request:**
```typescript
{
  templateId: string;
  userId: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  hasLock: boolean;
  isLocked: boolean;
  lockedBy?: string;
  expiresAt?: Date;
  isExpired?: boolean;
}
```

---

### 11. Version History
**Function:** `getTemplateVersionHistory`  
**Method:** Firebase Callable  
**Description:** Get version timeline with diffs

**Request:**
```typescript
{
  templateId: string;
  limit?: number; // default: 10
}
```

**Response:**
```typescript
{
  success: boolean;
  versions: Array<{
    version: number;
    status: 'draft' | 'approved' | 'archived';
    diff: PlaceholderDiff;
    createdAt: Date;
    createdBy: string;
    approvedAt?: Date;
    approvedBy?: string;
    reason?: string;
    isRollback?: boolean;
    rolledBackFrom?: number;
    rolledBackTo?: number;
    placeholderCount: number;
  }>;
  count: number;
}
```

---

### 12. Audit Trail
**Function:** `getTemplateAuditTrail`  
**Method:** Firebase Callable  
**Description:** Get audit events for template

**Request:**
```typescript
{
  templateId: string;
  limit?: number; // default: 50
}
```

**Response:**
```typescript
{
  success: boolean;
  events: Array<{
    id: string;
    eventType: string;
    actor: { userId: string; userName: string; email?: string };
    timestamp: Date;
    diff?: any;
    reason?: string;
    metadata?: Record<string, any>;
  }>;
  count: number;
}
```

---

### 13. Validate Placeholders
**Function:** `validatePlaceholders`  
**Method:** Firebase Callable  
**Description:** Validate placeholder schema with optional content check

**Request:**
```typescript
{
  placeholders: PlaceholderField[];
  templateContent?: string; // if provided, checks orphans/unused
}
```

**Response:**
```typescript
{
  success: boolean;
  valid: boolean;
  errors: Array<{
    field_key: string;
    type: 'invalid_format' | 'duplicate' | 'orphan' | 'invalid_type' | 'missing_location';
    message: string;
  }>;
  warnings: Array<{
    field_key: string;
    type: 'unused' | 'low_confidence' | 'ambiguous_location';
    message: string;
  }>;
}
```

---

## Intake Customization APIs

### 1. Generate Custom Clause (AI)
**Function:** `generateCustomClauseAI`  
**Method:** Firebase Callable (with OPENAI_API_KEY)  
**Description:** Generate custom legal clause with placeholders using AI

**Request:**
```typescript
{
  intakeId: string;
  customerId: string;
  request: string; // natural language request (max 2K chars)
  insertAfter?: string; // section anchor
}
```

**Response:**
```typescript
{
  success: boolean;
  clause: {
    section_text: string;
    section_title: string;
    new_placeholders: PlaceholderField[];
    insert_after: string;
    reasoning: string;
    warnings?: string[];
  };
}
```

---

### 2. Create Customer Override
**Function:** `createCustomerOverride`  
**Method:** Firebase Callable  
**Description:** Create customer-specific override with validation

**Request:**
```typescript
{
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
}
```

**Response:**
```typescript
{
  success: boolean;
  overrideId: string;
  validation: ValidationResult;
  hasCollisions: boolean;
  collisionCount: number;
}
```

---

### 3. Validate Override
**Function:** `validateCustomerOverride`  
**Method:** Firebase Callable  
**Description:** Pre-validate override before creation

**Request:**
```typescript
{
  intakeId: string;
  newPlaceholders: PlaceholderField[];
}
```

**Response:**
```typescript
{
  success: boolean;
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}
```

---

### 4. Review Override
**Function:** `reviewOverride`  
**Method:** Firebase Callable  
**Description:** Approve or reject customer override

**Request:**
```typescript
{
  intakeId: string;
  overrideId: string;
  action: 'approve' | 'reject';
  userId: string;
  userName: string;
  reviewNotes?: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  status: 'active' | 'rejected';
  message: string;
}
```

---

### 5. Get Overrides
**Function:** `getOverrides`  
**Method:** Firebase Callable  
**Description:** List overrides for intake

**Request:**
```typescript
{
  intakeId: string;
  status?: 'active' | 'pending_review' | 'rejected';
}
```

**Response:**
```typescript
{
  success: boolean;
  overrides: Array<{
    overrideId: string;
    customerId: string;
    sections: CustomerOverrideSection[];
    schema_delta: {
      added: PlaceholderField[];
      modified: PlaceholderField[];
      removed: string[];
    };
    status: 'active' | 'pending_review' | 'rejected';
    collisions: string[];
    createdAt: Date;
    createdBy: string;
    reviewedAt?: Date;
    reviewedBy?: string;
    reviewNotes?: string;
    reason?: string;
  }>;
  count: number;
}
```

---

### 6. Get Effective Schema
**Function:** `getEffectiveSchema`  
**Method:** Firebase Callable  
**Description:** Get merged global + all active overrides schema

**Request:**
```typescript
{
  intakeId: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  schema: PlaceholderField[]; // merged schema
  fieldCount: number;
}
```

---

### 7. Freeze Intake Version
**Function:** `freezeIntakeVersion`  
**Method:** Firebase Callable  
**Description:** Pin specific template versions for intake consistency

**Request:**
```typescript
{
  intakeId: string;
  templateIds: string[];
  useApprovedVersions?: boolean; // default: true
}
```

**Response:**
```typescript
{
  success: boolean;
  versionSnapshot: {
    templateVersions: Record<string, number>; // templateId -> version
    effectiveSchemaCount: number;
    frozenAt: Date;
  };
}
```

---

### 8-11. Utility Functions
**Functions:** `getOverrideSections`, `hasPendingOverrides`, `startIntakeWithOverrides`, `getIntakeWithOverrides`  
**Method:** Firebase Callable  
**Description:** Various helper functions for override management

---

## Response Formats

### Success Response
```typescript
{
  success: true,
  // ... data fields
}
```

### Error Response
```typescript
{
  success: false,
  error: string // error message
}
```

---

## Error Handling

### Common Errors
- `Unauthorized` - Missing or invalid authentication
- `Template not found` - Invalid templateId
- `Intake not found` - Invalid intakeId
- `Concurrent modification detected` - ETag mismatch
- `Lock held by another user` - Template locked
- `Validation failed` - Schema validation errors
- `OPENAI_API_KEY is not configured` - Missing AI credentials

---

## Usage Examples

### Example 1: Create and Approve Template Version

```typescript
// 1. Get current template
const template = await getTemplateWithPlaceholders({
  templateId: 'template123'
});

// 2. Acquire lock
await acquireTemplateLock({
  templateId: 'template123',
  userId: 'user456'
});

// 3. AI suggest placeholders
const suggestions = await suggestPlaceholdersAI({
  templateId: 'template123',
  templateContent: '...'
});

// 4. Save draft
const draft = await saveTemplateDraft({
  templateId: 'template123',
  placeholders: suggestions.suggestions.fields,
  userId: 'user456',
  userName: 'John Doe',
  expectedETag: template.template.etag
});

// 5. Approve version
await approveTemplateVersion({
  templateId: 'template123',
  version: draft.version,
  userId: 'admin789',
  userName: 'Admin User',
  reason: 'Ready for production'
});

// 6. Release lock
await releaseTemplateLock({
  templateId: 'template123',
  userId: 'user456'
});
```

---

### Example 2: Create Customer Override

```typescript
// 1. Generate custom clause with AI
const clause = await generateCustomClauseAI({
  intakeId: 'intake123',
  customerId: 'customer456',
  request: 'Add a confidentiality clause specific to healthcare providers',
  insertAfter: 'section_5'
});

// 2. Validate override
const validation = await validateCustomerOverride({
  intakeId: 'intake123',
  newPlaceholders: clause.clause.new_placeholders
});

// 3. Create override if valid
if (validation.valid) {
  const override = await createCustomerOverride({
    intakeId: 'intake123',
    customerId: 'customer456',
    sections: [{
      content: clause.clause.section_text,
      insertAfter: clause.clause.insert_after,
      newPlaceholders: clause.clause.new_placeholders
    }],
    userId: 'user456',
    userName: 'John Doe',
    reason: 'Customer-specific healthcare requirements'
  });

  // 4. If has collisions, send for review
  if (override.hasCollisions) {
    console.log('Override pending review due to collisions');
  }
}
```

---

### Example 3: Freeze Intake and Get Effective Schema

```typescript
// 1. Freeze template versions
await freezeIntakeVersion({
  intakeId: 'intake123',
  templateIds: ['template1', 'template2', 'template3'],
  useApprovedVersions: true
});

// 2. Get effective schema (global + overrides)
const schema = await getEffectiveSchema({
  intakeId: 'intake123'
});

console.log(`Effective schema has ${schema.fieldCount} fields`);

// 3. Check for pending overrides
const pending = await hasPendingOverrides({
  intakeId: 'intake123'
});

if (pending.hasPending) {
  // Get pending overrides
  const overrides = await getOverrides({
    intakeId: 'intake123',
    status: 'pending_review'
  });
  
  // Review first override
  await reviewOverride({
    intakeId: 'intake123',
    overrideId: overrides.overrides[0].overrideId,
    action: 'approve',
    userId: 'admin789',
    userName: 'Admin User',
    reviewNotes: 'Approved after legal review'
  });
}
```

---

## Configuration

### Required Secrets
- `OPENAI_API_KEY` - For AI functions (suggestPlaceholdersAI, generateCustomClauseAI)

### Memory/Timeout Settings
- **Template Editor APIs**: Default (256MB, 60s)
- **AI-powered APIs**: 512MB, 60s
- **Intake APIs**: Default (256MB, 60s)

### Firebase Functions Deploy
```bash
firebase deploy --only functions
```

---

## Intake Management APIs (NEW)

### generateIntakeLinkWithOverrides
**Function:** `generateIntakeLinkWithOverrides`  
**Method:** Firebase Callable  
**Description:** Create an intake with frozen template versions and customer overrides

**Request:**
```typescript
{
  serviceId: string;           // Required: Service to use
  customerId: string;          // Required: Customer ID
  templateIds?: string[];      // Optional: Specific templates
  useApprovedVersions?: boolean; // Default: true
  clientEmail?: string;        // Optional: Client email
  expiresInDays?: number;      // Default: 30
  overrideId?: string;         // Optional: Override to attach
}
```

**Response:**
```typescript
{
  success: boolean;
  data?: {
    intakeId: string;
    intakeUrl: string;
  };
  error?: string;
  message?: string;
}
```

**Example:**
```typescript
const result = await functions.httpsCallable('generateIntakeLinkWithOverrides')({
  serviceId: 'service-trust',
  customerId: 'customer-123',
  templateIds: ['template-001'],
  useApprovedVersions: true,
  overrideId: 'override-456',
  clientEmail: 'client@example.com'
});

// Result:
{
  success: true,
  data: {
    intakeId: 'intake-789',
    intakeUrl: 'https://example.com/intake/token-abc'
  },
  message: 'Intake link generated successfully with frozen template versions'
}
```

### getIntakeFormSchema
**Function:** `getIntakeFormSchema`  
**Method:** Firebase Callable  
**Description:** Get the form schema for an intake, including customer overrides

**Request:**
```typescript
{
  intakeId: string;  // Required: Intake ID
}
```

**Response:**
```typescript
{
  success: boolean;
  data?: {
    formFields: PlaceholderField[];  // Merged global + override fields
  };
  error?: string;
  message?: string;
}
```

**PlaceholderField Structure:**
```typescript
{
  field_key: string;         // Unique field identifier
  label: string;             // Display label
  type: 'string' | 'number' | 'date' | 'boolean' | 'enum' | 'address' | 'phone' | 'email';
  locations: PlaceholderLocation[];
  required?: boolean;
  description?: string;
  options?: string[];        // For enum type
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    format?: string;
  };
}
```

**Example:**
```typescript
const result = await functions.httpsCallable('getIntakeFormSchema')({
  intakeId: 'intake-789'
});

// Result with overrides:
{
  success: true,
  data: {
    formFields: [
      { field_key: 'trust_name', label: 'Trust Name', type: 'string', required: true, ... },
      { field_key: 'grantor_names', label: 'Grantor Names', type: 'string', required: true, ... },
      { field_key: 'custom_beneficiary', label: 'Custom Beneficiary', type: 'string', required: false, ... }
    ]
  },
  message: 'Form schema retrieved with customer overrides'
}
```

---

## Complete API Summary

**Total Endpoints: 28**

### Template Management (11)
- listTemplates
- getTemplateWithPlaceholders
- suggestPlaceholdersAI
- saveTemplateDraft
- approveTemplateVersion
- rollbackTemplate
- acquireTemplateLock
- releaseTemplateLock
- refreshTemplateLock
- checkTemplateLock
- getTemplateVersionHistory
- getTemplateAuditTrail
- validatePlaceholders

### Intake Customization (10)
- generateCustomClauseAI
- createCustomerOverride
- validateCustomerOverride
- reviewOverride
- getOverrides
- getEffectiveSchema
- freezeIntakeVersion
- getOverrideSections
- hasPendingOverrides
- startIntakeWithOverrides
- getIntakeWithOverrides

### Intake Management (5) ← NEW
- generateIntakeLink
- generateIntakeLinkWithOverrides ⭐ NEW
- getIntakeFormSchema ⭐ NEW
- submitIntakeForm
- approveIntakeForm

### Document Generation (2)
- generateDocumentsFromIntake (with override support)
- getDocumentDownloadUrl

---

**End of API Documentation**  
**For implementation details, see:** `IMPLEMENTATION_SUMMARY.md`  
**For override architecture, see:** `DOCUMENT_GENERATOR_OVERRIDES.md`  
**For intake integration, see:** `TASK_8_COMPLETE.md`
