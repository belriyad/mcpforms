# Template Upload Telemetry Documentation

## Overview
Comprehensive telemetry tracking for the template upload flow with individual step tracking and funnel creation.

## Funnel Tracking

### Template Upload Funnel
The template upload process is tracked through a complete funnel with 10 distinct steps:

1. **`templateUploadStarted`** - User lands on upload page
   - Tracked in: `useEffect` on page mount
   - Data: `userId`

2. **`templateUploadFileSelected`** - User selects a file
   - Tracked in: `handleFileChange` when file is selected
   - Data: `userId`, `fileName`, `fileSize`

3. **`templateUploadValidationPassed`** - File passes validation
   - Tracked in: `handleFileChange` after type and size validation
   - Data: `userId`

4. **`templateUploadNameEntered`** - User provides template name
   - Tracked in: `handleUpload` before upload starts
   - Data: `userId`, `templateName`

5. **`templateUploadFirestoreCreated`** - Firestore document created
   - Tracked in: `handleUpload` after Firestore `addDoc`
   - Data: `userId`, `templateId`

6. **`templateUploadStorageUploaded`** - File uploaded to Storage
   - Tracked in: `handleUpload` after `uploadBytes`
   - Data: `userId`, `templateId`

7. **`templateUploadMetadataUpdated`** - Template metadata updated
   - Tracked in: `handleUpload` after Firestore `updateDoc`
   - Data: `userId`, `templateId`

8. **`templateUploadParsingTriggered`** - Cloud function triggered
   - Tracked in: `handleUpload` after `processUploadedTemplate` call
   - Data: `userId`, `templateId`

9. **`templateUploadCompleted`** - Upload fully completed
   - Tracked in: `handleUpload` at success (100% progress)
   - Data: `userId`, `templateId`, `duration` (ms)

10. **`templateUploadFailed`** - Upload failed at any step
    - Tracked in: `handleUpload` catch block
    - Data: `userId`, `errorType`, `errorMessage`

## Event Tracking

### File Selection & Validation Events

#### `template_upload_file_selected`
- **When**: User selects a file
- **Data**: 
  - `fileName` (label)
  - `fileSize` (value)
  - `fileType` (category)
- **Usage**: Track which file types users are trying to upload

#### `template_upload_validation_failed`
- **When**: File fails validation (type or size)
- **Data**:
  - `reason` (error_code): `invalid_file_type` | `file_too_large`
  - `fileName` (label)
  - `fileType` or `fileSize` (additional details)
- **Usage**: Identify validation pain points

#### `template_upload_validation_passed`
- **When**: File passes all validation checks
- **Data**:
  - `fileName` (label)
  - `fileSize` (value)
- **Usage**: Measure successful file selection rate

### Upload Progress Events

#### `template_upload_progress`
- **When**: Each major step of the upload process
- **Data**:
  - `templateId`
  - `progress` (value): 0, 20, 40, 70, 90, 95, 100
  - `step` (label): See step names below
- **Steps tracked**:
  1. `firestore_creation_started` (20%)
  2. `firestore_created` (20%)
  3. `storage_upload_started` (40%)
  4. `storage_uploaded` (40%)
  5. `getting_download_url` (70%)
  6. `metadata_update_started` (90%)
  7. `metadata_updated` (90%)
  8. `parsing_trigger_started` (95%)
  9. `completed` (100%)

#### `template_upload_parse_triggered`
- **When**: Cloud function is called to parse template
- **Data**:
  - `templateId`
- **Usage**: Track parsing trigger success rate

#### `template_uploaded`
- **When**: Upload completes successfully
- **Data**:
  - `templateId`
  - `fileSize` (value)
- **Usage**: Track successful uploads

## Performance Tracking

### PerformanceTimer
- **Timer name**: `template_upload`
- **Started**: At beginning of `handleUpload`
- **Ended**: When upload completes successfully
- **Result**: Duration sent in `templateUploadCompleted` funnel step

## Error Tracking

### Error Types Tracked
1. **`permission_denied`** - User lacks upload permission
2. **`storage_unauthorized`** - Storage access denied
3. **`unknown_error`** - Unexpected error
4. **Custom error codes** - From Firebase/API errors

### Error Event
- **Event**: `error_occurred`
- **Data**:
  - `errorType`
  - `errorMessage`
  - `context`: `'template_upload'`

## Analytics Integration

### Dual Storage
All events are stored in two places:
1. **Firebase Analytics** - Real-time dashboards, predefined metrics
2. **Firestore `analyticsEvents`** - Detailed querying, custom analysis

### Session Tracking
All events include:
- `timestamp` (ISO 8601)
- `session_id` (from sessionStorage)
- `user_agent`

## Funnel Analysis Queries

### Conversion Rate: Page Visit → Upload Complete
```typescript
const pageVisits = await getFunnelStepCount('template_upload', 'page_visited')
const completions = await getFunnelStepCount('template_upload', 'completed')
const conversionRate = (completions / pageVisits) * 100
```

