# 🚀 Quick Deployment Reference

## Fastest Path to Production (30 minutes)

### Option 1: Automated Script (Recommended)
```bash
./deploy-to-vercel.sh
```
This script will:
1. Verify build
2. Check Git status
3. Login to Vercel
4. Create preview deployment
5. Guide you through env vars
6. Deploy to production

---

### Option 2: Manual Commands
```bash
# 1. Verify build
npm run build

# 2. Login to Vercel (opens browser)
vercel login

# 3. Deploy (first time - creates project)
vercel

# 4. Add environment variables
# Go to: https://vercel.com/dashboard
# Settings → Environment Variables
# Add all from .env.local

# 5. Deploy to production
vercel --prod
```

---

## 📋 Environment Variables Checklist

Copy these from your `.env.local` to Vercel Dashboard:

### Firebase (Required)
```
☐ NEXT_PUBLIC_FIREBASE_API_KEY
☐ NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
☐ NEXT_PUBLIC_FIREBASE_PROJECT_ID
☐ NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
☐ NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
☐ NEXT_PUBLIC_FIREBASE_APP_ID
☐ FIREBASE_PROJECT_ID
☐ FIREBASE_CLIENT_EMAIL
☐ FIREBASE_PRIVATE_KEY  (wrap in quotes!)
```

### OpenAI (Required)
```
☐ OPENAI_API_KEY
```

### Application URL (Set after first deploy)
```
☐ NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### Email (Optional - Console mode works)
```
☐ EMAIL_PROVIDER=console
```

---

## 🧪 Testing Checklist (15 minutes)

After deployment, test in order:

### 1. Authentication (2 min)
- [ ] Visit `/signup`
- [ ] Create account
- [ ] Log out
- [ ] Log in

### 2. Service Creation (2 min)
- [ ] Visit `/admin`
- [ ] Click "New Service"
- [ ] Fill details
- [ ] Save

### 3. Template Upload (3 min)
- [ ] Click "Upload Template"
- [ ] Select DOCX
- [ ] Verify fields extracted

### 4. Intake Form (3 min)
- [ ] Generate intake form
- [ ] Copy URL
- [ ] Open in incognito
- [ ] Fill and submit

### 5. Document Generation (3 min)
- [ ] Back to admin
- [ ] Click "Generate Documents"
- [ ] Download document
- [ ] Open and verify

### 6. New Features (2 min)
- [ ] Save a prompt at `/admin/prompts`
- [ ] Upload logo at `/admin/settings/branding`
- [ ] Check logs at `/admin/activity`

---

## 🐛 Quick Troubleshooting

### Build Fails
```bash
# Test locally first
npm run build

# Check Vercel logs
vercel logs
```

### Firebase Errors
```bash
# Re-add FIREBASE_PRIVATE_KEY
vercel env rm FIREBASE_PRIVATE_KEY production
vercel env add FIREBASE_PRIVATE_KEY production
# Paste full key with BEGIN/END lines
```

### 404 Errors
```bash
# Check function logs
vercel logs --follow
```

---

## 📊 Monitoring

### Vercel Dashboard
https://vercel.com/dashboard
- Check uptime
- Monitor errors
- View function logs

### Your App
- Activity logs: `/admin/activity`
- Check for errors
- Monitor usage

---

## 🎉 Success!

Your MVP is now live at:
**https://[your-project].vercel.app**

### Next Steps:
1. ✅ Test core workflow
2. ✅ Invite beta users
3. ✅ Monitor for 24 hours
4. ✅ Gather feedback
5. ✅ Iterate based on usage

---

## 📞 Need Help?

### Common Issues
1. **Build errors**: Check `npm run build` locally
2. **Firebase errors**: Verify env vars match .env.local
3. **API errors**: Check Vercel function logs
4. **Email not working**: Set EMAIL_PROVIDER=console

### Useful Commands
```bash
vercel logs --follow      # Watch logs live
vercel domains ls         # See your domains
vercel env ls             # List env variables
vercel --prod             # Redeploy
```

---

**Your MVP is 89% complete and production-ready!**
**Deploy with confidence! 🚀**
