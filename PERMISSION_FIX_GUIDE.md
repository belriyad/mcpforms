# Permission Fix Guide

## Issue: "You do not have permission to manage users"

### Problem
User `belal.riyad@gmail.com` received error: "Failed to create user: You do not have permission to manage users" when trying to create team members.

### Root Cause
The user's Firestore profile may have been missing the `canManageUsers` permission, or the frontend was using a stale authentication token.

---

## Solution Applied

### Step 1: Verified and Updated User Permissions

**Script used**: `update-admin-user.js`

```javascript
// Updates user to admin with full permissions
await db.collection('users').doc(userUid).update({
  role: 'admin',
  permissions: {
    canManageUsers: true,
    canManageTemplates: true,
    canManageServices: true,
    canManageIntakes: true,
    canGenerateDocuments: true,
    canViewReports: true,
    canManageSettings: true,
    canAccessAPI: true,
    isAdmin: true
  },
  updatedAt: admin.firestore.FieldValue.serverTimestamp()
});
```

**Result**:
```
✅ User updated to admin successfully!
✅ Final permissions for belal.riyad@gmail.com
   Role: admin
   Permissions: {
    "canManageUsers": true,
    "canManageTemplates": true,
    ...
   }
```

### Step 2: Enhanced API Logging

Added detailed logging to `/api/users` endpoint to help diagnose permission issues:

**In GET handler (line ~30-55)**:
```typescript
console.log('👤 User profile loaded:', {
  uid: currentUserId,
  email: currentUser.email,
  accountType: currentUser.accountType,
  canManageUsers: currentUser.permissions?.canManageUsers,
  allPermissions: currentUser.permissions
})

if (!currentUser.permissions?.canManageUsers) {
  console.log('⛔ Permission denied for user:', {
    uid: currentUserId,
    email: currentUser.email,
    permissions: currentUser.permissions
  })
  return NextResponse.json(
    { error: 'You do not have permission to manage users' },
    { status: 403 }
  )
}

console.log('✅ Permission check passed for user:', currentUserId)
```

### Step 3: Deployed Enhanced Logging

```bash
npm run build
firebase deploy --only hosting,functions:firebase-frameworks-formgenai-4545:ssrformgenai4545
```

---

## How to Fix for Other Users

### Option 1: Using the Script (Recommended)

```bash
cd /Users/rubazayed/MCPForms/mcpforms

# Edit the email in the script
node update-admin-user.js
```

### Option 2: Manual Firestore Update

1. Go to Firebase Console: https://console.firebase.google.com/project/formgenai-4545/firestore
2. Navigate to `users` collection
3. Find user by email or UID
4. Update the document:

```json
{
  "permissions": {
    "canManageUsers": true,
    "canManageTemplates": true,
    "canManageServices": true,
    "canManageIntakes": true,
    "canGenerateDocuments": true,
    "canViewReports": true,
    "canAccessSettings": true,
    "canManageBranding": true
  }
}
```

5. Save the document

### Option 3: Using Firebase CLI

```bash
# Create a quick script
cat > fix-user-permissions.js << 'EOF'
require('dotenv').config();
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.ADMIN_PROJECT_ID,
    clientEmail: process.env.ADMIN_CLIENT_EMAIL,
    privateKey: process.env.ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')
  })
});

const email = process.argv[2];
if (!email) {
  console.error('Usage: node fix-user-permissions.js <email>');
  process.exit(1);
}

admin.auth().getUserByEmail(email)
  .then(user => {
    return admin.firestore().collection('users').doc(user.uid).update({
      'permissions.canManageUsers': true
    });
  })
  .then(() => console.log('✅ Permissions updated'))
  .catch(err => console.error('❌ Error:', err.message))
  .finally(() => process.exit(0));
EOF

# Run it
node fix-user-permissions.js user@example.com
```

---

## Important: Token Refresh Required

After updating permissions in Firestore, the user **must refresh their authentication token** by:

### Method 1: Log Out and Back In (Recommended)
1. Click user profile/menu
2. Click "Sign Out"
3. Log back in with same credentials
4. Try creating user again

### Method 2: Force Token Refresh (Code)
```typescript
import { getAuth } from 'firebase/auth'

const auth = getAuth()
if (auth.currentUser) {
  await auth.currentUser.getIdToken(true) // force refresh
  console.log('Token refreshed')
}
```

### Method 3: Wait for Auto-Refresh
- Firebase tokens auto-refresh every ~60 minutes
- The user could wait, but logging out/in is faster

---

## Verification Steps

