# E2E Testing Quick Start Guide

## 🚀 Quick Start (2 minutes)

### Prerequisites
```bash
# Make sure you have Node.js and Playwright installed
node --version  # Should be v23.5.0 or later
```

### Run Tests

**Option 1: Run Core Workflow (Steps 1-2)**
```bash
cd /Users/rubazayed/MCPForms/mcpforms
export PATH="/opt/homebrew/bin:$PATH"
npx playwright test tests/core-scenarios.spec.ts --project=chromium --grep "COMPLETE WORKFLOW" --workers=1
```

**Option 2: Run Complete Flow with Templates (Steps 1-4)**
```bash
npx playwright test tests/complete-flow-with-templates.spec.ts --project=chromium --workers=1
```

**Option 3: Run Diagnostic Tests**
```bash
# Analyze service creation form
npx playwright test tests/diagnose-service-modal.spec.ts --project=chromium

# Check page accessibility  
npx playwright test tests/page-accessibility.spec.ts --project=chromium

# Test login flow
npx playwright test tests/login-diagnostic.spec.ts --project=chromium
```

### View Test Results
```bash
# Open HTML report
npx playwright show-report

# View screenshots
open test-results/
```

---

## 📊 Current Test Status

### ✅ Working Tests
| Test | Steps | Status | Duration |
|------|-------|--------|----------|
| Login | 1 | ✅ 100% Pass | ~4s |
| Service Creation | 2 | ✅ 100% Pass | ~5s |
| Core Workflow | 1-2 | ✅ Partial Pass | ~20s |
| Complete Flow | 1-4 | ✅ Partial Pass | ~20s |

### ⚠️ Blocked Tests
| Test | Steps | Blocker | Solution |
|------|-------|---------|----------|
| Generate Intake | 3-10 | No templates | Upload templates manually |
| Fill Form | 5-10 | Depends on Step 3 | Complete Step 3 first |
| Document Generation | 8-10 | Depends on Step 3 | Complete Step 3 first |

---

## 🎯 Test Credentials

**File:** `.env.test`
```env
TEST_USER_EMAIL=belal.riyad@gmail.com
TEST_USER_PASSWORD=9920032
TEST_INTAKE_TOKEN=intake_1759821638675_0fk5ujved
TEST_SERVICE_ID=w9rq4zgEiihA17ZNjhSg
```

**Login URL:** https://formgenai-4545.web.app/login

---

## 📸 What the Tests Do

### Core Scenarios Test
1. **Login** - Logs in with test credentials
2. **Create Service** - Creates a new service with:
   - Service Name: `E2E Test Service [timestamp]`
   - Client Name: `E2E Test Client`
   - Client Email: `e2e-client@test.com`
   - Description: `Automated E2E test service`

**Screenshots captured:**
- `01-login-page.png` - Login form
- `02-login-filled.png` - Filled login form
- `03-logged-in.png` - Dashboard after login
- `04-services-page.png` - Services list
- `05-create-service-modal.png` - Service creation modal
- `06-service-form-filled.png` - Completed service form
- `07-service-created.png` - Service created confirmation

### Complete Flow Test
Same as above, plus:
3. **Navigate to Templates** - Checks templates page
4. **Upload Template** - Attempts to upload test PDF

**Additional screenshots:**
- `04-templates-page.png` - Templates page
- `06-templates-ready.png` - Templates after upload attempt

---

## 🔧 Troubleshooting

### Test Fails at Login
```bash
# Check if credentials are correct
cat .env.test

# Run diagnostic login test
npx playwright test tests/login-diagnostic.spec.ts --project=chromium
```

### Test Fails at Service Creation
```bash
# Analyze service form structure
npx playwright test tests/diagnose-service-modal.spec.ts --project=chromium

# Check screenshot: test-results/service-modal-diagnosis.png
open test-results/service-modal-diagnosis.png
```

### Tests Timeout
```bash
# Increase timeout (default is 10 minutes for complete workflow)
# Edit test file and change:
test.setTimeout(600000); // 10 minutes
# To:
test.setTimeout(900000); // 15 minutes
```

### Screenshots Not Saving
```bash
# Create test-results directory
mkdir -p test-results

# Check permissions
ls -la test-results/
```

---

## 📝 Test File Reference

| File | Purpose | Lines | Status |
|------|---------|-------|--------|
| `core-scenarios.spec.ts` | Main E2E test | 1,039 | ✅ Steps 1-2 working |
| `complete-flow-with-templates.spec.ts` | Full flow with uploads | 600+ | ✅ Steps 1-4 working |
| `e2e-complete-flow.spec.ts` | Simplified flow | 250+ | ✅ Ready |
| `page-accessibility.spec.ts` | Page checks | 280+ | ✅ Working |
| `diagnose-service-modal.spec.ts` | Form analysis | 150+ | ✅ Working |
| `login-diagnostic.spec.ts` | Login analysis | 180+ | ✅ Working |
| `diagnose-pages.spec.ts` | Page content | 100+ | ✅ Working |
| `signup-new-account.spec.ts` | Account creation | 150+ | ✅ Ready |

