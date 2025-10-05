# Integration Plan: Unified Workflow with Customization

## Current Problem
The customizer (`/customize`) is a **disconnected standalone page** that doesn't integrate with the admin workflow. Customers can't actually use it because it's not part of the service creation/intake flow.

## The Correct Workflow

### ✅ Intended Flow (What we need to build):

```
1. TEMPLATE UPLOAD
   └─> Admin uploads PDF/DOCX template
   
2. TEMPLATE EDITING  
   └─> Admin edits placeholders, versions
   └─> Admin marks which fields are "customizable by customer"
   
3. SERVICE CREATION ⭐ (Integration Point)
   └─> Admin selects templates
   └─> Admin configures customization rules:
       ├─> Can customer add custom fields? (Yes/No)
       ├─> Can customer add custom clauses? (Yes/No)
       ├─> Which fields can be modified?
       ├─> What field types are allowed?
       └─> Approval required? (Yes/No)
   
4. SERVICE ACTIVATION
   └─> Service goes live with customization options
   
5. INTAKE LINK GENERATION
   └─> Generate unique link for customer
   └─> Link includes service + customization rules
   
6. CUSTOMER INTAKE (Customer-facing)
   └─> Customer opens link
   └─> Sees base form from templates
   └─> CAN customize if service allows:
       ├─> Add custom fields (if enabled)
       ├─> Add custom clauses (if enabled)
       └─> Submit for admin approval (if required)
   
7. ADMIN REVIEW (If approval required)
   └─> Admin reviews custom fields/clauses
   └─> Approves or rejects
   
8. FORM FILLING
   └─> Customer fills out intake form
   └─> Form includes base + approved custom fields
   
9. DOCUMENT GENERATION
   └─> System generates documents
   └─> Documents include customizations
   └─> Customer downloads
```

## What Needs to Change

### 1. **Template Editor Enhancement**
**File**: `src/components/admin/TemplateEditor.tsx`

**Add "Customization" tab** with:
- Toggle: "Allow customers to customize this template"
- Mark fields as "customer-modifiable"
- Set default customization rules

```tsx
// New tab in TemplateEditor
<TabsContent value="customization">
  <TemplateCustomizationRules
    templateId={templateId}
    placeholders={placeholders}
    onRulesUpdated={handleRulesUpdated}
  />
</TabsContent>
```

### 2. **Service Creation Form Enhancement**
**File**: `src/components/admin/ServiceManager.tsx` → `CreateServiceForm`

**Add customization settings** to service creation:
```tsx
function CreateServiceForm() {
  // Existing state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedTemplates, setSelectedTemplates] = useState([])
  
  // NEW: Customization settings
  const [allowCustomFields, setAllowCustomFields] = useState(false)
  const [allowCustomClauses, setAllowCustomClauses] = useState(false)
  const [requireApproval, setRequireApproval] = useState(true)
  const [allowedFieldTypes, setAllowedFieldTypes] = useState([
    'text', 'email', 'phone', 'date', 'number'
  ])
  
  // Form now includes customization section
  return (
    <form>
      {/* Existing fields: name, description, templates */}
      
      {/* NEW SECTION */}
      <div className="border-t pt-4">
        <h4 className="font-medium mb-3">Customer Customization Options</h4>
        
        <label>
          <input 
            type="checkbox"
            checked={allowCustomFields}
            onChange={(e) => setAllowCustomFields(e.target.checked)}
          />
          Allow customers to add custom fields
        </label>
        
        <label>
          <input 
            type="checkbox"
            checked={allowCustomClauses}
            onChange={(e) => setAllowCustomClauses(e.target.checked)}
          />
          Allow customers to add custom clauses
        </label>
        
        <label>
          <input 
            type="checkbox"
            checked={requireApproval}
            onChange={(e) => setRequireApproval(e.target.checked)}
          />
          Require admin approval for customizations
        </label>
      </div>
    </form>
  )
}
```

### 3. **Admin Dashboard - New "Customizations" Tab**
**File**: `src/components/admin/AdminDashboard.tsx`

**Add 4th tab** for reviewing pending customizations:
```tsx
const tabs = [
  { id: 'templates', name: 'Templates', icon: '📄' },
  { id: 'services', name: 'Services', icon: '⚙️' },
  { id: 'intakes', name: 'Intakes', icon: '📝' },
  { id: 'customizations', name: 'Customizations', icon: '🎨', badge: pendingCount }, // NEW
]
```

This tab shows:
- Pending customization requests
- Recently approved/rejected
- Quick approve/reject actions

### 4. **Intake Form Enhancement**
**File**: `src/app/intake/[token]/page.tsx`

**Add customization UI** if service allows:
```tsx
function IntakeForm({ service, token }) {
  return (
    <div>
      {/* Base form fields */}
      <FormFields fields={service.masterFormJson} />
      
      {/* NEW: Customization section */}
      {service.customization_enabled && (
        <div className="border-t pt-6 mt-6">
          <h3>Customize This Form (Optional)</h3>
          
          {service.allow_custom_fields && (
            <button onClick={openCustomFieldDialog}>
              ➕ Add Custom Field
            </button>
          )}
          
          {service.allow_custom_clauses && (
            <button onClick={openCustomClauseDialog}>
              📝 Add Custom Clause
            </button>
          )}
          
          {/* Show customer's pending/approved customizations */}
          <CustomizationsList 
            customizations={customerOverrides}
            serviceId={service.id}
          />
        </div>
      )}
    </div>
  )
}
```

