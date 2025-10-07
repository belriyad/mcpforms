# 🗺️ Authentication System Visual Map

## 🏗️ Application Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      MCPForms Application                     │
└─────────────────────────────────────────────────────────────┘
                              |
                              |
         ┌────────────────────┴─────────────────────┐
         |                                          |
    [Not Logged In]                          [Logged In]
         |                                          |
         v                                          v
┌─────────────────┐                     ┌──────────────────────┐
│  PUBLIC ROUTES  │                     │   PROTECTED ROUTES   │
└─────────────────┘                     └──────────────────────┘
         |                                          |
    ┌────┴─────┐                          ┌────────┴──────────┐
    |          |                          |                   |
    v          v                          v                   v
┌────────┐ ┌────────┐              ┌──────────┐      ┌──────────────┐
│ /login │ │/signup │              │  /admin  │      │ /admin/...   │
└────────┘ └────────┘              └──────────┘      └──────────────┘
    │          │                        │                    │
    │          │                        │                    │
    └──────┬───┘                        └────────┬───────────┘
           │                                     │
           v                                     v
    ┌──────────────┐                    ┌──────────────────┐
    │   Sign Up    │                    │  Admin Dashboard │
    │   Sign In    │                    │  with Logout     │
    └──────────────┘                    └──────────────────┘
```

---

## 🔄 Authentication Flow Diagram

```
┌──────────┐
│  User    │
│  Visits  │
│  Site    │
└────┬─────┘
     │
     v
┌─────────────────┐
│ Is User Logged  │
│ In?             │◄─────────┐
└────┬────────────┘          │
     │                       │
     ├─── NO ───┐            │
     │          │            │
     │          v            │
     │   ┌──────────────┐   │
     │   │ Redirect to  │   │
     │   │   /login     │   │
     │   └──────┬───────┘   │
     │          │            │
     │          v            │
     │   ┌──────────────┐   │
     │   │ Login Form   │   │
     │   │ - Email      │   │
     │   │ - Password   │   │
     │   └──────┬───────┘   │
     │          │            │
     │          v            │
     │   ┌──────────────┐   │
     │   │ Submit       │   │
     │   │ Credentials  │   │
     │   └──────┬───────┘   │
     │          │            │
     │          v            │
     │   ┌──────────────┐   │
     │   │  Firebase    │   │
     │   │  Auth Check  │   │
     │   └──────┬───────┘   │
     │          │            │
     │          │ Valid      │
     │          └────────────┘
     │
     └─── YES ───┐
                 │
                 v
          ┌──────────────┐
          │ Load User    │
          │ Profile from │
          │ Firestore    │
          └──────┬───────┘
                 │
                 v
          ┌──────────────┐
          │ Show Admin   │
          │ Dashboard    │
          └──────┬───────┘
                 │
                 v
          ┌──────────────┐
          │ User Clicks  │
          │ Logout       │
          └──────┬───────┘
                 │
                 v
          ┌──────────────┐
          │ Sign Out     │
          │ Redirect to  │
          │ /login       │
          └──────────────┘
