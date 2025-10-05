# MCPForms - Component Architecture

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        MCPForms System                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────┐          ┌──────────────────────┐      │
│  │  Admin Interface  │          │ Customer Interface   │      │
│  │  (Template Editor)│          │ (Intake Customizer)  │      │
│  └────────┬──────────┘          └──────────┬───────────┘      │
│           │                                 │                  │
│           ├─────────────┬───────────────────┤                  │
│           │             │                   │                  │
│  ┌────────▼──────┐  ┌──▼────────┐  ┌──────▼────────┐         │
│  │ Template Mgmt │  │ AI Service │  │ Override Mgmt │         │
│  │ (28 Functions)│  │ (Vertex AI)│  │ (Firestore)   │         │
│  └───────────────┘  └───────────┘  └───────────────┘         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Component Hierarchy

### Admin Interface

```
TemplateEditorPage
└── TemplateEditor (main container)
    ├── Header (template info, lock status)
    ├── Actions Bar (lock, save, release)
    └── Tabs
        ├── Editor Tab
        │   └── PlaceholderEditor
        │       ├── Placeholder List (scrollable)
        │       ├── Add/Edit/Delete Actions
        │       └── AI Suggestion Button
        │
        ├── History Tab
        │   └── VersionHistory
        │       ├── Version List (scrollable)
        │       ├── Compare Selection
        │       └── Diff Viewer
        │
        ├── AI Tab
        │   └── AIAssistant
        │       ├── Quick Actions
        │       ├── Chat Messages
        │       └── Suggestion Cards
        │
        └── Preview Tab
            └── Template Preview
                └── Sample Data Display
```

### Customer Interface

```
CustomizePage
└── IntakeCustomizer (main container)
    ├── Header (title, description)
    ├── Service Selector (grid)
    └── Tabs
        ├── My Overrides Tab
        │   ├── Override List (scrollable)
        │   └── OverrideApprovalPanel
        │       ├── Pending List
        │       └── Approve/Reject Actions
        │
        ├── Create Override Tab
        │   └── OverrideCreator
        │       ├── Type Selector
        │       ├── Add Field Form
        │       └── Custom Clause Form
        │
        ├── AI Generator Tab
        │   └── AIClauseGenerator
        │       ├── Quick Actions
        │       ├── Chat Interface
        │       └── Generated Clauses
        │
        └── Effective Schema Tab
            └── EffectiveSchemaViewer
                ├── Field List (scrollable)
                ├── Custom Clauses
                └── Statistics Summary
```

---

## 🔄 Data Flow

### Template Editing Flow

```
User Action                    Component                Backend API
───────────                    ─────────                ───────────

1. Navigate to editor
   │
   ├──> TemplateEditor
        │
        ├──> checkTemplateLock ──────────> Firebase Functions
        │                                   │
        │    <────── Lock Status ──────────┘
        │
2. Acquire Lock
   │
   ├──> Click "Acquire Lock"
        │
        ├──> acquireTemplateLock ─────────> Firebase Functions
        │                                    │
        │    <────── Lock Acquired ─────────┘
        │
3. Edit Placeholders
   │
   ├──> PlaceholderEditor
        │
        ├──> Edit fields locally
        │
        ├──> Click "AI Suggest"
        │
        ├──> suggestPlaceholder ──────────> Vertex AI
        │                                    │
        │    <────── Suggestions ───────────┘
        │
4. Save Version
   │
   ├──> Click "Save Version"
        │
        ├──> publishTemplateVersion ──────> Firebase Functions
        │                                    │
        │    <────── New Version ───────────┘
        │
5. Release Lock
   │
   ├──> Click "Release Lock"
        │
        └──> releaseTemplateLock ─────────> Firebase Functions
                                             │
             <────── Lock Released ─────────┘
```

### Intake Customization Flow

