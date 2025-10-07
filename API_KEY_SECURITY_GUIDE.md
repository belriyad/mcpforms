# 🔒 API Key Security Guide

## ⚠️ CRITICAL: Exposed API Key

Your OpenAI API key was found in `.env.local` and may have been committed to git history. 

### Immediate Actions Required:

1. **Rotate Your OpenAI API Key**
   - Go to https://platform.openai.com/api-keys
   - Delete the old key: `sk-proj-[REDACTED]`
   - Generate a new key
   - Update `.env.local` with new key

2. **Check Git History**
   ```bash
   # Search for exposed keys in git history
   git log -p | grep -i "OPENAI_API_KEY"
   ```

3. **Remove from Git History** (if found)
   ```bash
   # Use BFG Repo Cleaner or git filter-branch
   # WARNING: This rewrites history, coordinate with team!
   ```

---

## ✅ Current Security Status

### Safe API Keys (Public - OK to expose):
- ✅ `NEXT_PUBLIC_FIREBASE_API_KEY` - Firebase restricts by domain
- ✅ `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` - Public configuration
- ✅ `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - Public identifier
- ✅ All other `NEXT_PUBLIC_*` variables - Client-side safe

### Secure API Keys (Server-Side Only):
- ✅ `OPENAI_API_KEY` - Server-side only (not prefixed with NEXT_PUBLIC_)
- ✅ `RESEND_API_KEY` - Server-side only
- ✅ `FIREBASE_PRIVATE_KEY` - Server-side only
- ✅ `FIREBASE_CLIENT_EMAIL` - Server-side only

---

## 📋 Security Checklist

### Environment Variables
- [x] Firebase keys properly prefixed with `NEXT_PUBLIC_`
- [x] OpenAI key is server-side only
- [ ] OpenAI key has been rotated
- [ ] Resend API key added
- [ ] Firebase Admin credentials added
- [x] `.env.example` created for reference
- [x] `.env.local` in `.gitignore`

### Firebase Security
- [x] Firestore security rules created
- [x] Storage security rules created
- [ ] Security rules deployed to Firebase
- [ ] Rules tested with Firebase Emulator

### Code Security
- [x] Authentication required for admin routes
- [x] Role-based access control implemented
- [x] API endpoints validate authentication
- [ ] Rate limiting implemented
- [ ] Input validation added

---

## 🚀 Deployment Checklist

### Before Deploying:

1. **Update Environment Variables**
   ```bash
   # Add to Firebase Functions config
   firebase functions:config:set \
     openai.api_key="YOUR_NEW_KEY" \
     email.resend_key="re_xxxxx" \
     firebase.private_key="-----BEGIN..." \
     firebase.client_email="xxx@xxx.iam.gserviceaccount.com"
   ```

2. **Deploy Security Rules**
   ```bash
   # Deploy Firestore rules
   firebase deploy --only firestore:rules
   
   # Deploy Storage rules
   firebase deploy --only storage:rules
   ```

3. **Verify Security**
   - Test authentication flows
   - Verify unauthenticated access is blocked
   - Test role-based permissions
   - Check API key is not exposed in client bundle

---

## 🔐 Best Practices

### DO ✅
- Use `NEXT_PUBLIC_` prefix only for client-safe variables
- Store sensitive keys in environment variables
- Use Firebase Functions config for production secrets
- Rotate API keys regularly
- Use different keys for dev/staging/prod
- Monitor API usage for anomalies

### DON'T ❌
- Never commit `.env.local` to git
- Never use `NEXT_PUBLIC_` for sensitive keys
- Never expose API keys in client-side code
- Never share API keys in screenshots/documentation
- Never use the same keys across environments

---

## 🧪 Testing Security Rules

### Using Firebase Emulator:
```bash
# Start emulator
firebase emulators:start

# Run in another terminal
npm run test:security
```

### Manual Testing:
1. Test unauthenticated access (should fail)
2. Test with lawyer role (should access templates/services)
3. Test with admin role (should access everything)
4. Test client token access (should only access own service)

---

## 📞 Need Help?

If you suspect a key has been compromised:
1. Rotate the key immediately
2. Review access logs
3. Contact the service provider
4. Update all deployments

---

## 🔄 Key Rotation Schedule

- **OpenAI**: Every 90 days
- **Resend**: Every 90 days  
- **Firebase**: As needed
- **Emergency**: Immediately if compromised
