# Document Generator with Customer Overrides

## Overview

The document generator has been enhanced to support **customer overrides**, enabling per-customer customization of generated documents with additional sections and placeholders.

## Architecture

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Document Generation Request                                  │
│    - intakeId provided                                           │
│    - regenerate flag (optional)                                  │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Load Intake with Version Snapshot                            │
│    - intake.versionSnapshot?.templateVersions                    │
│    - intake.versionSnapshot?.overrideId                          │
│    - intake.versionSnapshot?.effectiveSchema                     │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Load Pinned Template Versions                                │
│    - For each template in service:                              │
│      • Load template metadata                                    │
│      • If pinnedVersion exists, load that version's placeholders │
│      • Attach versionedPlaceholders to template                  │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Fetch Customer Overrides (if overrideId exists)              │
│    - getOverrideSections(intakeId)                               │
│      Returns: Array<{content, insertAfter, placeholders}>        │
│    - getEffectiveSchema(intakeId)                                │
│      Returns: PlaceholderField[] (global + deltas merged)        │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. Generate Document for Each Template                          │
│    - Download template file from Storage                         │
│    - For DOCX: fillWordDocument(...)                             │
│    - For PDF: fillPdfDocument(...)                               │
│    - Pass overrideSections & effectiveSchema                     │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. Fill Document with Client Data                               │
│    - Replace {{placeholders}} with clientData values             │
│    - Use effectiveSchema for placeholder mapping                 │
│    - Handle standard placeholders + override placeholders        │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. Insert Override Sections (DOCX only)                         │
│    - For each override section:                                  │
│      • Replace placeholders in section.content                   │
│      • Convert text to DOCX XML format                           │
│      • Find insertion point (anchor or 'end')                    │
│      • Insert XML into document                                  │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. Upload & Store Generated Document                            │
│    - Save to Firebase Storage                                    │
│    - Update DocumentArtifact status                              │
│    - Return artifactId                                           │
└─────────────────────────────────────────────────────────────────┘
```

## Key Features

### 1. Version Pinning

When an intake is created with overrides, template versions are **frozen** to ensure consistency:

```typescript
intake.versionSnapshot = {
  templateVersions: {
    "template-123": 5,  // Use version 5 of this template
    "template-456": 3   // Use version 3 of this template
  },
  effectiveSchema: [...], // Merged global + override placeholders
  overrideId: "override-789",
  frozenAt: new Date(),
  frozenBy: "user-001"
}
```

**Benefits:**
- Documents remain consistent even if templates are updated later
- Overrides are guaranteed to work with the specific template version they were created for
- Audit trail of which versions were used for each document

### 2. Effective Schema

The **effective schema** combines global placeholders with customer-specific placeholders:

```typescript
// Global placeholders (from template version)
[
  { field_key: "trust_name", type: "string", ... },
  { field_key: "grantor_names", type: "string", ... }
]

// Customer override delta
{
  added: [
    { field_key: "custom_clause_beneficiary", type: "string", ... }
  ],
  modified: [
    { field_key: "trust_name", label: "Custom Trust Name", ... }
  ],
  removed: ["unused_field"]
}

// Effective schema (merged)
[
  { field_key: "trust_name", label: "Custom Trust Name", ... }, // Modified
  { field_key: "grantor_names", type: "string", ... },          // Unchanged
  { field_key: "custom_clause_beneficiary", type: "string", ... } // Added
  // "unused_field" removed
]
```

### 3. Override Section Insertion

Override sections are inserted into DOCX documents at specified anchor points:

```typescript
{
  section_id: "additional-beneficiary-clause",
  title: "Additional Beneficiary Provisions",
  content: "The trust shall include {{custom_clause_beneficiary}} as a contingent beneficiary...",
  insert_after: "ARTICLE III: BENEFICIARIES", // Or 'end' for end of document
  new_placeholders: [
    { field_key: "custom_clause_beneficiary", type: "string", ... }
  ]
}
```

**Insertion Logic:**
1. Search for anchor text in document XML
2. Find the end of that paragraph (`</w:p>`)
3. Convert section content to DOCX XML format
4. Insert after the anchor paragraph
5. Replace placeholders in inserted content with client data

## Updated Functions

### `generateDocuments()`

**Changes:**
- Loads `versionSnapshot` from intake
- Fetches override sections via `getOverrideSections()`
- Fetches effective schema via `getEffectiveSchema()`
- Passes override data to `generateDocumentFromTemplate()`

```typescript
const overrideSections = await getOverrideSections(intakeId);
const effectiveSchema = await getEffectiveSchema(intakeId);

