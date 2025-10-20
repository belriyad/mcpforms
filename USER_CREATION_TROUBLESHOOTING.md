# User Creation Troubleshooting Guide

## Issue: "Failed to create user" Error

### Recent Fix (Deployed)
Added comprehensive error logging and handling to identify the exact failure point in user creation.

---

## Debugging Steps

### 1. Check Browser Console
After clicking "Add Team Member" and getting an error:

1. Open Developer Tools (F12 or Cmd+Option+I)
2. Go to Console tab
3. Look for logs starting with:
   - 🚀 Getting authentication token...
   - 📡 Sending request to create user...
   - 📥 Response status: XXX
   - 📥 Response data: {...}

**What to look for:**
- If you see `401 Unauthorized`: Token issue
- If you see `403 Forbidden`: Permission issue
- If you see `404 Not Found`: User profile issue
- If you see `409 Conflict`: Email already exists
- If you see `500 Internal Server Error`: Server-side issue

---

### 2. Check Server Logs (Firebase Functions)

```bash
export PATH="/opt/homebrew/bin:$PATH"
cd /Users/rubazayed/MCPForms/mcpforms
firebase functions:log --only ssrformgenai4545
```

**Look for these log entries:**
```
🚀 POST /api/users - User creation request received
📦 Request body: { email: ..., name: ..., hasPermissions: true }
🔑 Verifying authentication token...
✅ Token verified for user: uid
📂 Fetching current user profile...
✅ Current user loaded: { uid: ..., canManageUsers: true }
🔐 Generating temporary password...
👤 Creating Firebase Auth user...
✅ Created Firebase Auth user successfully: uid
💾 Creating user profile in Firestore...
✅ Created user profile in Firestore successfully
🎉 User creation completed successfully: uid
```

---

## Common Issues & Solutions

### Issue 1: Firebase Admin Not Initialized
**Error**: `Firebase Admin not configured`

**Cause**: Environment variables missing

**Fix**:
1. Check `.env` file has all required Firebase Admin credentials:
   ```
   FIREBASE_PROJECT_ID=...
   FIREBASE_CLIENT_EMAIL=...
   FIREBASE_PRIVATE_KEY=...
   ```

2. Redeploy:
   ```bash
   firebase deploy --only functions
   ```

---

### Issue 2: Token Verification Failed
**Error**: `Invalid authentication token`

**Cause**: User session expired or token corrupted

**Fix**:
1. Sign out and sign in again
2. Clear browser cache
3. Try in incognito window

---

### Issue 3: User Profile Not Found
**Error**: `User profile not found. Please contact support.`

**Cause**: Current user doesn't have a Firestore profile

**Fix**:
1. Check Firestore console: `users/{uid}` exists
2. If missing, create manually:
   ```json
   {
     "uid": "your-uid",
     "email": "your@email.com",
     "name": "Your Name",
     "accountType": "manager",
     "permissions": {
       "canManageUsers": true,
       "canManageTemplates": true,
       "canManageServices": true,
       "canViewIntakes": true,
       "canManageIntakes": true,
       "canGenerateDocuments": true,
       "canViewDocuments": true,
       "canDownloadDocuments": true,
       "canEditDocuments": true,
       "canDeleteDocuments": true,
       "canSendIntakes": true,
       "canCustomizeIntakes": true,
       "canViewReports": true,
       "canManageSettings": true
     },
     "isActive": true,
     "createdAt": "2025-10-19T..."
   }
   ```

---

### Issue 4: Permission Denied
**Error**: `You do not have permission to manage users`

**Cause**: Current user's `canManageUsers` permission is false

**Fix**:
1. Go to Firestore console
2. Find your user document: `users/{your-uid}`
3. Edit field: `permissions.canManageUsers` → `true`
4. Refresh the page

---

### Issue 5: Email Already Exists
**Error**: `A user with this email already exists`

**Cause**: Email is already registered in Firebase Auth

**Fix**:
Option A: Use a different email
Option B: Delete the existing user:
```bash
# In Firebase Console > Authentication > Users
# Find the user and delete them
```

---

### Issue 6: Firebase Auth Creation Failed
**Error**: `Failed to create user account: [details]`

**Possible Causes**:
- Invalid email format
- Password complexity requirements not met
- Firebase quota exceeded
- Firebase project billing issue

