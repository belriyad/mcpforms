# Template Upload Funnel Visualization

## Funnel Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    TEMPLATE UPLOAD FUNNEL                        │
└─────────────────────────────────────────────────────────────────┘

Step 1: Page Visit (100% baseline)
  ├─ Event: page_view('/admin/templates/upload')
  ├─ Funnel: templateUploadStarted(userId)
  └─ Tracked: useEffect on component mount
        │
        ▼
Step 2: File Selected
  ├─ Event: template_upload_file_selected
  ├─ Funnel: templateUploadFileSelected(userId, fileName, fileSize)
  ├─ Data: fileName, fileSize, fileType
  └─ Tracked: handleFileChange when file input changes
        │
        ├─── [VALIDATION CHECKPOINT] ──────┐
        │                                   │
        ▼                                   ▼
  ✅ PASS                              ❌ FAIL
  validation_passed                    validation_failed
        │                                   │
        │                                   ├─ invalid_file_type
        │                                   └─ file_too_large
        │
        ▼
Step 3: Validation Passed
  ├─ Event: template_upload_validation_passed
  ├─ Funnel: templateUploadValidationPassed(userId)
  └─ Tracked: handleFileChange after checks pass
        │
        ▼
Step 4: Name Entered & Upload Clicked
  ├─ Funnel: templateUploadNameEntered(userId, templateName)
  ├─ Timer: ⏱️ START PerformanceTimer('template_upload')
  └─ Tracked: handleUpload start
        │
        ▼
Step 5: Firestore Document Created (Progress: 20%)
  ├─ Event: template_upload_progress(templateId, 20, 'firestore_creation_started')
  ├─ Action: addDoc(collection(db, 'templates'), {...})
  ├─ Event: template_upload_progress(templateId, 20, 'firestore_created')
  ├─ Funnel: templateUploadFirestoreCreated(userId, templateId)
  └─ Data: templateId generated
        │
        ▼
Step 6: Storage Upload (Progress: 40%)
  ├─ Event: template_upload_progress(templateId, 40, 'storage_upload_started')
  ├─ Action: uploadBytes(storageRef, file)
  ├─ Event: template_upload_progress(templateId, 40, 'storage_uploaded')
  ├─ Funnel: templateUploadStorageUploaded(userId, templateId)
  └─ Storage Path: templates/{templateId}/{fileName}
        │
        ▼
Step 7: Get Download URL (Progress: 70%)
  ├─ Event: template_upload_progress(templateId, 70, 'getting_download_url')
  ├─ Action: getDownloadURL(storageRef)
  └─ Data: downloadURL obtained
        │
        ▼
Step 8: Metadata Updated (Progress: 90%)
  ├─ Event: template_upload_progress(templateId, 90, 'metadata_update_started')
  ├─ Action: updateDoc(templateDoc, { storagePath, downloadURL, status: 'uploaded' })
  ├─ Event: template_upload_progress(templateId, 90, 'metadata_updated')
  └─ Funnel: templateUploadMetadataUpdated(userId, templateId)
        │
        ▼
Step 9: Parsing Triggered (Progress: 95%)
  ├─ Event: template_upload_progress(templateId, 95, 'parsing_trigger_started')
  ├─ Action: httpsCallable(functions, 'processUploadedTemplate')
  ├─ Event: template_upload_parse_triggered(templateId)
  └─ Funnel: templateUploadParsingTriggered(userId, templateId)
        │
        ▼
Step 10: Upload Completed (Progress: 100%) ✅
  ├─ Event: template_upload_progress(templateId, 100, 'completed')
  ├─ Event: template_uploaded(templateId, fileSize)
  ├─ Timer: ⏱️ END → duration calculated
  ├─ Funnel: templateUploadCompleted(userId, templateId, duration)
  └─ Action: Redirect to /admin/templates after 2s


┌─────────────────────────────────────────────────────────────────┐
│                        ERROR PATH                                │
└─────────────────────────────────────────────────────────────────┘

At Any Step Above:
  ├─ Catch Error
  ├─ Determine Error Type:
  │    ├─ permission_denied
  │    ├─ storage_unauthorized
  │    ├─ api_error
  │    └─ unknown_error
  ├─ Event: error_occurred(errorType, errorMessage, 'template_upload')
  ├─ Funnel: templateUploadFailed(userId, errorType, errorMessage)
  └─ UI: Display error message


