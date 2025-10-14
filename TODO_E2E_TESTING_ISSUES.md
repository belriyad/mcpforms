# E2E Testing Issues & TODO Work Items

**Date**: October 14, 2025  
**Test Run**: Complete E2E Workflow (Login → Document Generation)  
**Status**: Partial completion - Reaches Step 6/9 consistently

## 🎯 Test Coverage Summary

### ✅ Working Steps (Consistently Pass)
- ✅ **Step 1**: Login with existing account
- ✅ **Step 2**: Create service (all 4 wizard steps)
- ✅ **Step 3**: Generate intake form
- ✅ **Step 4**: Open intake form (client view)
- ✅ **Step 5**: Fill intake form (8 fields)
- ⏳ **Step 6**: Submit intake form (button clicks, but confirmation unclear)

### ⏳ Partially Working Steps
- ⏳ **Step 7**: Review submission as admin
- ⏳ **Step 8**: Approve submission
- ⏳ **Step 9**: Generate and download document (NEW - not yet tested)

## 🐛 Critical Issues Found

### Issue #1: Test Interruption During Step 6
**Priority**: 🔴 Critical  
**Status**: Needs Investigation

**Symptom**:
- Test consistently stops after clicking submit button
- Error: `page.waitForTimeout: Test ended`
- Occurs at line 727 in core-scenarios.spec.ts

**Root Cause**:
- Test waits 5 seconds for submission confirmation
- No success message detected
- Test times out or gets interrupted

**Impact**:
- Steps 7-9 never execute
- Document generation not tested
- Unknown if submission actually succeeds

**TODO**:
- [ ] Increase timeout from 5s to 15s for submission
- [ ] Add multiple success indicator checks
- [ ] Remove hard timeout, use event-based waiting
- [ ] Add retry logic for submission
- [ ] Check if submission actually completes in database
- [ ] Add better error logging for submission failures

**Suggested Fix**:
```typescript
// Instead of:
await page.waitForTimeout(5000);

// Use:
await Promise.race([
  page.waitForSelector('text=/success|submitted|thank you/i', { timeout: 15000 }),
  page.waitForURL(/\/intake\/.*\/success/, { timeout: 15000 })
]).catch(() => console.log('⚠️  No confirmation message'));
```

---

### Issue #2: Intake Form Submission Confirmation
**Priority**: 🟡 High  
**Status**: Needs Fix

**Symptom**:
```
⏳ Waiting for form submission...
❌ STEP 6 FAILED: page.waitForTimeout: Test ended.
```

**Root Cause**:
- No clear success message after submission
- No redirect to confirmation page
- Hard timeout instead of event-based waiting

**Impact**:
- Can't verify submission succeeded
- Test appears to fail even if submission works
- False negatives in test results

**TODO**:
- [ ] Check if intake form shows success message after submit
- [ ] Verify submission creates record in Firestore
- [ ] Add success page/modal after submission
- [ ] Update test to check database instead of UI
- [ ] Add better loading indicators during submission
- [ ] Implement proper form validation feedback

**Suggested Implementation**:
```typescript
// After submit click
const submissionResult = await Promise.race([
  page.waitForSelector('[data-testid="success-message"]'),
  page.waitForURL(/success/),
  page.waitForFunction(() => 
    document.body.textContent?.includes('Thank you') ||
    document.body.textContent?.includes('Submitted')
  )
]).catch(() => null);

if (!submissionResult) {
  // Check database as fallback
  const submitted = await checkFirestoreForSubmission(serviceId);
  console.log(submitted ? '✅ Verified in DB' : '❌ Not found in DB');
}
```

---

### Issue #3: Admin Dashboard Cold Start Performance
**Priority**: 🟡 High  
**Status**: Partially Mitigated

**Symptom**:
- Admin page takes >30 seconds to load on first request
- Causes test timeouts
- Error: `page.waitForURL: Test timeout of 30000ms exceeded`

**Root Cause**:
- Firebase Cloud Function cold start
- 256MB memory insufficient
- No warm instances configured

**Current Mitigation**:
- Increased memory to 512MB in firebase.json
- Not yet deployed

**Impact**:
- Tests timeout on admin page navigation
- Scenarios 1, 2, 3 fail on fresh function start
- User experience degraded on first visit

**TODO**:
- [ ] Deploy firebase.json with 512MB memory setting
- [ ] Monitor function cold start times in Firebase Console
- [ ] Consider adding minInstances: 1 (costs ~$10/month)
- [ ] Implement function pre-warming strategy
- [ ] Add loading indicators on admin pages
- [ ] Optimize admin dashboard bundle size
- [ ] Implement code splitting for faster initial load

