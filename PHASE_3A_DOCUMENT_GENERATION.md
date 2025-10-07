# 🎯 Phase 3A: Actual Document Generation - Implementation Guide

## Status: In Progress 🚧

### What We've Completed So Far

#### 1. ✅ Installed Required Libraries
```bash
npm install docxtemplater pizzip jszip-utils file-saver firebase-admin
```

**Libraries:**
- `docxtemplater` - DOCX template processing
- `pizzip` - ZIP file handling for DOCX
- `jszip-utils` - Utility functions for JSZip
- `file-saver` - Client-side file download
- `firebase-admin` - Server-side Firebase operations

#### 2. ✅ Created Firebase Admin Initialization
**File:** `src/lib/firebase-admin.ts`

- Initializes Firebase Admin SDK
- Provides `adminDb` for Firestore operations
- Provides `adminStorage` for Cloud Storage operations
- Uses environment variables for credentials

#### 3. ✅ Created Document Generation Utility
**File:** `src/lib/document-generator.ts`

**Functions:**
- `generateDocument()` - Generate DOCX from template
- `prepareTemplateData()` - Prepare data for rendering
- `extractPlaceholders()` - Extract all placeholders from template
- `validateTemplateData()` - Validate data completeness

#### 4. ✅ Created Document Download API
**File:** `src/app/api/services/[serviceId]/documents/[documentId]/download/route.ts`

- Retrieves document from Cloud Storage
- Returns file with proper headers
- Handles authentication and authorization

---

## Next Steps

### Step 5: Update Generate Documents API

We need to modify `/api/services/generate-documents` to:
1. Load DOCX templates from Cloud Storage
2. Use docxtemplater to populate fields
3. Include AI-generated sections
4. Upload generated documents to Cloud Storage
5. Update service with download URLs

### Step 6: Setup Firebase Storage Rules

Create storage rules for:
- Template uploads (admin only)
- Generated document storage
- Secure download URLs

### Step 7: Create Template Upload Feature

Allow admins to upload DOCX templates to Cloud Storage when creating templates.

### Step 8: Update Frontend

- Wire up download buttons
- Add loading states
- Show generation progress
- Handle errors gracefully

---

## Environment Variables Needed

Add to `.env.local`:
```env
# Firebase Admin (Server-side)
FIREBASE_PROJECT_ID=formgenai-4545
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@formgenai-4545.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=formgenai-4545.appspot.com
```

### How to Get These Values:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (formgenai-4545)
3. Go to **Project Settings** → **Service Accounts**
4. Click **Generate New Private Key**
5. Save the JSON file
6. Extract values from JSON:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY`

---

## Cloud Storage Structure

```
storage/
├── templates/
│   ├── {templateId}/
│   │   └── original.docx          # Original uploaded template
│   └── metadata.json              # Template catalog
│
└── generated/
    └── {serviceId}/
        ├── {documentId}.docx      # Generated document
        └── metadata.json          # Document details
```

---

## API Endpoints

### Generate Documents
**POST** `/api/services/generate-documents`
```json
{
  "serviceId": "service_123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully generated 3 documents",
  "documents": [
    {
      "id": "doc_123",
      "fileName": "Immigration_Petition_John_Doe_Final.docx",
      "downloadUrl": "https://storage.googleapis.com/...",
      "fileSize": 45678,
      "generatedAt": "2025-10-07T10:30:00Z"
    }
  ]
}
```

### Download Document
**GET** `/api/services/{serviceId}/documents/{documentId}/download`

**Response:** Binary DOCX file

---

## Document Generation Flow

```
1. User clicks "Generate Documents"
   ↓
2. API loads service from Firestore
   ↓
3. Verify intake form submitted
   ↓
4. For each template:
   a. Load template DOCX from Storage
   b. Prepare data (client responses + AI sections)
   c. Generate document with docxtemplater
   d. Upload to Storage
   e. Get download URL
   ↓
5. Update service with generated documents
   ↓
6. Return success with download links
```

---

## Error Handling

### Template Loading Errors
- Template not found in storage
- Corrupted template file
- Invalid template format

### Generation Errors
- Missing required fields
- Invalid placeholder syntax
- Docxtemplater errors

### Storage Errors
- Upload failed
- Insufficient permissions
- Storage quota exceeded

---

## Testing Checklist

- [ ] Install all dependencies
- [ ] Setup Firebase Admin credentials
- [ ] Configure storage bucket
- [ ] Upload test template
- [ ] Test document generation
- [ ] Test download endpoint
- [ ] Verify file integrity
- [ ] Test error scenarios
- [ ] Check security rules

---

## Performance Considerations

1. **Parallel Generation**: Generate multiple documents concurrently
2. **Caching**: Cache template files in memory
3. **Streaming**: Stream large files instead of loading in memory
4. **Background Jobs**: Use Cloud Functions for long-running tasks
5. **Progress Updates**: Real-time progress via Firestore

---

## Security Considerations

1. **Authentication**: Verify user is logged in
2. **Authorization**: Check user owns the service
3. **Rate Limiting**: Prevent abuse of generation endpoint
4. **Signed URLs**: Use temporary signed URLs for downloads
5. **Storage Rules**: Restrict direct storage access

---

## Next Immediate Actions

1. **Get Firebase Admin Credentials** (Priority: Critical)
2. **Configure Storage Bucket** (Priority: High)
3. **Test Document Generation Utility** (Priority: High)
4. **Update Generate Documents API** (Priority: High)
5. **Wire Up Frontend** (Priority: Medium)

---

## Questions to Resolve

1. Where are template DOCX files currently stored?
2. Do we have sample templates to test with?
3. Should we support PDF export immediately or later?
4. Do we need document versioning?
5. Should generated documents expire after X days?

---

## Status: Waiting for Firebase Admin Setup

Before we can proceed with actual document generation, we need:
1. Firebase Admin service account credentials
2. Storage bucket configured
3. Template files uploaded to storage

Once these are ready, we can complete the implementation and test end-to-end!
