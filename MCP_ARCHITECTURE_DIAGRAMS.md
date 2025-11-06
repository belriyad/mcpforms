# MCP Server Integration Architecture Diagrams

## 1. Complete Integration Stack

```
┌─────────────────────────────────────────────────────────────────────┐
│                         MCPForms Platform                            │
│                    (Production Environment)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Admin      │  │   Public     │  │   Settings   │              │
│  │   Dashboard  │  │   Intake     │  │   & Labs     │              │
│  │   (Main Ops) │  │   Portal     │  │   (Config)   │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                  │                  │                     │
│         └──────────────────┼──────────────────┘                     │
│                            │                                        │
│         ┌──────────────────▼──────────────────┐                    │
│         │    Next.js 14 Application           │                    │
│         │  (React Components + API Routes)    │                    │
│         └──────────────────┬──────────────────┘                    │
│                            │                                        │
└────────────────────────────┼────────────────────────────────────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
            ▼                ▼                ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │  Firestore   │  │    Cloud     │  │   Cloud      │
    │  Database    │  │   Storage    │  │   Functions  │
    │  (Realtime)  │  │  (Docs & Tmpl)   (Processing)  │
    └──────────────┘  └──────────────┘  └──────────────┘
            │                │                │
            └────────────────┼────────────────┘
                             │
        ┌────────────────────▼────────────────────┐
        │   Google Cloud Platform (Firebase)      │
        └─────────────────────────────────────────┘
            │
            │ HTTP/gRPC
            │
        ┌───▼─────────────────────────────────────┐
        │  MCP Playwright Server (@playwright/mcp) │
        │  (Test & Validation Layer)               │
        └───┬─────────────────────────────────────┘
            │
    ┌───────┼───────┬─────────┐
    │       │       │         │
    ▼       ▼       ▼         ▼
┌────┐ ┌────┐ ┌────┐ ┌────────────┐
│ UI │ │API │ │E2E │ │ Advanced   │
│Tests│ │ Tests│ │Tests│ │  Scenario  │
│    │ │    │ │    │ │  Tests     │
└────┘ └────┘ └────┘ └────────────┘
```

---

## 2. Detailed MCP Test Execution Flow

```
Developer/CI Pipeline
    │
    └─→ npm run test:mcp
         │
         └─→ MCP Playwright Server starts
              │
              ├─→ Load mcp-playwright.config.json
              ├─→ Initialize test fixtures (mcp-test-utils.ts)
              └─→ Launch browsers (Chromium, Firefox, WebKit)
                  │
                  ├─────────────┬─────────────┬──────────────┐
                  │             │             │              │
                  ▼             ▼             ▼              ▼
          ┌──────────────┐ ┌──────────┐ ┌────────────┐ ┌──────────────┐
          │ Firebase     │ │ API      │ │ UI         │ │ Advanced     │
          │ Integration  │ │ Integration  Component  │ │ Scenarios    │
          │ Tests        │ │ Tests    │ │ Tests      │ │ Tests        │
          └──────┬───────┘ └────┬─────┘ └────┬───────┘ └──────┬───────┘
                 │              │            │                │
                 ├──────────────┼────────────┼────────────────┘
                 │              │            │
                 └──────────────┴────────────┴─→ MCP Analysis & Reporting
                                    │
                                    ▼
                           ┌─────────────────┐
                           │ Test Report     │
                           │ • Pass/Fail     │
                           │ • Coverage      │
                           │ • Performance   │
                           │ • Accessibility │
                           └─────────────────┘
```

---

## 3. Admin Operations to MCP Integration

