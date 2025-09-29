# 📚 MCPForms Backend Services API Documentation

## 🌟 Overview

MCPForms is a comprehensive backend system built on Firebase that provides AI-powered document template parsing, service management, intake form generation, and document automation. This documentation covers all backend services available for frontend integration.

## 🏗️ Architecture

### Technology Stack
- **Firebase Functions**: Serverless backend functions
- **Firestore**: NoSQL database for data storage
- **Firebase Storage**: File storage for templates and generated documents
- **OpenAI API**: AI-powered field extraction from templates
- **Express.js**: HTTP API endpoints for public intake forms

### Project Configuration
- **Project ID**: `mcpforms-dev` (development) / `formgenai-4545` (production)
- **Region**: `us-central1`
- **Functions Base URL**: `https://us-central1-{project-id}.cloudfunctions.net`

---

## 📋 Data Models

### Template
```typescript
interface Template {
  id: string;                    // Unique template identifier
  name: string;                  // Human-readable template name
  originalFileName: string;       // Original uploaded file name
  fileUrl: string;               // Firebase Storage path
  fileType: "pdf" | "docx";     // Supported file types
  extractedFields: FormField[]; // AI-extracted form fields
  status: "uploaded" | "parsing" | "parsed" | "error";
  createdAt: Date;
  updatedAt: Date;
  parsedAt?: Date;
  errorMessage?: string;
}
```

### Service
```typescript
interface Service {
  id: string;                    // Unique service identifier
  name: string;                  // Service display name
  description: string;           // Service description
  templateIds: string[];         // Array of associated template IDs
  masterFormJson: FormField[];   // Consolidated form fields from all templates
  status: "draft" | "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}
```

### Intake
```typescript
interface Intake {
  id: string;                    // Unique intake identifier
  serviceId: string;             // Associated service ID
  serviceName: string;           // Service name for display
  linkToken: string;             // Unique access token for intake form
  clientData: Record<string, any>; // Client-submitted form data
  status: "link-generated" | "opened" | "in-progress" | "submitted" | "approved" | "rejected" | "documents-generated";
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
  approvedAt?: Date;
  clientEmail?: string;
  clientName?: string;
  expiresAt?: Date;
}
```

### DocumentArtifact
```typescript
interface DocumentArtifact {
  id: string;                    // Unique artifact identifier
  intakeId: string;              // Associated intake ID
  templateId: string;            // Source template ID
  fileName: string;              // Generated document filename
  fileUrl: string;               // Firebase Storage path
  fileType: string;              // Document type (pdf, docx)
  generatedAt: Date;
  status: "generating" | "generated" | "error";
  errorMessage?: string;
}
```

### FormField
```typescript
interface FormField {
  id: string;
  name: string;                  // Field name/identifier
  type: "text" | "email" | "number" | "date" | "select" | "textarea" | "checkbox" | "radio";
  label: string;                 // Display label
  description?: string;          // Field description/help text
  required: boolean;
  options?: string[];            // For select, radio, checkbox types
  validation?: FieldValidation;
  placeholder?: string;
}
```

---

## 🔧 Firebase Cloud Functions

### Template Management

#### `uploadTemplateAndParse`
**Purpose**: Upload and initiate AI parsing of document templates

**Method**: `httpsCallable`
**Secrets Required**: `OPENAI_API_KEY`

**Request**:
```typescript
interface UploadTemplateRequest {
  fileName: string;              // Name of file to upload
  fileType: string;              // MIME type (pdf/docx)
  templateName: string;          // Display name for template
}
```

**Response**:
```typescript
interface UploadResponse {
  success: boolean;
  data?: {
    templateId: string;          // Generated template ID
    uploadUrl: string;           // Signed URL for file upload
  };
  error?: string;
}
```

**Usage Example**:
```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const uploadTemplate = httpsCallable(functions, 'uploadTemplateAndParse');

const result = await uploadTemplate({
  fileName: 'contract-template.docx',
  fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  templateName: 'Standard Contract Template'
});

if (result.data.success) {
  const { templateId, uploadUrl } = result.data.data;
  // Upload file to the provided URL
  await fetch(uploadUrl, {
    method: 'PUT',
    body: fileBlob,
    headers: { 'Content-Type': fileType }
  });
}
```

