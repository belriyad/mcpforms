# 🚀 Quick Start: Get Tests Running

## Problem
E2E tests fail because credentials in `.env.test` are invalid.

## Solution (Choose One)

### ⭐ FASTEST: Manual Signup (2 minutes)

1. Open: https://formgenai-4545.web.app/signup
2. Create account with ANY email/password you want
3. Update `.env.test`:
   ```bash
   TEST_USER_EMAIL=your-email@example.com
   TEST_USER_PASSWORD=your-password
   ```
4. Run tests:
   ```bash
   npx playwright test tests/core-scenarios.spec.ts --project=chromium
   ```

## That's It!

The test suite is ready - it just needs valid login credentials. 

See `CREATE_TEST_ACCOUNT.md` for detailed instructions.  
See `CREDENTIALS_INVESTIGATION.md` for full investigation report.