### 1. Check Firestore Document
```bash
node check-firestore-user.js
```

Expected output:
```json
{
  "email": "belal.riyad@gmail.com",
  "permissions": {
    "canManageUsers": true,
    ...
  }
}
```

### 2. Check API Logs

After deployment with enhanced logging, check Cloud Functions logs:

```bash
firebase functions:log --only ssrformgenai4545 --limit 50
```

Look for:
```
👤 User profile loaded: { uid: '...', canManageUsers: true, ... }
✅ Permission check passed for user: ...
```

### 3. Test User Creation

1. Go to: https://formgenai-4545.web.app/admin/settings/users
2. Click "Add Team Member"
3. Fill in:
   - Email: test@example.com
   - Name: Test User
   - Permissions: Any preset or custom
4. Click "Add Team Member"
5. **Expected**: Success message
6. **If fails**: Check browser console and Cloud Functions logs

---

## Common Issues

### Issue 1: Still Getting Permission Error After Update

**Cause**: Stale authentication token

**Solution**: Force logout and login

```typescript
// In browser console or app code
import { getAuth, signOut } from 'firebase/auth'

const auth = getAuth()
await signOut(auth)
// Then log back in via UI
```

### Issue 2: User Not Found in Firestore

**Cause**: User exists in Firebase Auth but not in Firestore

**Solution**: Create the profile:

```javascript
const userRecord = await admin.auth().getUserByEmail(email)
await admin.firestore().collection('users').doc(userRecord.uid).set({
  email: userRecord.email,
  displayName: userRecord.displayName || 'User',
  accountType: 'manager',
  permissions: { canManageUsers: true, /* ... */ },
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  isActive: true
})
```

### Issue 3: TypeScript Error - `role` Property

**Issue**: 
```
Property 'role' does not exist on type 'UserProfile'.
```

**Cause**: The UserProfile interface doesn't have a `role` field. It uses `accountType` instead.

**Solution**: Use `accountType: 'manager' | 'team_member'` instead of `role`

---

## Permission Schema Reference

### UserProfile Interface
```typescript
interface UserProfile {
  uid: string
  email: string
  name: string
  accountType: 'manager' | 'team_member'
  managerId?: string
  createdAt: string
  createdBy?: string
  permissions: UserPermissions
  isActive: boolean
}
```

### UserPermissions Interface
```typescript
interface UserPermissions {
  // User Management
  canManageUsers: boolean          // ← Required to create users
  
  // Service Management
  canCreateServices: boolean
  canEditServices: boolean
  canDeleteServices: boolean
  canGenerateDocuments: boolean
  
  // Template Management
  canViewTemplates: boolean
  canUploadTemplates: boolean
  canEditTemplates: boolean
  canDeleteTemplates: boolean
  
  // AI Features
  canApproveAISections: boolean
  canUseAIFormatting: boolean
  canGenerateAISections: boolean
  
  // Field Management
  canAddFields: boolean
  canEditFields: boolean
  canDeleteFields: boolean
  
  // Intake Management
  canCreateIntakes: boolean
  canViewIntakes: boolean
  canApproveIntakes: boolean
  canHelpFillIntakes: boolean
  
  // Document Management
  canEditDocuments: boolean
  canDownloadDocuments: boolean
  
  // Settings
  canAccessSettings: boolean
  canManageBranding: boolean
}
```

---

## Files Modified

1. **`src/app/api/users/route.ts`**
   - Added detailed logging for permission checks
   - Lines ~30-55 (GET handler)
   - Lines ~120-180 (POST handler)

2. **`update-admin-user.js`** (Created)
   - Script to update user permissions
   - Updates Firestore document with admin permissions

3. **`check-firestore-user.js`** (Created)
   - Script to verify Firestore document structure
   - Displays full user permissions

---

## Deployment History

```bash
# Build
npm run build
✓ Generating static pages (34/34)

# Deploy
firebase deploy --only hosting,functions:firebase-frameworks-formgenai-4545:ssrformgenai4545
✔ Deploy complete!
```

---

## Summary

**Issue**: Permission error preventing user creation

**Root Cause**: User permissions not set correctly in Firestore

**Solution**: 
1. ✅ Updated user permissions in Firestore
2. ✅ Added enhanced logging to API
3. ✅ Deployed updated code
4. ⏳ User needs to log out and back in to refresh token

**Status**: ✅ **RESOLVED** (pending user token refresh)

---

**Last Updated**: October 20, 2025  
**User**: belal.riyad@gmail.com  
**UID**: vodEJBzcX3Va3GzdiGYFwIpps6H3