#### `processUploadedTemplate`
**Purpose**: Process an uploaded template file with AI field extraction

**Method**: `httpsCallable`
**Secrets Required**: `OPENAI_API_KEY`

**Request**:
```typescript
{
  templateId: string;            // Template ID to process
  filePath: string;              // Storage path of uploaded file
}
```

**Response**:
```typescript
{
  success: boolean;
  data?: { message: string };
  error?: string;
}
```

---

### Service Management

#### `createServiceRequest`
**Purpose**: Create a new service by combining multiple templates

**Method**: `httpsCallable`

**Request**:
```typescript
interface CreateServiceRequest {
  name: string;                  // Service name
  description: string;           // Service description
  templateIds: string[];         // Array of template IDs to include
}
```

**Response**:
```typescript
{
  success: boolean;
  data?: { serviceId: string };
  error?: string;
}
```

**Usage Example**:
```javascript
const createService = httpsCallable(functions, 'createServiceRequest');

const result = await createService({
  name: 'Legal Document Package',
  description: 'Complete legal documentation service',
  templateIds: ['template1_id', 'template2_id', 'template3_id']
});

if (result.data.success) {
  const serviceId = result.data.data.serviceId;
  console.log('Service created:', serviceId);
}
```

#### `updateServiceRequest`
**Purpose**: Update an existing service

**Method**: `httpsCallable`

**Request**:
```typescript
{
  serviceId: string;
  updates: Partial<Service>;     // Fields to update
}
```

#### `deleteServiceRequest`
**Purpose**: Delete a service

**Method**: `httpsCallable`

**Request**:
```typescript
{
  serviceId: string;
}
```

---

### Intake Management

#### `generateIntakeLink`
**Purpose**: Generate a unique intake form link for a service

**Method**: `httpsCallable`

**Request**:
```typescript
interface GenerateIntakeLinkRequest {
  serviceId: string;             // Service to create intake for
  clientEmail?: string;          // Optional pre-fill client email
  expiresInDays?: number;        // Link expiration (default: 30 days)
}
```

**Response**:
```typescript
{
  success: boolean;
  data?: {
    intakeId: string;            // Generated intake ID
    intakeUrl: string;           // Complete URL for client access
  };
  error?: string;
}
```

**Usage Example**:
```javascript
const generateLink = httpsCallable(functions, 'generateIntakeLink');

const result = await generateLink({
  serviceId: 'service_123',
  clientEmail: 'client@example.com',
  expiresInDays: 14
});

if (result.data.success) {
  const intakeUrl = result.data.data.intakeUrl;
  // Send URL to client via email, SMS, etc.
  console.log('Intake URL:', intakeUrl);
}
```

#### `submitIntakeForm`
**Purpose**: Submit completed intake form data

**Method**: `httpsCallable`

**Request**:
```typescript
interface SubmitIntakeRequest {
  intakeId: string;              // Intake form ID
  formData: Record<string, any>; // Form field values
  clientInfo?: {
    name: string;
    email: string;
  };
}
```

**Response**:
```typescript
{
  success: boolean;
  data?: any;
  error?: string;
}
```

#### `approveIntakeForm`
**Purpose**: Approve or reject a submitted intake form

**Method**: `httpsCallable`

**Request**:
```typescript
{
  intakeId: string;
  approved: boolean;             // true to approve, false to reject
  notes?: string;                // Optional approval/rejection notes
}
```

---

### Document Generation

#### `generateDocumentsFromIntake`
**Purpose**: Generate filled documents from approved intake data

**Method**: `httpsCallable`

**Request**:
```typescript
{
  intakeId: string;              // Approved intake ID
}
```

**Response**:
```typescript
{
  success: boolean;
  data?: {
    artifactIds: string[];       // Array of generated document IDs
  };
  message?: string;
  error?: string;
}
```

**Usage Example**:
```javascript
const generateDocs = httpsCallable(functions, 'generateDocumentsFromIntake');

const result = await generateDocs({
  intakeId: 'intake_456'
});

if (result.data.success) {
  const documentIds = result.data.data.artifactIds;
  console.log('Generated documents:', documentIds);
}
```

#### `getDocumentDownloadUrl`
**Purpose**: Get secure download URL for generated documents

**Method**: `httpsCallable`

