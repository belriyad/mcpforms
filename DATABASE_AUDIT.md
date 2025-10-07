# Database & Index Audit Report

**Date:** October 8, 2025  
**Project:** Smart Forms AI (formgenai-4545)

---

## 📊 Firestore Collections Inventory

### ✅ Collections with Indexes & Security Rules

#### 1. **`templates`**
- **Purpose:** Document templates (Word, PDF) with extracted fields
- **Owner Field:** `createdBy` (uid)
- **Index Status:** ✅ Composite index (createdBy + createdAt DESC)
- **Security Rules:** ✅ Per-user isolation
- **Query Pattern:** `where('createdBy', '==', uid).limit(50)`
- **Data Structure:**
  ```typescript
  {
    id: string
    name: string
    originalFileName: string
    fileType: 'docx' | 'pdf'
    status: 'uploaded' | 'parsing' | 'parsed' | 'error'
    extractedFields: Array<{name, type, placeholder}>
    createdBy: string (uid)
    createdAt: Timestamp
    errorMessage?: string
  }
  ```

#### 2. **`services`**
- **Purpose:** Legal services combining multiple templates
- **Owner Field:** `createdBy` (uid)
- **Index Status:** ✅ Composite index (createdBy + createdAt DESC)
- **Security Rules:** ✅ Per-user isolation
- **Query Pattern:** `where('createdBy', '==', uid).limit(50)`
- **Data Structure:**
  ```typescript
  {
    id: string
    name: string
    description: string
    templateIds: string[]
    status: 'draft' | 'active' | 'inactive'
    masterFormJson: any[]
    createdBy: string (uid)
    createdAt: Timestamp
    intakeForm?: {
      token: string
      url: string
    }
  }
  ```

#### 3. **`intakeSubmissions`**
- **Purpose:** Client form submissions (historical name, may not be actively used)
- **Owner Field:** `createdBy` (uid)
- **Index Status:** ✅ Composite index (createdBy + createdAt DESC)
- **Security Rules:** ❌ **MISSING** - not defined in firestore.rules
- **Query Pattern:** `where('createdBy', '==', uid).limit(100)`
- **Status:** ⚠️ Used in AdminDashboard stats only

#### 4. **`intakeCustomizations`**
- **Purpose:** Custom form configurations and branding
- **Owner Field:** `userId` (uid)
- **Index Status:** ✅ Composite index (userId + createdAt DESC)
- **Security Rules:** ✅ Per-user isolation
- **Query Pattern:** `where('userId', '==', uid).limit(100)`
- **Data Structure:**
  ```typescript
  {
    id: string
    userId: string (uid)
    serviceId: string
    customizations: any
    createdAt: Timestamp
  }
  ```

#### 5. **`users`**
- **Purpose:** User profiles with roles
- **Owner Field:** uid (document ID)
- **Index Status:** N/A (single document reads by ID)
- **Security Rules:** ✅ Users can read/update own profile
- **Access Pattern:** `doc(db, 'users', uid)`
- **Data Structure:**
  ```typescript
  {
    uid: string
    email: string
    role: 'lawyer' | 'admin'
    displayName?: string
    lastLogin: string (ISO)
    createdAt: string (ISO)
  }
  ```

---

### ⚠️ Collections WITHOUT Indexes or Security Rules

#### 6. **`intakes`** 
- **Purpose:** Active client intake forms
- **Owner Field:** ❓ **UNKNOWN** - needs investigation
- **Index Status:** ❌ **MISSING** - orderBy('createdAt') without index
- **Security Rules:** ❌ **MISSING** - not defined in firestore.rules
- **Query Pattern:** `orderBy('createdAt', 'desc')` - **WILL FAIL WITHOUT INDEX**
- **Component:** Used in `IntakeMonitor.tsx`
- **Risk:** 🔴 **HIGH** - No access control, slow queries
- **Action Required:**
  1. Add owner field (`createdBy`)
  2. Create composite index
  3. Add security rules
  4. Update IntakeMonitor queries

#### 7. **`documentArtifacts`**
- **Purpose:** Generated documents from templates
- **Owner Field:** ❓ **UNKNOWN** - needs investigation
- **Index Status:** ❌ **MISSING** - orderBy('generatedAt') without index
- **Security Rules:** ❌ **MISSING** - not defined in firestore.rules
- **Query Pattern:** `orderBy('generatedAt', 'desc')` - **WILL FAIL WITHOUT INDEX**
- **Component:** Used in `IntakeMonitor.tsx`
- **Risk:** 🔴 **HIGH** - No access control, slow queries
- **Action Required:**
  1. Add owner field (`createdBy`)
  2. Create composite index
  3. Add security rules
  4. Update IntakeMonitor queries