```
User Action                    Component                Backend API
───────────                    ─────────                ───────────

1. Select Service
   │
   ├──> IntakeCustomizer
        │
        ├──> listServices ────────────────> Firebase Functions
        │                                    │
        │    <────── Service List ──────────┘
        │
2. Create Override
   │
   ├──> OverrideCreator
        │
        ├──> Fill form (field/clause)
        │
        ├──> Click "Create Override"
        │
        ├──> createCustomerOverride ──────> Firebase Functions
        │                                    │
        │    <────── Override Created ──────┘
        │
3. Generate AI Clause
   │
   ├──> AIClauseGenerator
        │
        ├──> Type request in chat
        │
        ├──> generateCustomClause ────────> Vertex AI
        │                                    │
        │    <────── Generated Text ────────┘
        │
        ├──> Click "Add to Form"
        │
        ├──> createCustomerOverride ──────> Firebase Functions
        │                                    │
        │    <────── Override Created ──────┘
        │
4. Approve Override (Admin)
   │
   ├──> OverrideApprovalPanel
        │
        ├──> Click "Approve"
        │
        ├──> approveCustomerOverride ─────> Firebase Functions
        │                                    │
        │    <────── Override Approved ─────┘
        │
5. View Effective Schema
   │
   ├──> EffectiveSchemaViewer
        │
        └──> getEffectiveSchema ──────────> Firebase Functions
                                             │
             <────── Merged Schema ─────────┘
```

---

## 🔌 API Integration Matrix

### Template Editor APIs

| Component          | API Function              | Purpose                    |
|--------------------|---------------------------|----------------------------|
| TemplateEditor     | `checkTemplateLock`       | Check lock status          |
| TemplateEditor     | `acquireTemplateLock`     | Lock for editing           |
| TemplateEditor     | `releaseTemplateLock`     | Release lock               |
| TemplateEditor     | `publishTemplateVersion`  | Save new version           |
| TemplateEditor     | `getTemplate`             | Load template data         |
| PlaceholderEditor  | `suggestPlaceholder`      | AI field suggestions       |
| PlaceholderEditor  | `detectPlaceholders`      | AI detection               |
| VersionHistory     | `listTemplateVersions`    | Get version history        |
| VersionHistory     | `compareVersions`         | Generate diff              |
| VersionHistory     | `rollbackToVersion`       | Revert to version          |
| VersionHistory     | `getTemplateVersion`      | Load specific version      |
| AIAssistant        | `detectPlaceholders`      | Find missing fields        |
| AIAssistant        | `validateTemplateSchema`  | Check schema validity      |

### Intake Customizer APIs

| Component              | API Function               | Purpose                    |
|------------------------|----------------------------|----------------------------|
| IntakeCustomizer       | `listServices`             | Get available services     |
| IntakeCustomizer       | `getCustomerOverrides`     | Load customizations        |
| OverrideCreator        | `createCustomerOverride`   | Add custom field/clause    |
| AIClauseGenerator      | `generateCustomClause`     | AI clause generation       |
| AIClauseGenerator      | `createCustomerOverride`   | Save generated clause      |
| OverrideApprovalPanel  | `approveCustomerOverride`  | Approve/reject override    |
| EffectiveSchemaViewer  | `getEffectiveSchema`       | Get merged schema          |

---

## 🎨 UI Component Library

### Core Components

```
src/components/ui/
├── badge.tsx           → Status indicators (pending, approved, rejected)
├── button.tsx          → Primary actions (save, delete, approve)
├── card.tsx            → Content containers
├── input.tsx           → Text input fields
├── label.tsx           → Form field labels
├── tabs.tsx            → Tabbed navigation
├── scroll-area.tsx     → Scrollable containers
├── toast.tsx           → Notification popups
├── toaster.tsx         → Toast manager
├── use-toast.ts        → Toast hook
└── utils.ts            → Utility functions (cn, clsx)
```

### Component Dependencies

```
┌──────────────────────┐
│   Admin/Customer     │
│    Components        │
└──────────┬───────────┘
           │
           ├─────> badge.tsx
           ├─────> button.tsx
           ├─────> card.tsx
           ├─────> input.tsx
           ├─────> label.tsx
           ├─────> tabs.tsx
           ├─────> scroll-area.tsx
           ├─────> toast.tsx
           └─────> toaster.tsx
                   │
                   └─────> use-toast.ts
                           │
                           └─────> utils.ts
```