**Request**:
```typescript
{
  artifactId: string;            // Document artifact ID
}
```

**Response**:
```typescript
{
  success: boolean;
  data?: {
    downloadUrl: string;         // Temporary signed download URL (1 hour expiry)
  };
  error?: string;
}
```

---

## 🌐 HTTP API Endpoints

### `intakeFormAPI`
**Purpose**: Public HTTP API for intake form access (no authentication required)

**Base URL**: `https://us-central1-{project-id}.cloudfunctions.net/intakeFormAPI`

#### Get Intake Form Data
```
GET /intake/{token}
```

**Response**:
```typescript
{
  success: boolean;
  data?: {
    intake: Intake;              // Intake form details
    service: Service;            // Associated service
    formFields: FormField[];     // Form structure
  };
  error?: string;
}
```

#### Save Intake Progress
```
POST /intake/{token}/save
```

**Body**:
```typescript
{
  formData: Record<string, any>; // Partial form data
}
```

#### Submit Intake Form
```
POST /intake/{token}/submit
```

**Body**:
```typescript
{
  formData: Record<string, any>; // Complete form data
  clientInfo?: {
    name: string;
    email: string;
  };
}
```

---

## 🔄 Event Triggers

### Storage Triggers

#### `onTemplateUploaded`
**Purpose**: Automatically triggered when files are uploaded to Firebase Storage
**Trigger**: `functions.storage.object().onFinalize`
**Secrets Required**: `OPENAI_API_KEY`

Automatically processes uploaded template files and extracts fields using AI.

### Firestore Triggers

#### `onIntakeStatusChange`
**Purpose**: React to intake status changes
**Trigger**: `functions.firestore.document("intakes/{intakeId}").onUpdate`

Handles workflow automation when intake status changes (e.g., auto-generate documents on approval).

---

## 🗄️ Firestore Collections

### `templates`
- **Purpose**: Store template metadata and extracted fields
- **Security**: Admin access only
- **Indexes**: `status`, `createdAt`

### `services`
- **Purpose**: Service definitions and master form schemas
- **Security**: Admin access only
- **Indexes**: `status`, `createdAt`

### `intakes`
- **Purpose**: Client intake submissions and status tracking
- **Security**: Token-based access for clients, admin access for management
- **Indexes**: `serviceId`, `status`, `createdAt`, `linkToken`

### `documentArtifacts`
- **Purpose**: Generated document metadata and download tracking
- **Security**: Admin access only
- **Indexes**: `intakeId`, `status`, `generatedAt`

---

## 🔐 Authentication & Security

### Admin Functions
Most Cloud Functions require Firebase Authentication:
```javascript
// Client-side authentication
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase-config';

await signInWithEmailAndPassword(auth, email, password);
```

### Public Access
The `intakeFormAPI` endpoints are publicly accessible using token-based authentication:
- Intake forms use unique `linkToken` for access
- No Firebase Auth required for client form submission
- Tokens expire based on service configuration

### Security Rules
Firestore security rules enforce:
- Admin-only access to templates and services
- Token-based access to intake forms
- Document artifacts restricted to admins

---

## 📱 Frontend Integration Examples

### React/Next.js Integration

```javascript
// firebase-config.js
import { initializeApp } from 'firebase/app';
import { getFunctions } from 'firebase/functions';
import { getFirestore } from 'firebase/firestore';

const app = initializeApp(firebaseConfig);
export const functions = getFunctions(app);
export const db = getFirestore(app);
```

```javascript
// template-service.js
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase-config';

export class TemplateService {
  static async uploadTemplate(templateData) {
    const uploadTemplate = httpsCallable(functions, 'uploadTemplateAndParse');
    return await uploadTemplate(templateData);
  }
  
  static async createService(serviceData) {
    const createService = httpsCallable(functions, 'createServiceRequest');
    return await createService(serviceData);
  }
}
```

### Real-time Data Listening

```javascript
// Real-time intake monitoring
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from './firebase-config';

const intakesQuery = query(
  collection(db, 'intakes'), 
  orderBy('createdAt', 'desc')
);

const unsubscribe = onSnapshot(intakesQuery, (snapshot) => {
  const intakes = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  console.log('Updated intakes:', intakes);
});
```

---

## 🔧 Environment Configuration

### Required Environment Variables