### 5. **Backend Function Updates**
**File**: `functions/src/services/serviceManager.ts`

**Update `createServiceRequest`** to store customization rules:
```typescript
export const createServiceRequest = async (data: {
  name: string
  description: string
  templateIds: string[]
  customization?: {
    allow_custom_fields: boolean
    allow_custom_clauses: boolean
    require_approval: boolean
    allowed_field_types: string[]
  }
}) => {
  // Store service with customization rules
  await db.collection('services').add({
    ...data,
    customization_enabled: Boolean(data.customization),
    customization_rules: data.customization || null,
    status: 'active'
  })
}
```

## Implementation Steps (Priority Order)

### Phase 1: Service-Level Customization (CRITICAL)
1. ✅ Update `CreateServiceForm` to include customization toggles
2. ✅ Update `createServiceRequest` backend function
3. ✅ Update Firestore schema to store customization rules
4. ✅ Test service creation with customization options

### Phase 2: Customer Intake Integration (CRITICAL)
5. ✅ Update intake form to show customization UI
6. ✅ Connect customer customization requests to service rules
7. ✅ Test customer flow: create custom field → submit → pending approval

### Phase 3: Admin Approval Workflow (HIGH PRIORITY)
8. ✅ Add "Customizations" tab to AdminDashboard
9. ✅ Build CustomizationManager component (approve/reject UI)
10. ✅ Connect to `approveCustomerOverride` function
11. ✅ Test admin approval workflow

### Phase 4: Template-Level Rules (MEDIUM PRIORITY)
12. ⚠️ Add "Customization" tab to TemplateEditor
13. ⚠️ Allow marking fields as "customer-modifiable"
14. ⚠️ Inherit template rules when creating service

### Phase 5: Polish & Features (LOW PRIORITY)
15. ⚠️ Add AI-powered customization suggestions
16. ⚠️ Add customization preview
17. ⚠️ Add customization templates/presets
18. ⚠️ Add analytics for popular customizations

## Files to Modify

### Frontend Changes
```
src/components/admin/
├── AdminDashboard.tsx ⚠️ Add "Customizations" tab
├── ServiceManager.tsx ⚠️ Add customization to CreateServiceForm
├── TemplateEditor.tsx ⚠️ Add "Customization" tab
└── CustomizationManager.tsx ⚠️ NEW FILE - Approval UI

src/app/intake/[token]/
└── page.tsx ⚠️ Add customization UI to intake form

src/components/intake/
└── CustomerCustomization.tsx ⚠️ NEW FILE - Customer customization UI
```

### Backend Changes
```
functions/src/
├── services/serviceManager.ts ⚠️ Update createServiceRequest
├── services/overrideManager.ts ⚠️ Update validation with service rules
└── api/intake.ts ⚠️ Include customization rules in intake data
```

### Data Model Changes
```typescript
// Service model
interface Service {
  id: string
  name: string
  description: string
  templateIds: string[]
  masterFormJson: any[]
  
  // NEW FIELDS
  customization_enabled: boolean
  customization_rules: {
    allow_custom_fields: boolean
    allow_custom_clauses: boolean
    require_approval: boolean
    allowed_field_types: string[]
    max_custom_fields?: number
    max_custom_clauses?: number
  } | null
}

// CustomerOverride model (existing, enhanced)
interface CustomerOverride {
  id: string
  customer_id: string
  service_id: string
  override_type: 'add_field' | 'custom_clause'
  
  // NEW FIELD
  service_allows_customization: boolean // Validated against service rules
  
  status: 'pending' | 'approved' | 'rejected'
  // ... rest of fields
}
```

## Key Benefits of This Approach

✅ **Unified Flow**: Everything happens in the admin dashboard
✅ **Per-Service Control**: Admin decides customization rules per service
✅ **Customer Empowerment**: Customers can customize within admin-defined boundaries
✅ **Quality Control**: Admin approval ensures quality
✅ **Scalable**: Easy to add more customization types later

## Migration Path

### For Existing Deployments:
1. Add customization fields to existing services (default: disabled)
2. Keep `/customize` page for backward compatibility (mark as deprecated)
3. Show migration banner: "Customization has moved to the intake form"
4. Remove standalone page after 30 days

### For New Deployments:
1. Deploy with integrated flow from day 1
2. Don't create `/customize` route
3. Customization only accessible via service → intake flow

---

## Next Steps

**IMMEDIATE ACTION NEEDED:**
1. Review this plan with stakeholders
2. Prioritize which phase to start with
3. Update architecture docs
4. Begin Phase 1 implementation

**QUESTION FOR PRODUCT TEAM:**
- Should customers be able to customize BEFORE or AFTER receiving the intake link?
  - **Option A**: Admin creates service → generates link → customer customizes when filling form
  - **Option B**: Admin creates service → customer requests customizations first → then fills form
  
Current implementation assumes **Option A** (customize during form filling).
