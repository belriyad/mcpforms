# 🚀 QUICK UPLOAD GUIDE

## Your browser should now be open to: https://formgenai-4545.web.app/login

Follow these steps:

### Step 1: Login ✅
```
Email: belal.riyad@gmail.com
Password: 9920032
```
Click "Sign In"

### Step 2: Go to Templates 📂
- You'll be on the Admin dashboard
- Click the **"Templates"** tab at the top

### Step 3: Upload Template ➕
- Click the **"+ Upload Template"** button
- A dialog will open

### Step 4: Select File 📄
- Click "Choose File" or the file input area
- Navigate to: `/Users/rubazayed/MCPForms/mcpforms/src/sample/`
- Select: **"Warranty Deed Template.docx"**

### Step 5: Fill Details ✏️
- Template Name: `Warranty Deed Template`
- (Description is optional)

### Step 6: Upload 🚀
- Click **"Upload & Parse"** or **"Upload Template"**
- Wait for the upload/parsing to complete (5-10 seconds)
- You should see a success message

### Step 7: Verify ✅
- The template should appear in your templates list
- You should see "Warranty Deed Template" with field count

---

## ✅ Once Complete:

Run this command to test the full E2E workflow:

```bash
npx playwright test tests/core-scenarios.spec.ts --grep "COMPLETE WORKFLOW"
```

The wizard Step 2 should now show your template! 🎉

---

**Need help?** The file is located at:
`/Users/rubazayed/MCPForms/mcpforms/src/sample/Warranty Deed Template.docx`
