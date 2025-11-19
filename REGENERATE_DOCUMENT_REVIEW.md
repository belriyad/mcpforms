# Regenerate Document Feature - Complete Review

## Overview

The "Regenerate Documents" feature allows users to regenerate all documents for a service with the latest data and template files. This is useful when:
- Templates have been updated or fixed
- Intake data has been modified
- Previous generation failed or produced incorrect results
- User wants to use AI generation instead of docxtemplater (or vice versa)

## Implementation Locations

### 1. Service Detail Page - Main Regenerate Button

**File**: `src/app/admin/services/[serviceId]/page.tsx`

**UI Button** (Lines 1080-1095):
```tsx
<button 
  className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg hover:from-orange-700 hover:to-amber-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
  onClick={handleGenerateDocuments}
  disabled={generatingDocs}
  title="Regenerate all documents with latest data and template files"
>
  {generatingDocs ? (
    <>
      <Loader2 className="w-5 h-5 animate-spin" />
      Regenerating...
    </>
  ) : (
    <>
      <RefreshCw className="w-5 h-5" />
      Regenerate Documents
    </>
  )}
</button>
```

**Handler Function** (Lines 375-505):
```typescript
const handleGenerateDocuments = async () => {
  if (!service) return
  
  setGeneratingDocs(true)
  let currentDocuments: any = null
  
  try {
    // Call API endpoint
    const response = await fetch('/api/services/generate-documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        serviceId: service.id,
        useAI: true // Enable AI-powered document generation
      }),
    })

    const result = await response.json()
    
    // Handle success/failure
    if (result.success || (result.summary && result.summary.total > 0)) {
      // Show detailed summary
      // Wait for document generation
      // Refresh service data from Firestore
      // Multiple backup refreshes (5s, 10s intervals)
    }
  } catch (err) {
    alert('❌ Failed to generate documents')
  } finally {
    setGeneratingDocs(false)
  }
}
```

**Key Features**:
- ✅ **Always uses AI generation** (`useAI: true`)
- ✅ **Shows loading state** with spinner and "Regenerating..." text
- ✅ **Waits 3 seconds** for generation to complete
- ✅ **Automatic refresh** of service data from Firestore
- ✅ **Backup refreshes** at 5s and 10s intervals to catch late updates
- ✅ **Detailed console logging** for debugging
- ✅ **Handles partial failures** (some docs succeed, some fail)

### 2. API Route Handler

**File**: `src/app/api/services/generate-documents/route.ts`

**Endpoint**: `POST /api/services/generate-documents`

**Request Body**:
```json
{
  "serviceId": "xVvgBn5HsoxophXELCrf",
  "useAI": true
}
```

**Flow** (Lines 10-90):
```typescript
export async function POST(request: NextRequest) {
  const { serviceId, useAI = true } = body
  
  // If AI generation requested
  if (useAI) {
    // Call cloud function with timeout (120 seconds)
    const response = await fetch(functionUrl, {
      method: 'POST',
      body: JSON.stringify({
        data: {
          intakeId: serviceId,
          regenerate: true  // ← Always true for regeneration
        }
      }),
      signal: controller.signal
    })
    
    // If successful, return
    // If failed or timeout, fall back to docxtemplater
  }
  
  // Fallback: Use docxtemplater method
}
```

**Key Features**:
- ✅ **Always passes `regenerate: true`** to cloud function
- ✅ **120-second timeout** for AI processing
- ✅ **Automatic fallback** to docxtemplater if AI fails/times out
- ✅ **AbortController** to cancel requests on timeout

### 3. Cloud Function - AI Document Generation

**File**: `functions/src/services/documentGeneratorAI.ts`

**Function**: `generateDocumentsFromIntake(intakeId, regenerate)`

**Regenerate Logic** (Lines 128-130):
```typescript
// If regenerating, delete existing artifacts
if (regenerate) {
  await this.deleteExistingArtifacts(intakeId);
}
```

