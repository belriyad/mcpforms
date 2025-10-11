# 🔧 Quick Fix: Download Not Working

## Issue
Download button shows "Generating..." and won't download

## Root Cause
Documents were generated BEFORE the fix was deployed, so they don't have `downloadUrl` set.

## ✅ Solution (2 minutes)

### Step 1: Open Service
1. Go to https://formgenai-4545.web.app
2. Login with your credentials
3. Open any service with submitted intake form

### Step 2: Regenerate Documents
1. Scroll to "Document Generation" section
2. Click **"Generate All Documents"** button again
3. Wait 5-10 seconds

### Step 3: Download
1. Button should now show "Download" (not "Generating...")
2. Click "Download" to get your DOCX file
3. File should download immediately

---

## Why This Happens

**Before Fix:**
- API tried to download non-existent template files
- Failed silently
- Never set `downloadUrl`
- Old documents in database: `downloadUrl: null`

**After Fix:**
- API creates simple DOCX when template missing
- Always sets `downloadUrl`
- New documents in database: `downloadUrl: "https://..."`

**BUT:** Old documents in database still have `downloadUrl: null`

**Solution:** Regenerate documents to create new ones with downloadUrl

---

## Verification

### Button States:

**If button shows "Generating..." (disabled):**
```typescript
// Document in database:
{
  downloadUrl: null  // ❌ Old document, needs regeneration
}
```

**If button shows "Download" (enabled):**
```typescript
// Document in database:
{
  downloadUrl: "https://storage.googleapis.com/..."  // ✅ New document, ready
}
```

### Console Check (Optional):

Open browser console on service page and run:
```javascript
// Check if documents have downloadUrl
const service = JSON.parse(document.querySelector('[data-service]')?.dataset?.service || '{}');
console.log('Documents:', service.generatedDocuments);
service.generatedDocuments?.forEach((doc, i) => {
  console.log(`Document ${i + 1}:`, {
    name: doc.fileName,
    hasDownloadUrl: !!doc.downloadUrl,
    url: doc.downloadUrl
  });
});
```

---

## Alternative: Delete Old Documents (If Regeneration Doesn't Work)

If clicking "Generate All Documents" again doesn't work:

1. Go to Firebase Console
2. Open Firestore Database
3. Find your service document
4. **Delete** the `generatedDocuments` field
5. Click "Generate All Documents" again
6. Downloads should now work

---

## Test Services

### From Latest E2E Test:
- **Service ID:** `2F3GSb5UJobtRzU9Vjvv`
- **Token:** `intake_1760172674999_8i05bdp7c`
- **Status:** Has submitted intake, ready for document generation

### Steps to Test:
1. Go to: https://formgenai-4545.web.app/admin/services/2F3GSb5UJobtRzU9Vjvv
2. Click "Generate All Documents"
3. Wait 10 seconds
4. Check if "Download" button appears
5. Click "Download"
6. File should download

---

## Expected Behavior

### Success Indicators:
1. ✅ Button changes from "Generating..." to "Download"
2. ✅ Button is blue and clickable (not gray/disabled)
3. ✅ Clicking downloads a `.docx` file
4. ✅ File opens in Word/Google Docs
5. ✅ File contains form data

### Timing:
- Document generation: 5-10 seconds
- Button state update: Immediate after page reload
- Download trigger: Instant on click

---

## Troubleshooting

### Issue: Button still shows "Generating..." after regeneration
**Cause:** Page not refreshed
**Fix:** Reload the page (Cmd+R / Ctrl+R)

### Issue: Download button shows but click does nothing
**Cause:** Browser blocking download or JavaScript error
**Fix:** 
1. Check browser console for errors
2. Allow popups for the site
3. Try different browser

### Issue: Downloaded file is corrupt
**Cause:** File generation error
**Fix:** 
1. Check browser console logs
2. Regenerate documents
3. Check Cloud Storage for file existence

### Issue: API returns 404
**Cause:** Document not in Cloud Storage
**Fix:** Regenerate documents (uploads new files)

---

## Technical Details

### Document Structure (After Fix):
```typescript
{
  id: "doc_1760173464_abc123",
  fileName: "Trust_Client_Final.docx",
  templateName: "Revocable Living Trust",
  status: "generated",
  downloadUrl: "https://storage.googleapis.com/formgenai-4545.appspot.com/services/...",  // ✅ Set
  storagePath: "services/ABC123/documents/doc_xyz/Trust.docx",  // ✅ Set
  fileSize: 12345,  // ✅ Set
  populatedFields: { ... },
  generatedAt: "2025-10-11T09:04:52.000Z"
}
```

### Download Flow:
1. User clicks "Download" button
2. Frontend checks: `if (!doc.downloadUrl) return`
3. Frontend calls: `/api/services/[serviceId]/documents/[documentId]/download`
4. Backend reads: `doc.storagePath` from Firestore
5. Backend downloads: File from Cloud Storage
6. Backend returns: File blob
7. Frontend creates: Blob URL
8. Frontend triggers: Browser download

---

## Quick Commands

### Open Service in Browser:
```bash
open "https://formgenai-4545.web.app/admin/services/2F3GSb5UJobtRzU9Vjvv"
```

### Check Firebase Logs:
```bash
firebase functions:log --only ssrformgenai4545
```

### Redeploy (If Needed):
```bash
npm run build
firebase deploy --only hosting
./set-env-vars.sh
```

---

**TL;DR:** Click "Generate All Documents" again to create new documents with download URLs. Old documents from before the fix don't have download URLs set.
