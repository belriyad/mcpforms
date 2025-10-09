# Service Creation Troubleshooting Guide

## Common Reasons Service Creation Fails

### 1. ❌ No Templates Available
**Services require at least one template to be created first!**

**Solution:**
1. Go to: https://formgenai-4545.web.app/admin/templates
2. Upload a template document (DOCX file)
3. Wait for AI processing to complete
4. Then try creating a service

### 2. ❌ Not Logged In
**Error:** Stuck on login page or redirected back

**Solution:**
- Make sure you're logged in with valid credentials
- Check that you reached `/admin` page after login

### 3. ❌ Invalid Credentials in `.env.test`
**Current credentials are invalid:**
```
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=password123
```

**Solution:**
1. Create new account at: https://formgenai-4545.web.app/signup
2. Update `.env.test` with your actual credentials

### 4. ❌ Firebase Permission Error
**Error:** "Permission denied" or "Insufficient permissions"

**Solution:**
- User role must be 'lawyer' or 'admin'
- Check Firebase Auth and Firestore rules

### 5. ❌ Missing Required Fields
**Error:** Form validation error

**Solution:**
- Service name is required
- At least one template must be selected

## Quick Test Commands

### Test Login Only
```bash
npx playwright test tests/login-diagnostic.spec.ts --project=chromium
```

### Test Service Creation (after login works)
```bash
npx playwright test tests/debug-service-creation.spec.ts --project=chromium
```

### Full E2E Test
```bash
npx playwright test tests/core-scenarios.spec.ts --project=chromium --grep "COMPLETE WORKFLOW"
```

## Next Steps

**Please provide:**
1. Your test account email and password (I'll update `.env.test`)
2. Have you uploaded any templates to the admin panel?
3. What exact error message did you see?
4. Screenshots in `test-results/` folder (if test ran)

## Quick Fix Checklist

- [ ] Test account created via signup
- [ ] Can login at https://formgenai-4545.web.app/login
- [ ] `.env.test` updated with working credentials
- [ ] At least one template uploaded in admin panel
- [ ] Template processing completed (not stuck in "processing")
- [ ] Can manually create service in admin dashboard

Let me know which step is failing!