#### 8. **`customer_overrides`**
- **Purpose:** Customer-specific customization overrides
- **Owner Field:** ❓ **UNKNOWN**
- **Index Status:** ❌ **MISSING**
- **Security Rules:** ❌ **MISSING**
- **Component:** Used in `CustomizationManager.tsx`
- **Risk:** 🟡 **MEDIUM** - May not be actively used
- **Action Required:** Investigate usage, add rules if needed

#### 9. **`activityLogs`**
- **Purpose:** User activity tracking
- **Owner Field:** `userId` (uid)
- **Index Status:** ❓ **UNKNOWN** - depends on query patterns
- **Security Rules:** ✅ Defined in firestore.rules
- **Risk:** 🟢 **LOW** - Rules exist, but check if indexes needed

#### 10. **`settings`**
- **Purpose:** System-wide settings
- **Owner Field:** N/A (admin-only)
- **Index Status:** N/A
- **Security Rules:** ✅ Admin-only access
- **Risk:** 🟢 **LOW** - Properly secured

---

## 🚨 Critical Issues

### Issue 1: IntakeMonitor.tsx Queries Will Fail
**Problem:** `IntakeMonitor` uses `orderBy` on collections without indexes:
```typescript
// Line 46 - intakes collection
const intakesQuery = query(collection(db, 'intakes'), orderBy('createdAt', 'desc'))

// Line 59 - documentArtifacts collection  
const artifactsQuery = query(collection(db, 'documentArtifacts'), orderBy('generatedAt', 'desc'))
```

**Impact:**
- ❌ Queries will fail or be extremely slow
- ❌ IntakeMonitor tab won't load
- ❌ No access control on these collections

**Required Actions:**
1. Add `createdBy` field to both collections
2. Update queries to include `where('createdBy', '==', uid)`
3. Create composite indexes
4. Add security rules

---

### Issue 2: Missing Security Rules
**Problem:** No security rules for:
- `intakes`
- `documentArtifacts`
- `customer_overrides`
- `intakeSubmissions`

**Impact:**
- 🔓 Anyone authenticated can read/write these collections
- 🔓 No data isolation between users
- 🔓 Potential data leakage

---

### Issue 3: Inconsistent Naming
**Problem:**
- Dashboard uses `intakeSubmissions` 
- IntakeMonitor uses `intakes`
- Both may refer to the same data

**Impact:**
- Confusion about which collection is active
- Potential duplicate data
- Inefficient queries

---

## 🔧 Required Indexes

### Currently Deployed ✅
```json
{
  "indexes": [
    {
      "collectionGroup": "templates",
      "fields": [
        {"fieldPath": "createdBy", "order": "ASCENDING"},
        {"fieldPath": "createdAt", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "services",
      "fields": [
        {"fieldPath": "createdBy", "order": "ASCENDING"},
        {"fieldPath": "createdAt", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "intakeSubmissions",
      "fields": [
        {"fieldPath": "createdBy", "order": "ASCENDING"},
        {"fieldPath": "createdAt", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "intakeCustomizations",
      "fields": [
        {"fieldPath": "userId", "order": "ASCENDING"},
        {"fieldPath": "createdAt", "order": "DESCENDING"}
      ]
    }
  ]
}
```

### Missing Indexes ❌

#### For `intakes` collection:
```json
{
  "collectionGroup": "intakes",
  "fields": [
    {"fieldPath": "createdBy", "order": "ASCENDING"},
    {"fieldPath": "createdAt", "order": "DESCENDING"}
  ]
}
```

#### For `documentArtifacts` collection:
```json
{
  "collectionGroup": "documentArtifacts",
  "fields": [
    {"fieldPath": "createdBy", "order": "ASCENDING"},
    {"fieldPath": "generatedAt", "order": "DESCENDING"}
  ]
}
```

#### Optional: For `activityLogs` (if orderBy is used):
```json
{
  "collectionGroup": "activityLogs",
  "fields": [
    {"fieldPath": "userId", "order": "ASCENDING"},
    {"fieldPath": "timestamp", "order": "DESCENDING"}
  ]
}
```

---

## 📋 Action Plan

### 🔴 **CRITICAL - Do Immediately**

#### 1. Fix IntakeMonitor Queries
**File:** `src/components/admin/IntakeMonitor.tsx`

**Change from:**
```typescript
const intakesQuery = query(collection(db, 'intakes'), orderBy('createdAt', 'desc'))
```

