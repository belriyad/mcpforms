# 🔍 Login Debug Instructions

## What We Found

✅ **Firebase Authentication is working** - 17 users exist in the database
✅ **Your email exists**: `briyad@skylineproperties.com`

## Common "Failed to Sign In" Causes

### 1. **Wrong Password** (Most Common)
- Firebase doesn't tell you if the password is wrong for security reasons
- Error will just say "Failed to sign in" or "Invalid credentials"

### 2. **How to Fix**

#### Option A: Reset Your Password
1. Go to: http://localhost:3000/login
2. Click "Forgot password?"
3. Enter: `briyad@skylineproperties.com`
4. Check your email for reset link
5. Create a new password

#### Option B: Use Existing Test Accounts
Try these test accounts that were created during E2E testing:

```
Email: test1759952236525@example.com
Password: TestPassword123!
```

```
Email: test1759951296191@example.com
Password: TestPassword123!
```

#### Option C: Create New Admin Account
1. Go to: http://localhost:3000/signup
2. Use a new email
3. Create account
4. Then manually upgrade to admin in Firebase Console

### 3. **Check Browser Console for Detailed Error**

I've updated the code to show detailed error messages. Here's what to do:

1. Open http://localhost:3000/login
2. Press `F12` or `Cmd+Option+I` (Mac) to open DevTools
3. Click the **Console** tab
4. Try to login
5. Look for messages like:
   - `🔐 Attempting sign in for: [your email]`
   - `❌ Sign in error:` followed by the error code
   - `Error code: auth/wrong-password` or similar

### 4. **Error Code Meanings**

| Error Code | What It Means | How to Fix |
|------------|---------------|------------|
| `auth/wrong-password` | Password is incorrect | Use password reset |
| `auth/user-not-found` | Email doesn't exist | Sign up first |
| `auth/invalid-email` | Email format is wrong | Check for typos |
| `auth/too-many-requests` | Too many failed attempts | Wait 15 minutes |
| `auth/network-request-failed` | No internet connection | Check WiFi |
| `auth/invalid-credential` | Wrong email or password | Verify credentials |

## Quick Test Steps

1. **Start the dev server** (if not already running):
   ```bash
   npm run dev
   ```

2. **Open browser console**:
   - Chrome/Edge: Press `F12` or `Cmd+Option+I` (Mac)
   - Firefox: Press `F12` or `Cmd+Option+K` (Mac)
   - Safari: Enable Develop menu first, then `Cmd+Option+C`

3. **Navigate to login**:
   ```
   http://localhost:3000/login
   ```

4. **Try to login** and watch the console

5. **Share the error message** you see in red that starts with:
   ```
   ❌ Sign in error:
   Error code: auth/xxxxx
   ```

## Next Steps

After you see the error in the console, you'll know exactly what's wrong:

- **`auth/wrong-password`** → Use password reset
- **`auth/user-not-found`** → Sign up or check email spelling
- **`auth/invalid-credential`** → Both email and password are wrong
- **Network errors** → Check internet connection

## Test Account Info

If you want to create a fresh test account with known credentials:

```bash
# Go to signup page
http://localhost:3000/signup

# Create account with:
Email: youremail+test@gmail.com
Password: TestPassword123!
Display Name: Your Name
```

Then you'll know for sure this password works.

---

**What's the actual error code you see in the browser console?** Share that and I can give you the exact fix.
