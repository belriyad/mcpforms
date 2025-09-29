# MCPForms Integration Guide

## Quick Start for Frontend Developers

This guide helps you integrate with the MCPForms backend services to build custom frontends or integrate MCPForms functionality into existing applications.

### Table of Contents
1. [Authentication Setup](#authentication-setup)
2. [Common Integration Patterns](#common-integration-patterns)
3. [Frontend SDK Examples](#frontend-sdk-examples)
4. [React Hooks](#react-hooks)
5. [Error Handling](#error-handling)
6. [Best Practices](#best-practices)

## Authentication Setup

### Firebase Configuration

```javascript
// firebase.config.js
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const functions = getFunctions(app, 'us-central1');

// For local development
if (process.env.NODE_ENV === 'development') {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFunctionsEmulator(functions, 'localhost', 5001);
}
```

### Authentication Helper

```javascript
// auth.service.js
import { auth } from './firebase.config';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';

export class AuthService {
  static async getAuthToken() {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    return await user.getIdToken();
  }

  static async signIn(email, password) {
    return await signInWithEmailAndPassword(auth, email, password);
  }

  static onAuthStateChange(callback) {
    return onAuthStateChanged(auth, callback);
  }
}
```

## Common Integration Patterns

### 1. Template Management Workflow

```javascript
// template.service.js
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase.config';

export class TemplateService {
  static async uploadTemplate(templateData) {
    const uploadFn = httpsCallable(functions, 'uploadTemplateAndParse');
    
    try {
      const result = await uploadFn(templateData);
      return result.data;
    } catch (error) {
      console.error('Template upload failed:', error);
      throw error;
    }
  }

  static async processTemplate(templateId, filePath) {
    const processFn = httpsCallable(functions, 'processUploadedTemplate');
    
    return await processFn({ templateId, filePath });
  }

  static async monitorTemplateStatus(templateId, callback) {
    // Use Firestore listener for real-time updates
    import { doc, onSnapshot } from 'firebase/firestore';
    import { db } from './firebase.config';
    
    const templateRef = doc(db, 'templates', templateId);
    
    return onSnapshot(templateRef, (doc) => {
      if (doc.exists()) {
        callback(doc.data());
      }
    });
  }
}

// Usage Example
async function uploadAndProcessTemplate() {
  try {
    // Step 1: Upload template
    const uploadResult = await TemplateService.uploadTemplate({
      fileName: 'contract.docx',
      fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      templateName: 'Standard Contract'
    });

    console.log('Upload URL:', uploadResult.uploadUrl);
    console.log('Template ID:', uploadResult.templateId);

    // Step 2: Upload file to signed URL (implement file upload)
    await uploadFileToSignedUrl(uploadResult.uploadUrl, file);

    // Step 3: Process template
    await TemplateService.processTemplate(
      uploadResult.templateId, 
      `templates/${uploadResult.templateId}.docx`
    );

    // Step 4: Monitor processing status
    const unsubscribe = TemplateService.monitorTemplateStatus(
      uploadResult.templateId,
      (templateData) => {
        console.log('Template status:', templateData.status);
        if (templateData.status === 'parsed') {
          console.log('Extracted fields:', templateData.extractedFields);
          unsubscribe(); // Stop monitoring
        }
      }
    );

  } catch (error) {
    console.error('Template workflow failed:', error);
  }
}
```

### 2. Service Creation and Management

```javascript
// service.service.js
export class ServiceManager {
  static async createService(serviceData) {
    const createFn = httpsCallable(functions, 'createServiceRequest');
    
    try {
      const result = await createFn(serviceData);
      return result.data.serviceId;
    } catch (error) {
      console.error('Service creation failed:', error);
      throw error;
    }
  }

  static async updateService(serviceId, updates) {
    const updateFn = httpsCallable(functions, 'updateServiceRequest');
    
    return await updateFn({ serviceId, updates });
  }

  static async deleteService(serviceId) {
    const deleteFn = httpsCallable(functions, 'deleteServiceRequest');
    
    return await deleteFn({ serviceId });
  }

  static async getServiceList() {
    import { collection, getDocs } from 'firebase/firestore';
    import { db } from './firebase.config';
    
    const servicesRef = collection(db, 'services');
    const snapshot = await getDocs(servicesRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
}

// Usage Example
async function serviceManagementWorkflow() {
  try {
    // Create service from parsed templates
    const serviceId = await ServiceManager.createService({
      name: 'Legal Document Package',
      description: 'Complete legal documentation service',
      templateIds: ['template_123', 'template_456', 'template_789']
    });

    console.log('Service created:', serviceId);

    // Update service status to active
    await ServiceManager.updateService(serviceId, {
      status: 'active'
    });

    // Get all services
    const services = await ServiceManager.getServiceList();
    console.log('All services:', services);

  } catch (error) {
    console.error('Service management failed:', error);
  }
}
```

### 3. Intake Form Generation and Management

```javascript
// intake.service.js
export class IntakeService {
  static async generateIntakeLink(serviceId, options = {}) {
    const generateFn = httpsCallable(functions, 'generateIntakeLink');
    
    try {
      const result = await generateFn({
        serviceId,
        clientEmail: options.clientEmail,
        expiresInDays: options.expiresInDays || 30
      });
      
      return result.data;
    } catch (error) {
      console.error('Intake link generation failed:', error);
      throw error;
    }
  }

  static async submitIntakeForm(intakeId, formData, clientInfo) {
    const submitFn = httpsCallable(functions, 'submitIntakeForm');
    
    return await submitFn({
      intakeId,
      formData,
      clientInfo
    });
  }

  static async approveIntake(intakeId, approved, notes = '') {
    const approveFn = httpsCallable(functions, 'approveIntakeForm');
    
    return await approveFn({
      intakeId,
      approved,
      notes
    });
  }

  static monitorIntakes(callback) {
    import { collection, onSnapshot } from 'firebase/firestore';
    import { db } from './firebase.config';
    
    const intakesRef = collection(db, 'intakes');
    
    return onSnapshot(intakesRef, (snapshot) => {
      const intakes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(intakes);
    });
  }
}

// Usage Example
async function intakeWorkflow() {
  try {
    // Generate intake link
    const intakeData = await IntakeService.generateIntakeLink('service_123', {
      clientEmail: 'client@example.com',
      expiresInDays: 30
    });

    console.log('Intake URL:', intakeData.intakeUrl);
    
    // Send URL to client (email, SMS, etc.)
    await sendIntakeLinkToClient(intakeData.intakeUrl, 'client@example.com');

    // Monitor intake submissions
    const unsubscribe = IntakeService.monitorIntakes((intakes) => {
      const newSubmissions = intakes.filter(i => i.status === 'submitted');
      console.log('New submissions:', newSubmissions.length);
    });

    // Approve intake (after review)
    await IntakeService.approveIntake('intake_xyz789', true, 'All information verified');

  } catch (error) {
    console.error('Intake workflow failed:', error);
  }
}
```

### 4. Document Generation and Download

```javascript
// document.service.js
export class DocumentService {
  static async generateDocuments(intakeId) {
    const generateFn = httpsCallable(functions, 'generateDocumentsFromIntake');
    
    try {
      const result = await generateFn({ intakeId });
      return result.data.artifactIds;
    } catch (error) {
      console.error('Document generation failed:', error);
      throw error;
    }
  }

  static async getDownloadUrl(artifactId) {
    const downloadFn = httpsCallable(functions, 'getDocumentDownloadUrl');
    
    try {
      const result = await downloadFn({ artifactId });
      return result.data.downloadUrl;
    } catch (error) {
      console.error('Download URL generation failed:', error);
      throw error;
    }
  }

  static async downloadDocument(artifactId, fileName) {
    try {
      const downloadUrl = await this.getDownloadUrl(artifactId);
      
      // Download file
      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      
      // Trigger download
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return true;
    } catch (error) {
      console.error('Document download failed:', error);
      throw error;
    }
  }

  static monitorDocumentGeneration(intakeId, callback) {
    import { collection, query, where, onSnapshot } from 'firebase/firestore';
    import { db } from './firebase.config';
    
    const artifactsRef = collection(db, 'documentArtifacts');
    const q = query(artifactsRef, where('intakeId', '==', intakeId));
    
    return onSnapshot(q, (snapshot) => {
      const artifacts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(artifacts);
    });
  }
}

// Usage Example
async function documentWorkflow() {
  try {
    // Generate documents from approved intake
    const artifactIds = await DocumentService.generateDocuments('intake_xyz789');
    console.log('Generated artifacts:', artifactIds);

    // Monitor generation progress
    const unsubscribe = DocumentService.monitorDocumentGeneration(
      'intake_xyz789',
      (artifacts) => {
        const completed = artifacts.filter(a => a.status === 'generated');
        console.log(`${completed.length}/${artifacts.length} documents ready`);
        
        if (completed.length === artifacts.length) {
          console.log('All documents generated');
          unsubscribe();
        }
      }
    );

    // Download specific document
    await DocumentService.downloadDocument('doc_001', 'contract_filled.docx');

  } catch (error) {
    console.error('Document workflow failed:', error);
  }
}
```

## React Hooks

### Custom Hooks for MCPForms

```javascript
// hooks/useMCPForms.js
import { useState, useEffect, useCallback } from 'react';
import { TemplateService, ServiceManager, IntakeService, DocumentService } from '../services';

export function useTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const uploadTemplate = useCallback(async (templateData) => {
    try {
      setLoading(true);
      const result = await TemplateService.uploadTemplate(templateData);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshTemplates = useCallback(async () => {
    try {
      setLoading(true);
      // Implement template fetching from Firestore
      const templateList = await getTemplatesFromFirestore();
      setTemplates(templateList);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshTemplates();
  }, [refreshTemplates]);

  return {
    templates,
    loading,
    error,
    uploadTemplate,
    refreshTemplates
  };
}

export function useServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const createService = useCallback(async (serviceData) => {
    try {
      setLoading(true);
      const serviceId = await ServiceManager.createService(serviceData);
      await refreshServices();
      return serviceId;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshServices = useCallback(async () => {
    try {
      setLoading(true);
      const serviceList = await ServiceManager.getServiceList();
      setServices(serviceList);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshServices();
  }, [refreshServices]);

  return {
    services,
    loading,
    error,
    createService,
    refreshServices
  };
}

export function useIntakes() {
  const [intakes, setIntakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = IntakeService.monitorIntakes((intakeList) => {
      setIntakes(intakeList);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const generateIntakeLink = useCallback(async (serviceId, options) => {
    try {
      return await IntakeService.generateIntakeLink(serviceId, options);
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  const approveIntake = useCallback(async (intakeId, approved, notes) => {
    try {
      await IntakeService.approveIntake(intakeId, approved, notes);
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  return {
    intakes,
    loading,
    error,
    generateIntakeLink,
    approveIntake
  };
}

export function useDocuments(intakeId) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!intakeId) return;

    const unsubscribe = DocumentService.monitorDocumentGeneration(
      intakeId,
      (artifacts) => {
        setDocuments(artifacts);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [intakeId]);

  const generateDocuments = useCallback(async () => {
    try {
      setLoading(true);
      return await DocumentService.generateDocuments(intakeId);
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [intakeId]);

  const downloadDocument = useCallback(async (artifactId, fileName) => {
    try {
      await DocumentService.downloadDocument(artifactId, fileName);
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  return {
    documents,
    loading,
    error,
    generateDocuments,
    downloadDocument
  };
}
```

### React Component Examples

```javascript
// components/TemplateUploader.jsx
import React, { useState } from 'react';
import { useTemplates } from '../hooks/useMCPForms';

export function TemplateUploader() {
  const { uploadTemplate, loading } = useTemplates();
  const [file, setFile] = useState(null);
  const [templateName, setTemplateName] = useState('');

  const handleUpload = async () => {
    if (!file || !templateName) return;

    try {
      const result = await uploadTemplate({
        fileName: file.name,
        fileType: file.type,
        templateName
      });

      console.log('Upload successful:', result);
      // Handle success (reset form, show notification, etc.)
      
    } catch (error) {
      console.error('Upload failed:', error);
      // Handle error (show error message, etc.)
    }
  };

  return (
    <div className="template-uploader">
      <h3>Upload Template</h3>
      
      <input
        type="text"
        placeholder="Template Name"
        value={templateName}
        onChange={(e) => setTemplateName(e.target.value)}
      />
      
      <input
        type="file"
        accept=".pdf,.docx"
        onChange={(e) => setFile(e.target.files[0])}
      />
      
      <button 
        onClick={handleUpload}
        disabled={loading || !file || !templateName}
      >
        {loading ? 'Uploading...' : 'Upload Template'}
      </button>
    </div>
  );
}

// components/IntakeMonitor.jsx
import React from 'react';
import { useIntakes, useDocuments } from '../hooks/useMCPForms';

export function IntakeMonitor() {
  const { intakes, approveIntake, loading } = useIntakes();

  const handleApproval = async (intakeId, approved) => {
    try {
      await approveIntake(intakeId, approved, 'Reviewed by admin');
      // Show success message
    } catch (error) {
      console.error('Approval failed:', error);
      // Show error message
    }
  };

  if (loading) return <div>Loading intakes...</div>;

  return (
    <div className="intake-monitor">
      <h3>Intake Submissions</h3>
      
      {intakes.map(intake => (
        <IntakeCard
          key={intake.id}
          intake={intake}
          onApprove={(approved) => handleApproval(intake.id, approved)}
        />
      ))}
    </div>
  );
}

function IntakeCard({ intake, onApprove }) {
  const { documents, generateDocuments } = useDocuments(intake.id);

  return (
    <div className="intake-card">
      <h4>{intake.serviceName}</h4>
      <p>Status: {intake.status}</p>
      <p>Client: {intake.clientEmail}</p>
      
      {intake.status === 'submitted' && (
        <div className="approval-actions">
          <button onClick={() => onApprove(true)}>Approve</button>
          <button onClick={() => onApprove(false)}>Reject</button>
        </div>
      )}
      
      {intake.status === 'approved' && documents.length === 0 && (
        <button onClick={generateDocuments}>Generate Documents</button>
      )}
      
      {documents.length > 0 && (
        <DocumentList documents={documents} />
      )}
    </div>
  );
}
```

## Error Handling

### Centralized Error Handler

```javascript
// utils/errorHandler.js
export class MCPFormsError extends Error {
  constructor(message, code, originalError) {
    super(message);
    this.code = code;
    this.originalError = originalError;
  }
}

export function handleFirebaseFunctionError(error) {
  // Firebase Functions errors come with specific codes
  switch (error.code) {
    case 'functions/cancelled':
      return new MCPFormsError('Operation was cancelled', 'CANCELLED', error);
    case 'functions/unknown':
      return new MCPFormsError('Unknown error occurred', 'UNKNOWN', error);
    case 'functions/invalid-argument':
      return new MCPFormsError('Invalid request parameters', 'INVALID_PARAMS', error);
    case 'functions/deadline-exceeded':
      return new MCPFormsError('Request timeout', 'TIMEOUT', error);
    case 'functions/not-found':
      return new MCPFormsError('Resource not found', 'NOT_FOUND', error);
    case 'functions/already-exists':
      return new MCPFormsError('Resource already exists', 'ALREADY_EXISTS', error);
    case 'functions/permission-denied':
      return new MCPFormsError('Permission denied', 'PERMISSION_DENIED', error);
    case 'functions/resource-exhausted':
      return new MCPFormsError('Resource exhausted', 'RESOURCE_EXHAUSTED', error);
    case 'functions/failed-precondition':
      return new MCPFormsError('Precondition failed', 'PRECONDITION_FAILED', error);
    case 'functions/aborted':
      return new MCPFormsError('Operation aborted', 'ABORTED', error);
    case 'functions/out-of-range':
      return new MCPFormsError('Value out of range', 'OUT_OF_RANGE', error);
    case 'functions/unimplemented':
      return new MCPFormsError('Feature not implemented', 'UNIMPLEMENTED', error);
    case 'functions/internal':
      return new MCPFormsError('Internal server error', 'INTERNAL_ERROR', error);
    case 'functions/unavailable':
      return new MCPFormsError('Service unavailable', 'UNAVAILABLE', error);
    case 'functions/data-loss':
      return new MCPFormsError('Data loss occurred', 'DATA_LOSS', error);
    case 'functions/unauthenticated':
      return new MCPFormsError('Authentication required', 'UNAUTHENTICATED', error);
    default:
      return new MCPFormsError('Unknown error occurred', 'UNKNOWN', error);
  }
}

export function createErrorHandler(showNotification) {
  return (error) => {
    const mcpError = error instanceof MCPFormsError 
      ? error 
      : handleFirebaseFunctionError(error);
    
    console.error('MCPForms Error:', mcpError);
    
    // Show user-friendly notification
    showNotification({
      type: 'error',
      title: 'Operation Failed',
      message: mcpError.message
    });
    
    return mcpError;
  };
}
```

## Best Practices

### 1. Authentication Best Practices

```javascript
// Wrap all Firebase Function calls with authentication check
async function callFunction(functionName, data) {
  try {
    await AuthService.getAuthToken(); // Verify authentication
    const fn = httpsCallable(functions, functionName);
    return await fn(data);
  } catch (error) {
    if (error.code === 'UNAUTHENTICATED') {
      // Redirect to login
      window.location.href = '/login';
    }
    throw error;
  }
}
```

### 2. Real-time Updates

```javascript
// Use Firestore listeners for real-time UI updates
function useRealtimeCollection(collectionName, queryConstraints = []) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import { collection, query, onSnapshot } from 'firebase/firestore';
    import { db } from '../firebase.config';
    
    const ref = collection(db, collectionName);
    const q = queryConstraints.length > 0 ? query(ref, ...queryConstraints) : ref;
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setData(items);
      setLoading(false);
    });

    return unsubscribe;
  }, [collectionName, queryConstraints]);

  return { data, loading };
}
```

### 3. Optimistic Updates

```javascript
// Update UI optimistically before backend confirmation
async function updateServiceOptimistically(serviceId, updates) {
  // Update local state immediately
  setServices(prev => prev.map(service => 
    service.id === serviceId 
      ? { ...service, ...updates }
      : service
  ));

  try {
    // Confirm with backend
    await ServiceManager.updateService(serviceId, updates);
  } catch (error) {
    // Revert on error
    setServices(prev => prev.map(service => 
      service.id === serviceId 
        ? { ...service, ...originalService }
        : service
    ));
    throw error;
  }
}
```

### 4. Caching Strategy

```javascript
// Simple cache implementation
class APICache {
  static cache = new Map();
  static TTL = 5 * 60 * 1000; // 5 minutes

  static set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  static get(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  static clear() {
    this.cache.clear();
  }
}

// Use cache in service calls
export async function getCachedServices() {
  const cacheKey = 'services';
  const cached = APICache.get(cacheKey);
  
  if (cached) return cached;
  
  const services = await ServiceManager.getServiceList();
  APICache.set(cacheKey, services);
  
  return services;
}
```

### 5. Performance Optimization

```javascript
// Lazy load heavy components
import { lazy, Suspense } from 'react';

const TemplateUploader = lazy(() => import('./components/TemplateUploader'));
const IntakeMonitor = lazy(() => import('./components/IntakeMonitor'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TemplateUploader />
      <IntakeMonitor />
    </Suspense>
  );
}

// Debounce expensive operations
function useDebouncedSearch(searchTerm, delay = 300) {
  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, delay);

    return () => clearTimeout(timer);
  }, [searchTerm, delay]);

  return debouncedTerm;
}
```

## Testing Integration

```javascript
// __tests__/integration.test.js
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TemplateUploader } from '../components/TemplateUploader';

// Mock Firebase
jest.mock('../firebase.config', () => ({
  functions: {},
  auth: { currentUser: { getIdToken: () => 'mock-token' } }
}));

jest.mock('firebase/functions', () => ({
  httpsCallable: jest.fn(() => jest.fn().mockResolvedValue({
    data: { templateId: 'test-123', uploadUrl: 'https://test.com' }
  }))
}));

describe('MCPForms Integration', () => {
  test('template upload workflow', async () => {
    render(<TemplateUploader />);
    
    const nameInput = screen.getByPlaceholderText('Template Name');
    const fileInput = screen.getByRole('button', { name: /upload/i });
    
    fireEvent.change(nameInput, { target: { value: 'Test Template' } });
    
    // Mock file selection
    const file = new File(['content'], 'test.docx', { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    });
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: /upload template/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/upload successful/i)).toBeInTheDocument();
    });
  });
});
```

This integration guide provides everything frontend developers need to build new interfaces or integrate MCPForms functionality into existing applications. The examples cover all major workflows and include best practices for performance, error handling, and testing.