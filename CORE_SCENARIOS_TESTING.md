# Core Scenarios Testing Guide

## Overview

Comprehensive end-to-end tests covering all core user journeys in Smart Forms AI production system.

## Test Scenarios

### Complete E2E Workflow
Tests the entire user journey from account creation to document generation:

1. **Create Account** - New user signup
2. **Login** - Authentication with new credentials
3. **Create Service** - Add a new service
4. **Generate Intake** - Create intake form for service
5. **Fill Intake** - Complete form as client
6. **Submit** - Submit intake data
7. **Review** - Admin reviews submission
8. **Approve** - Approve intake data
9. **Generate Document** - Create final document

### Individual Scenarios
Isolated tests for each core function:

- **Scenario 1**: Create new user account
- **Scenario 2**: Login with existing account
- **Scenario 3**: Create a new service
- **Scenario 4**: Open and load intake link
- **Scenario 5**: Fill and submit intake form
- **Scenario 6**: Approve intake and generate document

## Running Tests

### Run All Core Scenarios
```bash
npx playwright test tests/core-scenarios.spec.ts --project=chromium
```

### Run with Visual Browser (Headed Mode)
```bash
npx playwright test tests/core-scenarios.spec.ts --project=chromium --headed
```

### Run Complete E2E Workflow Only
```bash
npx playwright test tests/core-scenarios.spec.ts --grep "COMPLETE WORKFLOW" --project=chromium --headed
```

### Run Specific Scenario
```bash
# Run only account creation test
npx playwright test tests/core-scenarios.spec.ts --grep "Scenario 1" --project=chromium

# Run only login test
npx playwright test tests/core-scenarios.spec.ts --grep "Scenario 2" --project=chromium

# Run only service creation test
npx playwright test tests/core-scenarios.spec.ts --grep "Scenario 3" --project=chromium
```

### Run with Detailed Console Output
```bash
npx playwright test tests/core-scenarios.spec.ts --project=chromium --reporter=list
```

### Debug Mode (Slow Motion + Inspector)
```bash
npx playwright test tests/core-scenarios.spec.ts --project=chromium --debug
```

## View Test Results

### Generate and View HTML Report
```bash
npx playwright test tests/core-scenarios.spec.ts --project=chromium --reporter=html
npx playwright show-report
```

### View Screenshots
All tests automatically save screenshots at key steps to `test-results/`:

- `01-signup-filled.png` - Signup form completed
- `02-account-created.png` - Account creation success
- `03-service-form.png` - Service creation form
- `04-service-created.png` - Service created successfully
- `05-intake-generating.png` - Intake generation in progress
- `06-intake-generated.png` - Intake generated with token
- `07-intake-opened.png` - Intake form loaded
- `08-intake-filled.png` - Intake form completed
- `09-intake-submitted.png` - Intake submitted
- `10-admin-review.png` - Admin reviewing submission
- `11-approved.png` - Submission approved
- `12-doc-generating.png` - Document generation started
- `13-doc-ready.png` - Document ready for download

## Test Configuration

Tests use environment variables from `.env.test`:

```env
TEST_USER_EMAIL=rubazayed@gmail.com
TEST_USER_PASSWORD=rubazayed
TEST_INTAKE_TOKEN=intake_1759821638675_0fk5ujved
TEST_SERVICE_ID=w9rq4zgEiihA17ZNjhSg
```

The complete workflow creates its own test account dynamically:
- Email: `test-{timestamp}@example.com`
- Password: `TestPass123!`

## Expected Results

### ✅ What Should Pass

1. **Account Creation** - New accounts should be created successfully
2. **Login** - Existing accounts should authenticate
3. **Service Creation** - Services should be created with unique names
4. **Intake Generation** - Intake forms should generate with unique tokens
5. **Form Loading** - Intake forms should load for valid tokens
6. **Form Submission** - Forms should submit with valid data

### ⚠️ What Might Fail

1. **Old Intake Tokens** - Test tokens from `.env.test` may expire
2. **Template Requirements** - Document generation requires uploaded templates
3. **Network Latency** - Production may be slower than expected (timeouts set to 60s for auth, 10s for most operations)
4. **Service Permissions** - Known issue with service ownership in production

## Debugging Failed Tests

### View Last Test Run
```bash
npx playwright show-report
```

### Run Single Test in Debug Mode
```bash
npx playwright test tests/core-scenarios.spec.ts --grep "COMPLETE WORKFLOW" --project=chromium --debug
```

### Check Screenshots
Look in `test-results/` folder for screenshots at failure point.

### View Console Logs
Tests output detailed console logs showing each step:
```
========================================
STEP 1: CREATE NEW ACCOUNT
========================================
Creating account: test1234567890@example.com
✅ Account created successfully!
```

## Test Timeouts

- **Complete Workflow**: 300 seconds (5 minutes)
- **Authentication**: 60 seconds
- **Page Navigation**: 10 seconds
- **Button Clicks**: 5 seconds
- **Element Visibility**: 3 seconds

## Best Practices

1. **Run in Headed Mode First** - See what's happening visually
   ```bash
   npx playwright test tests/core-scenarios.spec.ts --headed
   ```

2. **Check Screenshots** - Every major step captures a screenshot

3. **Read Console Output** - Tests print detailed progress logs

4. **Run Individual Scenarios** - Test one scenario at a time when debugging

5. **Use Debug Mode** - When tests fail, run with `--debug` to step through

## Continuous Integration

For CI/CD pipelines:

```bash
# Headless mode with JSON reporter
npx playwright test tests/core-scenarios.spec.ts --project=chromium --reporter=json

# Or with list reporter for CI logs
npx playwright test tests/core-scenarios.spec.ts --project=chromium --reporter=list
```

## Known Issues

1. **Service Permission Error** - "You do not have permission to view this service"
   - Status: Known production issue
   - Workaround: Use owner account for testing

2. **Intake Loading 500 Error** - Old tokens return HTTP 500
   - Status: Expected for expired tokens
   - Workaround: Complete workflow test creates fresh tokens

3. **Login Timeout** - First login may take >30 seconds
   - Status: Production latency
   - Solution: Timeout increased to 60 seconds

## Success Metrics

A successful test run should show:

```
✅ All scenarios passing
✅ 17 screenshots captured
✅ No timeout errors
✅ Console logs showing all steps completed
✅ HTML report with no failures
```

## Support

If tests consistently fail:

1. Check `.env.test` has valid credentials
2. Verify production site is accessible: https://formgenai-4545.web.app
3. Run in headed mode to see browser actions
4. Check screenshots in test-results/
5. Review console output for specific error messages