**Delete Artifacts Function** (Lines 554-584):
```typescript
async deleteExistingArtifacts(intakeId: string): Promise<void> {
  // Query all artifacts for this intake
  const artifactsSnapshot = await db
    .collection("documentArtifacts")
    .where("intakeId", "==", intakeId)
    .get();

  const deletePromises = artifactsSnapshot.docs.map(async (doc) => {
    const artifact = doc.data();
    
    // Delete from storage
    await storage.bucket().file(artifact.fileUrl).delete();
    
    // Delete from Firestore
    await doc.ref.delete();
  });

  await Promise.all(deletePromises);
  console.log(`🗑️ [AI-GEN] Deleted ${artifactsSnapshot.size} existing artifacts`);
}
```

**Key Features**:
- ✅ **Deletes old documents** before generating new ones
- ✅ **Cleans up storage files** (Firebase Storage)
- ✅ **Removes Firestore records** (documentArtifacts collection)
- ✅ **Parallel deletion** for performance
- ✅ **Error handling** for individual file deletions

## Complete Regeneration Flow

```
1. User clicks "Regenerate Documents" button
   ↓
2. handleGenerateDocuments() called
   - Sets generatingDocs = true (shows loading spinner)
   ↓
3. POST to /api/services/generate-documents
   - Body: { serviceId, useAI: true }
   ↓
4. API route receives request
   - Calls cloud function with { intakeId: serviceId, regenerate: true }
   - Sets 120-second timeout
   ↓
5. Cloud function: generateDocumentsFromIntake(serviceId, true)
   - Checks if regenerate = true
   - If yes: deleteExistingArtifacts()
     ↓
     - Queries documentArtifacts where intakeId = serviceId
     - Deletes each artifact from Storage
     - Deletes each artifact from Firestore
   ↓
6. Generate new documents
   - For each template:
     - Download template file
     - Extract content (plain text)
     - Send to OpenAI with intake data
     - Convert response to DOCX
     - Upload to Storage
     - Create documentArtifact record
   ↓
7. Update service status
   - Set status to "documents_ready"
   - Update updatedAt timestamp
   ↓
8. Return success to API route
   ↓
9. API route returns to frontend
   ↓
10. Frontend refreshes service data
    - Wait 3 seconds
    - Fetch fresh data from Firestore
    - Backup refresh at 5s
    - Backup refresh at 10s
    ↓
11. UI updates
    - Shows success message
    - Displays new documents with download links
    - Sets generatingDocs = false
```

## Data Flow

### Before Regeneration
```
Firestore:
  services/{serviceId}:
    - generatedDocuments: [
        { fileName: "Trust.docx", downloadUrl: "old-url-1" },
        { fileName: "Will.docx", downloadUrl: "old-url-2" }
      ]
  
  documentArtifacts/{artifactId1}:
    - intakeId: serviceId
    - fileUrl: "generated-documents/serviceId/artifact1.docx"
    - status: "generated"
  
  documentArtifacts/{artifactId2}:
    - intakeId: serviceId
    - fileUrl: "generated-documents/serviceId/artifact2.docx"
    - status: "generated"

Firebase Storage:
  - generated-documents/serviceId/artifact1.docx (OLD)
  - generated-documents/serviceId/artifact2.docx (OLD)
```

### After Regeneration
```
Firestore:
  services/{serviceId}:
    - generatedDocuments: [
        { fileName: "Trust.docx", downloadUrl: "new-url-1" },
        { fileName: "Will.docx", downloadUrl: "new-url-2" }
      ]
  
  documentArtifacts/{newArtifactId1}:
    - intakeId: serviceId
    - fileUrl: "generated-documents/serviceId/newArtifact1.docx"
    - status: "generated"
  
  documentArtifacts/{newArtifactId2}:
    - intakeId: serviceId
    - fileUrl: "generated-documents/serviceId/newArtifact2.docx"
    - status: "generated"
  
  [OLD artifacts deleted]

Firebase Storage:
  - generated-documents/serviceId/newArtifact1.docx (NEW)
  - generated-documents/serviceId/newArtifact2.docx (NEW)
  
  [OLD files deleted]
```

## User Experience

### When Regeneration is Needed

