# Manual Subscription Management Guide

## Overview

This guide shows you how to manually change user subscription tiers (FREE ↔ PREMIUM) directly from the backend, without using Stripe. This is useful for:

- **Testing**: Test premium features during development
- **Manual upgrades**: Grant premium access without payment
- **Admin overrides**: Give lifetime premium to specific users
- **Support**: Help users with subscription issues

---

## 🚀 Quick Start

### Method 1: Using Scripts (Recommended)

I've created three convenient scripts for you:

#### **1. Upgrade to PREMIUM**
```bash
node scripts/upgrade-user-to-premium.mjs <email or userId>
```

**Examples:**
```bash
# By email
node scripts/upgrade-user-to-premium.mjs user@example.com

# By user ID
node scripts/upgrade-user-to-premium.mjs abc123def456

# Force upgrade even if already premium
node scripts/upgrade-user-to-premium.mjs user@example.com --force
```

**What it does:**
- ✅ Changes tier from FREE to PREMIUM
- ✅ Sets status to 'active'
- ✅ Keeps existing usage counts
- ✅ Adds timestamp and notes
- ✅ Grants unlimited access

---

#### **2. Downgrade to FREE**
```bash
node scripts/downgrade-user-to-free.mjs <email or userId>
```

**Examples:**
```bash
# By email
node scripts/downgrade-user-to-free.mjs user@example.com

# By user ID
node scripts/downgrade-user-to-free.mjs abc123def456
```

**What it does:**
- ✅ Changes tier from PREMIUM to FREE
- ✅ Sets status to 'active'
- ✅ Keeps usage counts (enforces limits)
- ✅ Adds end date and notes
- ✅ User sees limits again

---

#### **3. Check Subscription Status**
```bash
node scripts/check-user-subscription.mjs <email or userId>
```

**Examples:**
```bash
# By email
node scripts/check-user-subscription.mjs user@example.com

# By user ID
node scripts/check-user-subscription.mjs abc123def456
```

**What it shows:**
- 👤 User email and ID
- 🎫 Current tier (FREE or PREMIUM)
- 📍 Status (active, past_due, canceled)
- 📅 Start/end dates
- 💳 Stripe IDs (if any)
- 📈 Current usage counts
- ✨ Available features

---

## 📝 Method 2: Firebase Console (Manual)

If you prefer using the Firebase Console:

### **Steps:**

1. **Open Firebase Console**
   - Go to: https://console.firebase.google.com/project/formgenai-4545/firestore

2. **Navigate to Users Collection**
   - Click on **Firestore Database**
   - Find the **`users`** collection
   - Find the user by their UID

3. **Edit Subscription Field**
   - Click on the user document
   - Find the `subscription` field
   - Click the pencil icon to edit

4. **For PREMIUM Upgrade:**
   ```json
   {
     "tier": "PREMIUM",
     "status": "active",
     "startDate": [current timestamp],
     "currentUsage": {
       "templatesCount": 0,
       "servicesCount": 0,
       "usersCount": 1
     },
     "notes": "Manually upgraded via console"
   }
   ```

5. **For FREE Downgrade:**
   ```json
   {
     "tier": "FREE",
     "status": "active",
     "startDate": [original timestamp],
     "endDate": [current timestamp],
     "currentUsage": {
       "templatesCount": 0,
       "servicesCount": 0,
       "usersCount": 1
     },
     "notes": "Manually downgraded via console"
   }
   ```

6. **Save Changes**
   - Click **Update**
   - User must refresh their browser to see changes

---

## 🔍 How to Find User ID

### **Option 1: Firebase Auth Console**
1. Go to: https://console.firebase.google.com/project/formgenai-4545/authentication/users
2. Search for user by email
3. Copy their UID

### **Option 2: Using Script**
```bash
# This will show the UID along with subscription info
node scripts/check-user-subscription.mjs user@example.com
```

---

## ⚡ Common Use Cases

### **Test Premium Features**
```bash
# Upgrade yourself to test premium features
node scripts/upgrade-user-to-premium.mjs your-email@example.com

# Test analytics, unlimited templates, team management, etc.

# Downgrade back when done
node scripts/downgrade-user-to-free.mjs your-email@example.com
```

### **Grant Lifetime Premium**
```bash
# Upgrade a user
node scripts/upgrade-user-to-premium.mjs special-user@example.com

# They'll have premium forever (until you downgrade them)
```

### **Help a User with Subscription Issues**
```bash
# Check their current status
node scripts/check-user-subscription.mjs user@example.com

# If stuck, manually upgrade
node scripts/upgrade-user-to-premium.mjs user@example.com
```

---

## 🎯 What Changes When You Upgrade/Downgrade

