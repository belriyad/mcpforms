# Automated Testing Guide for Production

## 🎯 You're Absolutely Right!

Instead of manually testing the production site, you can automate everything with Playwright.

## 🚀 Quick Start

### 1. Set Up Test Credentials

```bash
# Copy the example environment file
cp .env.test.example .env.test

# Edit with your real test credentials
nano .env.test  # or use your preferred editor
```

Add your test user credentials:
```
TEST_USER_EMAIL=your-email@example.com
TEST_USER_PASSWORD=your-password
```

### 2. Run Production Tests

**Option A: Quick Run (Terminal)**
```bash
./run-production-tests.sh
```

**Option B: Interactive UI Mode (Recommended for Development)**
```bash
npx playwright test tests/production-sanity-check.spec.ts --ui
```

**Option C: Run Specific Test**
```bash
npx playwright test tests/production-sanity-check.spec.ts -g "Admin dashboard loads"
```

**Option D: Run with Debug Mode**
```bash
npx playwright test tests/production-sanity-check.spec.ts --debug
```

## 📋 What Gets Tested

### Sanity Checks (10 tests)
1. ✅ Home page loads successfully
2. ✅ Login page works with credentials
3. ✅ Admin dashboard loads with user data
4. ✅ Services page loads without errors
5. ✅ Can access owned service
6. ✅ Intake form link loads (if available)
7. ✅ Migration tool page loads
8. ✅ No console errors on dashboard
9. ✅ Security rules allow owned data access
10. ✅ Fast page load times (< 5s)

### Workflow Tests
- ✅ Complete workflow: Login → View Service → Generate Intake

## 🎬 Viewing Results

### 1. HTML Report (Best for Overview)
```bash
npx playwright show-report
```
Opens a browser with:
- Pass/fail status for each test
- Screenshots on failure
- Videos of test runs
- Network activity

### 2. Traces (Best for Debugging)
```bash
# After a test fails, view the trace
npx playwright show-trace trace.zip
```

### 3. Terminal Output
The tests print real-time progress:
```
✅ Step 1: Logged in successfully
✅ Step 2: Navigated to services page  
✅ Step 3: Opened service detail page
```

## 🐛 Debugging Failed Tests

### Option 1: UI Mode (Interactive)
```bash
npx playwright test tests/production-sanity-check.spec.ts --ui
```
- Step through test line by line
- See DOM changes in real-time
- Inspect network requests

### Option 2: Debug Mode (Step-by-Step)
```bash
npx playwright test tests/production-sanity-check.spec.ts --debug
```
- Opens Playwright Inspector
- Pause/resume execution
- Run commands in console

### Option 3: Headed Mode (Watch Browser)
```bash
npx playwright test tests/production-sanity-check.spec.ts --headed
```
- See the actual browser during test
- Good for understanding failures

## 📊 Existing Tests

You already have many tests in the `tests/` directory:

### Key Tests to Run
```bash
# Full workflow test
npx playwright test tests/complete-workflow.spec.ts

# API integration tests
npx playwright test tests/mcp-api-integration.spec.ts

# Firebase integration
npx playwright test tests/mcp-firebase-integration.spec.ts

# UI components
npx playwright test tests/mcp-ui-components.spec.ts

# Production checks
npx playwright test tests/mcp-production.spec.ts
```

### Run All Tests
```bash
npx playwright test
```

## 🎯 Testing Checklist

Before considering the app production-ready:

- [ ] All sanity checks pass
- [ ] Workflow tests pass
- [ ] No console errors
- [ ] Page load times < 5s
- [ ] All owned data accessible
- [ ] Security rules working correctly
- [ ] Migration tool functional
- [ ] Intake forms load properly

## 💡 Benefits of Automated Testing

✅ **Catch bugs before users do**
✅ **Fast feedback** (run in seconds vs. minutes of manual testing)
✅ **Consistent** (no human error)
✅ **Comprehensive** (test edge cases you'd forget manually)
✅ **Confidence** (deploy knowing tests pass)
✅ **Documentation** (tests show how app should work)
