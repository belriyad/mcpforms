# Login Troubleshooting Guide

## Current Status: ✅ Auth System is Properly Configured

The authentication system is correctly set up with:
- ✅ Firebase initialized with correct config
- ✅ AuthProvider wrapping the app
- ✅ ProtectedRoute checking authentication
- ✅ signIn/signUp functions working
- ✅ Dev server running on http://localhost:3000

---

## Common Login Issues & Solutions

### Issue 1: "Unable to login" - Generic Error

**Possible Causes:**
1. **No User Account Exists**
   - Solution: Create an account first at `/signup`
   - Or use the test account (if created)

2. **Wrong Credentials**
   - Email/password mismatch
   - Check for typos, especially in email

3. **Firebase Connection Issue**
   - Check browser console for errors
   - Verify internet connection
   - Check Firebase project status

4. **Browser Cache/Cookies**
   - Clear browser cache
   - Try incognito/private window

---

## Step-by-Step Diagnostic

### Step 1: Check Dev Server
```bash
# Make sure dev server is running
npm run dev

# Should show:
# ✓ Ready in xxxx ms
# Local: http://localhost:3000
```

### Step 2: Open Browser Console
1. Open http://localhost:3000/login
2. Press F12 (or Cmd+Option+I on Mac)
3. Go to "Console" tab
4. Look for error messages (red text)

**Common Console Errors:**

#### Error: "Firebase: Error (auth/user-not-found)"
- **Cause**: No account with that email
- **Solution**: Create account at /signup first

#### Error: "Firebase: Error (auth/wrong-password)"
- **Cause**: Incorrect password
- **Solution**: Use correct password or reset it

#### Error: "Firebase: Error (auth/invalid-email)"
- **Cause**: Email format is wrong
- **Solution**: Use valid email format (user@example.com)

#### Error: "Firebase: Error (auth/network-request-failed)"
- **Cause**: No internet or Firebase is down
- **Solution**: Check internet, try again later

#### Error: "useAuth must be used within an AuthProvider"
- **Cause**: AuthProvider not wrapping component
- **Solution**: Already fixed - AuthProvider is in root layout

---

## Quick Tests

### Test 1: Create New Account
```bash
1. Go to http://localhost:3000/signup
2. Fill in:
   - Email: test@example.com
   - Password: password123 (min 6 chars)
   - Display Name: Test User
3. Click "Sign Up"
4. Should redirect to /admin
```

### Test 2: Login with Existing Account
```bash
1. Go to http://localhost:3000/login
2. Enter your credentials
3. Click "Sign In"
4. Should redirect to /admin
```

### Test 3: Check Firebase Auth Users
```bash
1. Go to https://console.firebase.google.com
2. Select project: formgenai-4545
3. Go to Authentication → Users
4. Verify your user exists
```

---

## Manual Debugging Steps

### 1. Check Network Tab
```bash
1. Open http://localhost:3000/login
2. Open DevTools (F12) → Network tab
3. Try to login
4. Look for failed requests (red)
5. Click on failed request to see error details
```

### 2. Check Firebase Config
The Firebase config is loaded from `.env.local`:
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDEZrEwNAzOrpAvpm6XWuDjaGX4m8DK-cc
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=formgenai-4545.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=formgenai-4545
```

Verify these values match your Firebase project.

### 3. Check Browser Console Logs
Look for these log messages:
- ✅ "Sign in error:" - Shows Firebase error details
- ✅ "Using cached profile for XXX" - Profile loaded successfully
- ❌ Any red error messages

---

## Solutions by Symptom

### Symptom: "Nothing happens when I click Sign In"

**Check:**
1. Open browser console - any errors?
2. Is form validation passing? (red borders on inputs)
3. Check Network tab - is request being sent?

**Solutions:**
- Fill all required fields
- Use valid email format
- Check JavaScript errors in console

---

### Symptom: "Invalid email or password" error

**Check:**
1. Does the user exist in Firebase Auth?
2. Is the password correct? (case-sensitive)
3. Is the email exactly matching?

**Solutions:**
- Verify email has no extra spaces
- Try password reset if forgotten
- Create new account if user doesn't exist

---

### Symptom: "Stuck on loading screen"

**Check:**
1. Browser console for errors
2. Network tab for hanging requests

**Solutions:**
- Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)
- Clear browser cache
- Check Firebase project status
- Restart dev server

---

### Symptom: "Redirects back to /login after successful login"

**Check:**
1. User profile exists in Firestore?
2. ProtectedRoute logic working?

**Solutions:**
- Check Firestore → users collection
- Verify user document exists with correct structure
- Check browser console for auth state changes

---

## Create Test User via Firebase Console

If you can't signup through the UI:

1. Go to https://console.firebase.google.com
2. Select project: formgenai-4545
3. Go to Authentication → Users
4. Click "Add user"
5. Fill in:
   - Email: admin@test.com
   - Password: Test123!
6. Click "Add user"
7. Now create user profile in Firestore:
   - Go to Firestore Database
   - Collection: users
   - Document ID: (copy the UID from Authentication)
   - Fields:
     ```
     uid: <copied UID>
     email: admin@test.com
     displayName: Test Admin
     role: admin
     createdAt: <current date ISO string>
     lastLogin: <current date ISO string>
     ```

---

## Debug Code Snippets

### Add to login page to debug:
```tsx
console.log('Login attempt:', { email, password: '***' });

const result = await signIn(email, password);
console.log('Login result:', result);

if (result.success) {
  console.log('Login successful, redirecting...');
  router.push('/admin');
} else {
  console.error('Login failed:', result.error);
  setError(result.error || 'Failed to sign in');
}
```

### Check auth state:
```tsx
// Add this useEffect to login page
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    console.log('Auth state changed:', user ? user.email : 'null');
  });
  return () => unsubscribe();
}, []);
```

---

## Current File Locations

- Login Page: `/Users/rubazayed/MCPForms/mcpforms/src/app/login/page.tsx`
- Auth Functions: `/Users/rubazayed/MCPForms/mcpforms/src/lib/auth.ts`
- Auth Provider: `/Users/rubazayed/MCPForms/mcpforms/src/lib/auth/AuthProvider.tsx`
- Protected Route: `/Users/rubazayed/MCPForms/mcpforms/src/components/ProtectedRoute.tsx`
- Firebase Config: `/Users/rubazayed/MCPForms/mcpforms/src/lib/firebase.ts`
- Environment: `/Users/rubazayed/MCPForms/mcpforms/.env.local`

---

## Next Steps to Debug

1. **Open browser console** and share the exact error message
2. **Check Network tab** for failed requests
3. **Try creating a new account** at /signup
4. **Verify Firebase project** is active
5. **Test with incognito window** to rule out cache

---

## If Still Having Issues

Please provide:
1. Exact error message from browser console
2. Screenshot of the login page
3. Any red errors in Network tab
4. Have you tried creating an account first?
5. What happens when you click "Sign In"? (nothing, error, loading, etc.)

Then I can provide more specific help!