**Change to:**
```typescript
const intakesQuery = query(
  collection(db, 'intakes'), 
  where('createdBy', '==', user.uid),
  limit(50)
)
```

**Same for documentArtifacts query.**

#### 2. Add Security Rules
**File:** `firestore.rules`

Add rules for missing collections:
```javascript
// Intakes - client form submissions
match /intakes/{intakeId} {
  allow read: if isAuthenticated() && 
                 (resource.data.createdBy == request.auth.uid || isAdmin());
  allow create: if isLawyerOrAdmin() && 
                   request.resource.data.createdBy == request.auth.uid;
  allow update: if isAuthenticated() && 
                   (resource.data.createdBy == request.auth.uid || isAdmin());
  allow delete: if isAuthenticated() && 
                   (resource.data.createdBy == request.auth.uid || isAdmin());
}

// Document Artifacts - generated documents
match /documentArtifacts/{artifactId} {
  allow read: if isAuthenticated() && 
                 (resource.data.createdBy == request.auth.uid || isAdmin());
  allow create: if isLawyerOrAdmin() && 
                   request.resource.data.createdBy == request.auth.uid;
  allow update, delete: if isAuthenticated() && 
                           (resource.data.createdBy == request.auth.uid || isAdmin());
}

// Intake Submissions (if still used)
match /intakeSubmissions/{submissionId} {
  allow read: if isAuthenticated() && 
                 (resource.data.createdBy == request.auth.uid || isAdmin());
  allow create: if isLawyerOrAdmin() && 
                   request.resource.data.createdBy == request.auth.uid;
  allow update, delete: if isAuthenticated() && 
                           (resource.data.createdBy == request.auth.uid || isAdmin());
}
```

#### 3. Add Indexes
**File:** `firestore.indexes.json`

Add missing indexes shown above.

#### 4. Data Migration
Create migration script to add `createdBy` field to existing documents in:
- `intakes`
- `documentArtifacts`

---

### 🟡 **IMPORTANT - Do Soon**

1. **Clarify Collection Usage:**
   - Determine if both `intakes` and `intakeSubmissions` are needed
   - Consolidate to single collection if redundant

2. **Add User Context to IntakeMonitor:**
   - Import `useAuth()` hook
   - Filter queries by `user.uid`

3. **Test IntakeMonitor Tab:**
   - Verify it loads after fixes
   - Check performance with indexes

4. **Audit `customer_overrides` Collection:**
   - Determine if actively used
   - Add security rules or remove

---

### 🟢 **NICE TO HAVE - Do Later**

1. **Add Pagination:**
   - Implement load-more for datasets >50 items
   - Use `startAfter` for pagination

2. **Add Activity Logging:**
   - Ensure `activityLogs` collection is populated
   - Create indexes if query patterns require them

3. **Performance Monitoring:**
   - Set up Firebase Performance SDK
   - Monitor query performance
   - Track slow queries

4. **Database Cleanup:**
   - Remove unused collections
   - Archive old data
   - Set up TTL rules

---

## 📊 Collection Summary Table

| Collection | Owner Field | Index | Rules | Status | Priority |
|------------|-------------|-------|-------|--------|----------|
| `users` | uid (ID) | N/A | ✅ | Active | ✅ Good |
| `templates` | `createdBy` | ✅ | ✅ | Active | ✅ Good |
| `services` | `createdBy` | ✅ | ✅ | Active | ✅ Good |
| `intakeCustomizations` | `userId` | ✅ | ✅ | Active | ✅ Good |
| `intakeSubmissions` | `createdBy` | ✅ | ❌ | Unknown | 🟡 Investigate |
| `intakes` | ❌ Missing | ❌ | ❌ | Active | 🔴 **FIX NOW** |
| `documentArtifacts` | ❌ Missing | ❌ | ❌ | Active | 🔴 **FIX NOW** |
| `customer_overrides` | ❓ | ❌ | ❌ | Unknown | 🟡 Investigate |
| `activityLogs` | `userId` | ❓ | ✅ | Unknown | 🟢 Optional |
| `settings` | N/A | N/A | ✅ | Active | ✅ Good |

---

## 🎯 Immediate Next Steps

1. ✅ Review this audit report
2. ❌ Fix IntakeMonitor queries (remove orderBy temporarily)
3. ❌ Add security rules for missing collections
4. ❌ Add composite indexes
5. ❌ Create migration for createdBy fields
6. ❌ Test IntakeMonitor tab
7. ❌ Deploy all changes

---

**Estimated Time:** 2-3 hours  
**Risk Level:** 🔴 HIGH (data security + performance issues)  
**Priority:** URGENT

