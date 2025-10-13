# Feature #13: AI Preview Modal - Manual Testing Guide

**Date**: October 13, 2025  
**Tester**: _______________  
**Environment**: □ Development  □ Staging  □ Production  
**OpenAI API Key**: □ Configured  □ Working  

---

## ⚙️ Pre-Testing Setup

### 1. Start Development Server
```bash
cd /Users/rubazayed/MCPForms/mcpforms
npm run dev
```

### 2. Verify Environment
- [ ] Server running at `http://localhost:3000`
- [ ] Firebase connected (check console for errors)
- [ ] OpenAI API key set in `.env.local`
- [ ] Test user account created (email/password)

### 3. Open Browser Developer Tools
- [ ] Console tab open (watch for errors)
- [ ] Network tab open (watch API calls)
- [ ] Preserve log enabled

---

## 🧪 Test Suite 1: Feature Flag

### Test 1.1: Enable AI Preview Modal Feature
**Steps**:
1. Navigate to `http://localhost:3000/login`
2. Login with test credentials
3. Navigate to `/admin/labs`
4. Find "AI Preview Modal" toggle
5. Click to enable (check)
6. Refresh page

**Expected**:
- [ ] Toggle persists after refresh
- [ ] No errors in console
- [ ] Labs page loads correctly

**Actual**: _____________________________________________

**Status**: □ Pass  □ Fail  □ Skip

**Screenshot**: _____________________________________________

---

### Test 1.2: Disable Feature (Legacy Mode)
**Steps**:
1. Go to `/admin/labs`
2. Disable "AI Preview Modal" toggle
3. Navigate to a service detail page
4. Click "Add AI Section" (if available)
5. Generate AI content

**Expected**:
- [ ] Alert appears: "✅ AI section generated successfully!"
- [ ] No preview modal appears
- [ ] Content auto-saved (legacy behavior)

**Actual**: _____________________________________________

**Status**: □ Pass  □ Fail  □ Skip

---

## 🧪 Test Suite 2: AI Generation & Preview

### Test 2.1: Trigger AI Generation
**Steps**:
1. Ensure feature flag is ON
2. Navigate to `/admin/services`
3. Click on any existing service (or create new one)
4. Look for "Add AI Section" or similar AI button
5. Click the button

**Expected**:
- [ ] AI input modal opens
- [ ] Has placeholder input field
- [ ] Has prompt/description textarea
- [ ] Has "Generate" button
- [ ] Has "Cancel" button

**Actual**: _____________________________________________

**Status**: □ Pass  □ Fail  □ Skip

**Screenshot**: _____________________________________________

---

### Test 2.2: Generate AI Content
**Steps**:
1. In AI input modal, enter:
   - Placeholder: `{{test_liability_clause}}`
   - Prompt: `Generate a liability limitation clause that protects the service provider while maintaining professional tone. Include standard indemnification language.`
2. Click "Generate AI Section"
3. Wait 5-30 seconds

**Expected**:
- [ ] Loading state shows ("Generating...")
- [ ] Preview modal appears after generation
- [ ] Input modal closes automatically

**API Call Check (Network Tab)**:
- [ ] POST to `/api/services/generate-ai-section`
- [ ] Status: 200 OK
- [ ] Response includes: `{ success: true, preview: true, data: {...} }`
- [ ] Temperature in request: `0.3` (not 0.7)

**Actual**: _____________________________________________

**Status**: □ Pass  □ Fail  □ Skip

**Screenshot**: _____________________________________________

---

### Test 2.3: Verify Preview Modal UI
**Steps**:
1. After AI generation, inspect preview modal

**Expected UI Elements**:
- [ ] Modal has gradient header (purple/pink)
- [ ] Header shows "AI Preview" or similar title
- [ ] **Confidence badge displays** (e.g., "87% Confidence")
- [ ] Badge is color-coded:
  - Green if ≥80%
  - Yellow if 60-80%
  - Red if <60%