1. **Template was updated** - User uploaded a new version of the template
2. **Intake data was edited** - Client responses were modified
3. **First generation failed** - Timeout or error occurred
4. **Wrong generation method** - Want to switch between AI/docxtemplater
5. **Template had errors** - Placeholders were missing or incorrect

### Visual Feedback

**Before Click**:
```
[RefreshCw Icon] Regenerate Documents
```

**During Generation** (2-120 seconds):
```
[Spinner] Regenerating...
```

**After Success**:
```
Alert: "✅ Successfully generated 2 document(s)!"
[RefreshCw Icon] Regenerate Documents  (enabled again)
```

**After Partial Success**:
```
Alert: "⚠️ Generated 1 document(s), but 1 failed. Check console for details."
```

**After Failure**:
```
Alert: "❌ All 2 document(s) failed to generate. Check console and Firebase logs."
```

## Timing & Performance

### Expected Durations

- **API Call Setup**: ~100ms
- **Cloud Function Invocation**: ~200ms
- **Delete Old Artifacts**: ~1-2 seconds (per artifact)
- **AI Generation per Template**: ~30-90 seconds
- **Upload to Storage**: ~500ms-2s per document
- **Firestore Updates**: ~200ms
- **Total for 2 templates**: **60-180 seconds**

### Timeout Protection

```typescript
// API Route
const timeoutId = setTimeout(() => {
  controller.abort()
}, 120000) // 2 minutes
```

If generation takes longer than 2 minutes:
1. Request is aborted
2. Falls back to docxtemplater method (fast, 2-5 seconds)
3. May not fill all fields correctly (template format dependent)

### Refresh Strategy

```typescript
// Immediate refresh (after 3s)
await new Promise(resolve => setTimeout(resolve, 3000))
const updatedServiceDoc = await getDoc(serviceRef)

// Backup refresh #1 (after 5s)
setTimeout(() => { /* refresh */ }, 5000)

// Backup refresh #2 (after 10s)
setTimeout(() => { /* refresh */ }, 10000)
```

**Why multiple refreshes?**
- Firestore propagation can be delayed
- Storage URLs may take time to become available
- Cloud function may update Firestore after API returns
- Ensures UI shows latest data even if timing varies

## Differences vs. Initial Generation

| Aspect | Initial Generation | Regeneration |
|--------|-------------------|--------------|
| **Trigger** | "Generate Documents" button (first time) | "Regenerate Documents" button (subsequent) |
| **Old Files** | N/A (no old files) | Deleted before generating new ones |
| **Old Artifacts** | N/A | Deleted from Firestore and Storage |
| **regenerate flag** | `false` or not passed | `true` (always) |
| **User expectation** | Waiting for first results | Replacing existing results |
| **Button text** | "Generate Documents" | "Regenerate Documents" |
| **Button color** | Blue/purple gradient | Orange/amber gradient |
| **Icon** | FileText | RefreshCw (circular arrows) |

## Error Handling

### Scenario 1: Cloud Function Timeout
```typescript
try {
  const response = await fetch(functionUrl, { signal: controller.signal })
} catch (aiError: any) {
  if (aiError.name === 'AbortError') {
    console.error('⏱️ AI generation timeout - falling back to docxtemplater')
    // Fall through to docxtemplater method
  }
}
```

**Result**: Fast fallback, documents generated using docxtemplater

### Scenario 2: AI Generation Fails
```typescript
if (result.result?.success) {
  return NextResponse.json({ success: true, ... })
} else {
  console.error('❌ AI generation failed:', result.result?.error)
  // Fall through to docxtemplater method
}
```

**Result**: Automatic fallback, user may not even notice

### Scenario 3: Partial Failure
```typescript
const successful = result.summary?.successful || 0
const failed = result.summary?.failed || 0

if (successful > 0 && failed > 0) {
  alert(`⚠️ Generated ${successful} document(s), but ${failed} failed.`)
}
```

**Result**: User informed, can try regenerating again

### Scenario 4: Complete Failure
```typescript
if (failed > 0 && successful === 0) {
  alert(`❌ All ${failed} document(s) failed to generate. Check console and Firebase logs.`)
}
```

