# Create Test Account - Manual Instructions

## 🎯 Objective
Create a working test account for E2E testing since automated account creation is being interrupted.

## 📋 Steps to Create Test Account

### Option A: Create New Account via Signup (RECOMMENDED - 2 minutes)

1. **Open the signup page:**
   - Go to: https://formgenai-4545.web.app/signup

2. **Fill in the form:**
   - **Name:** Test User
   - **Email:** testuser@mcpforms.test (or any email you want)
   - **Password:** TestPassword123!
   - ✅ Check the "I agree to terms" checkbox

3. **Click "Sign Up" or "Create Account"**

4. **Verify it works:**
   - You should be redirected to `/admin` page
   - You should see the admin dashboard

5. **Update `.env.test` file:**
   ```bash
   TEST_USER_EMAIL=testuser@mcpforms.test
   TEST_USER_PASSWORD=TestPassword123!
   ```

### Option B: Use Existing Account (FASTEST - 30 seconds)

If you already have a working account for https://formgenai-4545.web.app:

1. **Test your account works:**
   - Go to: https://formgenai-4545.web.app/login
   - Try logging in with your credentials
   - Verify you reach the `/admin` dashboard

2. **Update `.env.test` file:**
   ```bash
   TEST_USER_EMAIL=your-email@example.com
   TEST_USER_PASSWORD=your-password
   ```

### Option C: Firebase Console (Alternative - 3 minutes)

1. **Go to Firebase Console:**
   - https://console.firebase.google.com/project/formgenai-4545/authentication/users

2. **Add User:**
   - Click "Add User"
   - Email: testuser@test.com
   - Password: TestPassword123!
   - Click "Add User"

3. **Update `.env.test` file:**
   ```bash
   TEST_USER_EMAIL=testuser@test.com
   TEST_USER_PASSWORD=TestPassword123!
   ```

## 🧪 Test the Credentials

After updating `.env.test`, run:

```bash
npx playwright test tests/login-diagnostic.spec.ts --project=chromium
```

This will verify your credentials work before running the full E2E test suite.

## ✅ Run E2E Tests

Once credentials are working:

```bash
npx playwright test tests/core-scenarios.spec.ts --project=chromium
```

## 📝 Current Status

- ❌ **test@example.com** / **password123** - Invalid credentials
- ❌ **briyad@gmail.com** / **testpassword123** - Invalid credentials  
- ❌ **rubazayed@gmail.com** / **rubazayed** - Invalid credentials
- ❌ **admin@mcpforms.com** / **adminpassword123** - Invalid credentials

**None of these work!** You need to create a new account or use an existing one.

## 🔍 Why Previous Credentials Don't Work

The `create-test-users.js` script was never successfully run because it requires `serviceAccountKey.json` which doesn't exist in the repo. All previous test credentials are invalid on the production Firebase instance.

## 💡 Recommendation

**Go with Option A** (create new account via signup) - it's the quickest and most reliable way to get a working test account!
