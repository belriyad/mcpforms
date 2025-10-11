# 🧪 Manual Testing Guide - Document Download & Timestamp Fixes

## Quick Test URL
**Production:** https://formgenai-4545.web.app

---

## 🎯 Test Scenario: Complete Workflow

### Step 1: Login
1. Go to https://formgenai-4545.web.app/login
2. Login with: `belal.riyad@gmail.com` / `9920032`
3. ✅ Should see admin dashboard

### Step 2: Create Service (Or Use Existing)

**Option A: Use Existing Service**
1. Go to Services list
2. Click on any recent service with "intake_submitted" status
3. Skip to Step 3

**Option B: Create New Service**
1. Click "Create New Service"
2. Fill in service details
3. Select a template (e.g., "Revocable Living Trust")
4. Skip AI customization
5. Review and click "Create & Send"
6. Note the service ID and intake token
7. Continue to Step 3

### Step 3: Submit Intake Form (If Creating New)
1. Open intake form URL: `https://formgenai-4545.web.app/intake/[TOKEN]`
2. Fill all fields:
   - Text fields: Any test values
   - Date fields: Pick any date
   - Dropdowns: Select any option
3. Click "Submit"
4. ✅ Form should submit successfully

### Step 4: Generate Documents
1. Go back to admin dashboard
2. Open the service detail page
3. You should see: **"Generate All Documents"** button
4. Click the button
5. ⏳ Wait 5-10 seconds for generation
6. ✅ Success message should appear

### Step 5: Verify Timestamp ⭐ **TEST ISSUE #1**
1. Look for the green success box
2. Should display: **"Documents generated on [DATE/TIME]"**
3. ✅ **PASS:** Shows actual date like "10/11/2025, 11:45:30 AM"
4. ❌ **FAIL:** Shows "Invalid Date"

**Expected:**
```
✅ Documents generated on 10/11/2025, 11:45:30 AM
```

**NOT:**
```
❌ Documents generated on Invalid Date
```

### Step 6: Test Individual Download ⭐ **TEST ISSUE #2A**
1. Find the document card (shows template name, field count)
2. Look for the **"Download"** button
3. Button should be:
   - **Blue and clickable** if document ready
   - **Gray and disabled** with "Generating..." if not ready
4. Click **"Download"** button
5. ✅ **PASS:** Browser downloads a `.docx` file with proper name
6. ❌ **FAIL:** Shows alert "Document download will be available soon"

**Expected:**
```
✅ Revocable_Living_Trust_E2E_Test_Client_Final.docx downloaded
```

**NOT:**
```
❌ Alert: "Document download will be available soon!"
```

### Step 7: Open Downloaded DOCX
1. Open the downloaded file in Microsoft Word / Google Docs / LibreOffice
2. ✅ **PASS:** File opens successfully
3. ✅ **PASS:** Fields are populated with form data (client name, dates, etc.)
4. ✅ **PASS:** Document is properly formatted

### Step 8: Test "Download All" ⭐ **TEST ISSUE #2B**
1. Scroll to bottom of Document Generation section
2. Find the **"Download All Documents"** button (gradient blue/indigo)
3. Click the button
4. ✅ **PASS:** All documents download sequentially (500ms delay between each)
5. ✅ **PASS:** Success alert shows: "Downloaded X document(s)"
6. ❌ **FAIL:** Shows alert "ZIP download will be available soon"

**Expected:**
```
✅ Downloaded 1 document(s)
[Browser downloads each .docx file]
```

**NOT:**
```
❌ Alert: "ZIP download will be available soon!"
```

---

## 🐛 Troubleshooting

### Issue: Button says "Generating..." forever
**Cause:** Document generation may have failed
**Solution:** 
1. Check browser console for errors
2. Try clicking "Generate All Documents" again
3. Check Cloud Storage for files: `services/[serviceId]/documents/`

### Issue: Download fails with error
**Cause:** File not found in storage or API error
**Solution:**
1. Check browser console for error message
2. Verify document has `downloadUrl` in Firestore
3. Check Cloud Storage for file existence

### Issue: DOCX file is corrupted
**Cause:** Template or field mapping issue
**Solution:**
1. Verify template file exists in Cloud Storage
2. Check template has proper placeholders
3. Review console logs for docxtemplater errors

---

## ✅ Success Criteria

Both issues are fixed if:

### Issue #1: Timestamp Display
- [ ] Shows actual date/time (e.g., "10/11/2025, 11:45:30 AM")
- [ ] No "Invalid Date" text
- [ ] Format is readable and localized

### Issue #2: Document Download
- [ ] Individual "Download" buttons work
- [ ] Files download with correct names
- [ ] DOCX files open successfully
- [ ] Fields are populated correctly
- [ ] "Download All Documents" button works
- [ ] Multiple files download sequentially
- [ ] No placeholder alerts appear

---

## 📊 Test Report Template

```markdown
## Test Results - [Your Name] - [Date/Time]

### Environment
- URL: https://formgenai-4545.web.app
- Account: belal.riyad@gmail.com
- Browser: Chrome/Safari/Firefox [Version]
- Service ID: [ID from test]

### Issue #1: Timestamp Display
- Status: ✅ PASS / ❌ FAIL
- Screenshot: [Attach if failed]
- Notes: [Any observations]

### Issue #2A: Individual Download
- Status: ✅ PASS / ❌ FAIL
- File Downloaded: ✅ YES / ❌ NO
- File Name: [Actual filename]
- File Opens: ✅ YES / ❌ NO
- Fields Populated: ✅ YES / ❌ NO / ⚠️ PARTIAL
- Screenshot: [Attach if failed]
- Notes: [Any observations]

### Issue #2B: Download All
- Status: ✅ PASS / ❌ FAIL
- Files Downloaded: [Count]
- All Files Valid: ✅ YES / ❌ NO
- Screenshot: [Attach if failed]
- Notes: [Any observations]

### Overall Result
- Both Issues Fixed: ✅ YES / ❌ NO
- Ready for Production: ✅ YES / ❌ NO
```

---

## 🚀 Quick Commands (For Developers)

### Check Recent Services
```bash
# In browser console on admin page
console.log(document.querySelector('[data-service-id]')?.dataset?.serviceId)
```

### Force Regenerate Documents
1. Go to service detail page
2. Open browser console
3. Run:
```javascript
fetch('/api/services/generate-documents', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ serviceId: 'YOUR_SERVICE_ID' })
}).then(r => r.json()).then(console.log)
```

### Check Document Metadata in Console
```javascript
// On service detail page
const service = JSON.parse(document.querySelector('[data-service]')?.dataset?.service || '{}');
console.log('Generated Documents:', service.generatedDocuments);
console.log('Timestamp:', service.documentsGeneratedAt);
```

---

## 📝 Notes

- Document generation takes 5-10 seconds
- Downloads may be blocked by browser popup blocker (allow popups)
- Sequential downloads have 500ms delay to avoid browser blocking
- Files are publicly accessible via Cloud Storage URLs
- Template must exist in Cloud Storage for generation to work

---

**Last Updated:** October 11, 2025  
**Deployed Version:** Latest (post-fix)  
**Test Status:** Ready for manual verification
