# 🔐 Authentication System Guide

Complete guide to where all authentication features are located in your MCPForms application.

---

## 📁 File Structure Overview

```
mcpforms/
├── src/
│   ├── lib/
│   │   ├── auth.ts                      # 🔑 Core auth functions
│   │   └── auth/
│   │       └── AuthProvider.tsx         # 🎯 Auth context provider
│   ├── app/
│   │   ├── login/
│   │   │   └── page.tsx                 # 🔓 Login page
│   │   ├── signup/
│   │   │   └── page.tsx                 # ✍️ Signup page
│   │   └── admin/
│   │       └── layout.tsx               # 🛡️ Protected admin layout with logout
│   └── components/
│       ├── ProtectedRoute.tsx           # 🚧 Route protection HOC
│       └── admin/
│           └── AdminDashboard.tsx       # 📊 Dashboard with logout button
└── firestore.rules                      # 🔒 Database security rules
```

---

## 🔑 Core Authentication Files

### 1. **`src/lib/auth.ts`** - Main Auth Utilities

**Location:** `/Users/rubazayed/MCPForms/mcpforms/src/lib/auth.ts`

**What it does:**
- Central hub for all authentication operations
- Firebase Authentication integration
- User profile management

**Available Functions:**

```typescript
// Sign up new user
signUp(email: string, password: string, userData: {
  name: string
  role: 'admin' | 'lawyer' | 'client'
  phone?: string
  lawFirm?: string
})

// Sign in existing user
signIn(email: string, password: string)

// Sign out current user
signOut()

// Reset password
resetPassword(email: string)

// Get current user profile
getCurrentUserProfile()

// Check if user has specific role
hasRole(userId: string, role: string)
```

**Example Usage:**
```typescript
import { signIn, signOut, getCurrentUserProfile } from '@/lib/auth'

// Login
await signIn('user@example.com', 'password123')

// Get user info
const profile = await getCurrentUserProfile()

// Logout
await signOut()
```

---

### 2. **`src/lib/auth/AuthProvider.tsx`** - Auth Context

**Location:** `/Users/rubazayed/MCPForms/mcpforms/src/lib/auth/AuthProvider.tsx`

**What it does:**
- Provides authentication state to entire app
- Real-time auth state updates
- User profile data management

**Context Structure:**
```typescript
interface AuthContextType {
  user: User | null              // Firebase user object
  userProfile: UserProfile | null // User profile from Firestore
  loading: boolean               // Loading state
}

interface UserProfile {
  uid: string
  email: string
  name: string
  role: 'admin' | 'lawyer' | 'client'
  phone?: string
  lawFirm?: string
  createdAt: Date
}
```

**How to Use:**
```typescript
import { useAuth } from '@/lib/auth/AuthProvider'

function MyComponent() {
  const { user, userProfile, loading } = useAuth()
  
  if (loading) return <div>Loading...</div>
  if (!user) return <div>Not logged in</div>
  
  return <div>Welcome, {userProfile?.name}!</div>
}
```

---

## 🔓 Login & Signup Pages

### 3. **`src/app/login/page.tsx`** - Login Page

**Location:** `/Users/rubazayed/MCPForms/mcpforms/src/app/login/page.tsx`  
**URL:** `http://localhost:3000/login`

**Features:**
- Email/password login
- Form validation
- Error handling
- Password visibility toggle
- Remember me option
- Link to signup page
- Password reset link

**Try it:**
```bash
# Visit in browser
http://localhost:3000/login
```

---

### 4. **`src/app/signup/page.tsx`** - Signup Page

**Location:** `/Users/rubazayed/MCPForms/mcpforms/src/app/signup/page.tsx`  
**URL:** `http://localhost:3000/signup`

**Features:**
- Email/password registration
- Name input
- Role selection (admin, lawyer, client)
- Optional phone number
- Optional law firm name
- Form validation
- Password visibility toggle
- Link to login page

**Try it:**
```bash
# Visit in browser
http://localhost:3000/signup
```

---

## 🛡️ Protected Routes

### 5. **`src/components/ProtectedRoute.tsx`** - Route Protection

**Location:** `/Users/rubazayed/MCPForms/mcpforms/src/components/ProtectedRoute.tsx`

**What it does:**
- Protects routes requiring authentication
- Auto-redirects to login if not authenticated
- Shows loading state
- Optional role-based access control

