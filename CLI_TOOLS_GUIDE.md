# 🛠️ CLI TOOLS FOR TEMPLATE ISSUE

I've created several CLI tools to help diagnose and fix the template issue. Here's what's available:

## 📋 Available Tools

### 1. **diagnose-and-fix.js** - Show Diagnosis & Recommendations
```bash
node diagnose-and-fix.js
```
**What it does:**
- Shows current problem summary
- Lists 3 fix options (A, B, C)
- Provides URLs to Firebase Console
- Gives step-by-step instructions

**Use when:** You want to see all available options

---

### 2. **test-api-generation.js** - Test Document Generation
```bash
node test-api-generation.js
```
**What it does:**
- Calls the generation API for service 2F3GSb5UJobtRzU9Vjvv
- Shows detailed response with success/failure counts
- Lists documents with/without URLs

**Use when:** You want to verify current status

**Expected Output (when fixed):**
```json
{
  "success": true,
  "message": "Successfully generated 1/1 documents",
  "summary": {
    "successful": 1,
    "failed": 0
  }
}
```

---

### 3. **create-working-service.sh** - Automated Fix (Interactive)
```bash
./create-working-service.sh
```
**What it does:**
1. Asks for confirmation
2. Runs E2E tests to create a fresh service
3. Extracts the new service ID
4. Tests document generation on it
5. Reports success/failure

**Use when:** You want an automated solution

**Requirements:** Playwright must be installed

---

### 4. **Playwright Tests** - Comprehensive Testing

#### Auto-Retry Test (Recommended)
```bash
npx playwright test tests/regenerate-auto-fix.spec.ts --project=chromium
```
**What it does:**
- Tries regeneration up to 5 times
- Takes screenshots at each attempt
- Shows detailed console logs
- Reports exactly when/if buttons enable

**Use when:** Testing if the fix works

#### Debug Test
```bash
npx playwright test tests/regenerate-button-debug.spec.ts --project=chromium
```
**What it does:**
- Single detailed test run
- Step-by-step logging
- Comprehensive status checks

**Use when:** Need detailed diagnostics

---

## 🎯 Recommended Workflow

### Option A: Quickest Fix (Manual)

1. **Diagnose the issue:**
   ```bash
   node diagnose-and-fix.js
   ```

2. **Create new service via UI:**
   - Go to: https://formgenai-4545.web.app/admin/templates
   - Upload a template DOCX
   - Wait for field extraction
   - Create new service with that template

3. **Test it works:**
   ```bash
   # Update test-api-generation.js with new service ID
   node test-api-generation.js
   ```

4. **Verify with automation:**
   ```bash
   npx playwright test tests/regenerate-auto-fix.spec.ts
   ```

---

### Option B: Automated Fix

1. **Run the automated script:**
   ```bash
   ./create-working-service.sh
   ```

2. **Follow prompts** - It will:
   - Create fresh service
   - Test generation
   - Report results

3. **If successful**, test the UI:
   - Open the service URL shown
   - Click "Regenerate Documents"
   - Watch buttons enable in 3-10 seconds

---

### Option C: Manual Firebase Console Fix

1. **See diagnosis:**
   ```bash
   node diagnose-and-fix.js
   ```

2. **Follow Option B instructions** shown in output

3. **Check Firestore:**
   - URL provided in script output
   - Navigate to service → templates
   - Verify storagePath exists

4. **Check Storage:**
   - URL provided in script output
   - Find template file
   - Verify it exists at storagePath location

5. **Test after fix:**
   ```bash
   node test-api-generation.js
   ```

---

## 🔍 Debugging Tools

### Check Current Status
```bash
# See what API returns
node test-api-generation.js

# See diagnosis
node diagnose-and-fix.js
```

### Test After Making Changes
```bash
# Quick API test
node test-api-generation.js

# Full UI test with retries
npx playwright test tests/regenerate-auto-fix.spec.ts
```