- [ ] **Warning banner prominent**: "AI-Generated Content - Review Required"
- [ ] Banner has warning icon
- [ ] Context section shows:
  - Template name
  - Placeholder (e.g., `{{test_liability_clause}}`)
- [ ] **Content in editable textarea**
- [ ] Textarea shows generated legal text
- [ ] **Word count displays** (e.g., "145 words")
- [ ] **Character count displays**
- [ ] **Collapsible prompt section** (show/hide original prompt)
- [ ] **Quality feedback buttons**:
  - 👍 "Good" button
  - 👎 "Needs Work" button
- [ ] **Three action buttons visible**:
  - "Cancel" (gray)
  - "Regenerate" (outline)
  - "Accept & Insert" (gradient, prominent)

**Actual**: _____________________________________________

**Status**: □ Pass  □ Fail  □ Skip

**Screenshot**: _____________________________________________

---

## 🧪 Test Suite 3: Content Editing

### Test 3.1: Edit Content Before Accept
**Steps**:
1. In preview modal textarea, modify the generated text
2. Change at least 10-20 words
3. Observe UI changes

**Expected**:
- [ ] Textarea remains editable
- [ ] Word count updates in real-time
- [ ] Blue info message appears: "You have edited this content. Your changes will be saved."
- [ ] "Accept & Insert" button remains enabled

**Actual**: _____________________________________________

**Status**: □ Pass  □ Fail  □ Skip

---

### Test 3.2: Accept Edited Content
**Steps**:
1. After editing, click "Accept & Insert"
2. Wait for response

**Expected**:
- [ ] Button shows loading state ("Accepting...")
- [ ] Modal closes after 1-3 seconds
- [ ] Success indication (toast or page update)
- [ ] Service page updates with new AI section

**API Call Check (Network Tab)**:
- [ ] POST to `/api/services/accept-ai-section`
- [ ] Status: 200 OK
- [ ] Request body includes:
  - `originalContent` (what AI generated)
  - `content` (what you edited)
  - `userEdits` (the edited version)
  - `wasEdited: true`

**Actual**: _____________________________________________

**Status**: □ Pass  □ Fail  □ Skip

**Screenshot**: _____________________________________________

---

## 🧪 Test Suite 4: Accept As-Is

### Test 4.1: Accept Without Editing
**Steps**:
1. Generate new AI section
2. In preview modal, do NOT edit content
3. Click thumbs up (👍 "Good") for quality feedback
4. Click "Accept & Insert"

**Expected**:
- [ ] No "You have edited" message appears
- [ ] Modal closes successfully
- [ ] Content saved to service

**API Call Check**:
- [ ] `userEdits`: `undefined` or `null`
- [ ] `wasEdited`: `false`
- [ ] `feedback`: `"positive"`

**Actual**: _____________________________________________

**Status**: □ Pass  □ Fail  □ Skip

---

## 🧪 Test Suite 5: Regenerate

### Test 5.1: Regenerate Content
**Steps**:
1. Generate AI section
2. In preview modal, click "Regenerate" button
3. Wait for new content

**Expected**:
- [ ] Button shows loading state ("Regenerating...")
- [ ] Modal stays open
- [ ] Content textarea updates with NEW text
- [ ] Confidence score recalculates (may change)
- [ ] Prompt remains the same (unchanged)
- [ ] Word count updates
- [ ] Previous edits are cleared

**API Call Check**:
- [ ] POST to `/api/services/generate-ai-section` (same endpoint)
- [ ] Same prompt in request body
- [ ] Different content in response

**Actual**: _____________________________________________

**Status**: □ Pass  □ Fail  □ Skip

---

### Test 5.2: Regenerate Multiple Times
**Steps**:
1. Click "Regenerate" 3 times in a row
2. Observe content changes

**Expected**:
- [ ] Each regeneration produces different content
- [ ] Confidence scores may vary (70-95% range)
- [ ] No errors after multiple regenerations
- [ ] Modal remains stable

**Actual**: _____________________________________________

**Status**: □ Pass  □ Fail  □ Skip

---

## 🧪 Test Suite 6: Cancel & Quality Feedback