**How to Use:**
```typescript
import ProtectedRoute from '@/components/ProtectedRoute'

export default function AdminPage() {
  return (
    <ProtectedRoute>
      <YourProtectedContent />
    </ProtectedRoute>
  )
}

// With role requirement
<ProtectedRoute requiredRole="admin">
  <AdminOnlyContent />
</ProtectedRoute>
```

---

### 6. **`src/app/admin/layout.tsx`** - Admin Layout with Logout

**Location:** `/Users/rubazayed/MCPForms/mcpforms/src/app/admin/layout.tsx`

**Features:**
- Navigation bar with user info
- Sign out button
- Role badge display
- Protects all `/admin/*` routes
- Responsive design

**What it shows:**
```
┌─────────────────────────────────────────────┐
│ MCPForms Admin                              │
│                         [John Doe] [Logout] │
│                         [admin badge]       │
└─────────────────────────────────────────────┘
```

**Sign Out Button:**
- Located in top-right corner
- Shows user name and email
- Click to sign out and redirect to login

---

## 🚪 Logout Functionality

### Where to Find Logout Buttons

**1. Admin Layout** (Top Navigation)
```
Location: /Users/rubazayed/MCPForms/mcpforms/src/app/admin/layout.tsx
Line: 41-47
Button: Top-right corner of admin pages
```

**2. Admin Dashboard** (Quick Stats Area)
```
Location: /Users/rubazayed/MCPForms/mcpforms/src/components/admin/AdminDashboard.tsx
Line: 108-114 and 143-146
Button: In user info section and mobile menu
```

**How Logout Works:**
```typescript
// 1. Click logout button
// 2. Calls handleSignOut()
const handleSignOut = async () => {
  await signOut()  // From auth.ts
  router.push('/login')  // Redirect to login
}
// 3. User is signed out
// 4. Redirected to login page
```

---

## ⚙️ Settings (To Be Added)

**Currently:** No dedicated settings page exists yet.

**Where to Add Settings Page:**

### Option 1: User Settings Page
```
Create: src/app/settings/page.tsx
URL: http://localhost:3000/settings
```

**Suggested Features:**
- Change password
- Update profile (name, phone, law firm)
- Email preferences
- Notification settings
- Theme preferences

### Option 2: Admin Settings in Dashboard
```
Add to: src/app/admin/settings/page.tsx
URL: http://localhost:3000/admin/settings
```

**Suggested Features:**
- System configuration
- API key management
- Email templates
- User management
- Security settings

**Need me to create a settings page?** Just ask!

---

## 🎯 Quick Navigation

### For Users (Frontend)

| Feature | URL | File |
|---------|-----|------|
| **Login** | `/login` | `src/app/login/page.tsx` |
| **Signup** | `/signup` | `src/app/signup/page.tsx` |
| **Admin Dashboard** | `/admin` | `src/app/admin/page.tsx` |
| **Logout** | Button in nav bar | `src/app/admin/layout.tsx` |

### For Developers (Backend)

| Feature | File | Purpose |
|---------|------|---------|
| **Auth Functions** | `src/lib/auth.ts` | Login, signup, logout, password reset |
| **Auth Context** | `src/lib/auth/AuthProvider.tsx` | Global auth state |
| **Route Protection** | `src/components/ProtectedRoute.tsx` | Protect pages |
| **Security Rules** | `firestore.rules` | Database access control |

---

## 🧪 How to Test Authentication

### 1. Test Signup
```bash
# 1. Visit signup page
http://localhost:3000/signup

# 2. Fill in form:
- Email: test@example.com
- Password: Test123!
- Name: Test User
- Role: lawyer
- Phone: 555-1234 (optional)
- Law Firm: Test Firm (optional)

# 3. Click "Sign Up"
# 4. Should redirect to /admin
# 5. Check Firebase Console → Authentication
```

### 2. Test Login
```bash
# 1. Visit login page
http://localhost:3000/login

# 2. Enter credentials:
- Email: test@example.com
- Password: Test123!

# 3. Click "Sign In"
# 4. Should redirect to /admin
```

### 3. Test Logout
```bash
# 1. While logged in, go to admin
http://localhost:3000/admin

# 2. Look at top-right corner
# 3. Click user menu or logout button
# 4. Should redirect to /login
# 5. Try accessing /admin - should redirect to /login
```