**Current Config** (firebase.json):
```json
"frameworksBackend": {
  "region": "us-central1",
  "memory": "512MiB",
  "concurrency": 80
}
```

**Deployment Status**: ⏳ Pending
```bash
# Need to deploy
firebase deploy --only hosting
```

---

### Issue #4: Document Generation Not Tested Yet
**Priority**: 🟢 Medium  
**Status**: Blocked by Issue #1

**Symptom**:
- Test never reaches Step 9 (document generation)
- Unknown if generate button works
- Unknown if download works
- New Scenario 7 not executed

**Root Cause**:
- Test stops at Step 6 submission
- Can't proceed to admin review and generation

**Impact**:
- No validation of core feature (document generation)
- Can't verify end-to-end workflow completion
- Missing critical test coverage

**TODO**:
- [ ] Fix Issue #1 to allow test to proceed
- [ ] Run test to completion to reach Step 9
- [ ] Verify generate button appears after submission
- [ ] Verify document generation completes
- [ ] Verify download button appears
- [ ] Verify file downloads successfully
- [ ] Verify file is correct format (.docx)
- [ ] Add assertions for document content

**Test Readiness**:
- ✅ Code implemented (Scenario 7 & Step 9)
- ✅ Download directory created
- ✅ File verification logic added
- ⏳ Awaiting test execution

---

### Issue #5: No Template Validation in Tests
**Priority**: 🟢 Medium  
**Status**: Needs Implementation

**Symptom**:
- Test assumes templates exist
- Fails silently if no templates
- Error: "Found 0 template cards"

**Root Cause**:
- No pre-test setup to verify prerequisites
- No template seeding in test data
- Relies on manual template upload

**Impact**:
- Test fails for new users with no templates
- Hard to reproduce test environment
- Manual setup required before each test run

**TODO**:
- [ ] Add test prerequisite validation
- [ ] Create template seeding script (attempted, needs fix)
- [ ] Add beforeAll hook to check template existence
- [ ] Create sample template fixtures
- [ ] Document template requirements in README
- [ ] Add helpful error message if templates missing

**Suggested Implementation**:
```typescript
beforeAll(async () => {
  // Check templates exist
  const templates = await db.collection('templates')
    .where('uploadedBy', '==', TEST_USER_ID)
    .limit(1)
    .get();
  
  if (templates.empty) {
    throw new Error(
      '❌ No templates found!\n' +
      '   Please upload at least one template before running tests.\n' +
      '   Visit: https://formgenai-4545.web.app/admin/templates'
    );
  }
  
  console.log(`✅ Found ${templates.size} template(s)`);
});
```

---

### Issue #6: Test Service Cleanup
**Priority**: 🟢 Low  
**Status**: Nice to Have

**Symptom**:
- Each test run creates new services
- Test data accumulates in Firestore
- Database gets cluttered with test records

**Root Cause**:
- No afterAll cleanup
- No test data isolation
- Services persist after test completion

**Impact**:
- Database pollution
- Harder to debug issues
- Potential conflicts between test runs

**TODO**:
- [ ] Add afterAll hook to clean up test services
- [ ] Delete test services created during run
- [ ] Add test data isolation (separate collection or flag)
- [ ] Implement test data cleanup script
- [ ] Add option to preserve test data for debugging
- [ ] Document manual cleanup procedure

**Suggested Implementation**:
```typescript
let testServicIds: string[] = [];

afterEach(async ({ page }) => {
  // Collect service IDs created during test
});

afterAll(async () => {
  if (process.env.CLEANUP_TEST_DATA === 'true') {
    for (const serviceId of testServicIds) {
      await db.collection('services').doc(serviceId).delete();
      console.log(`🗑️  Deleted test service: ${serviceId}`);
    }
  }
});
```

---

## 📋 Prioritized Action Items

### 🔴 Critical (Must Fix for Tests to Complete)