### Test 6.1: Cancel Preview
**Steps**:
1. Generate AI section
2. In preview modal, click "Cancel" button

**Expected**:
- [ ] Modal closes immediately
- [ ] Nothing saved to service
- [ ] No API call to accept endpoint
- [ ] User returns to service page

**Actual**: _____________________________________________

**Status**: □ Pass  □ Fail  □ Skip

---

### Test 6.2: Negative Feedback
**Steps**:
1. Generate AI section
2. Click thumbs down (👎 "Needs Work")
3. Click "Accept & Insert" anyway

**Expected**:
- [ ] Feedback button highlights (shows selected)
- [ ] Can still accept with negative feedback
- [ ] API call includes `feedback: "negative"`

**Actual**: _____________________________________________

**Status**: □ Pass  □ Fail  □ Skip

---

## 🧪 Test Suite 7: Activity Logging

### Test 7.1: Verify Activity Log Entry
**Steps**:
1. Accept an AI section (with or without edits)
2. Navigate to `/admin/activity`
3. Look for latest entry

**Expected Activity Log Entry**:
- [ ] Type: `ai_section_accepted`
- [ ] Timestamp: recent (within 1 minute)
- [ ] User ID: your user ID
- [ ] Service ID: the service you modified
- [ ] Meta includes:
  - `wasEdited`: true or false
  - `feedback`: "positive", "negative", or null
  - `originalLength`: character count
  - `finalLength`: character count
  - `model`: "gpt-4o-mini"
  - `temperature`: 0.3

**Actual**: _____________________________________________

**Status**: □ Pass  □ Fail  □ Skip

**Screenshot**: _____________________________________________

---

## 🧪 Test Suite 8: Edge Cases

### Test 8.1: Very Long Content (1000+ words)
**Steps**:
1. Generate AI section with prompt: "Generate a comprehensive 2000-word terms of service agreement"
2. Verify preview modal handles long content

**Expected**:
- [ ] Textarea scrolls properly
- [ ] Word count accurate (2000+)
- [ ] Accept button still works
- [ ] No UI breaking

**Actual**: _____________________________________________

**Status**: □ Pass  □ Fail  □ Skip

---

### Test 8.2: Very Short Content (1 sentence)
**Steps**:
1. Generate AI section with prompt: "Generate a one-sentence disclaimer"
2. Verify confidence score

**Expected**:
- [ ] Content generates successfully
- [ ] Confidence score lower (60-75% range)
- [ ] Still shows yellow or red badge
- [ ] Accept button still works

**Actual**: _____________________________________________

**Status**: □ Pass  □ Fail  □ Skip

---

### Test 8.3: Special Characters
**Steps**:
1. Generate content with prompt: "Include special characters: © ® ™ § ¶ €"
2. Accept content

**Expected**:
- [ ] Special characters display correctly
- [ ] No encoding issues
- [ ] Saves properly to Firestore

**Actual**: _____________________________________________

**Status**: □ Pass  □ Fail  □ Skip

---

### Test 8.4: Network Error Handling
**Steps**:
1. Open Network tab in DevTools
2. Set throttling to "Offline"
3. Try to generate AI section
4. Restore network

**Expected**:
- [ ] Error message displays (not silent failure)
- [ ] User can retry
- [ ] Modal doesn't break

**Actual**: _____________________________________________

**Status**: □ Pass  □ Fail  □ Skip

---

## 🧪 Test Suite 9: Confidence Scoring

### Test 9.1: High Confidence Content (80%+)
**Steps**:
1. Generate content with legal terminology: "Generate a contract with terms like 'indemnify', 'liability', 'warranty', 'parties', and 'agreement'"
2. Check confidence score

**Expected**:
- [ ] Score: 85-95%
- [ ] Badge: Green
- [ ] Icon: CheckCircle2

**Actual**: _____________________________________________

**Status**: □ Pass  □ Fail  □ Skip

---

### Test 9.2: Low Confidence Content (<70%)
**Steps**:
1. Generate very basic content: "Write 'Hello world'"
2. Check confidence score