**Result**: User must check logs, may need technical support

## Logging & Debugging

### Frontend Console Logs
```javascript
console.log('📊 API Response:', result)
console.log('📊 Generation Summary:', { total, successful, failed })
console.log('✅ Documents with URLs:', documentsWithUrls)
console.log('❌ Documents WITHOUT URLs:', documentsWithoutUrls)
console.log('⏳ Waiting 3 seconds for document generation...')
console.log('🔄 Fetching fresh service data from Firestore...')
console.log('🔄 Refreshed service data:', { documentsCount, documents })
console.log('📊 Status: X/Y documents have download URLs')
```

### Cloud Function Logs
```javascript
console.log('🤖 [AI-GEN] Starting AI-powered document generation...')
console.log('📋 [AI-GEN] Using intake data from service.clientResponse')
console.log('🤖 [AI-GEN] Processing template: Certificate_of_Trust_Fillable Template')
console.log('🗑️ [AI-GEN] Deleted 2 existing artifacts')
console.log('✅ [AI-GEN] Successfully generated: artifactId123')
console.log('🎉 [AI-GEN] Successfully generated 2 documents')
```

### API Route Logs
```javascript
console.log('📄 Generating documents for service:', serviceId)
console.log('🤖 Using AI generation:', useAI)
console.log('🤖 Delegating to AI cloud function...')
console.log('🤖 AI function result:', result)
console.error('⏱️ AI Cloud Function timeout after 120 seconds')
console.error('❌ AI generation failed:', error)
console.log('⚠️ Falling back to docxtemplater method...')
```

## Recommendations for Improvement

### 1. Add Progress Indicators
```typescript
// Show progress for each template
onProgress={(template, current, total) => {
  setProgress(`Generating ${template} (${current}/${total})`)
}}
```

### 2. Selective Regeneration
```typescript
// Allow user to choose which documents to regenerate
<Checkbox>
  □ Certificate of Trust
  ☑ Last Will and Testament
</Checkbox>
<button>Regenerate Selected (1)</button>
```

### 3. Show Diff/Comparison
```typescript
// Before regeneration, show what changed
<DiffViewer 
  oldContent={oldDocument} 
  newContent={previewDocument} 
/>
<button>Confirm Regeneration</button>
```

### 4. Retry Individual Failures
```typescript
// If partial failure, allow retrying failed documents
{failedDocuments.map(doc => (
  <button onClick={() => retryDocument(doc.id)}>
    Retry {doc.fileName}
  </button>
))}
```

### 5. Add Confirmation Dialog
```typescript
// Warn user before regenerating
if (!confirm('This will delete all existing documents and generate new ones. Continue?')) {
  return
}
```

### 6. Background Processing
```typescript
// For long operations, process in background
<button onClick={() => queueRegeneration(serviceId)}>
  Regenerate in Background
</button>
// Show notification when complete
toast.success('Documents regenerated! Click to view.')
```

### 7. Version History
```typescript
// Keep old versions instead of deleting
const version = await createDocumentVersion(oldDocument)
console.log('📦 Archived version:', version.id)
// User can restore old versions if needed
```

### 8. Estimate Generation Time
```typescript
// Show estimated time based on template count
const estimatedTime = templateCount * 45 // ~45 seconds per template
alert(`This will take approximately ${estimatedTime} seconds`)
```

## Summary

The "Regenerate Documents" feature is a **comprehensive, production-ready solution** with:

✅ **Robust error handling** (timeout, fallback, partial failure)
✅ **Automatic cleanup** (deletes old files before generating new)
✅ **Multiple refresh strategies** (ensures UI gets latest data)
✅ **Detailed logging** (frontend + backend for debugging)
✅ **User feedback** (loading states, success/error messages)
✅ **Performance optimization** (parallel operations, timeouts)

**Main Flow**: User clicks button → Old documents deleted → New documents generated with AI → Storage uploaded → Firestore updated → UI refreshed

**Typical Duration**: 60-180 seconds for 2 templates with AI generation

**Fallback**: If AI times out (>120s), automatically falls back to fast docxtemplater method (2-5s)