┌─────────────────────────────────────────────────────────────────┐
│                     DATA COLLECTION POINTS                       │
└─────────────────────────────────────────────────────────────────┘

Every Event Includes:
  ├─ timestamp (ISO 8601)
  ├─ session_id (from sessionStorage)
  ├─ user_agent (browser info)
  └─ userId (when authenticated)

Dual Storage:
  ├─ Firebase Analytics → Real-time dashboards
  └─ Firestore (analyticsEvents) → Custom queries

Funnel Steps Stored In:
  └─ Firestore (analyticsEvents) with:
      ├─ eventName: 'funnel_step'
      ├─ funnel: 'template_upload'
      ├─ step: 'started' | 'file_selected' | ... | 'completed'
      ├─ userId
      ├─ metadata (varies by step)
      └─ createdAt: serverTimestamp()
```

## Sample Event Payloads

### 1. Page Visit
```json
{
  "eventName": "page_view",
  "page_path": "/admin/templates/upload",
  "page_title": "Upload Template",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "session_id": "sess_abc123",
  "user_agent": "Mozilla/5.0..."
}
```

### 2. File Selected
```json
{
  "eventName": "template_upload_file_selected",
  "label": "employment_contract.docx",
  "value": 45678,
  "category": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "timestamp": "2024-01-15T10:30:15.000Z",
  "session_id": "sess_abc123",
  "userId": "user_xyz789"
}
```

### 3. Validation Failed
```json
{
  "eventName": "template_upload_validation_failed",
  "error_code": "file_too_large",
  "label": "huge_file.docx",
  "fileSize": 15728640,
  "timestamp": "2024-01-15T10:30:20.000Z",
  "session_id": "sess_abc123",
  "userId": "user_xyz789"
}
```

### 4. Validation Passed
```json
{
  "eventName": "template_upload_validation_passed",
  "label": "employment_contract.docx",
  "value": 45678,
  "timestamp": "2024-01-15T10:30:25.000Z",
  "session_id": "sess_abc123",
  "userId": "user_xyz789"
}
```

### 5. Progress Event
```json
{
  "eventName": "template_upload_progress",
  "templateId": "tmpl_def456",
  "value": 40,
  "label": "storage_uploaded",
  "timestamp": "2024-01-15T10:31:05.000Z",
  "session_id": "sess_abc123",
  "userId": "user_xyz789"
}
```

### 6. Funnel Step (Firestore)
```json
{
  "eventName": "funnel_step",
  "funnel": "template_upload",
  "step": "firestore_created",
  "userId": "user_xyz789",
  "templateId": "tmpl_def456",
  "timestamp": "2024-01-15T10:30:50.000Z",
  "session_id": "sess_abc123",
  "createdAt": "2024-01-15T10:30:50.123Z"
}
```

### 7. Upload Completed
```json
{
  "eventName": "funnel_step",
  "funnel": "template_upload",
  "step": "completed",
  "userId": "user_xyz789",
  "templateId": "tmpl_def456",
  "duration": 45000,
  "timestamp": "2024-01-15T10:31:30.000Z",
  "session_id": "sess_abc123",
  "createdAt": "2024-01-15T10:31:30.456Z"
}
```

### 8. Upload Failed
```json
{
  "eventName": "funnel_step",
  "funnel": "template_upload",
  "step": "failed",
  "userId": "user_xyz789",
  "errorType": "permission_denied",
  "errorMessage": "Permission denied. You need lawyer or admin role to upload templates.",
  "timestamp": "2024-01-15T10:30:55.000Z",
  "session_id": "sess_abc123",
  "createdAt": "2024-01-15T10:30:55.789Z"
}
```

## Conversion Metrics

### Success Funnel (Expected Conversion Rates)
```
Page Visited:              100%  (1000 users)
    ↓ -5%
File Selected:              95%  (950 users)
    ↓ -2%
Validation Passed:          93%  (930 users)
    ↓ -1%
Name Entered:               92%  (920 users)
    ↓ -3%