```
ADMIN USER WORKFLOW → MCP TEST COVERAGE

┌─────────────────────────────────────────────────────────┐
│ 1. LOGIN to Admin Dashboard                             │
│    └→ Route: /admin                                     │
│       └→ MCP: firebaseAuth.login()                      │
│          └→ Tests: All MCP tests require auth           │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│ 2. UPLOAD TEMPLATE                                      │
│    └→ Route: /admin/templates                          │
│       └→ Cloud Function: uploadTemplateAndParse        │
│          └→ MCP: templateHelpers.uploadTemplate()      │
│             └→ Test: mcp-template-upload.spec.ts       │
│                └→ Validates: File parsing, AI extract  │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│ 3. CREATE SERVICE                                       │
│    └→ Route: /admin/services/create                    │
│       └→ Cloud Function: createServiceRequest          │
│          └→ MCP: serviceHelpers.createService()        │
│             └→ Test: mcp-service-creation.spec.ts      │
│                └→ Validates: Service config, templates │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│ 4. GENERATE INTAKE LINK                                 │
│    └→ Route: /admin/services/[serviceId]              │
│       └→ Cloud Function: generateIntakeLink            │
│          └→ MCP: intakeHelpers.generateIntakeLink()    │
│             └→ Test: mcp-intake-creation.spec.ts       │
│                └→ Validates: Link generation, access   │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│ 5. REVIEW INTAKES                                       │
│    └→ Route: /admin/intakes                            │
│       └→ Firestore Query: listIntakes()                │
│          └→ MCP: Verify intake status changes          │
│             └→ Test: Advanced scenario testing          │
│                └→ Validates: Status transitions        │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│ 6. GENERATE DOCUMENTS                                   │
│    └→ Route: /admin/services/[serviceId]/documents    │
│       └→ Cloud Function: generateDocumentsWithAI       │
│          └→ MCP: Monitor generation pipeline           │
│             └→ Test: mcp-advanced-scenarios.spec.ts    │
│                └→ Validates: AI text, formatting       │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│ 7. DOWNLOAD DOCUMENTS                                   │
│    └→ Route: /api/documents/download                   │
│       └→ Cloud Function: downloadDocument              │
│          └→ MCP: Validate file delivery                │
│             └→ Test: mcp-api-integration.spec.ts       │
│                └→ Validates: File integrity, access    │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Public Portal to MCP Integration

```
CLIENT USER WORKFLOW → MCP TEST COVERAGE

┌────────────────────────────────────────┐
│ 1. RECEIVE INTAKE LINK                 │
│    └→ Email: intakeUrl                │
│       └→ MCP: Test link format        │
└────────────────────────────────────────┘
            │
            ▼
┌────────────────────────────────────────┐
│ 2. ACCESS INTAKE FORM                  │
│    └→ Route: /intake/[token]          │
│       └→ API: GET /intake/:token      │
│          └→ MCP: intakeHelpers       │
│             └→ Test: mcp-client-     │
│                intake.spec.ts         │
└────────────────────────────────────────┘
            │
            ▼
┌────────────────────────────────────────┐
│ 3. FILL FORM                           │
│    └→ Route: /intake/[token]          │
│       └→ MCP: fillIntakeForm()        │
│          └→ Form validation           │
│             └→ Auto-save testing      │
└────────────────────────────────────────┘
            │
            ▼
┌────────────────────────────────────────┐
│ 4. ADD CUSTOMIZATIONS (Optional)       │
│    └→ Custom fields + clauses         │
│       └→ MCP: Validate structure      │
│          └→ Test: Advanced scenarios  │
└────────────────────────────────────────┘
            │
            ▼
┌────────────────────────────────────────┐
│ 5. SUBMIT INTAKE                       │
│    └→ Route: /intake/[token]/submit   │
│       └→ Cloud Function: submitIntake │
│          └→ Updates service status    │
│             └→ Triggers generation    │
│                └→ MCP: Validate all   │
└────────────────────────────────────────┘
            │
            ▼
┌────────────────────────────────────────┐
│ 6. DOCUMENT GENERATED                  │
│    └→ Email: Download link            │
│       └→ Firestore updated            │
│          └→ MCP: Verify generation    │
└────────────────────────────────────────┘
            │
            ▼
