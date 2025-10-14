# E2E Test Prerequisites - "Failed to Create Service" Issue

## 🔍 Root Cause Analysis

The headed Playwright test revealed the actual issue:

```
📋 Strategy 1: Found 0 template cards with cursor-pointer
⚠️ Could not select any template
```

## ❌ This is NOT a Regression!

The "Failed to create service" error is **expected behavior** when:
- No templates exist in the database
- The service creation wizard requires at least one template to be selected
- Without templates, the wizard cannot proceed to create a service

## ✅ Solution: Upload Templates First

Before running E2E tests or creating services, you must:

### Option 1: Manual Template Upload (Recommended for Testing)

1. Open: https://formgenai-4545.web.app/admin/templates
2. Click: "Upload Template" or "+ New Template"
3. Upload a .docx file (any Word document with placeholders like `{{fieldName}}`)
4. Wait for AI field extraction to complete
5. Save the template

### Option 2: Use Existing Templates

If you already have templates uploaded:
- Check they are in "active" status
- Verify they belong to your user account
- Ensure extracted fields are present

### Option 3: Seed Test Data (For Development)

```bash
# Run the seeding script (requires Firebase Admin credentials)
node scripts/seed-test-data.js
```

This creates 3 sample templates:
- Employment Contract (5 fields)
- NDA Agreement (4 fields)
- Service Agreement (6 fields)

## 📋 E2E Test Requirements

The Playwright tests assume:
1. ✅ User account exists (auto-created during test)
2. ❌ **At least 1 template exists** ← Missing!
3. ✅ Firebase hosting is deployed
4. ✅ Authentication works

## 🎯 Test Flow

```
1. Login ✅
2. Navigate to service creation ✅
3. Fill service details ✅
4. Select template ❌ ← Fails here (no templates)
5. Send intake
6. Fill intake form
7. Generate document
8. Download document
```

## 🐛 Debugging Output from Headed Test

From the visible browser test run:

```
📝 Wizard Step 2: Selecting templates...
📸 Screenshot: Wizard Step 2: Template Selection
📋 Strategy 1: Found 0 template cards with cursor-pointer
⚠️ Could not select any template
```

This confirms the page loaded correctly, but the templates list was empty.

## 🔧 Quick Fix for E2E Tests

1. **Upload one template manually** via UI
2. **Re-run the E2E tests:**
   ```bash
   npx playwright test tests/core-scenarios.spec.ts --headed --project=chromium
   ```
3. Tests should now progress past the template selection step

## 📊 Expected Test Results After Fix

Before (with no templates):
- ❌ Scenario 1: Create Account - Fails at template selection
- ❌ Scenario 2: Login - Fails at template selection
- ❌ Scenario 3: Create Service - Fails at template selection
- ✅ Scenario 4: Open Intake Link - Passes
- ✅ Scenario 5: Fill Submit Form - Passes

After (with templates uploaded):
- ✅ Scenario 1: Create Account - Should pass
- ✅ Scenario 2: Login - Should pass  
- ✅ Scenario 3: Create Service - Should pass
- ✅ Scenario 4: Open Intake Link - Should pass
- ✅ Scenario 5: Fill Submit Form - Should pass
- ✅ Scenario 6: Approve Generate - Should pass
- ✅ Scenario 7: Complete Workflow - Should pass

Target: **100% pass rate** (7/7 tests passing)

## 🚀 Next Steps

1. Upload at least one .docx template via the admin UI
2. Re-run headed tests to verify service creation works
3. Consider creating a test data fixture for CI/CD

## 💡 Prevention for Future

Add to test setup (in `tests/setup.ts` or similar):
```typescript
beforeAll(async () => {
  // Check if templates exist
  const templatesCount = await db.collection('templates').count().get();
  if (templatesCount.data().count === 0) {
    throw new Error('❌ No templates found! Upload at least one template before running E2E tests.');
  }
});
```

This will fail fast with a clear error message instead of mysterious "failed to create service" errors.