### Drop-off Points
```typescript
const steps = [
  'page_visited',
  'file_selected',
  'validation_passed',
  'name_entered',
  'firestore_created',
  'storage_uploaded',
  'metadata_updated',
  'parsing_triggered',
  'completed'
]

for (let i = 0; i < steps.length - 1; i++) {
  const current = await getFunnelStepCount('template_upload', steps[i])
  const next = await getFunnelStepCount('template_upload', steps[i + 1])
  const dropoff = ((current - next) / current) * 100
  console.log(`${steps[i]} → ${steps[i+1]}: ${dropoff.toFixed(2)}% drop-off`)
}
```

### Average Upload Time
```typescript
const completedEvents = await db.collection('analyticsEvents')
  .where('eventName', '==', 'funnel_step')
  .where('funnel', '==', 'template_upload')
  .where('step', '==', 'completed')
  .get()

const durations = completedEvents.docs.map(doc => doc.data().duration)
const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length
```

### Validation Failure Rate by Type
```typescript
const validationFailed = await db.collection('analyticsEvents')
  .where('eventName', '==', 'template_upload_validation_failed')
  .get()

const failuresByType = {}
validationFailed.docs.forEach(doc => {
  const type = doc.data().error_code
  failuresByType[type] = (failuresByType[type] || 0) + 1
})
```

## Dashboard Metrics

### Key Metrics to Track
1. **Upload Success Rate**: `completed / started * 100`
2. **Average Upload Time**: `mean(duration)` from completed uploads
3. **Top Failure Reasons**: Group by `errorType`
4. **Validation Failure Rate**: `validation_failed / file_selected * 100`
5. **Step-by-Step Conversion**: Each funnel step conversion
6. **File Size Distribution**: Histogram of uploaded file sizes
7. **Time to First Action**: Time from page visit to file selection

### Real-Time Alerts
Set up alerts for:
- Upload failure rate > 10%
- Average upload time > 30 seconds
- Validation failure rate > 20%
- Any permission_denied errors

## Implementation Details

### Files Modified
1. **`src/lib/analytics.ts`**:
   - Added template upload funnel functions to `Funnel` object
   - Added template upload event types to `AnalyticsEventName`
   - Added convenience methods to `Analytics` object

2. **`src/app/admin/templates/upload/page.tsx`**:
   - Imported Analytics, Funnel, PerformanceTimer
   - Added page view tracking in useEffect
   - Instrumented handleFileChange with selection and validation tracking
   - Instrumented handleUpload with 9 progress tracking points
   - Added error tracking in catch block
   - Added performance timing

### Dependencies
- Firebase Analytics
- Firebase Firestore
- Custom analytics service (`@/lib/analytics`)

## Testing Recommendations

### Manual Testing
1. Visit upload page → Check `page_visited` event
2. Select valid file → Check `file_selected` and `validation_passed` events
3. Select invalid file → Check `validation_failed` event
4. Complete upload → Check all 9 progress events and `completed` funnel step
5. Trigger error → Check `failed` funnel step and `error_occurred` event

### Automated Testing
Add Playwright tests to verify:
- Page view tracking on mount
- File selection events fire
- Validation events fire for valid/invalid files
- Progress events fire in sequence during upload
- Completion event fires on success
- Error event fires on failure

### Analytics Verification
```javascript
// In browser console during testing
// (Requires analytics debug mode enabled)

// Check last event
const lastEvent = sessionStorage.getItem('last_analytics_event')
console.log(JSON.parse(lastEvent))

// Check all events in session
const events = sessionStorage.getItem('analytics_events')
console.log(JSON.parse(events))
```

## Future Enhancements

### Potential Additions
1. **Field Extraction Funnel**: Track template parsing and field extraction
2. **Template Usage Tracking**: Link uploads to service creation and usage
3. **User Cohort Analysis**: Compare upload success by user role/tenure
4. **A/B Testing**: Test different upload UI variations
5. **Predictive Alerts**: ML model to predict upload failures
6. **User Satisfaction**: Post-upload survey integration

### Advanced Metrics
- **Template Quality Score**: Based on fields extracted, usage frequency
- **Upload Reliability Index**: Success rate by file size, type, user
- **Performance Benchmarks**: P50, P95, P99 upload times
- **Error Recovery Rate**: Users who retry after failure

## Compliance & Privacy

### Data Retention
- Analytics events stored for 90 days (configurable)
- Personal identifiers (userId) hashed in analytics reports
- File names and content NOT stored in analytics

### GDPR Compliance
- User can request analytics data deletion
- Analytics opt-out supported
- No tracking before cookie consent

## Support & Troubleshooting

### Common Issues
1. **Events not appearing**: Check Firebase Analytics debug mode
2. **Funnel steps missing**: Verify all tracking calls have userId
3. **Duplicate events**: Ensure component not re-rendering unnecessarily
4. **Timing inconsistencies**: Check PerformanceTimer is started/stopped correctly

### Debug Mode
Enable analytics debug in browser console:
```javascript
localStorage.setItem('debug_analytics', 'true')
```

### Contact
For analytics questions: Check `/admin/activity` for live event stream
