# E2E Test Issues Summary

## Date: October 15, 2025

## Problem Analysis

### Root Cause Identified
The original `e2e-complete-flow.spec.ts` test was failing because it expected a **modal-based** service creation flow, but the application actually uses a **multi-step wizard page** at `/admin/services/create/`.

### Key Findings

1. **Service Creation Flow**
   - ❌ NOT a modal popup
   - ✅ Full-page wizard at `/admin/services/create/`  
   - 4 steps: Service Details → Select Templates → Customize → Review & Send

2. **Button Locations**
   - Services list page has "New Service" button (not "Create Service")
   - Empty state has "Create Service" button
   - Both navigate to `/admin/services/create/`

3. **Required Fields (Step 1)**
   - Service Name * (required)
   - Client Name * (required)
   - Client Email * (required)
   - Description (optional)

### Test Progress

**Simplified Test Results** (`e2e-simplified.spec.ts`):

✅ **Working:**
- Step 1: Login with credentials
- Step 2: Navigate to services page  
- Step 3: Click "New Service" button
- Step 4: Navigate to wizard (`/admin/services/create/`)
- Step 5: Fill Service Name, Client Name, Client Email
- Step 6: Click "Next" to go to Step 2 (templates)
- Step 7: Check first template

❌ **Failing:**
- Step 8: Click "Next/Continue" on Step 2 fails
  - Button not clickable or validation error
  - Need to investigate what's blocking progression

### Next Steps

1. **Debug Step 2 Continue Button**
   ```typescript
   // Add before clicking:
   - Check if button is disabled
   - Look for validation errors
   - Check console for JavaScript errors
   - Verify template selection is properly registered
   ```

2. **Complete Wizard Flow**
   - Step 2: Template Selection → Continue
   - Step 3: Customization (AI sections) → Continue  
   - Step 4: Review & Send → Finish/Create

3. **Extract Service ID**
   - After wizard completion, get service ID from URL or services list
   - Navigate to service detail page
   - Verify intake link generation

### Code Changes Made

#### Created: `tests/e2e-simplified.spec.ts`
- Clean implementation without debug code
- Properly handles wizard navigation
- Uses correct button selectors ("New Service")
- Fills all required fields for Step 1

#### Issues with Original Test
The `tests/e2e-complete-flow.spec.ts` had multiple problems:
1. Expected modal, not wizard page
2. Used wrong selectors (#serviceName doesn't exist on wizard)
3. Tried to click save button that doesn't exist on Step 1
4. Didn't handle multi-step navigation

### Comparison: Working vs Broken Tests

**core-scenarios.spec.ts** (Reference - Works):
- Uses simple modal flow (older version of app?)
- `setShowCreateForm(true)` → modal appears
- Fill form → Click save → Done

**Current App** (Wizard Flow):
- Click button → Navigate to `/admin/services/create/`
- Fill Step 1 → Click Next
- Fill Step 2 → Click Next  
- Fill Step 3 → Click Next
- Review Step 4 → Click Finish
- Navigate to service detail or services list

### Recommendations

1. **Update core-scenarios.spec.ts**
   - It may be testing against outdated UI
   - Should also use wizard flow

2. **Add Wizard Helper Function**
   ```typescript
   async function completeServiceWizard(page: Page, serviceData: ServiceData) {
     // Step 1
     await fillStep1(page, serviceData)
     await clickNext(page)
     
     // Step 2
     await selectTemplates(page, serviceData.templateIds)
     await clickNext(page)
     
     // Step 3 (optional AI customization)
     if (await hasAISections(page)) {
       await fillAISections(page, serviceData.aiPrompts)
       await clickNext(page)
     }
     
     // Step 4
     await reviewAndFinish(page)
     return await extractServiceId(page)
   }
   ```

3. **Increase Test Timeout**
   - Wizard has 4 steps with potential AI generation
   - Current 30s timeout too short
   - Recommend 120s for full wizard flow

### Current Test Status

| Test File | Status | Progress | Blocker |
|-----------|--------|----------|---------|
| `e2e-complete-flow.spec.ts` | ❌ Broken | 40% | Wrong flow (modal vs wizard) |
| `e2e-simplified.spec.ts` | 🟡 Partial | 70% | Step 2 Continue button |
| `core-scenarios.spec.ts` | ✅ Works | 100% | May be testing old UI |

### Files to Review

1. `/src/app/admin/services/create/page.tsx` - Wizard implementation
2. `/src/app/admin/services/page.tsx` - Services list with "New Service" button  
3. `/src/components/admin/ServiceManager.tsx` - Old modal-based component (unused?)

### Environment
- Production URL: https://formgenai-4545.web.app
- Test Credentials: belal.riyad@gmail.com / 9920032
- Framework: Playwright with Chromium
- Node Path Issues: Need to export PATH="/opt/homebrew/bin:..." before running tests
