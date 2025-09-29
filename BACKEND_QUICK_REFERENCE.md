# 🚀 MCPForms Backend Quick Start Guide

## 📋 Essential Information

### Base URLs
```
Production:  https://us-central1-formgenai-4545.cloudfunctions.net
Development: https://us-central1-mcpforms-dev.cloudfunctions.net
Local:       http://localhost:5001/{project-id}/us-central1
```

### Firebase Configuration
```javascript
const firebaseConfig = {
  // Production
  apiKey: "AIzaSyDEZrEwNAzOrpAvpm6XWuDjaGX4m8DK-cc",
  authDomain: "formgenai-4545.firebaseapp.com",
  projectId: "formgenai-4545",
  storageBucket: "formgenai-4545.firebasestorage.app",
  messagingSenderId: "34490364510",
  appId: "1:34490364510:web:ecad3f7a71bc3608fefacf"
  
  // Development  
  apiKey: "AIzaSyCO5APhs5_YmNEqN8tmdPqkxnnF8HOvKrM",
  authDomain: "mcpforms-dev.firebaseapp.com", 
  projectId: "mcpforms-dev",
  storageBucket: "mcpforms-dev.firebasestorage.app",
  messagingSenderId: "115029213949",
  appId: "1:115029213949:web:7b5f02ed90c51b1388abfa"
};
```

---

## 🔧 Cloud Functions Reference

| Function Name | Purpose | Auth Required | Input | Output |
|---------------|---------|---------------|-------|--------|
| `uploadTemplateAndParse` | Upload & parse template | ✅ | `{fileName, fileType, templateName}` | `{templateId, uploadUrl}` |
| `processUploadedTemplate` | Process uploaded file | ✅ | `{templateId, filePath}` | `{message}` |
| `createServiceRequest` | Create service | ✅ | `{name, description, templateIds[]}` | `{serviceId}` |
| `updateServiceRequest` | Update service | ✅ | `{serviceId, updates}` | `{message}` |
| `deleteServiceRequest` | Delete service | ✅ | `{serviceId}` | `{message}` |
| `generateIntakeLink` | Create intake link | ✅ | `{serviceId, clientEmail?, expiresInDays?}` | `{intakeId, intakeUrl}` |
| `submitIntakeForm` | Submit intake | ✅ | `{intakeId, formData, clientInfo?}` | `{message}` |
| `approveIntakeForm` | Approve/reject intake | ✅ | `{intakeId, approved, notes?}` | `{message}` |
| `generateDocumentsFromIntake` | Generate docs | ✅ | `{intakeId}` | `{artifactIds[]}` |
| `getDocumentDownloadUrl` | Get download URL | ✅ | `{artifactId}` | `{downloadUrl}` |

---

## 🌐 HTTP Endpoints

### Intake Form API (Public)
```
GET  /intakeFormAPI/intake/{token}           # Get form data
POST /intakeFormAPI/intake/{token}/save      # Save progress  
POST /intakeFormAPI/intake/{token}/submit    # Submit form
```

---

## 🗄️ Database Collections

| Collection | Purpose | Key Fields |
|------------|---------|------------|
| `templates` | Template metadata | `id, name, fileUrl, extractedFields[], status, createdAt` |
| `services` | Service definitions | `id, name, description, templateIds[], masterFormJson[], status` |
| `intakes` | Intake submissions | `id, serviceId, linkToken, clientData{}, status, createdAt` |
| `documentArtifacts` | Generated documents | `id, intakeId, templateId, fileName, fileUrl, status` |

---

## 📱 Quick Integration Examples

### Basic Setup
```javascript
import { initializeApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirestore, collection, onSnapshot } from 'firebase/firestore';

const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);
const db = getFirestore(app);
```

### Upload Template
```javascript
const uploadTemplate = httpsCallable(functions, 'uploadTemplateAndParse');
const result = await uploadTemplate({
  fileName: 'template.docx',
  fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  templateName: 'Contract Template'
});
```

### Create Service  
```javascript
const createService = httpsCallable(functions, 'createServiceRequest');
const result = await createService({
  name: 'Legal Package',
  description: 'Complete legal service',
  templateIds: ['template1_id', 'template2_id']
});
```

### Generate Intake Link
```javascript
const generateLink = httpsCallable(functions, 'generateIntakeLink');
const result = await generateLink({
  serviceId: 'service_id',
  clientEmail: 'client@example.com',
  expiresInDays: 30
});
// Use: result.data.data.intakeUrl
```

### Real-time Data
```javascript
// Listen to intakes
const unsubscribe = onSnapshot(collection(db, 'intakes'), (snapshot) => {
  const intakes = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
});

// Listen to documents
const unsubscribe2 = onSnapshot(collection(db, 'documentArtifacts'), (snapshot) => {
  const docs = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
});
```

---

## 🔐 Security Notes

- **Admin Functions**: Require Firebase Authentication
- **Public API**: Uses token-based access (`linkToken`)
- **File Access**: Secured with Firebase Storage rules
- **CORS**: Enabled for cross-origin requests

---

## 📊 Status Values

### Template Status
- `uploaded` → `parsing` → `parsed` / `error`

### Service Status  
- `draft` → `active` / `inactive`

### Intake Status
- `link-generated` → `opened` → `in-progress` → `submitted` → `approved` / `rejected` → `documents-generated`

### Document Status
- `generating` → `generated` / `error`

---

## ⚡ Common Workflows

### 1. Template → Service → Intake
```javascript
// 1. Upload template
const template = await uploadTemplate({...});

// 2. Create service
const service = await createService({
  templateIds: [template.data.templateId]
});

// 3. Generate intake link
const intake = await generateLink({
  serviceId: service.data.serviceId
});
```

### 2. Form Submission → Document Generation
```javascript
// 1. Client submits form (via HTTP API)
fetch(`/intakeFormAPI/intake/${token}/submit`, {
  method: 'POST',
  body: JSON.stringify({formData: {...}})
});

// 2. Admin approves
await approveIntakeForm({intakeId, approved: true});

// 3. Generate documents  
const docs = await generateDocumentsFromIntake({intakeId});

// 4. Get download URLs
for (const artifactId of docs.data.artifactIds) {
  const url = await getDocumentDownloadUrl({artifactId});
}
```

---

## 🐛 Debugging

### Check Function Logs
```powershell
firebase functions:log --limit 50
firebase functions:log --only uploadTemplateAndParse
```

### Common Errors
- **401 Unauthorized**: Check Firebase Auth token
- **404 Not Found**: Verify function name and project ID  
- **500 Internal**: Check function logs for details
- **CORS Error**: Ensure proper origin configuration

---

## 🔗 Next Steps

1. **Read Full Documentation**: See `BACKEND_API_DOCUMENTATION.md`
2. **Set Up Firebase**: Install SDK and configure project
3. **Test Functions**: Use Firebase emulators for local testing
4. **Implement Frontend**: Start with template upload workflow
5. **Deploy**: Use `firebase deploy --only functions`

---

## 📞 Support Resources

- **Full API Docs**: `BACKEND_API_DOCUMENTATION.md`
- **Test Examples**: `/tests/e2e/` directory
- **Firebase Console**: Monitor functions and database
- **Logs**: `firebase functions:log`