┌────────────────────────────────────────┐
│ 7. DOWNLOAD DOCUMENT                   │
│    └→ Route: /api/documents/download  │
│       └→ Cloud Function: download     │
│          └→ MCP: Verify file integrity│
└────────────────────────────────────────┘
```

---

## 5. Cloud Functions Integration Map

```
CLOUD FUNCTIONS → MCP TEST INTEGRATION

1st GEN FUNCTIONS (HTTP/Express):
├── uploadTemplateAndParse()
│   └→ MCP: mcp-firebase-integration.spec.ts
│   └→ Test: Template upload & parsing
├── createServiceRequest()
│   └→ MCP: mcp-service-creation.spec.ts
│   └→ Test: Service CRUD
├── generateIntakeLink()
│   └→ MCP: mcp-intake-creation.spec.ts
│   └→ Test: Link generation
├── intakeFormAPI()
│   └→ MCP: mcp-client-intake.spec.ts
│   └→ Test: Public portal API
└── generateDocumentsWithAI()
    └→ MCP: mcp-advanced-scenarios.spec.ts
    └→ Test: Doc generation

2nd GEN FUNCTIONS (Cloud Run SSR):
└── firebase-frameworks-formgenai-4545:ssrformgenai4545()
    └→ MCP: mcp-ui-components.spec.ts
    └→ Test: Next.js SSR & routing

TRIGGERED FUNCTIONS (Firestore):
├── onIntakeStatusChange()
│   └→ MCP: Verify status transitions
├── onTemplateUploaded()
│   └→ MCP: Verify processing pipeline
└── onServiceCreated()
    └→ MCP: Verify initialization
```

---

## 6. MCP Test Fixture Hierarchy

```
┌─────────────────────────────────────────────────────┐
│       Base Playwright Test (@playwright/test)       │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│      Extended Test (from mcp-test-utils.ts)         │
│                                                     │
│   Provides enhanced fixtures for MCP testing       │
└──────────────────┬──────────────────────────────────┘
                   │
       ┌───────────┼───────────┬─────────────┐
       │           │           │             │
       ▼           ▼           ▼             ▼
   ┌────────┐ ┌────────┐ ┌────────────┐ ┌──────────┐
   │ mcpPage │ │Firebase │ │ Template   │ │ Service  │
   │        │ │ Auth   │ │ Helpers    │ │ Helpers  │
   └────────┘ └────────┘ └────────────┘ └──────────┘
       │           │           │             │
       └───────────┴───────────┴─────────────┘
                   │
                   ▼
       ┌──────────────────────────┐
       │ Intake Helpers           │
       │ - generateIntakeLink     │
       │ - fillIntakeForm         │
       │ - submitIntake           │
       └──────────────────────────┘
                   │
                   ▼
       ┌──────────────────────────────────────┐
       │ MCPPlaywrightUtils (Static Methods)  │
       │ - capturePageState()                 │
       │ - mockFirebaseFunction()             │
       │ - checkAccessibility()               │
       │ - measurePerformance()               │
       └──────────────────────────────────────┘
```

---

## 7. Test Execution Pipeline (CI/CD Integration)

```
Git Commit
    │
    ├─→ Pre-commit Hooks
    │   └─→ Lint TypeScript
    │
    └─→ Push to GitHub
         │
         └─→ GitHub Actions Workflow
              │
              ├─→ Install Dependencies
              │   └─→ npm ci
              │
              ├─→ Build Application
              │   └─→ npm run build
              │
              ├─→ Run MCP Tests (Parallel)
              │   ├─→ Firebase Integration Tests
              │   ├─→ API Integration Tests
              │   ├─→ UI Component Tests
              │   └─→ Advanced Scenario Tests
              │
              ├─→ Generate Reports
              │   ├─→ Coverage Report
              │   ├─→ Performance Metrics
              │   └─→ Accessibility Report
              │
              ├─→ Production Validation (if main branch)
              │   └─→ npm run test:mcp:production
              │
              └─→ Deploy (if all tests pass)
                  ├─→ npm run build
                  └─→ firebase deploy --only hosting,functions
