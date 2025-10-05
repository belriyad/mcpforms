# Frontend Components - Quick Start Guide

## 🎯 Overview
This guide shows how to use the newly created frontend components for template editing and intake customization.

---

## 📁 Component Locations

### Admin Components (`src/components/admin/`)
- `TemplateEditor.tsx` - Main template editor
- `PlaceholderEditor.tsx` - Placeholder management
- `VersionHistory.tsx` - Version history and diff viewer
- `AIAssistant.tsx` - AI-powered suggestions

### Customer Components (`src/components/intake/`)
- `IntakeCustomizer.tsx` - Main intake customizer
- `OverrideCreator.tsx` - Create custom fields/clauses
- `AIClauseGenerator.tsx` - AI clause generation
- `OverrideApprovalPanel.tsx` - Approval workflow
- `EffectiveSchemaViewer.tsx` - Final schema preview

### UI Components (`src/components/ui/`)
- `badge.tsx`, `button.tsx`, `card.tsx`, `input.tsx`, `label.tsx`
- `tabs.tsx`, `scroll-area.tsx`, `toast.tsx`, `toaster.tsx`

---

## 🚀 Usage Examples

### 1. Template Editor Page

**File**: `src/app/admin/templates/[templateId]/page.tsx`

```tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import TemplateEditor from '@/components/admin/TemplateEditor';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';

export default function TemplateEditorPage({ 
  params 
}: { 
  params: { templateId: string } 
}) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <Button onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Templates
        </Button>

        <TemplateEditor
          templateId={params.templateId}
          onClose={() => router.back()}
        />
      </div>
      <Toaster />
    </div>
  );
}
```

**Features:**
- Acquire/release edit locks
- Edit placeholders visually
- View version history with diffs
- Get AI suggestions
- Save new versions
- Rollback to previous versions

---

### 2. Intake Customizer Page

**File**: `src/app/customize/page.tsx`

```tsx
'use client';

import React from 'react';
import IntakeCustomizer from '@/components/intake/IntakeCustomizer';
import { Toaster } from '@/components/ui/toaster';

export default function CustomizePage() {
  // Get customerId from authentication
  const customerId = 'customer_123'; // Replace with auth

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <h1 className="text-3xl font-bold">Customize Your Intake</h1>
          <p className="text-gray-600 mt-2">
            Add custom fields and clauses to your forms
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        <IntakeCustomizer customerId={customerId} />
      </div>

      <Toaster />
    </div>
  );
}
```

**Features:**
- Select service to customize
- Add custom fields
- Generate AI clauses
- View pending approvals
- Preview effective schema

---

### 3. Using Individual Components

#### PlaceholderEditor

```tsx
import PlaceholderEditor from '@/components/admin/PlaceholderEditor';

function MyComponent() {
  const [placeholders, setPlaceholders] = useState([]);

  return (
    <PlaceholderEditor
      placeholders={placeholders}
      onChange={setPlaceholders}
      readOnly={false}
      templateId="template_123"
    />
  );
}
```

#### VersionHistory

```tsx
import VersionHistory from '@/components/admin/VersionHistory';

function MyComponent() {
  return (
    <VersionHistory
      templateId="template_123"
      currentVersion={5}
    />
  );
}
```

#### AIAssistant

```tsx
import AIAssistant from '@/components/admin/AIAssistant';

function MyComponent() {
  const [placeholders, setPlaceholders] = useState([]);

  return (
    <AIAssistant
      templateId="template_123"
      placeholders={placeholders}
      onSuggestionApply={(suggestion) => {
        setPlaceholders([...placeholders, suggestion]);
      }}
    />
  );
}
```

#### OverrideCreator

```tsx
import OverrideCreator from '@/components/intake/OverrideCreator';

function MyComponent() {
  return (
    <OverrideCreator
      customerId="customer_123"
      serviceId="service_456"
      onOverrideCreated={(override) => {
        console.log('Created:', override);
      }}
    />
  );
}
```

#### AIClauseGenerator

```tsx
import AIClauseGenerator from '@/components/intake/AIClauseGenerator';

function MyComponent() {
  return (
    <AIClauseGenerator
      customerId="customer_123"
      serviceId="service_456"
      onClauseGenerated={(override) => {
        console.log('Generated:', override);
      }}
    />
  );
}
```

#### EffectiveSchemaViewer

```tsx
import EffectiveSchemaViewer from '@/components/intake/EffectiveSchemaViewer';

function MyComponent() {
  const approvedOverrides = []; // Get from API

  return (
    <EffectiveSchemaViewer
      customerId="customer_123"
      serviceId="service_456"
      overrides={approvedOverrides}
    />
  );
}
```

---

## 🔧 Configuration

### Firebase Setup

**File**: `src/lib/firebase.ts`

```typescript
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

export default app;
```

### Environment Variables

**File**: `.env.local`

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

---

## 🎨 Styling

All components use **Tailwind CSS** for styling. The UI is built with:

- **shadcn/ui** components
- **Radix UI** primitives
- **Lucide React** icons
- **Tailwind CSS** utilities

### Customizing Colors