---

## 🔐 Security & Permissions

### Template Editor
- **Who**: Admins only
- **Permissions**:
  - Acquire/release template locks
  - Edit placeholders
  - Create new versions
  - Rollback versions
  - View version history

### Intake Customizer
- **Who**: Authenticated customers
- **Permissions**:
  - View own services
  - Create overrides (pending approval)
  - Generate AI clauses
  - View own overrides
  - View effective schema

### Admin Approval
- **Who**: Admins only
- **Permissions**:
  - Approve/reject customer overrides
  - View all overrides
  - Monitor abuse

---

## 📊 State Management

### Template Editor State

```typescript
{
  template: Template | null,
  placeholders: Placeholder[],
  loading: boolean,
  saving: boolean,
  isLocked: boolean,
  lockHolder: string | null,
  hasChanges: boolean,
  activeTab: 'editor' | 'history' | 'ai' | 'preview'
}
```

### Intake Customizer State

```typescript
{
  services: Service[],
  selectedService: string | null,
  overrides: CustomerOverride[],
  loading: boolean,
  activeTab: 'overrides' | 'create' | 'ai' | 'preview'
}
```

### Placeholder Editor State

```typescript
{
  editingIndex: number | null,
  editForm: Placeholder | null,
  suggestingFor: string | null
}
```

---

## 🎯 Event Flow

### Template Lock Flow

```
User clicks "Acquire Lock"
    │
    ├──> Call acquireTemplateLock()
    │
    ├──> If successful:
    │    ├──> Set isLocked = true
    │    ├──> Set lockHolder = "you"
    │    ├──> Start 2-minute refresh timer
    │    └──> Enable editing
    │
    └──> If failed:
         └──> Show error toast
              └──> Display current lock holder
```

### AI Suggestion Flow

```
User clicks "AI Suggest"
    │
    ├──> Call suggestPlaceholder(field_key)
    │
    ├──> Show loading indicator
    │
    ├──> Receive AI response
    │
    ├──> Display suggestion toast
    │
    └──> If user accepts:
         └──> Update editForm with suggestions
```

### Override Approval Flow

```
Admin clicks "Approve"
    │
    ├──> Call approveCustomerOverride(overrideId, true)
    │
    ├──> Show loading indicator
    │
    ├──> If successful:
    │    ├──> Update override status = 'approved'
    │    ├──> Show success toast
    │    └──> Remove from pending list
    │
    └──> If failed:
         └──> Show error toast
```

---

## 📱 Responsive Design

### Desktop (> 1024px)
- Full sidebar navigation
- 3-column layouts
- Expanded cards
- Side-by-side diff viewer

### Tablet (768px - 1024px)
- Collapsed sidebar
- 2-column layouts
- Stacked cards
- Vertical diff viewer

### Mobile (< 768px)
- Bottom navigation
- Single column
- Compact cards
- Mobile-optimized forms

---

## 🔄 Auto-Refresh & Polling

### Template Lock Auto-Refresh
```typescript
useEffect(() => {
  if (isLocked) {
    const interval = setInterval(() => {
      refreshLock(); // Renew lock every 2 minutes
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }
}, [isLocked]);
```

### Prevents lock expiration during active editing

---

## 🎨 Color Coding

### Status Colors

| Status      | Color      | Usage                          |
|-------------|------------|--------------------------------|
| Pending     | Yellow     | Awaiting approval              |
| Approved    | Green      | Approved override              |
| Rejected    | Red        | Rejected override              |
| Editing     | Blue       | Active edit lock               |
| Locked      | Red        | Locked by another user         |
| Available   | Gray       | No lock, can acquire           |

### Field Types

| Type        | Color      |
|-------------|------------|
| text        | Blue       |
| number      | Green      |
| date        | Purple     |
| email       | Yellow     |
| phone       | Orange     |
| address     | Red        |
| currency    | Emerald    |

---

**End of Architecture Documentation**
