# E2E Test Wizard Navigation Fix

## Date: October 15, 2025

## Problem Identified
The E2E test (`tests/e2e-simplified.spec.ts`) was getting stuck in the service creation wizard, repeatedly clicking the same "Next" button without progressing through all steps.

## Root Cause
The test used a generic loop that tried to click any button matching `/next|continue|finish|create|complete/i` without understanding the wizard's 4-step structure:

1. **Step 1**: Service Details (name, client info)
2. **Step 2**: Template Selection
3. **Step 3**: Customize Templates (AI sections - optional)
4. **Step 4**: Review & Send (creates service + sends intake)

The loop would click "Next" on Step 2, but wouldn't recognize that:
- Steps 1-3 have a "Next" button
- Step 4 has a different button: **"Create & Send to Client"**

## Solution Implemented
Replaced the generic loop with **explicit step-by-step navigation**:

```typescript
// Step 2→3: Click Next
const step2NextBtn = page.getByRole('button', { name: /next/i })
await safeClick(page, step2NextBtn, 'Next (Step 2→3)')
await takeScreenshot(page, 'simplified-05d-wizard-step3', 'Wizard Step 3')

// Step 3→4: Click Next  
const step3NextBtn = page.getByRole('button', { name: /next/i })
await safeClick(page, step3NextBtn, 'Next (Step 3→4)')
await takeScreenshot(page, 'simplified-05e-wizard-step4', 'Wizard Step 4')

// Step 4: Click "Create & Send to Client"
const createSendBtn = page.getByRole('button', { name: /create.*send/i })
await safeClick(page, createSendBtn, 'Create & Send to Client')
```

## Test Progress Now

✅ **Working Steps**:
1. Login with credentials
2. Navigate to services page
3. Click "Create/New Service"
4. Fill service details (Step 1)
5. Click "Next" to Step 2
6. Select template
7. Click "Next" to Step 3 ✅ **NEW**
8. Click "Next" to Step 4 ✅ **NEW**
9. Click "Create & Send to Client" ✅ **NEW**
10. Wait for service creation

⏳ **In Progress**:
- Service ID extraction after creation
- Intake link generation
- Intake form filling
- Document generation

## Commits Made

1. **db0c4b12**: Enhanced E2E test with comprehensive debugging
   - Added detailed page state logging
   - Multiple selector strategies
   - Better form field detection

2. **67f2598e**: Fixed wizard navigation (4-step flow)
   - Explicit step progression
   - Correct final button ("Create & Send to Client")
   - Screenshots for each step

## Next Steps

### Immediate (P0)
1. ✅ Fix wizard navigation - **DONE**
2. Run complete test without interruption
3. Validate service creation completes
4. Confirm service ID extraction works

### Short-term (P1)
1. Complete intake link extraction (already fixed in previous session)
2. Validate intake form filling
3. Test document generation
4. Verify ≥70% E2E pass rate

### Medium-term (P2)
According to **Feature #30** in the instruction pack:
- Automated test covers: Upload → Extract → Send → Submit → Generate → Download
- Target: ≥70% pass in CI
- Integration with nightly builds

## Test Execution

### Run Test (Headed Mode)
```bash
cd /Users/rubazayed/MCPForms/mcpforms
export PATH="/opt/homebrew/bin:$PATH"
npx playwright test tests/e2e-simplified.spec.ts --project=chromium --headed
```

### Expected Duration
- Full test: 60-90 seconds
- Service creation: ~10 seconds
- Intake form filling: ~5 seconds  
- Document generation: ~10 seconds

## Screenshots Generated
- `simplified-01-login.png` - Login page
- `simplified-02-services-list.png` - Services list
- `simplified-03-wizard-step1.png` - Step 1: Service Details
- `simplified-04-wizard-filled.png` - Step 1 filled
- `simplified-05-wizard-step2.png` - Step 2: Template Selection
- `simplified-05c-template-selected.png` - Template selected
- `simplified-05d-wizard-step3.png` - **Step 3: Customize** ✅ NEW
- `simplified-05e-wizard-step4.png` - **Step 4: Review & Send** ✅ NEW
- `simplified-06-service-created.png` - After creation

## Key Learnings

1. **Don't assume UI patterns** - The wizard had 4 distinct steps, not a generic flow
2. **Explicit is better than generic** - Step-by-step navigation is more reliable
3. **Different buttons per step** - Step 4 uses "Create & Send" not "Next"
4. **Screenshots are essential** - Visual debugging helped identify the stuck state
5. **Know the source code** - Reading `src/app/admin/services/create/page.tsx` revealed the true wizard structure

## Related Files

- **Test**: `tests/e2e-simplified.spec.ts`
- **Wizard**: `src/app/admin/services/create/page.tsx`
- **API**: `src/app/api/services/create/route.ts`
- **Instructions**: `.github/instructions/featurelist.instructions.md` (Feature #30)

## Status
🟢 **Wizard Navigation: FIXED**
🟡 **Full E2E Flow: IN PROGRESS**
🔵 **Target: 70% Pass Rate**

---
*Last Updated: October 15, 2025*