### 4. Test Protected Routes
```bash
# 1. Sign out
# 2. Try accessing /admin directly
http://localhost:3000/admin

# 3. Should auto-redirect to /login
# 4. After login, should redirect back to /admin
```

---

## 🔥 Firebase Console

**Check User Accounts:**
1. Go to: https://console.firebase.google.com
2. Select project: `formgenai-4545`
3. Navigate to: **Authentication** → **Users**
4. See all registered users

**Check User Profiles:**
1. Navigate to: **Firestore Database**
2. Collection: `users`
3. Each user has a document with:
   - Email
   - Name
   - Role (admin/lawyer/client)
   - Phone
   - Law Firm
   - Created date

---

## 🔒 Security Features

### Password Requirements
- Minimum 6 characters (Firebase default)
- Can be customized in signup form validation

### Role-Based Access Control (RBAC)
```typescript
// Defined in firestore.rules
- admin: Full access to everything
- lawyer: Access to own services and templates
- client: Access to own intake submissions
```

### Security Rules Deployed
```bash
# Firestore rules
firebase deploy --only firestore:rules

# Storage rules  
firebase deploy --only storage:rules
```

**View rules:**
- Firestore: `firestore.rules`
- Storage: `storage.rules`

---

## 🎨 UI Components

### Auth Pages Use:
- Tailwind CSS for styling
- Gradient backgrounds
- Professional forms
- Error handling
- Loading states
- Responsive design
- lucide-react icons

### Navigation Components:
- User avatar/name display
- Role badges
- Dropdown menus
- Sign out buttons
- Mobile responsive

---

## 🚀 What You Can Do Now

### As a Developer:
✅ Modify login/signup forms  
✅ Add password strength requirements  
✅ Customize user roles  
✅ Add profile photos  
✅ Create settings page  
✅ Add email verification  
✅ Add social login (Google, etc.)

### As a User:
✅ Sign up for account  
✅ Log in with email/password  
✅ Access admin dashboard  
✅ See your profile info  
✅ Sign out securely  
✅ Reset forgotten password

---

## 📝 Common Tasks

### Add Email Verification
```typescript
// In src/lib/auth.ts, modify signUp:
import { sendEmailVerification } from 'firebase/auth'

const userCredential = await createUserWithEmailAndPassword(auth, email, password)
await sendEmailVerification(userCredential.user)
```

### Add Password Strength Meter
```bash
npm install zxcvbn
```

### Add Social Login (Google)
```typescript
// In src/lib/auth.ts
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider()
  const result = await signInWithPopup(auth, provider)
  // Create user profile in Firestore
}
```

### Add "Remember Me"
```typescript
// In login page
import { setPersistence, browserSessionPersistence, browserLocalPersistence } from 'firebase/auth'

if (rememberMe) {
  await setPersistence(auth, browserLocalPersistence)
} else {
  await setPersistence(auth, browserSessionPersistence)
}
```

---

## 🆘 Troubleshooting

### "Cannot read properties of null"
- **Cause:** Trying to access user before loaded
- **Fix:** Check `loading` state in useAuth()

### "Redirected to login immediately"
- **Cause:** Auth state not persisted
- **Fix:** Check Firebase config in `.env.local`

### "User not found in Firestore"
- **Cause:** Profile not created during signup
- **Fix:** Check `signUp()` function in `auth.ts`

### "Permission denied"
- **Cause:** Firestore security rules
- **Fix:** Check user role and rules in `firestore.rules`

---

## 🎉 Summary

Your authentication system is **fully functional** with:

✅ **Login Page** - Professional email/password login  
✅ **Signup Page** - User registration with roles  
✅ **Logout** - Sign out from navigation bar  
✅ **Protected Routes** - Auto-redirect if not logged in  
✅ **User Profiles** - Stored in Firestore with roles  
✅ **Security Rules** - RBAC protecting data  
✅ **Auth Context** - Global state management  

**Settings page** can be added - just let me know if you want it!

---

**Questions?** Ask me to:
- Create a settings page
- Add password reset functionality
- Implement email verification
- Add social login
- Customize the UI
- Add more user fields

**Ready to use!** Visit: http://localhost:3000/login 🚀