**Expected**:
- [ ] Score: 70-75% (minimum)
- [ ] Badge: Yellow or Red
- [ ] Warning: Low confidence

**Actual**: _____________________________________________

**Status**: □ Pass  □ Fail  □ Skip

---

## 🧪 Test Suite 10: Browser Compatibility

### Test 10.1: Chrome
- [ ] All features work
- [ ] Modal displays correctly
- [ ] No console errors

### Test 10.2: Firefox
- [ ] All features work
- [ ] Modal displays correctly
- [ ] No console errors

### Test 10.3: Safari
- [ ] All features work
- [ ] Modal displays correctly
- [ ] No console errors

---

## 🧪 Test Suite 11: Mobile Responsiveness

### Test 11.1: Mobile View (iPhone)
**Steps**:
1. Open DevTools, toggle device emulation
2. Select iPhone 12 Pro
3. Generate AI section

**Expected**:
- [ ] Modal fits screen width
- [ ] Buttons stack vertically
- [ ] Textarea scrollable
- [ ] Touch-friendly button sizes

**Status**: □ Pass  □ Fail  □ Skip

---

## 📊 Test Summary

### Results
- **Total Tests**: 25
- **Passed**: _____
- **Failed**: _____
- **Skipped**: _____
- **Pass Rate**: _____%

### Critical Issues Found
1. _____________________________________________
2. _____________________________________________
3. _____________________________________________

### Non-Critical Issues
1. _____________________________________________
2. _____________________________________________

### Recommendations
1. _____________________________________________
2. _____________________________________________

---

## ✅ Sign-Off

**Tester Name**: _______________________  
**Date**: _______________________  
**Time Spent**: _______________________  
**Overall Status**: □ Ready for Production  □ Needs Fixes  □ Blocked  

**Notes**: 
_____________________________________________
_____________________________________________
_____________________________________________

---

## 📸 Required Screenshots

Upload screenshots to `/e2e-screenshots/manual-testing/`:

1. `01-feature-flag-enabled.png` - Labs page with toggle ON
2. `02-ai-input-modal.png` - AI section input modal
3. `03-preview-modal-full.png` - Complete preview modal view
4. `04-confidence-badge-green.png` - High confidence (80%+)
5. `05-edited-content-indicator.png` - "You have edited" message
6. `06-activity-log-entry.png` - Activity log with ai_section_accepted
7. `07-regenerated-content.png` - After regeneration
8. `08-quality-feedback-selected.png` - Thumbs up/down selected

---

## 🔍 Firestore Verification

After testing, verify Firestore data:

### Check Service Document
```javascript
// In browser console:
const serviceId = 'YOUR_SERVICE_ID'
const docRef = doc(db, 'services', serviceId)
const snapshot = await getDoc(docRef)
console.log(snapshot.data().aiSections)
```

**Expected aiSection structure**:
```json
{
  "id": "ai_...",
  "templateId": "...",
  "placeholder": "{{test_liability_clause}}",
  "prompt": "Generate a liability...",
  "originalContent": "The AI generated text...",
  "finalContent": "The edited text...",
  "model": "gpt-4o-mini",
  "temperature": 0.3,
  "generatedAt": "2025-10-13T...",
  "approved": true,
  "approvedAt": "2025-10-13T...",
  "approvedBy": "USER_ID",
  "userEdits": "The edited text..." or null,
  "wasEdited": true or false,
  "feedback": "positive" or "negative" or null
}
```

---

## 🚀 Production Readiness Checklist

Before enabling in production:

- [ ] All critical tests passed
- [ ] No console errors
- [ ] Activity logging works
- [ ] Feature flag tested (ON/OFF)
- [ ] Temperature confirmed at 0.3
- [ ] Audit trail complete
- [ ] Mobile responsive
- [ ] Cross-browser compatible
- [ ] Performance acceptable (<30s generation)
- [ ] Error handling robust
- [ ] Backup/rollback plan ready

---

**END OF MANUAL TESTING GUIDE**