for (const template of templates) {
  await generateDocumentFromTemplate(
    template, 
    intake,
    overrideSections,
    effectiveSchema
  );
}
```

### `generateDocumentFromTemplate()`

**Changes:**
- Added parameters: `overrideSections`, `effectiveSchema`
- Passes override data to `fillWordDocument()` and `fillPdfDocument()`

```typescript
async generateDocumentFromTemplate(
  template: Template,
  intake: Intake,
  overrideSections: Array<{...}> = [],
  effectiveSchema: PlaceholderField[] = []
): Promise<string>
```

### `fillWordDocument()`

**Changes:**
- Added parameters: `overrideSections`, `effectiveSchema`
- Calls `insertOverrideSections()` before generating final buffer
- Logs override processing

```typescript
async fillWordDocument(
  templateBuffer: Buffer,
  clientData: Record<string, any>,
  template?: any,
  overrideSections: Array<{...}> = [],
  effectiveSchema: PlaceholderField[] = []
): Promise<Buffer>
```

**Override Insertion:**
```typescript
if (overrideSections.length > 0) {
  await this.insertOverrideSections(zip, overrideSections, clientData);
}
```

### `fillPdfDocument()`

**Changes:**
- Added parameters: `overrideSections`, `effectiveSchema`
- Logs that PDF override insertion is not yet fully implemented
- **TODO:** Implement PDF section insertion using `pdf-lib`

### `insertOverrideSections()` ⭐ NEW

Inserts customer override sections into a DOCX document.

**Parameters:**
- `zip`: PizZip instance containing the document
- `overrideSections`: Array of override sections to insert
- `clientData`: Client data for placeholder replacement

**Process:**
1. Extract `word/document.xml` from ZIP
2. For each override section:
   - Replace placeholders in content with client data
   - Convert content to DOCX XML format
   - Find insertion point (anchor text or end)
   - Insert XML at the appropriate location
3. Update `word/document.xml` in ZIP

**Example:**
```typescript
await insertOverrideSections(zip, [
  {
    content: "Special provision: {{custom_field}}",
    insertAfter: "ARTICLE II",
    placeholders: [{ field_key: "custom_field", ... }]
  }
], { custom_field: "Value 123" });
```

### `convertTextToDocxXml()` ⭐ NEW

Converts plain text to DOCX XML format.

**Features:**
- Splits text by newlines into paragraphs
- Escapes XML special characters (`&`, `<`, `>`, `"`, `'`)
- Wraps each paragraph in `<w:p><w:r><w:t>...</w:t></w:r></w:p>`
- Preserves whitespace with `xml:space="preserve"`

**Example:**
```typescript
convertTextToDocxXml("Line 1\nLine 2")
// Returns:
// <w:p><w:r><w:t xml:space="preserve">Line 1</w:t></w:r></w:p>
// <w:p><w:r><w:t xml:space="preserve">Line 2</w:t></w:r></w:p>
```

## Data Flow Example

### Scenario: Generate document with custom beneficiary clause

**1. Intake Data:**
```json
{
  "id": "intake-001",
  "serviceId": "service-trust",
  "clientData": {
    "trust_name": "Smith Family Trust",
    "grantor_names": "John Smith",
    "custom_beneficiary_name": "Jane Doe Foundation"
  },
  "versionSnapshot": {
    "templateVersions": {
      "template-trust": 3
    },
    "overrideId": "override-001",
    "frozenAt": "2025-10-05T10:00:00Z"
  }
}
```

**2. Override Section:**
```json
{
  "section_id": "custom-beneficiary",
  "content": "In the event that all primary beneficiaries predecease the Grantor, the trust assets shall be distributed to {{custom_beneficiary_name}} as the contingent beneficiary.",
  "insert_after": "ARTICLE IV: DISTRIBUTION PROVISIONS",
  "new_placeholders": [
    {
      "field_key": "custom_beneficiary_name",
      "type": "string",
      "label": "Custom Beneficiary Name"
    }
  ]
}
```

**3. Document Generation:**
```
1. Load template version 3 (pinned)
2. Load override sections
3. Fill standard placeholders:
   - {{trust_name}} → "Smith Family Trust"
   - {{grantor_names}} → "John Smith"
4. Insert override section after "ARTICLE IV"
5. Replace {{custom_beneficiary_name}} → "Jane Doe Foundation" in override
6. Generate final DOCX
```

