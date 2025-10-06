# 🔧 OpenAI API Key Configuration Guide

## ⚠️ IMPORTANT: Required for AI Field Generation

The AI Field Generator requires an OpenAI API key to function. Without this key, you'll see the error:
```
"Failed to generate fields with AI"
```

---

## 🔑 Step 1: Get Your OpenAI API Key

1. Go to: https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-...`)
5. **IMPORTANT**: Save it securely - you won't see it again!

---

## 💻 Step 2: Add to Local Development

### Option A: .env.local File (Recommended)

Add this line to your `.env.local` file:

```bash
OPENAI_API_KEY=sk-your-actual-api-key-here
```

Your `.env.local` should look like:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDEZrEwNAzOrpAvpm6XWuDjaGX4m8DK-cc
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=formgenai-4545.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=formgenai-4545
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=formgenai-4545.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=34490364510
NEXT_PUBLIC_FIREBASE_APP_ID=1:34490364510:web:9d2ee11114ef80dbfefacf

# App Configuration
APP_BASE_URL=https://formgenai-4545.web.app

# OpenAI API Key (REQUIRED FOR AI FEATURES)
OPENAI_API_KEY=sk-your-actual-api-key-here
```

### Option B: Command Line

Run this command:

```bash
echo "OPENAI_API_KEY=sk-your-actual-api-key-here" >> .env.local
```

---

## ☁️ Step 3: Add to Firebase Cloud Functions

Firebase Cloud Functions need the API key set as an environment secret.

### Using Firebase CLI:

```bash
firebase functions:secrets:set OPENAI_API_KEY
```

When prompted, paste your OpenAI API key.

### Alternative: Firebase Console

1. Go to: https://console.firebase.google.com/project/formgenai-4545/functions
2. Click on your function: `ssrformgenai4545`
3. Click "Edit" or "Configuration"
4. Under "Secrets", add:
   - Name: `OPENAI_API_KEY`
   - Value: `sk-your-actual-api-key-here`

---

## 🔄 Step 4: Restart & Redeploy

### Local Development:
```bash
# Stop your dev server (Ctrl+C)
npm run dev
# Restart - it will now load the new environment variable
```

### Production (Firebase):
```bash
# After setting the secret, redeploy
npm run build
firebase deploy --only hosting
```

---

## ✅ Step 5: Verify It Works

1. Go to your admin dashboard: https://formgenai-4545.web.app/admin
2. Navigate to Services → Edit any service
3. Scroll to "AI Field Generator" section
4. Click "Show AI Generator"
5. Enter a description like:
   ```
   I need fields for: full name, email address, and phone number
   ```
6. Click "Generate Fields with AI"
7. Should see AI-generated fields in 2-5 seconds!

If you still see an error, check:
- ✅ API key is correct (starts with `sk-`)
- ✅ API key has no extra spaces
- ✅ .env.local file is saved
- ✅ Dev server was restarted
- ✅ Firebase secret was set correctly

---

## 💰 Cost Information

### OpenAI Pricing (as of Oct 2025):
- **Model**: GPT-4o-mini
- **Input**: ~$0.15 per 1M tokens
- **Output**: ~$0.60 per 1M tokens

### Estimated Cost per Generation:
- **Average**: ~500-1000 tokens per request
- **Cost**: ~$0.0005 per field generation
- **Monthly** (100 generations): ~$0.05

Very affordable! 🎉

---

## 🔒 Security Best Practices

### ✅ DO:
- Keep API keys in `.env.local` (gitignored)
- Use Firebase Secrets for production
- Rotate keys periodically
- Monitor usage on OpenAI dashboard

### ❌ DON'T:
- Commit API keys to Git
- Share keys publicly
- Use keys in client-side code
- Leave unused keys active

---

## 🐛 Troubleshooting

### Error: "OpenAI API key not configured"
**Solution**: API key not found in environment
1. Check `.env.local` exists and has the key
2. Restart dev server
3. For production, set Firebase secret

### Error: "Failed to generate fields with AI"
**Possible causes:**
1. **API key invalid** - Check key on OpenAI platform
2. **No API credit** - Add payment method to OpenAI account
3. **Rate limit exceeded** - Wait a moment and try again
4. **Network error** - Check internet connection

### Error: "Incorrect API key provided"
**Solution**: API key is wrong or expired
1. Generate new key on OpenAI platform
2. Update `.env.local`
3. Update Firebase secret
4. Restart/redeploy

### Error: "You exceeded your current quota"
**Solution**: OpenAI account needs payment method
1. Go to: https://platform.openai.com/account/billing
2. Add payment method
3. Add credits ($5 minimum)

---

## 📊 Monitoring Usage

### OpenAI Dashboard:
https://platform.openai.com/usage

View:
- Daily token usage
- Cost breakdown
- API call statistics
- Rate limits

### Set Usage Limits:
1. Go to: https://platform.openai.com/account/limits
2. Set monthly spend limit
3. Get email alerts at 75%, 90%, 100%

---

## 🎯 Quick Reference

### Local Development:
```bash
# .env.local
OPENAI_API_KEY=sk-your-key-here

# Restart
npm run dev
```

### Production (Firebase):
```bash
# Set secret
firebase functions:secrets:set OPENAI_API_KEY

# Redeploy
firebase deploy --only hosting
```

### Test:
```
Admin → Services → Edit → AI Generator → Generate
```

---

## 📞 Need Help?

### OpenAI Support:
- Docs: https://platform.openai.com/docs
- Help: https://help.openai.com
- Status: https://status.openai.com

### Firebase Support:
- Docs: https://firebase.google.com/docs
- Console: https://console.firebase.google.com

---

## ✨ What You Get With API Key

Once configured, you can:
- ✅ Generate form fields from descriptions
- ✅ AI detects field types automatically
- ✅ Extract dropdown/radio options
- ✅ Create placeholders and descriptions
- ✅ Save 70-80% time on field creation
- ✅ Use natural language instead of forms

**It's worth it!** 🚀
