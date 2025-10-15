# ⚡ QUICK START: Fix Authentication & Run E2E Test

**Status**: 🔴 BLOCKED - Authentication Required  
**Time Needed**: 10-20 minutes to fix + 10 minutes to test  
**Your Action**: Fix credentials, then tell agent to re-run test

---

## 🚀 3-STEP QUICK FIX

### STEP 1: Test Login Manually (2 minutes)
```
1. Open: https://formgenai-4545.web.app/login
2. Try: belal.riyad@gmail.com / 9920032
3. Report result to agent
```

### STEP 2: Fix Authentication (Choose One)

**Option A - Reset Password** ⭐ RECOMMENDED
```
1. Go to: https://formgenai-4545.web.app/login
2. Click: "Forgot password?"
3. Enter: belal.riyad@gmail.com
4. Check email → Click reset link
5. Set new password (remember it!)
6. Update file: .env.test
   Change: TEST_USER_PASSWORD=<your_new_password>
```

**Option B - Check Firebase Console**
```
1. Go to: https://console.firebase.google.com/project/formgenai-4545/authentication/users
2. Find: belal.riyad@gmail.com
3. Check: Enabled? Email verified?
4. Fix issues found
```

**Option C - Create New Account**
```
1. Go to: https://formgenai-4545.web.app/signup
2. Create: e2e-test@mcpforms.test
3. Update .env.test with new credentials
```

### STEP 3: Tell Agent
```
Just say: "Authentication fixed, please re-run test"
```

Agent will automatically:
- ✅ Run complete E2E test (9 steps)
- ✅ Validate field normalization fix
- ✅ Inspect generated documents
- ✅ Create final validation report

---

## 📋 Full Details

**Comprehensive TODO**: `E2E_TODO_AUTHENTICATION_FIX.md` (~730 lines)  
**Test Run Summary**: `E2E_TEST_RUN_SUMMARY_OCT15.md`  
**This Quick Start**: `QUICK_START_AUTH_FIX.md`

---

## 🎯 What We're Testing

**Primary Goal**: Validate field normalization fix is working

**The Fix**: Converts intake form data from camelCase → snake_case before document generation

**What Success Looks Like**:
- ✅ Test completes all 9 steps
- ✅ Documents generated with ≥95% fields filled
- ✅ No empty placeholders in documents
- ✅ Firebase logs show normalization happening

**Current Blocker**: Can't even login to start the test!

---

## ⏱️ Timeline

```
Fix auth:     10-20 min  ← YOU DO THIS
Run test:     10 min     ← AGENT DOES THIS  
Validate:     20 min     ← AGENT HELPS WITH THIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total:        40-50 min
```

---

**START HERE**: Open https://formgenai-4545.web.app/login and test the credentials! 🚀