1. **Fix Intake Submission Wait Logic** (Issue #1)
   - File: `tests/core-scenarios.spec.ts`, line ~727
   - Change: Replace `waitForTimeout` with event-based waiting
   - Estimated Time: 30 minutes
   - Blocker: Yes (prevents steps 7-9)

2. **Deploy Firebase Memory Update** (Issue #3)
   - Command: `firebase deploy --only hosting`
   - Change: Deploy 512MB memory configuration
   - Estimated Time: 15 minutes (deploy)
   - Blocker: Partial (causes timeouts)

### 🟡 High (Should Fix Soon)

3. **Add Submission Success Indicators** (Issue #2)
   - File: `src/app/intake/[token]/page.tsx`
   - Change: Add success message/modal after submission
   - Estimated Time: 1 hour
   - Blocker: No (workaround possible)

4. **Validate Document Generation** (Issue #4)
   - Action: Fix Issue #1, then run test to completion
   - Change: Execute and observe Steps 7-9
   - Estimated Time: 15 minutes (test run)
   - Blocker: Yes (blocked by Issue #1)

### 🟢 Medium (Nice to Have)

5. **Add Template Pre-check** (Issue #5)
   - File: `tests/core-scenarios.spec.ts`
   - Change: Add beforeAll template validation
   - Estimated Time: 30 minutes
   - Blocker: No (manual workaround)

6. **Implement Test Cleanup** (Issue #6)
   - File: `tests/core-scenarios.spec.ts`
   - Change: Add afterAll cleanup
   - Estimated Time: 1 hour
   - Blocker: No (manual cleanup works)

---

## 🎯 Success Criteria

### For Test to Pass Completely:
- [ ] All 9 steps execute without interruption
- [ ] Steps 1-6 complete (currently working)
- [ ] Step 7: Admin review succeeds
- [ ] Step 8: Approval succeeds
- [ ] Step 9: Document generation and download succeeds
- [ ] Downloaded file exists in `test-results/downloads/`
- [ ] File is valid .docx format
- [ ] All screenshots captured
- [ ] Video recording complete

### For Production Readiness:
- [ ] Admin page loads in <5 seconds (not 30+)
- [ ] Intake submission shows clear success message
- [ ] Document generation completes in <20 seconds
- [ ] Download button appears and works
- [ ] All E2E scenarios pass at 80%+ rate

---

## 🔧 Quick Fixes to Try Now

### Fix #1: Increase Submission Timeout
```bash
# Edit tests/core-scenarios.spec.ts line 727
# Change: await page.waitForTimeout(5000);
# To: await page.waitForTimeout(15000);
```

### Fix #2: Deploy Memory Update
```bash
cd /Users/rubazayed/MCPForms/mcpforms
firebase deploy --only hosting
# Wait 15 minutes for deployment
```

### Fix #3: Run Test Again (After Fixes)
```bash
npx playwright test tests/core-scenarios.spec.ts \
  --grep "COMPLETE WORKFLOW" \
  --headed \
  --project=chromium
# Let it run without interruption (Ctrl+C)
```

---

## 📊 Test Execution Log

### Current Run (Oct 14, 2025 11:11 AM)
```
✅ Step 1: Login - PASSED (3.5s)
✅ Step 2: Create Service - PASSED (14s)
   └─ Service ID: jNdKjWwVGdlDhz6ntucF
✅ Step 3: Generate Intake - PASSED (2s)
   └─ Token: intake_1760429413247_a8d6wpqn1
✅ Step 4: Open Intake - PASSED (3s)
✅ Step 5: Fill Form - PASSED (1s, 8 fields)
⏳ Step 6: Submit Form - INTERRUPTED
   └─ Submit button clicked
   └─ Waiting for confirmation...
   └─ ❌ Test ended (Ctrl+C)
❌ Step 7: Not reached
❌ Step 8: Not reached
❌ Step 9: Not reached

Progress: 67% (6/9 steps)
Duration: ~30 seconds before interruption
```

### Screenshots Captured
```
01-login-page.png ✅
02-login-filled.png ✅
03-logged-in.png ✅
04-wizard-step1.png ✅
05-wizard-step1-filled.png ✅
06-wizard-step2.png ✅
07-wizard-step2-selected.png ✅
08-wizard-step3.png ✅
09-wizard-step4.png ✅
10-service-created.png ✅
11-service-detail-page.png ✅
14-intake-form-loaded.png ✅
15-intake-form-filled.png ✅
```

---

## 🚀 Next Steps

1. **Immediate** (Today):
   - [ ] Implement Fix #1 (increase timeout)
   - [ ] Deploy Fix #2 (memory update)
   - [ ] Re-run test to completion
   - [ ] Document Step 9 results

2. **Short Term** (This Week):
   - [ ] Add success indicators to intake form
   - [ ] Validate document generation works
   - [ ] Add template pre-check
   - [ ] Document any additional issues found

3. **Medium Term** (Next Sprint):
   - [ ] Implement test cleanup
   - [ ] Optimize admin dashboard performance
   - [ ] Create template seeding automation
   - [ ] Achieve 100% E2E test pass rate

---

## 📝 Notes

- Test credentials: belal.riyad@gmail.com (configured in .env.test)
- Production URL: https://formgenai-4545.web.app
- Test logs: e2e-test-run.log
- Video recordings: test-results/*/video.webm

**Last Updated**: October 14, 2025  
**Next Review**: After implementing critical fixes