**Fix**:
1. Check email format is valid
2. Verify Firebase project has billing enabled (Blaze plan required for Admin SDK)
3. Check Firebase quota limits in console
4. Review error code in details

---

### Issue 7: Firestore Write Failed
**Error**: `Failed to create user profile: [details]`

**Possible Causes**:
- Firestore rules blocking write
- Network issue
- Firestore quota exceeded

**Fix**:
1. Check Firestore rules allow write to `users` collection:
   ```javascript
   match /users/{userId} {
     allow create: if request.auth != null;
     allow read, update: if request.auth.uid == userId || 
                           request.auth.token.canManageUsers == true;
   }
   ```

2. Check Firestore console for quota warnings

---

## Testing After Fix

### Test Case 1: Create User with All Permissions
1. Go to Settings > Team Management
2. Click "Add Team Member"
3. Fill in:
   - Email: `test@example.com`
   - Name: `Test User`
   - Permission Level: Manager
   - ✓ Send invitation email
4. Click "Add Team Member"
5. ✅ Should see: "Team member created! They will receive an invitation email shortly."

### Test Case 2: Create User Without Email
1. Go to Settings > Team Management
2. Click "Add Team Member"
3. Fill in:
   - Email: `test2@example.com`
   - Name: `Test User 2`
   - Permission Level: Assistant
   - ✗ Send invitation email
4. Click "Add Team Member"
5. ✅ Should see: "Team member created successfully!"

### Test Case 3: Duplicate Email
1. Try to create user with email from Test Case 1
2. ❌ Should see: "Failed to create user: A user with this email already exists"

---

## Logs to Share for Support

If issue persists, collect these logs:

1. **Browser Console Logs**:
   - All logs from the console after clicking "Add Team Member"

2. **Network Tab**:
   - Request URL: `POST /api/users`
   - Request Headers (Authorization token - last 10 chars only)
   - Request Payload
   - Response Status
   - Response Body

3. **Firebase Function Logs**:
   ```bash
   firebase functions:log --only ssrformgenai4545 --limit 50
   ```

4. **User State**:
   - Current user UID
   - Current user email
   - `canManageUsers` permission status

---

## Quick Fix Commands

### Reset User Permissions
```javascript
// In Firestore Console > users/{your-uid}
{
  "permissions": {
    "canManageUsers": true,
    "canManageTemplates": true,
    "canManageServices": true,
    "canViewIntakes": true,
    "canManageIntakes": true,
    "canGenerateDocuments": true,
    "canViewDocuments": true,
    "canDownloadDocuments": true,
    "canEditDocuments": true,
    "canDeleteDocuments": true,
    "canSendIntakes": true,
    "canCustomizeIntakes": true,
    "canViewReports": true,
    "canManageSettings": true
  }
}
```

### Check Firebase Admin
```bash
# Check environment variables
cat .env | grep FIREBASE

# Should show:
# FIREBASE_PROJECT_ID=formgenai-4545
# FIREBASE_CLIENT_EMAIL=...
# FIREBASE_PRIVATE_KEY=...
```

### Redeploy Everything
```bash
export PATH="/opt/homebrew/bin:$PATH"
cd /Users/rubazayed/MCPForms/mcpforms
npm run build
firebase deploy
```

---

## Expected Behavior

### Successful User Creation Flow

1. User clicks "Add Team Member"
2. Modal opens with form
3. User fills in email, name, selects permissions
4. User clicks "Add Team Member" button
5. Button shows "Creating..." with spinner
6. Within 2-3 seconds:
   - ✅ Alert: "Team member created successfully!"
   - Modal closes
   - Table refreshes with new user
   - New user appears in list

### Error Handling

If any step fails:
- Clear error message shown in red box in modal
- Alert with detailed error message
- Button returns to normal state
- Modal stays open for user to retry
- Console shows detailed logs

---

## Deployment Status

**Latest Fix Deployed**: October 19, 2025
**Commit**: a0fbba8e
**Changes**:
- ✅ Comprehensive error logging
- ✅ Better error messages
- ✅ Auth user cleanup on Firestore failure
- ✅ Frontend error details
- ✅ Console debugging logs

**To apply latest fix**:
```bash
firebase deploy --only hosting,functions
```

---

## Need More Help?

1. Check browser console (F12)
2. Check Firebase function logs
3. Share error message and logs
4. Include user UID and email
5. Include timestamp of error

The improved logging will show exactly where the creation is failing!