Edit `tailwind.config.js`:

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3b82f6', // Blue
          foreground: '#ffffff',
        },
        destructive: {
          DEFAULT: '#ef4444', // Red
          foreground: '#ffffff',
        },
        // ... more colors
      },
    },
  },
};
```

---

## 🔌 API Integration

All components integrate with Firebase Cloud Functions:

### Template Editor APIs
- `acquireTemplateLock` - Lock template for editing
- `releaseTemplateLock` - Release edit lock
- `checkTemplateLock` - Check lock status
- `publishTemplateVersion` - Save new version
- `listTemplateVersions` - Get version history
- `rollbackToVersion` - Revert to previous version
- `detectPlaceholders` - AI placeholder detection
- `suggestPlaceholder` - AI field suggestions
- `validateTemplateSchema` - Schema validation

### Intake Customizer APIs
- `listServices` - Get available services
- `createCustomerOverride` - Add custom field/clause
- `getCustomerOverrides` - Fetch customizations
- `approveCustomerOverride` - Admin approval
- `getEffectiveSchema` - Merged schema
- `generateCustomClause` - AI clause generation

---

## 📊 Component Props

### TemplateEditor

```typescript
interface TemplateEditorProps {
  templateId: string;
  onClose?: () => void;
}
```

### PlaceholderEditor

```typescript
interface PlaceholderEditorProps {
  placeholders: Placeholder[];
  onChange: (placeholders: Placeholder[]) => void;
  readOnly: boolean;
  templateId: string;
}
```

### VersionHistory

```typescript
interface VersionHistoryProps {
  templateId: string;
  currentVersion?: number;
}
```

### AIAssistant

```typescript
interface AIAssistantProps {
  templateId: string;
  placeholders: Placeholder[];
  onSuggestionApply: (suggestion: Placeholder) => void;
}
```

### IntakeCustomizer

```typescript
interface IntakeCustomizerProps {
  customerId: string;
  serviceId?: string;
}
```

### OverrideCreator

```typescript
interface OverrideCreatorProps {
  customerId: string;
  serviceId: string;
  onOverrideCreated: (override: any) => void;
}
```

### AIClauseGenerator

```typescript
interface AIClauseGeneratorProps {
  customerId: string;
  serviceId: string;
  onClauseGenerated: (override: any) => void;
}
```

### OverrideApprovalPanel

```typescript
interface OverrideApprovalPanelProps {
  customerId: string;
  serviceId: string;
  overrides: CustomerOverride[];
  onApprove: (overrideId: string) => void;
  onReject: (overrideId: string) => void;
}
```

### EffectiveSchemaViewer

```typescript
interface EffectiveSchemaViewerProps {
  customerId: string;
  serviceId: string;
  overrides: CustomerOverride[];
}
```

---

## 🧪 Testing

### Manual Testing

1. **Start Development Server**:
   ```bash
   npm run dev
   ```

2. **Navigate to Pages**:
   - Template Editor: `http://localhost:3000/admin/templates/[templateId]`
   - Intake Customizer: `http://localhost:3000/customize`

3. **Test Features**:
   - Acquire lock
   - Edit placeholders
   - View version history
   - Get AI suggestions
   - Create overrides
   - Generate AI clauses

### E2E Testing

```typescript
// tests/template-editor.spec.ts
import { test, expect } from '@playwright/test';

test('template editor workflow', async ({ page }) => {
  await page.goto('/admin/templates/template_123');
  
  // Acquire lock
  await page.click('button:has-text("Acquire Edit Lock")');
  await expect(page.locator('text=Editing')).toBeVisible();
  
  // Edit placeholder
  await page.click('button:has-text("Add Field")');
  await page.fill('input[placeholder="e.g., custom_field_1"]', 'test_field');
  await page.click('button:has-text("Save")');
  
  // Save version
  await page.click('button:has-text("Save Version")');
  await expect(page.locator('text=Saved Successfully')).toBeVisible();
});
```

---

## 🐛 Troubleshooting

### TypeScript Errors

If you see errors like "Property 'variant' does not exist":

**Solution 1**: Add type assertions
```tsx
<Button size={'sm' as any} variant={'outline' as any}>
  Click me
</Button>
```

**Solution 2**: Use plain props
```tsx
<Button className="h-9 px-3">Click me</Button>
```

### Firebase Not Initialized

**Error**: "Firebase app not initialized"

**Solution**: Import firebase config
```tsx
import '@/lib/firebase';
```

### Module Not Found

**Error**: "Cannot find module './PlaceholderEditor'"

**Solution**: Rebuild the project
```bash
npm run build
```

---

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Lucide Icons](https://lucide.dev/)

---

## ✅ Checklist

Before deploying to production:

- [ ] Configure Firebase environment variables
- [ ] Test all component features
- [ ] Fix TypeScript type errors
- [ ] Add error boundaries
- [ ] Implement loading states
- [ ] Add authentication guards
- [ ] Test on mobile devices
- [ ] Optimize bundle size
- [ ] Set up monitoring
- [ ] Add analytics

---

**End of Quick Start Guide**