#### Firebase Functions
```powershell
# functions/.env
OPENAI_API_KEY=sk-your-openai-api-key
```

#### Frontend Application
```powershell
# .env.local
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

---

## 🚀 Deployment

### Firebase Functions Deployment
```powershell
# Build and deploy all functions
cd functions
npm run build; firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:uploadTemplateAndParse
```

### Testing Functions Locally
```powershell
# Start Firebase emulators
firebase emulators:start

# Functions will be available at:
# http://localhost:5001/{project-id}/us-central1/{function-name}
```

---

## 📊 Monitoring & Logging

### Function Logs
```powershell
# View all function logs
firebase functions:log

# View specific function logs
firebase functions:log --only uploadTemplateAndParse

# View real-time logs
firebase functions:log --follow
```

### Error Handling
All functions return standardized `ApiResponse` format:
```typescript
{
  success: boolean;
  data?: any;        // Success payload
  error?: string;    // Error message
  message?: string;  // Additional info
}
```

---

## 🔍 Common Integration Patterns

### 1. Template Upload Workflow
```javascript
// 1. Request upload URL
const uploadResult = await uploadTemplate({
  fileName: 'template.docx',
  fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  templateName: 'My Template'
});

// 2. Upload file to signed URL
await fetch(uploadResult.data.uploadUrl, {
  method: 'PUT',
  body: fileBlob
});

// 3. Monitor template status in Firestore
const templateRef = doc(db, 'templates', uploadResult.data.templateId);
onSnapshot(templateRef, (doc) => {
  const template = doc.data();
  if (template.status === 'parsed') {
    console.log('Template ready!', template.extractedFields);
  }
});
```

### 2. Service Creation Workflow
```javascript
// 1. Create service from templates
const serviceResult = await createService({
  name: 'Legal Package',
  description: 'Complete legal service',
  templateIds: ['template1', 'template2']
});

// 2. Generate intake link
const linkResult = await generateIntakeLink({
  serviceId: serviceResult.data.serviceId,
  clientEmail: 'client@example.com'
});

// 3. Send link to client
const intakeUrl = linkResult.data.intakeUrl;
```

### 3. Document Generation Workflow
```javascript
// 1. Monitor intake submissions
const intakesQuery = query(
  collection(db, 'intakes'),
  where('status', '==', 'submitted')
);

onSnapshot(intakesQuery, async (snapshot) => {
  for (const doc of snapshot.docs) {
    const intake = doc.data();
    
    // 2. Approve intake
    await approveIntakeForm({
      intakeId: intake.id,
      approved: true
    });
    
    // 3. Generate documents
    const docResult = await generateDocumentsFromIntake({
      intakeId: intake.id
    });
    
    // 4. Get download URLs
    for (const artifactId of docResult.data.artifactIds) {
      const downloadResult = await getDocumentDownloadUrl({
        artifactId
      });
      console.log('Download URL:', downloadResult.data.downloadUrl);
    }
  }
});
```

---

## 🎯 Best Practices

### 1. Error Handling
Always check the `success` field in responses:
```javascript
const result = await someFunction(data);
if (!result.data.success) {
  console.error('Function failed:', result.data.error);
  return;
}
// Proceed with result.data.data
```

### 2. Real-time Updates
Use Firestore listeners for real-time updates instead of polling:
```javascript
// Good - Real-time listener
const unsubscribe = onSnapshot(collection(db, 'intakes'), handleUpdate);

// Avoid - Polling
setInterval(() => fetchIntakes(), 1000);
```

### 3. Security
- Always validate user permissions before calling admin functions
- Use appropriate Firestore security rules
- Sanitize user input before processing

### 4. Performance
- Use pagination for large datasets
- Implement proper error boundaries
- Cache frequently accessed data

---

## 📚 Additional Resources

- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Storage Documentation](https://firebase.google.com/docs/storage)
- [OpenAI API Documentation](https://platform.openai.com/docs)

---

## 📞 Support

For technical support or questions about the API:
- Review the comprehensive test files in `/tests` directory
- Check Firebase console for function logs
- Monitor Firestore collections for data flow
- Use Firebase emulators for local development

This documentation provides everything needed to integrate with the MCPForms backend services. The API is designed to be flexible and can support various frontend implementations while maintaining security and scalability.