**4. Final Document:**
```
ARTICLE III: BENEFICIARIES
[Standard beneficiary provisions]

ARTICLE IV: DISTRIBUTION PROVISIONS
[Standard distribution provisions]

In the event that all primary beneficiaries predecease the Grantor, 
the trust assets shall be distributed to Jane Doe Foundation as the 
contingent beneficiary.

ARTICLE V: TRUSTEE POWERS
[Continue with rest of document...]
```

## Backward Compatibility

The system maintains **100% backward compatibility** with non-override intakes:

- If `intake.versionSnapshot` is `undefined`, use current template versions
- If `overrideSections` is empty, skip override insertion
- If `effectiveSchema` is empty, use only global placeholders
- All override parameters have default values (`= []`)

**Example (old intake):**
```typescript
// Old intake without overrides
{
  id: "intake-002",
  serviceId: "service-trust",
  clientData: { ... },
  // NO versionSnapshot
}

// Document generation works exactly as before
```

## Error Handling

The system is designed to **gracefully degrade** if overrides fail:

```typescript
try {
  overrideSections = await getOverrideSections(intakeId);
  effectiveSchema = await getEffectiveSchema(intakeId);
} catch (error) {
  console.error("Failed to load overrides:", error);
  // Continue without overrides - generate with standard templates
}

try {
  await insertOverrideSections(zip, overrideSections, clientData);
} catch (overrideError) {
  console.error("Failed to insert override sections:", overrideError);
  // Continue with document generation - overrides will be missing
}
```

**Failure Modes:**
- Override fetch fails → Generate with standard template
- Section insertion fails → Generate without override sections
- Anchor not found → Insert at end of document
- Invalid XML → Log error, skip that section

## Logging

All override operations are logged with `[OVERRIDE-v1.0]` prefix:

```
[OVERRIDE-v1.0] Override sections: 2
[OVERRIDE-v1.0] Effective schema fields: 15
[OVERRIDE-INSERT] Starting override section insertion...
[OVERRIDE-INSERT] Processing section 1/2
[OVERRIDE-INSERT]   Insert after: ARTICLE IV
[OVERRIDE-INSERT]     Replaced {{custom_beneficiary_name}} with "Jane Doe Foundation"
[OVERRIDE-INSERT]   Found anchor at index: 5234
[OVERRIDE-INSERT]   ✅ Section inserted successfully
[OVERRIDE-INSERT] ✅ All override sections processed
```

## Future Enhancements

### 1. PDF Override Insertion
Currently, PDF override insertion is logged but not implemented. Future work:
- Use `pdf-lib` to insert text at specific coordinates
- Support PDF form field overrides
- Handle multi-page insertions

### 2. Rich Text Formatting
Currently, override sections are plain text. Future enhancements:
- Support Markdown in section content
- Convert Markdown to DOCX formatting (bold, italic, lists)
- Preserve formatting from AI-generated clauses

### 3. Advanced Anchor Points
Currently, anchors are simple text search. Future enhancements:
- Support multiple anchor types (heading level, bookmark, etc.)
- XPath-based anchors for precise insertion
- Relative insertion (before/after/replace)

### 4. Section Validation
- Validate that anchor points exist before insertion
- Warn if override placeholders are not in clientData
- Preview override insertion before finalizing

### 5. Performance Optimization
- Cache effective schema per intake
- Batch process multiple overrides
- Parallel document generation for multiple templates

## Testing

### Unit Tests Needed
- [ ] Load pinned template versions
- [ ] Fetch override sections
- [ ] Merge effective schema
- [ ] Insert override sections at correct anchor
- [ ] Replace placeholders in override content
- [ ] Handle missing anchors (insert at end)
- [ ] Backward compatibility (no overrides)
- [ ] Error handling (override fetch fails)

### Integration Tests Needed
- [ ] End-to-end: Create override → Generate document → Verify sections
- [ ] Multiple overrides in single document
- [ ] Override with multiple placeholders
- [ ] Override with no placeholders (static text)
- [ ] Regenerate document with same overrides

## Summary

The document generator now supports **customer overrides** with:

✅ **Version pinning** for template consistency  
✅ **Effective schema** merging global + override placeholders  
✅ **Section insertion** at configurable anchor points  
✅ **Placeholder replacement** in override content  
✅ **Backward compatibility** with existing intakes  
✅ **Graceful error handling** with fallbacks  
✅ **Comprehensive logging** for debugging  

**Status:** DOCX override insertion complete, PDF support pending.

---

**Last Updated:** October 5, 2025  
**Version:** 1.0  
**Related Files:**
- `functions/src/services/documentGenerator.ts`
- `functions/src/services/customerOverrideManager.ts`
- `functions/src/types/index.ts`
- `functions/src/types/versioning.ts`