---

## 🎓 Helper Functions

All tests include these helper functions:

### `waitForPageReady(page, timeout)`
Waits for page to load completely
```typescript
await waitForPageReady(page, 30000);
```

### `takeScreenshot(page, name, description)`
Takes timestamped screenshot
```typescript
await takeScreenshot(page, '01-login', 'Login page loaded');
// Saves to: test-results/2025-10-09T10-15-15-316Z-01-login.png
```

### `safeClick(page, selector, description, timeout)`
Clicks element with error handling
```typescript
const success = await safeClick(page, button, 'Login button', 30000);
if (!success) {
  throw new Error('Failed to click login button');
}
```

### `safeFill(page, selector, value, description)`
Fills input with validation
```typescript
const success = await safeFill(page, input, 'test@example.com', 'Email field');
if (!success) {
  throw new Error('Failed to fill email field');
}
```

---

## 🚦 Test Output Example

```
============================================================
🚀 COMPLETE E2E WORKFLOW TEST STARTED
============================================================
📧 Test User: belal.riyad@gmail.com
⏰ Timestamp: 10/9/2025, 1:25:00 PM
============================================================

🔐 STEP 1/10: LOGIN
------------------------------------------------------------
📸 Screenshot: Login page loaded → test-results/2025-10-09T10-25-01-977Z-01-login-page.png
✅ Filled: Email field = "belal.riyad@gmail.com"
✅ Filled: Password field = "9920032"
✅ Clicked: Sign In button
⏳ Waiting for login and redirect to dashboard...
✅ STEP 1 COMPLETE: Logged in successfully!

🎯 STEP 2/10: CREATE A SERVICE
------------------------------------------------------------
✅ Clicked: Create Service button
✅ Filled: Service name = "E2E Full Test 1760005500033"
✅ Filled: Client name = "E2E Test Client"
✅ Filled: Client email = "e2e-client@test.com"
✅ Clicked: Next button
✅ STEP 2 COMPLETE: Service created!

============================================================
🎉 PARTIAL SUCCESS: Completed steps 1-2
============================================================
```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `E2E_TESTING_SUCCESS_REPORT.md` | Comprehensive test results and findings |
| `E2E_TESTING_QUICK_START.md` | This file - Quick start guide |
| `TEST_SUITE_COMPLETE_SUMMARY.md` | Overview of all test files |
| `PAGE_ACCESSIBILITY_FINAL_REPORT.md` | Page accessibility findings |
| `CREDENTIALS_INVESTIGATION.md` | How we got working credentials |
| `CREATE_TEST_ACCOUNT.md` | Account creation methods |

---

## 🎯 Next Steps

### Immediate (Manual)
1. Log into https://formgenai-4545.web.app/login as belal.riyad@gmail.com
2. Navigate to Templates section
3. Upload at least one PDF template
4. Note the upload UI flow

### After Templates Uploaded
```bash
# Re-run complete flow
npx playwright test tests/complete-flow-with-templates.spec.ts --project=chromium

# Expected: All 10 steps should complete
```

### Continuous Testing
```bash
# Run all tests
npx playwright test --project=chromium

# Run specific test
npx playwright test tests/core-scenarios.spec.ts

# Run in headed mode (see browser)
npx playwright test --headed

# Debug mode
npx playwright test --debug
```

---

## 💡 Pro Tips

### Faster Test Runs
```bash
# Skip slow tests
npx playwright test --grep-invert "COMPLETE WORKFLOW"

# Run in parallel (not recommended for E2E)
npx playwright test --workers=2
```

### Better Screenshots
```typescript
// Full page screenshot (default)
await page.screenshot({ path: 'screenshot.png', fullPage: true });

// Viewport only
await page.screenshot({ path: 'screenshot.png', fullPage: false });

// Specific element
await element.screenshot({ path: 'element.png' });
```

### Debug Selectors
```bash
# Use Playwright Inspector
npx playwright test --debug

# Generate selectors
npx playwright codegen https://formgenai-4545.web.app
```

---

## 📞 Support

**Issues?** Check these files:
- `E2E_TESTING_SUCCESS_REPORT.md` - Detailed findings
- `test-results/` - Screenshots from last run
- `.env.test` - Verify credentials

**Questions?** Review:
- Test output in terminal
- HTML report: `npx playwright show-report`
- Video recordings in `test-results/`

---

**Last Updated:** October 9, 2025  
**Status:** ✅ Core tests working (Steps 1-2)  
**Next Milestone:** Template upload → Complete flow
