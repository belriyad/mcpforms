# 🔧 Service Creation Error - SOLUTION

## Problem
**Error**: "Failed to create service"
**Root Cause**: `7 PERMISSION_DENIED: Missing or insufficient permissions`

## Why This Happens

The `/api/services/create` endpoint runs **server-side** in Next.js API routes. It was using the **client-side Firebase SDK** which doesn't work properly on the server because:

1. Client SDK requires browser authentication context
2. API routes run on the server without auth context
3. Firestore security rules reject the write operation

## Solution

### ✅ **STEP 1: Fixed API Routes (Already Done)**

I've updated these files to use **Firebase Admin SDK**:
- ✅ `src/app/api/services/create/route.ts` - Now uses Admin SDK
- ✅ `src/app/api/services/load-templates/route.ts` - Now uses Admin SDK

### ⚠️ **STEP 2: Add Firebase Admin Credentials (REQUIRED)**

You need to add Firebase service account credentials to `.env.local`:

```bash
# Firebase Admin SDK (for API routes)
FIREBASE_PROJECT_ID=formgenai-4545
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@formgenai-4545.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----"
FIREBASE_STORAGE_BUCKET=formgenai-4545.firebasestorage.app
```

## How to Get Firebase Admin Credentials

### Option A: Firebase Console (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **formgenai-4545**
3. Click ⚙️ **Settings** → **Project Settings**
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Download the JSON file
7. Extract values from the JSON:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep the `\n` characters!)

### Option B: Use Existing Credentials

If you already have the service account key, add it to `.env.local`:

```bash
# Add these to .env.local (below existing variables)
FIREBASE_PROJECT_ID=formgenai-4545
FIREBASE_CLIENT_EMAIL=your-service-account@formgenai-4545.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour\nPrivate\nKey\nHere\n-----END PRIVATE KEY-----"
```

⚠️ **IMPORTANT**: The private key must keep the `\n` newline characters intact!

## Alternative: Temporary Workaround

If you can't get Firebase Admin credentials immediately, you can temporarily relax the Firestore rules:

### Update `firestore.rules`:

Find this section (around line 63):
```plaintext
match /services/{serviceId} {
  allow read: if isAuthenticated();
  
  allow create: if isLawyerOrAdmin() && 
                   request.resource.data.createdBy == request.auth.uid;
```

Replace with:
```plaintext
match /services/{serviceId} {
  allow read: if isAuthenticated();
  
  // TEMPORARY: Allow create without auth check for server-side API
  allow create: if true;  // ← TEMPORARY - Allows any write
```

Then run:
```bash
cd /Users/rubazayed/MCPForms/mcpforms
firebase deploy --only firestore:rules
```

⚠️ **WARNING**: This is insecure! Only use for testing. Proper solution is Firebase Admin SDK with credentials.

## Testing After Fix

### Rebuild and Deploy (Production):

```bash
cd /Users/rubazayed/MCPForms/mcpforms

# Add Firebase Admin credentials to .env.local first!

# Rebuild the app
npm run build

# Deploy to Firebase
firebase deploy --only hosting
```

### Or Test Locally:

```bash
# Add credentials to .env.local first

# Start dev server
npm run dev

# In another terminal, run the test
export PATH="/opt/homebrew/bin:$PATH"
npx playwright test tests/manual-service-test.spec.ts --project=chromium --headed
```

## Expected Result

After adding Firebase Admin credentials:

### API Response (Success):
```json
{
  "success": true,
  "serviceId": "abc123xyz",
  "message": "Service created successfully"
}
```

### What Should Work:
1. ✅ Create service (all 4 wizard steps)
2. ✅ Load templates into service
3. ✅ Generate intake form
4. ✅ Send intake form email
5. ✅ Redirect to `/admin/services/{serviceId}`

## Files Modified

### ✅ Already Fixed:
- `src/app/api/services/create/route.ts`
- `src/app/api/services/load-templates/route.ts`

### 📝 You Need to Update:
- `.env.local` - Add Firebase Admin credentials

### 🔧 Alternative (Firestore Rules):
- `firestore.rules` - Temporary workaround only

## Summary

| Task | Status | Action Required |
|------|--------|-----------------|
| Update API routes | ✅ **Done** | No action |
| Add Firebase Admin credentials | ⚠️ **Pending** | Add to `.env.local` |
| Rebuild app | ⏸️ **Waiting** | Run after credentials added |
| Deploy | ⏸️ **Waiting** | Run after rebuild |

---

**Next Steps:**
1. Get Firebase service account credentials
2. Add to `.env.local`
3. Rebuild: `npm run build`
4. Deploy: `firebase deploy --only hosting`
5. Test service creation → Should work! ✅

---

**Created**: 2025-10-09  
**Status**: Waiting for Firebase Admin credentials
