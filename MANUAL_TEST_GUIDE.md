# 🚀 Manual Template Upload & Testing Guide

## Quick Steps (5 Minutes)

### Step 1: Upload New Template (2 min)
1. Open: https://formgenai-4545.web.app/login
2. Login with:
   - Email: `e2etest1760215582016@mcpforms.test`
   - Password: `E2ETest123!`
3. Click "Templates" in sidebar
4. Click "Upload Template" or "New Template" button
5. Select file: `test-files/sample-template.docx` (Warranty Deed Template)
6. Wait 30-60 seconds for AI field extraction
7. You'll see the new template appear in the list

### Step 2: Create Service (1 min)
1. Click "Services" in sidebar
2. Click "Create Service" or "New Service"
3. Fill in:
   - Service Name: `Test Service ${Date.now()}`
   - Select your newly uploaded template
4. Click "Create" or "Submit"
5. You'll be redirected to the service detail page
6. **Copy the Service ID from the URL** (e.g., `/services/ABC123xyz`)

### Step 3: Test Document Generation (2 min)
1. On the service detail page, look for documents list
2. Click "Regenerate Documents" button
3. Watch the console (F12 → Console tab) for logs
4. **Wait 3-10 seconds** - buttons should automatically enable
5. Download buttons should turn blue and become clickable
6. Click "Download" to test downloading a document

---

## Expected Results

### ✅ Success Indicators:

**Console Logs (F12 → Console)**:
```
✅ API returned success
📊 Status: 1/1 documents have download URLs
🔄 Documents updated successfully
```

**UI Changes**:
- Alert appears: "✅ Successfully generated 1 document(s)!"
- Download buttons turn from gray to blue
- Buttons change from disabled to enabled
- Clicking download actually downloads a DOCX file

**Timing**:
- Initial wait: 3 seconds
- Backup refresh: 5 seconds
- Final backup: 10 seconds
- Total max wait: ~10 seconds

### ❌ If Still Failing:

**Console Shows**:
```
❌ Error: [error message]
📊 Status: 0/1 documents have download URLs
```

**What to Check**:
1. Go to Firebase Console: https://console.firebase.google.com/project/formgenai-4545/functions/logs
2. Filter by "generate-documents"
3. Look for errors about template loading
4. Check if template file exists in Storage

---

## Automated Testing

Once you have a working service, run:

```bash
# Test with your service ID
node test-api-generation.js

# Or run automated UI test
npx playwright test tests/regenerate-button-debug.spec.ts --project=chromium
```

---

## Service ID for Automation

After creating your service, update `.env.test`:

```bash
TEST_SERVICE_ID=YOUR_NEW_SERVICE_ID_HERE
```

Then run automated tests against this service.

---

## 📞 Troubleshooting

### Template Upload Issues
- Make sure file is a valid DOCX (not DOC or PDF)
- File should be < 10MB
- Wait full 60 seconds for AI processing

### Generation Issues
- Check Functions logs in Firebase Console
- Verify template exists in Cloud Storage
- Make sure storagePath field is populated in Firestore

### Download Button Issues
- If buttons don't enable after 10 seconds, check console
- Look for API errors or failed document statuses
- Try clicking "Regenerate Documents" again

---

## 🎯 The Fix We Implemented

All the code enhancements are deployed:
- ✅ 3-layer refresh strategy (3s, 5s, 10s)
- ✅ Enhanced error handling
- ✅ Detailed console logging
- ✅ Better API responses

**Once you have a service with a valid template, everything should work automatically!**

---

Ready? Start with Step 1 above! 🚀