Firestore Created:          89%  (890 users)
    ↓ -1%
Storage Uploaded:           88%  (880 users)
    ↓ -0.5%
Metadata Updated:         87.5%  (875 users)
    ↓ -0.5%
Parsing Triggered:          87%  (870 users)
    ↓ -2%
COMPLETED:                  85%  (850 users)

Overall Conversion Rate: 85%
Average Drop-off per step: 1.67%
```

### Critical Drop-off Points to Monitor
1. **File Selected → Validation Passed** (Target: <5% drop)
   - High drop = file type/size issues
   - Action: Better validation messages, file size indicator

2. **Name Entered → Firestore Created** (Target: <5% drop)
   - High drop = permission or network issues
   - Action: Check Firestore rules, improve error messages

3. **Parsing Triggered → Completed** (Target: <3% drop)
   - High drop = cloud function failures
   - Action: Monitor function logs, add retry logic

## Dashboard Queries

### Firestore Query Examples

#### Get Upload Success Rate (Last 7 Days)
```typescript
const sevenDaysAgo = new Date()
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

const started = await db.collection('analyticsEvents')
  .where('eventName', '==', 'funnel_step')
  .where('funnel', '==', 'template_upload')
  .where('step', '==', 'page_visited')
  .where('createdAt', '>=', sevenDaysAgo)
  .count()
  .get()

const completed = await db.collection('analyticsEvents')
  .where('eventName', '==', 'funnel_step')
  .where('funnel', '==', 'template_upload')
  .where('step', '==', 'completed')
  .where('createdAt', '>=', sevenDaysAgo)
  .count()
  .get()

const successRate = (completed.data().count / started.data().count) * 100
console.log(`Upload Success Rate: ${successRate.toFixed(2)}%`)
```

#### Get Average Upload Time
```typescript
const completed = await db.collection('analyticsEvents')
  .where('eventName', '==', 'funnel_step')
  .where('funnel', '==', 'template_upload')
  .where('step', '==', 'completed')
  .where('createdAt', '>=', sevenDaysAgo)
  .limit(100)
  .get()

const durations = completed.docs.map(doc => doc.data().duration)
const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length
console.log(`Average Upload Time: ${(avgDuration / 1000).toFixed(2)}s`)
```

#### Get Top Failure Reasons
```typescript
const failed = await db.collection('analyticsEvents')
  .where('eventName', '==', 'funnel_step')
  .where('funnel', '==', 'template_upload')
  .where('step', '==', 'failed')
  .where('createdAt', '>=', sevenDaysAgo)
  .get()

const failureReasons = {}
failed.docs.forEach(doc => {
  const type = doc.data().errorType
  failureReasons[type] = (failureReasons[type] || 0) + 1
})

console.table(failureReasons)
```

## Monitoring Alerts

### Recommended Alerts

1. **High Failure Rate**
   ```
   IF (failures / starts) > 0.20 in last 1 hour
   THEN alert: "Upload failure rate above 20%"
   ```

2. **Slow Uploads**
   ```
   IF AVG(duration) > 60000ms in last 1 hour
   THEN alert: "Upload times degraded (>60s avg)"
   ```

3. **Validation Failures Spike**
   ```
   IF (validation_failed / file_selected) > 0.10 in last 1 hour
   THEN alert: "High validation failure rate"
   ```

4. **Permission Errors**
   ```
   IF COUNT(errorType='permission_denied') > 5 in last 1 hour
   THEN alert: "Multiple permission errors detected"
   ```

## Testing Checklist

- [ ] Page visit tracked on mount
- [ ] File selection event fires with correct data
- [ ] Validation failure tracked for wrong file type
- [ ] Validation failure tracked for oversized file
- [ ] Validation success tracked for valid file
- [ ] All 9 progress events fire in sequence
- [ ] Firestore creation funnel step tracked
- [ ] Storage upload funnel step tracked
- [ ] Metadata update funnel step tracked
- [ ] Parsing trigger funnel step tracked
- [ ] Completion funnel step with duration tracked
- [ ] Failure funnel step tracked on error
- [ ] Error event includes context='template_upload'
- [ ] Session ID consistent across all events
- [ ] userId present in all events (when authenticated)
