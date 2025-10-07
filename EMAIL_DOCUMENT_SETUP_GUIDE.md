# 📧 Email & Document Generation Setup Guide

## 🎯 Quick Start

This guide will help you set up the missing environment variables to enable:
- ✉️ Email notifications (via Resend)
- 📄 Document generation (via Firebase Admin SDK)

---

## 📧 Step 1: Set Up Resend for Email Notifications

### 1.1 Create Resend Account
1. Go to https://resend.com
2. Sign up for a free account
3. Verify your email address

### 1.2 Get API Key
1. Go to https://resend.com/api-keys
2. Click "Create API Key"
3. Name it: "MCPForms Production"
4. Copy the key (starts with `re_`)

### 1.3 Configure Domain (Optional but Recommended)
1. Go to https://resend.com/domains
2. Click "Add Domain"
3. Enter your domain (e.g., `yourdomain.com`)
4. Add DNS records as instructed
5. Wait for verification (usually 5-30 minutes)

### 1.4 Add to Environment Variables

**For Local Development:**
```bash
# Add to .env.local
RESEND_API_KEY=re_xxxxx
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Smart Forms AI
```

**For Firebase Functions:**
```bash
firebase functions:config:set \
  email.resend_key="re_xxxxx" \
  email.from_email="noreply@yourdomain.com" \
  email.from_name="Smart Forms AI"
```

### 1.5 Test Email Sending

```bash
# In your terminal
npm run test:email
```

Or test manually at: `https://your-app.web.app/admin/services/{serviceId}`
- Create a service
- Generate intake form
- Click "Send to Client"
- Check your email!

---

## 📄 Step 2: Set Up Firebase Admin SDK for Document Generation

### 2.1 Generate Service Account Key
1. Go to Firebase Console: https://console.firebase.google.com/project/formgenai-4545/settings/serviceaccounts/adminsdk
2. Click "Generate New Private Key"
3. Click "Generate Key" in the confirmation dialog
4. Save the JSON file securely (don't commit to git!)

### 2.2 Extract Credentials from JSON

The downloaded file will look like:
```json
{
  "type": "service_account",
  "project_id": "formgenai-4545",
  "private_key_id": "xxxxx",
  "private_key": "-----BEGIN PRIVATE KEY-----\nxxxxx\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@formgenai-4545.iam.gserviceaccount.com",
  "client_id": "xxxxx",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "xxxxx"
}
```

You need:
- `project_id`
- `private_key`
- `client_email`

### 2.3 Add to Environment Variables

**For Local Development:**
```bash
# Add to .env.local
FIREBASE_PROJECT_ID=formgenai-4545
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@formgenai-4545.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Long-Key-Here\n-----END PRIVATE KEY-----\n"
```

⚠️ **Important:** Keep the quotes and newlines (`\n`) in the private key!

**For Firebase Functions:**
```bash
# The private key needs to be in a single line with \n preserved
firebase functions:config:set \
  firebase.project_id="formgenai-4545" \
  firebase.client_email="firebase-adminsdk-xxxxx@formgenai-4545.iam.gserviceaccount.com" \
  firebase.private_key="-----BEGIN PRIVATE KEY-----\nYour-Long-Key-Here\n-----END PRIVATE KEY-----\n"
```

### 2.4 Test Document Generation

```bash
# In your terminal  
npm run test:docgen
```

Or test manually:
1. Go to your app: `https://your-app.web.app/admin`
2. Create a service with templates
3. Generate intake form
4. Fill and submit intake form
5. Click "Generate Documents"
6. Download generated documents

---

## 🚀 Step 3: Deploy Everything

### 3.1 Build Locally
```bash
npm run build
```

### 3.2 Deploy to Firebase
```bash
# Deploy everything
firebase deploy

# Or deploy just functions and hosting
firebase deploy --only functions,hosting
```

### 3.3 Verify Deployment
1. Check Functions: https://console.firebase.google.com/project/formgenai-4545/functions
2. Check Hosting: https://formgenai-4545.web.app
3. Test full workflow:
   - Login → Create Service → Generate Intake → Send Email → Submit → Generate Documents

---

## ✅ Verification Checklist

### Email System
- [ ] Resend account created
- [ ] API key generated
- [ ] Domain configured (optional)
- [ ] Environment variables set (local)
- [ ] Firebase Functions config set (production)
- [ ] Test email sent successfully
- [ ] Emails arriving in inbox (not spam)

### Document Generation
- [ ] Service account key generated
- [ ] Credentials extracted from JSON
- [ ] Environment variables set (local)
- [ ] Firebase Functions config set (production)
- [ ] Build completes without warnings
- [ ] Test document generated successfully
- [ ] Document downloads work

### Deployment
- [ ] Local build successful
- [ ] Firebase deployment successful
- [ ] Login/signup working
- [ ] Services CRUD working
- [ ] Email notifications working
- [ ] Document generation working
- [ ] No console errors

---

## 🔧 Troubleshooting

### Email Issues

**Problem:** Emails not sending
```bash
# Check if API key is configured
firebase functions:config:get

# Check logs
firebase functions:log
```

**Problem:** Emails going to spam
- Configure SPF, DKIM, DMARC records
- Use verified domain
- Avoid spammy content
- Ask recipients to whitelist your domain

### Document Generation Issues

**Problem:** "Firebase Admin credentials not found"
```bash
# Verify environment variables are set
echo $FIREBASE_PRIVATE_KEY

# Check the key format (should have \n characters)
firebase functions:config:get firebase.private_key
```

**Problem:** Documents not generating
- Check Firebase Storage permissions
- Verify template files are uploaded
- Check Functions logs for errors
- Ensure placeholders match field names

### Common Errors

**Error:** `Invalid API key`
- Regenerate API key in Resend dashboard
- Update environment variables
- Redeploy

**Error:** `Permission denied`
- Check Firestore security rules
- Verify user authentication
- Check user role in database

**Error:** `Function timeout`
- Increase function timeout in firebase.json
- Optimize document generation
- Check for infinite loops

---

## 📞 Need Help?

### Resend Support
- Documentation: https://resend.com/docs
- Email: support@resend.com
- Discord: https://resend.com/discord

### Firebase Support
- Documentation: https://firebase.google.com/docs
- Stack Overflow: https://stackoverflow.com/questions/tagged/firebase
- Community: https://firebase.google.com/community

### MCPForms Issues
- GitHub Issues: https://github.com/belriyad/mcpforms/issues
- Check: API_KEY_SECURITY_GUIDE.md
- Check: PRODUCTION_READINESS_CHECKLIST.md

---

## 🎉 Success!

Once everything is set up, you should be able to:

1. ✅ Create services with templates
2. ✅ Generate intake forms with AI
3. ✅ Send intake invitations via email
4. ✅ Receive submission notifications
5. ✅ Generate populated documents
6. ✅ Download completed documents

Your Smart Forms AI system is now **fully operational**! 🚀