```

---

## 📂 File System Layout

```
mcpforms/
│
├── 🔐 AUTHENTICATION CORE
│   │
│   ├── src/lib/auth.ts
│   │   ├── signUp()              → Create new user
│   │   ├── signIn()              → Login user
│   │   ├── signOut()             → Logout user
│   │   ├── resetPassword()       → Send reset email
│   │   ├── getCurrentUserProfile() → Get user data
│   │   └── hasRole()             → Check permissions
│   │
│   └── src/lib/auth/AuthProvider.tsx
│       ├── AuthContext           → Global auth state
│       ├── useAuth() hook        → Access auth anywhere
│       └── Real-time listener    → Sync with Firebase
│
├── �� PUBLIC PAGES
│   │
│   ├── src/app/login/page.tsx
│   │   └── URL: /login
│   │       ├── Email input
│   │       ├── Password input
│   │       ├── Remember me
│   │       ├── Forgot password link
│   │       └── Sign up link
│   │
│   └── src/app/signup/page.tsx
│       └── URL: /signup
│           ├── Email input
│           ├── Password input
│           ├── Name input
│           ├── Role selector
│           ├── Phone input (optional)
│           ├── Law firm input (optional)
│           └── Login link
│
├── 🛡️ PROTECTED PAGES
│   │
│   ├── src/components/ProtectedRoute.tsx
│   │   └── HOC that wraps protected pages
│   │       ├── Checks if user logged in
│   │       ├── Redirects to /login if not
│   │       └── Optionally checks role
│   │
│   ├── src/app/admin/layout.tsx
│   │   └── Wraps all /admin/* pages
│   │       ├── Navigation bar
│   │       ├── User info display
│   │       ├── Role badge
│   │       └── Logout button
│   │
│   └── src/app/admin/page.tsx
│       └── URL: /admin
│           └── Requires authentication
│
├── 🎨 COMPONENTS
│   │
│   └── src/components/admin/AdminDashboard.tsx
│       ├── Quick stats
│       ├── Recent activity
│       ├── User profile section
│       └── Logout button (mobile)
│
└── 🔒 SECURITY
    │
    ├── firestore.rules
    │   └── Role-based access control
    │       ├── admin → Full access
    │       ├── lawyer → Own data
    │       └── client → Own submissions
    │
    └── storage.rules
        └── File upload security
            ├── File type validation
            ├── File size limits
            └── User ownership
```

---

## 🎯 User Journey Map

### New User Journey

```
1. Visit site
   └─> Lands on /login
   
2. Don't have account
   └─> Click "Sign Up"
   
3. Fill signup form
   ├─> Email: user@example.com
   ├─> Password: ••••••
   ├─> Name: John Doe
   └─> Role: Lawyer
   
4. Click "Sign Up"
   └─> Creates Firebase user
   └─> Creates Firestore profile
   
5. Auto-redirected to /admin
   └─> Now logged in
   
6. See dashboard
   ├─> Welcome message
   ├─> Services panel
   ├─> Templates panel
   └─> Logout button (top right)
```

### Returning User Journey

```
1. Visit site
   └─> Lands on /login
   
2. Enter credentials
   ├─> Email: user@example.com
   └─> Password: ••••••
   
3. Click "Sign In"
   └─> Firebase authenticates
   └─> Loads Firestore profile
   
4. Auto-redirected to /admin
   └─> Now logged in
   
5. Work in application
   ├─> Create services
   ├─> Manage templates
   └─> Generate documents
   
6. When done
   └─> Click logout button
   └─> Redirected to /login
```

---

## 🔌 Data Flow Diagram

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ 1. User enters credentials
       v
┌─────────────────────┐
│  Login/Signup Form  │
│  (React Component)  │
└──────┬──────────────┘
       │
       │ 2. Calls auth function
       v
┌─────────────────┐
│  src/lib/auth.ts│
│                 │
│  - signIn()     │
│  - signUp()     │
└──────┬──────────┘
       │
       │ 3. Firebase API call
       v
┌─────────────────────┐
│  Firebase Auth      │
│  (Cloud Service)    │
└──────┬──────────────┘
       │
       │ 4. Success → Create/Get UID
       v
┌─────────────────────┐
│   Firestore DB      │
│                     │
│   users/            │
│   └─ {uid}          │
│      ├─ email       │
│      ├─ name        │
│      ├─ role        │
│      ├─ phone       │
│      └─ lawFirm     │
└──────┬──────────────┘
       │
       │ 5. User data synced
       v
┌─────────────────────┐
│  AuthProvider       │
│  (React Context)    │
│                     │
│  State:             │
│  - user ✅          │
│  - userProfile ✅   │
│  - loading: false   │
└──────┬──────────────┘
       │
       │ 6. Context available app-wide
       v
┌─────────────────────┐
│  Any Component      │
│                     │
│  const { user,      │
│    userProfile }    │
│    = useAuth()      │
└─────────────────────┘
```

---

## 🔐 Security Layers

```
┌─────────────────────────────────────────┐
│         User Makes Request              │
└────────────────┬────────────────────────┘
                 │
                 v
        ┌────────────────────┐
        │   Layer 1:         │
        │   Route Protection │
        │   ProtectedRoute   │
        └────────┬───────────┘
                 │
                 ├─ Not Authenticated → Redirect to /login
                 │
                 v
        ┌────────────────────┐
        │   Layer 2:         │
        │   Firebase Auth    │
        │   Token Check      │
        └────────┬───────────┘
                 │
                 ├─ Invalid Token → Reject
                 │
                 v
        ┌────────────────────┐
        │   Layer 3:         │
        │   Firestore Rules  │
        │   Permission Check │
        └────────┬───────────┘
                 │
                 ├─ No Permission → Deny
                 │
                 v
        ┌────────────────────┐
        │   Layer 4:         │
        │   Data Access      │
        │   Granted ✅       │
        └────────────────────┘
```

---

## 🎨 UI Component Hierarchy

```
App Root
│
├── AuthProvider (wraps entire app)
│   │
│   ├── Login Page
│   │   └── Login Form
│   │       ├── Email Input
│   │       ├── Password Input
│   │       ├── Submit Button
│   │       └── Links (Signup, Reset Password)
│   │
│   ├── Signup Page
│   │   └── Signup Form
│   │       ├── Email Input
│   │       ├── Password Input
│   │       ├── Name Input
│   │       ├── Role Select
│   │       ├── Optional Fields
│   │       └── Submit Button
│   │
│   └── Admin Layout (Protected)
│       │
│       ├── Navigation Bar
│       │   ├── Logo/Brand
│       │   ├── Navigation Links
│       │   └── User Menu
│       │       ├── User Avatar
│       │       ├── User Name
│       │       ├── Role Badge
│       │       └── Logout Button ← HERE
│       │
│       └── Page Content
│           │
│           ├── Admin Dashboard
│           │   ├── Quick Stats
│           │   ├── Recent Activity
│           │   └── User Section
│           │       └── Logout Button ← AND HERE
│           │
│           ├── Services Page
│           ├── Templates Page
│           └── Other Admin Pages
```

---

## 🚦 Access Control Matrix

```
┌──────────────┬────────┬────────┬────────┐
│   Resource   │ Admin  │ Lawyer │ Client │
├──────────────┼────────┼────────┼────────┤
│ /login       │   ✅   │   ✅   │   ✅   │
│ /signup      │   ✅   │   ✅   │   ✅   │
│ /admin       │   ✅   │   ✅   │   ❌   │
│ All services │   ✅   │   Own  │   ❌   │
│ All users    │   ✅   │   ❌   │   ❌   │
│ Templates    │   ✅   │   ✅   │   ❌   │
│ Submissions  │   ✅   │   Own  │   Own  │
└──────────────┴────────┴────────┴────────┘

Legend:
✅ = Full Access
Own = Only their own data
❌ = No Access
```

---

## 🎯 Quick Reference

### 🔓 Login
**URL:** http://localhost:3000/login
**File:** `src/app/login/page.tsx`

### ✍️ Signup
**URL:** http://localhost:3000/signup
**File:** `src/app/signup/page.tsx`

### 🚪 Logout
**Location:** Top-right navigation bar
**Files:** 
- `src/app/admin/layout.tsx` (main)
- `src/components/admin/AdminDashboard.tsx` (backup)

### 🎯 Admin Dashboard
**URL:** http://localhost:3000/admin
**File:** `src/app/admin/page.tsx`
**Protection:** Requires authentication

### ⚙️ Auth Functions
**File:** `src/lib/auth.ts`
**Functions:** signUp, signIn, signOut, resetPassword

### 🔌 Auth Context
**File:** `src/lib/auth/AuthProvider.tsx`
**Hook:** `useAuth()`
**Returns:** `{ user, userProfile, loading }`

---

## 📍 Where to Find Things

### "I want to change the login page design"
→ Edit: `src/app/login/page.tsx`

### "I want to add fields to signup"
→ Edit: `src/app/signup/page.tsx`
→ Update: `src/lib/auth.ts` (signUp function)

### "I want to customize the logout button"
→ Edit: `src/app/admin/layout.tsx`

### "I want to add a settings page"
→ Create: `src/app/settings/page.tsx`
→ Or: `src/app/admin/settings/page.tsx`

### "I want to check user roles"
→ Use: `hasRole()` from `src/lib/auth.ts`
→ Or: `userProfile?.role` from `useAuth()`

### "I want to change security rules"
→ Edit: `firestore.rules`
→ Deploy: `firebase deploy --only firestore:rules`

---

**Visual guides created!** 
Check `AUTH_SYSTEM_GUIDE.md` for detailed documentation.