### View Test Screenshots
```bash
# Open test results folder
open test-results/

# Look for:
# - attempt-1-FAILED.png (or SUCCESS.png)
# - Shows exact UI state when test ran
```

---

## 📊 Success Indicators

### API Test Success
```bash
$ node test-api-generation.js

📊 API Response:
{
  "success": true,  ← Changed from false!
  "message": "Successfully generated 1/1 documents",
  "summary": {
    "total": 1,
    "successful": 1,  ← Changed from 0!
    "failed": 0
  }
}
```

### Playwright Test Success
```bash
$ npx playwright test tests/regenerate-auto-fix.spec.ts

🔄 ATTEMPT 1/5
[BROWSER] 📊 Status: 1/1 documents have download URLs  ← Changed!
   3s: 1/1 enabled  ← Buttons enabled!
🎉 SUCCESS at 3s! All buttons enabled!

✅ TEST PASSED!
```

### Browser Console Success
```
✅ API returned success
📊 Generation Summary: { successful: 1, failed: 0 }
📊 Status: 1/1 documents have download URLs
🔄 Refreshed service data
```

### UI Success
- Alert shows: "✅ Successfully generated 1 document(s)!"
- Download buttons turn blue within 3-10 seconds
- Clicking Download actually downloads DOCX file

---

## 🚨 Common Issues

### Issue: "command not found: node"
```bash
# Use full path
/opt/homebrew/bin/node diagnose-and-fix.js
```

### Issue: "Cannot find module"
```bash
# You're in wrong directory
cd /Users/rubazayed/MCPForms/mcpforms
node diagnose-and-fix.js
```

### Issue: Playwright not found
```bash
# Install it
npm install
npx playwright install chromium
```

### Issue: Permission denied on .sh script
```bash
# Make executable
chmod +x create-working-service.sh
./create-working-service.sh
```

---

## 💡 Quick Reference

| Goal | Command |
|------|---------|
| See diagnosis | `node diagnose-and-fix.js` |
| Test current status | `node test-api-generation.js` |
| Automated fix | `./create-working-service.sh` |
| Test if fixed | `npx playwright test tests/regenerate-auto-fix.spec.ts` |
| Debug test | `npx playwright test tests/regenerate-button-debug.spec.ts` |

---

## 📁 All Created Files

### Diagnostic Tools
- `diagnose-and-fix.js` - Shows options and URLs
- `test-api-generation.js` - Tests API directly
- `investigate-template.js` - Template investigation guide

### Automated Tools
- `create-working-service.sh` - Creates fresh service (Bash)
- `check-service-cli.js` - Would check Firestore (needs credentials)
- `check-service-data.mjs` - Would check Firestore (needs credentials)
- `check-via-api.js` - Attempts API-based check

### Test Tools
- `tests/regenerate-auto-fix.spec.ts` - Auto-retry test (up to 5 attempts)
- `tests/regenerate-button-debug.spec.ts` - Detailed debug test

### Documentation
- `ITERATION_COMPLETE.md` - Full status and next steps
- `ROOT_CAUSE_ANALYSIS.md` - Investigation timeline
- `COMPLETE_FINDINGS.md` - Executive summary
- `REGENERATE_TESTING_GUIDE.md` - User testing guide
- `CLI_TOOLS_GUIDE.md` - This file

---

## 🎯 Next Steps

1. **Run diagnosis:**
   ```bash
   node diagnose-and-fix.js
   ```

2. **Choose your approach:**
   - Manual: Create new service via UI
   - Automated: Run `./create-working-service.sh`
   - Console: Follow Firebase Console steps

3. **Verify the fix:**
   ```bash
   node test-api-generation.js
   npx playwright test tests/regenerate-auto-fix.spec.ts
   ```

4. **Test in browser:**
   - Open service page
   - Click "Regenerate Documents"
   - Buttons should enable in 3-10 seconds

---

**Ready to proceed! Which approach would you like to try?**
- A) Run automated fix script
- B) Manual via Firebase Console
- C) Create new service via UI
