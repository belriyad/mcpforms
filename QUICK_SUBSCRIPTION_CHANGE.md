# Quick Guide: Change User Subscription Tier

## 🎯 Easiest Methods (No Scripts Required)

### **Method 1: Firebase Console (Recommended - No Code Needed)**

This is the **simplest way** to manually change a user's subscription tier:

#### **Step-by-Step:**

1. **Open Firebase Console**
   - Go to: https://console.firebase.google.com/project/formgenai-4545/firestore/databases/-default-/data/~2Fusers

2. **Find the User**
   - Search or scroll to find the user by their UID
   - Or go to **Authentication** tab first to find their UID by email

3. **Edit the Subscription**
   - Click on the user document
   - Find the `subscription` field
   - Click the **pencil icon** (edit)

4. **Change the Tier**
   
   **To upgrade to PREMIUM:**
   - Find the `tier` field
   - Change from `"FREE"` to `"PREMIUM"`
   - Change `status` to `"active"` (if needed)
   - Click **Update**
   
   **To downgrade to FREE:**
   - Find the `tier` field
   - Change from `"PREMIUM"` to `"FREE"`
   - Click **Update**

5. **Done!**
   - User must refresh their browser to see changes
   - Changes take effect immediately

---

## 🖼️ Visual Guide

### **Finding Users in Firestore:**
```
Firebase Console
  └── Firestore Database
      └── users (collection)
          ├── abc123... (user document)
          │   └── subscription
          │       └── tier: "FREE" ← Change this
          ├── def456... (user document)
          └── ...
```

### **What to Change:**

**For PREMIUM upgrade:**
```
subscription {
  tier: "FREE"        →  tier: "PREMIUM"
  status: "active"    →  status: "active" (keep)
}
```

**For FREE downgrade:**
```
subscription {
  tier: "PREMIUM"     →  tier: "FREE"
  status: "active"    →  status: "active" (keep)
}
```

---

## 📧 How to Find a User

### **Option 1: Find by Email in Authentication**
1. Go to: https://console.firebase.google.com/project/formgenai-4545/authentication/users
2. Search for user's email
3. Copy their **User UID**
4. Go to Firestore → users → [paste UID]

### **Option 2: Browse Firestore Directly**
1. Go to: https://console.firebase.google.com/project/formgenai-4545/firestore/databases/-default-/data/~2Fusers
2. Scroll through user documents
3. Click to view details

---

## ✨ What Happens After Change

### **When you upgrade FREE → PREMIUM:**
- ✅ User can create unlimited templates
- ✅ User can create unlimited services
- ✅ User can invite unlimited team members
- ✅ **Analytics tab appears in navigation**
- ✅ **Team Management tab appears**

### **When you downgrade PREMIUM → FREE:**
- ⚠️ User limited to 3 templates
- ⚠️ User limited to 10 services
- ⚠️ User limited to 1 team member (self)
- ❌ **Analytics tab hidden**
- ❌ **Team Management hidden**
- 📝 Existing resources remain (but can't create more beyond limits)

---

## 🔄 User Experience

**After you make the change:**

1. User **must refresh** their browser (F5 or Cmd+R)
2. Changes appear **instantly** after refresh
3. Navigation tabs update automatically
4. New limits/features apply immediately

**Pro Tip:** Send user a message: "I've updated your account. Please refresh your browser (F5) to see the changes."

---

## 🎓 Examples

### **Example 1: Upgrade Test User**
```
1. Find user in Firestore: users/abc123...
2. Edit subscription.tier: "FREE" → "PREMIUM"
3. Save
4. Tell user to refresh browser
5. User now has premium features!
```

### **Example 2: Downgrade After Trial**
```
1. Find user in Firestore: users/xyz789...
2. Edit subscription.tier: "PREMIUM" → "FREE"
3. Save
4. Tell user to refresh browser
5. User back to free limits
```

---

## 🛠️ Troubleshooting

**"I can't find the user in Firestore"**
- Check Authentication tab first to get their UID
- User must have logged in at least once
- Make sure you're looking in the `users` collection

**"Changes not visible after refresh"**
- Wait 5-10 seconds
- Try logging out and back in
- Clear browser cache
- Check that changes saved in Firestore

**"User still seeing old subscription"**
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Incognito/private window test
- Verify Firestore change actually saved

---

## 🚀 Quick Reference

| Task | Field to Change | New Value |
|------|----------------|-----------|
| Upgrade to Premium | `subscription.tier` | `"PREMIUM"` |
| Downgrade to Free | `subscription.tier` | `"FREE"` |
| Activate subscription | `subscription.status` | `"active"` |
| Cancel subscription | `subscription.status` | `"canceled"` |

---

## 📝 Best Practices

1. ✅ **Always check current tier first** before making changes
2. ✅ **Note the reason** (add to `subscription.notes` field if you want)
3. ✅ **Tell the user** to refresh their browser
4. ✅ **Verify the change** worked by checking user's view
5. ✅ **Keep track** of manual upgrades for billing purposes

---

## 🔐 Security

- Only project administrators can access Firebase Console
- All changes are logged in Firebase audit logs
- Changes require Firebase authentication
- No special keys or tokens needed

---

## 💡 Pro Tips

**Add Notes:**
When editing in Firebase Console, you can add a `notes` field:
```
subscription {
  tier: "PREMIUM"
  notes: "Upgraded for beta testing - expires Dec 1"
}
```

**Bulk Changes:**
If you need to upgrade many users, consider using the scripts in `MANUAL_SUBSCRIPTION_MANAGEMENT.md` instead.

---

## 🎉 That's It!

Changing subscription tiers is as simple as:
1. Open Firebase Console
2. Find user in Firestore
3. Change `subscription.tier` from `"FREE"` to `"PREMIUM"` (or vice versa)
4. Save
5. Tell user to refresh

**No coding required!** 🚀

---

**Last Updated:** November 19, 2025