### **FREE → PREMIUM**
| Feature | Before | After |
|---------|--------|-------|
| Templates | Max 3 | Unlimited ✅ |
| Services | Max 10 | Unlimited ✅ |
| Team Members | 1 (self) | Unlimited ✅ |
| Analytics Tab | Hidden ❌ | Visible ✅ |
| Team Management | Hidden ❌ | Visible ✅ |
| Price | $0 | $199/month |

### **PREMIUM → FREE**
| Feature | Before | After |
|---------|--------|-------|
| Templates | Unlimited | Max 3 ⚠️ |
| Services | Unlimited | Max 10 ⚠️ |
| Team Members | Unlimited | 1 (self) ⚠️ |
| Analytics Tab | Visible | Hidden ❌ |
| Team Management | Visible | Hidden ❌ |
| Price | $199/month | $0 |

**⚠️ Note:** Existing resources remain accessible, but user can't create new ones beyond limits.

---

## 📊 Subscription Structure

Here's what the subscription object looks like in Firestore:

```typescript
subscription: {
  tier: 'FREE' | 'PREMIUM',          // Plan tier
  status: 'active' | 'past_due' | 'canceled' | 'trialing',
  startDate: Timestamp,              // When subscription started
  endDate?: Timestamp,               // When it ended (if downgraded)
  stripeCustomerId?: string,         // Stripe customer ID (if paid)
  stripeSubscriptionId?: string,     // Stripe subscription ID (if paid)
  currentUsage: {
    templatesCount: number,          // Current template count
    servicesCount: number,           // Current service count
    usersCount: number               // Current team member count
  },
  notes?: string                     // Admin notes
}
```

---

## 🛠️ Troubleshooting

### **"User document not found"**
- User hasn't logged in yet
- User needs to sign up first
- Check if the email/UID is correct

### **"User not found in Firebase Auth"**
- Email or UID is incorrect
- User account was deleted
- Double-check the identifier

### **"User should refresh browser to see changes"**
- Changes take effect immediately in Firestore
- User's browser has cached old subscription
- User must refresh the page (F5 or Cmd+R)

### **Changes not visible after refresh**
- Clear browser cache
- Log out and log back in
- Check Firestore to verify changes were saved
- Wait 5-10 seconds for real-time sync

---

## 🔐 Security Notes

- ✅ Only run these scripts with **admin access** (serviceAccountKey.json required)
- ✅ Keep `serviceAccountKey.json` secure and **never commit it to git**
- ✅ Scripts log all changes for audit trail
- ✅ Manual changes should include notes for tracking

---

## 📚 Script Locations

All scripts are in the `scripts/` folder:

```
scripts/
├── upgrade-user-to-premium.mjs      # Upgrade to PREMIUM
├── downgrade-user-to-free.mjs       # Downgrade to FREE
└── check-user-subscription.mjs      # View subscription status
```

---

## 🎓 Examples

### **Example 1: Test Premium Features**
```bash
# 1. Check current status
node scripts/check-user-subscription.mjs test@example.com
# Output: Currently on FREE tier

# 2. Upgrade to premium
node scripts/upgrade-user-to-premium.mjs test@example.com
# Output: ✅ SUCCESS! User upgraded to PREMIUM

# 3. Verify
node scripts/check-user-subscription.mjs test@example.com
# Output: Currently on PREMIUM tier

# 4. Test analytics, unlimited templates, etc.

# 5. Downgrade back
node scripts/downgrade-user-to-free.mjs test@example.com
# Output: ✅ SUCCESS! User downgraded to FREE
```

### **Example 2: Grant Lifetime Premium**
```bash
# Upgrade VIP user
node scripts/upgrade-user-to-premium.mjs vip@company.com

# User now has permanent premium (no Stripe, no expiration)
```

### **Example 3: Bulk Check Multiple Users**
```bash
# Check multiple users quickly
node scripts/check-user-subscription.mjs user1@example.com
node scripts/check-user-subscription.mjs user2@example.com
node scripts/check-user-subscription.mjs user3@example.com
```

---

## 💡 Pro Tips

1. **Always check first**: Use `check-user-subscription.mjs` before making changes
2. **Keep notes**: Scripts automatically add notes with timestamp
3. **Test carefully**: Upgrade yourself first before upgrading others
4. **User refresh**: Always remind users to refresh their browser
5. **Audit trail**: All changes are logged in the console output

---

## 🚀 Next Steps

After manually upgrading/downgrading users:

1. **User refreshes browser** → Sees new subscription immediately
2. **Analytics tab** → Appears/disappears based on tier
3. **Team management** → Enabled/disabled based on tier
4. **Resource limits** → Enforced based on tier

For automated upgrades via Stripe, see:
- `SUBSCRIPTION_IMPLEMENTATION.md`
- `END_TO_END_SUBSCRIPTION_COMPLETE.md`

---

**Last Updated:** November 19, 2025  
**Scripts Version:** 1.0.0