```

---

## 8. MCP Data Flow - Template Upload Example

```
USER ACTION: Click "Upload Template"
    │
    ▼
BROWSER EVENT: File input change
    │
    └─→ page.locator('input[type="file"]').setInputFiles(path)
    │
    ▼
FRONTEND: FormData + POST request
    │
    └─→ POST /api/services/upload-template
    │
    ▼
API ROUTE: /api/services/upload-template/route.ts
    │
    └─→ validateFile()
    └─→ uploadToStorage()
    └─→ callCloudFunction()
    │
    ▼
CLOUD FUNCTION: uploadTemplateAndParse
    │
    ├─→ Parse DOCX with docxtemplater
    ├─→ Extract placeholders
    ├─→ Call OpenAI API (suggestPlaceholdersAI)
    ├─→ Save metadata to Firestore
    └─→ Return: { templateId, status, placeholders }
    │
    ▼
FIRESTORE: templates/{templateId}
    │
    ├─→ Document created with:
    │   ├─ name, size, contentType
    │   ├─ placeholders[], status
    │   ├─ createdAt, uploadedBy
    │   └─ aiMetadata
    │
    └─→ Triggers onTemplateUploaded()
    │
    ▼
MCP TEST: Validates entire flow
    │
    ├─→ Mock function call
    ├─→ Verify file upload
    ├─→ Check Firestore write
    ├─→ Validate placeholder extraction
    └─→ Assert UI update
```

---

## 9. MCP Integration Points Summary

```
┌──────────────────────────────────────────────────────────┐
│                   INTEGRATION MATRIX                      │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ LAYER 1: Frontend (React Components)                     │
│   └─→ MCP Tests: mcp-ui-components.spec.ts              │
│                                                           │
│ LAYER 2: API Routes (Next.js)                            │
│   └─→ MCP Tests: mcp-api-integration.spec.ts            │
│                                                           │
│ LAYER 3: Cloud Functions (GCP)                           │
│   └─→ MCP Tests: mcp-firebase-integration.spec.ts       │
│                                                           │
│ LAYER 4: Database (Firestore)                            │
│   └─→ MCP Tests: All specs verify data                  │
│                                                           │
│ LAYER 5: Storage (Cloud Storage)                         │
│   └─→ MCP Tests: File integrity validation              │
│                                                           │
│ LAYER 6: Business Logic (Workflows)                      │
│   └─→ MCP Tests: mcp-advanced-scenarios.spec.ts         │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

## 10. MCP Feature Flags & Configuration

```
Testing Configuration Hierarchy:

┌────────────────────────────────────┐
│ playwright.config.ts               │
│ (Base Playwright config)            │
└────────────┬───────────────────────┘
             │
             ▼
┌────────────────────────────────────┐
│ mcp-playwright.config.json          │
│ (MCP server configuration)          │
│ • mcpServers.playwright             │
│ • testPatterns (ui/api/e2e)        │
│ • baseConfig (timeout, retries)    │
│ • selectors (testid mapping)       │
└────────────┬───────────────────────┘
             │
             ▼
┌────────────────────────────────────┐
│ Environment Variables              │
│ • PLAYWRIGHT_CONFIG                │
│ • PLAYWRIGHT_PROJECT               │
│ • TEST_BASE_URL                    │
│ • FIREBASE_PROJECT_ID              │
│ • MCP_SERVER_PORT                  │
└────────────────────────────────────┘
```

---

## Summary

The **MCP Server integration** in MCPForms provides:

✅ **Comprehensive testing** across all application layers  
✅ **Automated validation** of business workflows  
✅ **Firebase Functions monitoring** in real-time  
✅ **UI/UX verification** with accessibility checks  
✅ **Performance tracking** and optimization  
✅ **Production readiness** assurance  
✅ **CI/CD pipeline integration** for continuous validation  

All integration points are documented, tested, and ready for production deployment.
