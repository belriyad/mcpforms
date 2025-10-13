# MCPForms MVP Close-Out - Complete Task List

**Based on:** `.github/instructions/featurelist.instructions.md`  
**Date:** October 13, 2025  
**Goal:** Complete remaining 8 MVP features with minimal architectural changes

---

## 📊 Overview

### Completion Status
- ✅ **Done**: Core features (Auth, Templates, Services, Intake, Document Generation, AI Sections)
- 🔨 **To Do**: 8 features (#12, #13, #17, #18, #22, #25, #30, #32)
- 🎯 **Target**: ≥70% E2E test pass rate in CI

### Architecture Constraints
- ✅ Keep Next.js 14 + TypeScript + Firebase + docxtemplater
- ✅ No major refactoring of stable flows
- ✅ All features behind feature flags
- ✅ Exit criteria-driven development

---

## 🏗️ Phase 0: Foundation (Days 1-2)

### Task 0.1: Feature Flags System
**Priority:** Critical | **Agent:** E (Security & DevEx) | **Time:** 4 hours

**Subtasks:**
- [ ] Create `src/lib/feature-flags.ts`
  ```typescript
  export const featureFlags = {
    aiPreviewModal: false,
    promptLibrary: false,
    brandingBasic: false,
    auditLog: false,
    notifAuto: false,
    usageMetrics: false,
  }
  ```
- [ ] Create `src/hooks/useFeatureFlag.ts` hook
- [ ] Add localStorage toggle system for dev mode
- [ ] Create `/admin/labs` page with feature flag checkboxes
- [ ] Add server-side flag check helper
- [ ] Test: Toggle flag → Feature shows/hides

**Exit Criteria:**
- ✅ Flags stored in localStorage
- ✅ UI toggles work
- ✅ Features respect flag state

---

### Task 0.2: Firestore Schema Updates
**Priority:** Critical | **Agent:** E (Security & DevEx) | **Time:** 3 hours

**Subtasks:**
- [ ] Update `firestore.rules` with new collections:
  ```
  // Activity Logs
  match /activityLogs/{logId} {
    allow read: if isAuthenticated();
    allow create: if isLawyerOrAdmin();
  }
  
  // Usage Metrics
  match /usageDaily/{uid}/{date} {
    allow read, write: if isOwner(uid);
  }
  
  // User Settings - Branding
  match /userSettings/{userId} {
    allow read, write: if isOwner(userId);
  }
  ```
- [ ] Add Firestore indexes:
  - `activityLogs`: timestamp (desc)
  - `usageDaily`: userId + date (desc)
- [ ] Deploy rules: `firebase deploy --only firestore:rules`
- [ ] Verify in Firebase Console

**Exit Criteria:**
- ✅ Rules deployed without errors
- ✅ Test write to new collections succeeds
- ✅ Unauthorized access blocked

---

### Task 0.3: PR Template & Git Setup
**Priority:** Medium | **Agent:** E (Security & DevEx) | **Time:** 1 hour

**Subtasks:**
- [ ] Create `.github/pull_request_template.md` (from instructions)
- [ ] Add sections:
  - Summary
  - Feature ID(s)
  - Exit Criteria Verification
  - Safety & Regressions
  - Data (Firestore changes)
  - Docs
- [ ] Create `.github/CODEOWNERS` (optional)
- [ ] Update `.github/workflows/` for CI tests (if needed)

**Exit Criteria:**
- ✅ PR template appears on new PRs
- ✅ Checklist enforces exit criteria review

---

## 🏗️ Phase 1: Backend Infrastructure (Days 3-5)

### Feature #22: Audit Logging (Basic)
**Priority:** High | **Agents:** B (Backend) + A (Frontend) | **Time:** 8 hours

#### Task 22.1: Audit Log Infrastructure
**Agent B** | **Time:** 3 hours

**Subtasks:**
- [ ] Create `src/lib/audit-log.ts`
- [ ] Define types:
  ```typescript
  type ActivityLog = {
    id: string;
    type: 'intake_submitted' | 'doc_generated' | 'email_sent';
    timestamp: Timestamp;
    userId: string;
    serviceId?: string;
    meta?: Record<string, any>;
  }
  ```
- [ ] Create function: `writeActivityLog(log: Omit<ActivityLog, 'id'>)`
- [ ] Test: Write log → Verify in Firestore

#### Task 22.2: Activity Log Page
**Agent A** | **Time:** 3 hours

**Subtasks:**
- [ ] Create `/admin/activity/page.tsx`
- [ ] Build table with columns: Type | Timestamp | User | Service | Details
- [ ] Add real-time Firestore listener (latest 50 entries)
- [ ] Add filter dropdown: All, Intake Submitted, Doc Generated, Email Sent
- [ ] Add date range filter (optional)
- [ ] Add loading state
- [ ] Add empty state: "No activity yet"

#### Task 22.3: Integration Points
**Agent B** | **Time:** 2 hours

**Subtasks:**
- [ ] Hook into `/api/intake/submit/[token]/route.ts`
  - Add: `await writeActivityLog({ type: 'intake_submitted', ... })`
- [ ] Hook into `/api/services/generate-documents/route.ts`
  - Add: `await writeActivityLog({ type: 'doc_generated', ... })`
- [ ] Hook into email trigger (when Task 25 is done)

**Exit Criteria:**
- ✅ Submit intake → New log appears in Activity page
- ✅ Generate document → New log appears
- ✅ Playwright test: `e2e/audit-logs.spec.ts` passes

---

### Feature #32: Usage Logs / Metrics
**Priority:** Medium | **Agents:** B (Backend) + A (Frontend) | **Time:** 6 hours

#### Task 32.1: Usage Counter System
**Agent B** | **Time:** 3 hours

**Subtasks:**
- [ ] Create `src/lib/usage-metrics.ts`
- [ ] Define types:
  ```typescript
  type UsageDaily = {
    date: string; // 'yyyy-mm-dd'
    userId: string;
    docGeneratedCount: number;
  }
  ```
- [ ] Create function: `incrementDocGeneration(userId: string)`
  - Use `FieldValue.increment(1)` for atomic counter
  - Document path: `usageDaily/{userId}/{yyyy-mm-dd}`
- [ ] Test: Call function → Verify counter increments

#### Task 32.2: Usage Widget UI
**Agent A** | **Time:** 2 hours

**Subtasks:**
- [ ] Create `src/components/admin/UsageWidget.tsx`
- [ ] Display today's doc generation count
- [ ] Display last 7 days total (optional)
- [ ] Add to Dashboard (`/admin/page.tsx`)
- [ ] Add loading skeleton
- [ ] Add error state

#### Task 32.3: Integration
**Agent B** | **Time:** 1 hour

**Subtasks:**
- [ ] Update `/api/services/generate-documents/route.ts`
- [ ] Call `await incrementDocGeneration(userId)` after successful generation
- [ ] Add before response is sent

**Exit Criteria:**
- ✅ Generate document → Usage widget increments by 1
- ✅ Counter persists across page reloads
- ✅ Playwright test: `e2e/usage-metrics.spec.ts` passes

---

### Feature #25: Email Notifications (Intake/Docs)
**Priority:** Medium | **Agents:** B (Backend) + A (Frontend) | **Time:** 10 hours

#### Task 25.1: Email Service Abstraction
**Agent B** | **Time:** 4 hours

**Subtasks:**
- [ ] Create `src/lib/email-service.ts`
- [ ] Define email templates:
  - `intake_submitted` - Notify admin
  - `doc_ready` - Notify client
- [ ] Implement dev mode:
  ```typescript
  if (process.env.NODE_ENV === 'development') {
    await writeActivityLog({ type: 'email_sent', ... });
    console.log('📧 Email:', { to, template, data });
    return { sent: true, logId: '...' };
  }
  ```
- [ ] Implement prod stub:
  - Read `EMAIL_PROVIDER_API_KEY` from env
  - Placeholder for actual provider integration
- [ ] Create function: `sendEmail(to, template, data)`

#### Task 25.2: Email Triggers
**Agent B** | **Time:** 2 hours

**Subtasks:**
- [ ] Hook into `/api/intake/submit/[token]/route.ts`
  - Call: `await sendEmail(adminEmail, 'intake_submitted', { serviceName, clientName })`
- [ ] Hook into `/api/services/generate-documents/route.ts`
  - Call: `await sendEmail(clientEmail, 'doc_ready', { documents })`
- [ ] Both write to `activityLogs` with `type: 'email_sent'`

#### Task 25.3: Email Templates (HTML)
**Agent A** | **Time:** 3 hours

**Subtasks:**
- [ ] Create `src/templates/email-intake-submitted.tsx`
  - Subject: "New Intake Form Submitted"
  - Body: Service name, client name, link to admin
- [ ] Create `src/templates/email-doc-ready.tsx`
  - Subject: "Your Documents are Ready"
  - Body: Document list, download links
- [ ] Include branding (logo + accent color) - depends on Task 18
- [ ] Test rendering in browser

#### Task 25.4: Activity Log Display
**Agent A** | **Time:** 1 hour

**Subtasks:**
- [ ] Update Activity Log page to show `email_sent` events
- [ ] Display: "Email sent to {recipient}" with template name

**Exit Criteria:**
- ✅ Submit intake → "Email sent" log appears
- ✅ Generate document → "Email sent" log appears
- ✅ Dev mode logs to console
- ✅ Playwright test: `e2e/notifications.spec.ts` passes

---

## 🤖 Phase 2: AI Features (Days 6-8)

### Feature #13: AI Confidence / Preview Step ⚠️ CRITICAL
**Priority:** Critical | **Agents:** C (AI) + A (Frontend) | **Time:** 12 hours

#### Task 13.1: AI Preview Modal Component
**Agent A** | **Time:** 4 hours

**Subtasks:**
- [ ] Create `src/components/admin/AIPreviewModal.tsx`
- [ ] Three states: `'loading' | 'preview' | 'accepted'`
- [ ] UI elements:
  - Loading spinner: "Generating AI content..."
  - Preview pane (read-only textarea with generated text)
  - Collapsible "Prompt Used" section
  - Confidence badge: "🎯 87% Confidence"
  - Model display: "Model: gpt-4o-mini"
  - Warning badge: "⚠️ AI-generated—review required"
  - Buttons:
    - "Accept" (primary, green)
    - "Regenerate" (secondary, blue)
    - "Cancel" (tertiary, gray)
- [ ] Disable "Accept" if content empty
- [ ] "Regenerate" calls API again, updates preview

#### Task 13.2: Backend Enhancement
**Agent C** | **Time:** 4 hours

**Subtasks:**
- [ ] Update `/api/services/generate-ai-section/route.ts`
- [ ] Set OpenAI parameters:
  ```typescript
  temperature: 0.3, // ≤ 0.3 for legal text
  max_tokens: 1000,
  ```
- [ ] Compute confidence score:
  - If model returns `logprobs`: use average
  - Otherwise: proxy heuristic
    ```typescript
    let confidence = 75; // baseline
    if (content.length > 50) confidence += 10;
    if (content.match(/\b(shall|hereby|agreement)\b/gi)) confidence += 5;
    confidence = Math.min(confidence, 95); // cap at 95%
    ```
- [ ] Return structured response:
  ```typescript
  {
    success: true,
    aiSection: {
      ...existing fields,
      confidence: number,
      model: string,
      prompt: string,
      rawResponse: any // for audit
    }
  }
  ```
- [ ] Don't auto-insert yet - return for preview

#### Task 13.3: Audit Trail Storage
**Agent C** | **Time:** 2 hours

**Subtasks:**
- [ ] Update AI section data structure:
  ```typescript
  aiSections[].audit = {
    prompt: string,
    model: string,
    rawResponse: any,
    confidence: number,
    userEdits?: string,
    acceptedAt?: Timestamp,
    acceptedBy?: string
  }
  ```
- [ ] Store on "Accept" button click
- [ ] Update service in Firestore with audit blob

#### Task 13.4: Integration
**Agent A** | **Time:** 2 hours

**Subtasks:**
- [ ] Update service detail page (`/admin/services/[serviceId]/page.tsx`)
- [ ] Replace direct API call with modal flow:
  1. Click "Generate AI Section" → Open `AIPreviewModal`
  2. Modal calls API, shows loading state
  3. On success, show preview with confidence
  4. On "Accept", insert into service, close modal
  5. On "Regenerate", call API again
- [ ] Show "AI-generated—review required" badge on inserted sections
- [ ] Badge disappears on manual approval (optional toggle)
- [ ] Wrap with feature flag: `if (flags.aiPreviewModal)`

**Exit Criteria:**
- ✅ Click "Generate" → Modal opens → Shows loading
- ✅ Preview appears with confidence % (e.g., "87%")
- ✅ Warning badge "AI-generated" visible
- ✅ "Regenerate" updates content
- ✅ "Accept" inserts into doc context, closes modal
- ✅ Audit blob saved in Firestore
- ✅ Playwright test: `e2e/ai-preview.spec.ts` passes

---

### Feature #12: Prompt Library (Reusable Prompts)
**Priority:** Medium | **Agents:** C (AI) + A (Frontend) | **Time:** 6 hours

#### Task 12.1: Firestore Schema
**Agent C** | **Time:** 1 hour

**Subtasks:**
- [ ] Update `userSettings/{uid}` to include:
  ```typescript
  prompts: Array<{
    id: string;
    title: string;
    body: string;
    createdAt: Timestamp;
  }>
  ```
- [ ] Create helper functions in `src/lib/prompt-library.ts`:
  - `savePrompt(userId, title, body)` → Add to array
  - `getPrompts(userId)` → Fetch array
  - `deletePrompt(userId, promptId)` → Remove from array

#### Task 12.2: Prompt Library UI
**Agent A** | **Time:** 3 hours

**Subtasks:**
- [ ] Create `src/components/admin/PromptLibrary.tsx`
- [ ] Build list view:
  - Card for each prompt with title + truncated body
  - "Insert" button (primary)
  - "Delete" button (icon, red)
- [ ] Add to AI modal or Settings page
- [ ] "Save Prompt" button in AI generation modal:
  - Opens dialog with title input
  - Saves current prompt to `userSettings.prompts[]`
  - Shows success toast

#### Task 12.3: Insert Functionality
**Agent A** | **Time:** 1 hour

**Subtasks:**
- [ ] In AI generation modal, add "Saved Prompts" dropdown above prompt textarea
- [ ] On select, populate textarea with prompt body
- [ ] Dropdown updates in real-time (Firestore listener)

#### Task 12.4: Persistence Test
**Agent D** | **Time:** 1 hour

**Subtasks:**
- [ ] Test save → Verify in Firestore
- [ ] Reload page → Verify prompt still appears
- [ ] Test insert → Verify textarea populates

**Exit Criteria:**
- ✅ Save prompt → Appears in list
- ✅ Reload page → Prompt still appears
- ✅ Start new service → Insert prompt → Populates textarea
- ✅ Playwright test: `e2e/prompt-library.spec.ts` passes

---

## 🎨 Phase 3: UX Polish (Days 9-11)

### Feature #17: Empty & Error States
**Priority:** Medium | **Agent:** A (Frontend) | **Time:** 8 hours

#### Task 17.1: Reusable Components
**Time:** 2 hours

**Subtasks:**
- [ ] Create `src/components/admin/EmptyState.tsx`
  ```tsx
  <EmptyState 
    icon={FileX}
    title="No templates yet"
    description="Upload your first template to get started"
    ctaLabel="Upload Template"
    onCtaClick={() => {}}
  />
  ```
- [ ] Create `src/components/admin/ErrorState.tsx`
  ```tsx
  <ErrorState 
    title="Failed to load templates"
    description="Something went wrong. Please try again."
    onRetry={() => {}}
  />
  ```
- [ ] Style: Center-aligned, friendly illustrations, clear CTA

#### Task 17.2: Add to Templates Page
**Time:** 1 hour

**Subtasks:**
- [ ] Update `/admin/templates/page.tsx`
- [ ] Show `<EmptyState>` when `templates.length === 0`
- [ ] CTA: "Upload Template" → Opens upload modal
- [ ] Add try-catch around Firestore query
- [ ] On error, show `<ErrorState>` with "Retry" button

#### Task 17.3: Add to Services Page
**Time:** 1 hour

**Subtasks:**
- [ ] Update `/admin/services/page.tsx`
- [ ] Show `<EmptyState>` when `services.length === 0`
- [ ] CTA: "Create Service" → Navigate to `/admin/services/create`
- [ ] Add error handling with retry

#### Task 17.4: Add to Intakes Page
**Time:** 1 hour

**Subtasks:**
- [ ] Update `/admin/intakes/page.tsx`
- [ ] Show `<EmptyState>` when `intakes.length === 0`
- [ ] CTA: "View Services" → Navigate to `/admin/services`
- [ ] Add error handling with retry

#### Task 17.5: Mock Error Testing
**Time:** 1 hour

**Subtasks:**
- [ ] Add feature flag: `mockApiError`
- [ ] When enabled, throw error in data fetch
- [ ] Verify error state renders
- [ ] Verify "Retry" button works

#### Task 17.6: E2E Tests with Screenshots
**Agent D** | **Time:** 2 hours

**Subtasks:**
- [ ] Create `e2e/empty-error-states.spec.ts`
- [ ] Test empty states:
  - Navigate to Templates with no data → Screenshot
  - Navigate to Services with no data → Screenshot
  - Navigate to Intakes with no data → Screenshot
- [ ] Test error states:
  - Enable `mockApiError` flag
  - Navigate to each page → Screenshot error state
  - Click "Retry" → Verify recovery
- [ ] Add snapshot assertions:
  ```typescript
  await expect(page).toHaveScreenshot('templates-empty.png');
  await expect(page).toHaveScreenshot('services-error.png');
  ```

**Exit Criteria:**
- ✅ Empty states show friendly UI with CTA
- ✅ Error states show with "Retry" button
- ✅ Screenshots validated in CI
- ✅ Playwright test passes

---

### Feature #18: Basic Branding (Logo/Colors)
**Priority:** Medium | **Agents:** A (Frontend) + B (Backend) | **Time:** 10 hours

#### Task 18.1: Firestore Schema
**Agent B** | **Time:** 1 hour

**Subtasks:**
- [ ] Update `userSettings/{uid}` to include:
  ```typescript
  branding: {
    logoUrl?: string; // Firebase Storage URL
    accentColor?: string; // Hex: "#6366f1"
  }
  ```
- [ ] Update Firestore rules (already done in Task 0.2)

#### Task 18.2: Branding Settings UI
**Agent A** | **Time:** 4 hours

**Subtasks:**
- [ ] Update `/admin/settings/page.tsx`
- [ ] Add "Branding" section:
  - Logo upload:
    ```tsx
    <input type="file" accept="image/*" onChange={handleLogoUpload} />
    ```
  - Upload to Firebase Storage: `branding/{userId}/logo.{ext}`
  - Save URL to `userSettings.branding.logoUrl`
  - Color picker:
    ```tsx
    <input type="color" value={accentColor} onChange={handleColorChange} />
    ```
  - Save to `userSettings.branding.accentColor`
- [ ] Add preview panel:
  - Show uploaded logo
  - Show color swatch
  - Example button with accent color
- [ ] Auto-save on change (debounced)

#### Task 18.3: Apply to Public Intake
**Agent B** | **Time:** 3 hours

**Subtasks:**
- [ ] Update `/intake/[token]/page.tsx` (SSR)
- [ ] Fetch service → Get `userId` → Fetch `userSettings.branding`
- [ ] Inject CSS variables:
  ```tsx
  <style>{`
    :root {
      --brand-accent: ${branding?.accentColor || '#6366f1'};
    }
  `}</style>
  ```
- [ ] Render logo in header:
  ```tsx
  {branding?.logoUrl && (
    <img src={branding.logoUrl} alt="Logo" className="h-12" />
  )}
  ```
- [ ] Apply `--brand-accent` to:
  - Buttons: `bg-[var(--brand-accent)]`
  - Links: `text-[var(--brand-accent)]`
  - Headings: `border-[var(--brand-accent)]`

#### Task 18.4: Apply to Emails
**Agent B** | **Time:** 1 hour

**Subtasks:**
- [ ] Update email templates (from Task 25.3)
- [ ] Include logo: `<img src="{logoUrl}" alt="Logo" style="height: 48px;" />`
- [ ] Apply accent color to header/footer

#### Task 18.5: E2E Test
**Agent D** | **Time:** 1 hour

**Subtasks:**
- [ ] Create `e2e/branding.spec.ts`
- [ ] Test: Upload logo → Verify preview shows
- [ ] Test: Choose accent color → Verify preview updates
- [ ] Test: Open public intake → Screenshot
- [ ] Test: Verify logo rendered
- [ ] Test: Check CSS variable applied:
  ```typescript
  const accentColor = await page.evaluate(() => {
    return getComputedStyle(document.documentElement)
      .getPropertyValue('--brand-accent');
  });
  expect(accentColor).toBe('#6366f1');
  ```

**Exit Criteria:**
- ✅ Admin can upload logo and choose color
- ✅ Preview shows changes
- ✅ Public intake shows logo and uses accent color
- ✅ Playwright test passes

---

## 🧪 Phase 4: Comprehensive Testing (Days 12-14)

### Feature #30: Playwright E2E Tests (Core Flow)
**Priority:** Critical | **Agent:** D (QA / Playwright) | **Time:** 16 hours

#### Task 30.1: Core Flow Baseline Test
**Time:** 4 hours

**Subtasks:**
- [ ] Create or update `e2e/core-flow.spec.ts`
- [ ] Test full happy path:
  1. Login as admin
  2. Upload template → AI extracts fields
  3. Create service → Select template → Send intake
  4. Switch to client mode (new context)
  5. Open intake form via token URL
  6. Fill form → Submit
  7. Switch back to admin
  8. Approve submission
  9. Generate documents
  10. Download document
  11. Verify DOCX file downloaded
- [ ] Add assertions at each step
- [ ] Take screenshots on failure

#### Task 30.2: AI Preview Test
**Time:** 2 hours

**Subtasks:**
- [ ] Create `e2e/ai-preview.spec.ts` (if not done in Task 13.4)
- [ ] Test modal flow (already defined in Task 13)
- [ ] Add visual regression test (screenshot comparison)

#### Task 30.3: Prompt Library Test
**Time:** 2 hours

**Subtasks:**
- [ ] Create `e2e/prompt-library.spec.ts` (if not done in Task 12.4)
- [ ] Test save → reload → reuse flow

#### Task 30.4: Empty/Error States Test
**Time:** 2 hours

**Subtasks:**
- [ ] Already defined in Task 17.6
- [ ] Ensure screenshot snapshots stored in repo

#### Task 30.5: Branding Test
**Time:** 2 hours

**Subtasks:**
- [ ] Already defined in Task 18.5

#### Task 30.6: Audit Logs Test
**Time:** 1 hour

**Subtasks:**
- [ ] Already defined in Task 22.4

#### Task 30.7: Notifications Test
**Time:** 1 hour

**Subtasks:**
- [ ] Already defined in Task 25.4

#### Task 30.8: Usage Metrics Test
**Time:** 1 hour

**Subtasks:**
- [ ] Already defined in Task 32.4

#### Task 30.9: CI Integration
**Time:** 1 hour

**Subtasks:**
- [ ] Update `.github/workflows/test.yml` (or create)
- [ ] Add Playwright test job:
  ```yaml
  - name: Run E2E Tests
    run: npx playwright test
  - name: Upload test results
    uses: actions/upload-artifact@v3
    with:
      name: playwright-report
      path: playwright-report/
  ```
- [ ] Set pass threshold: ≥70%

**Exit Criteria:**
- ✅ All 8 test files created
- ✅ Core flow (Upload → Generate → Download) passes
- ✅ ≥70% pass rate in local run
- ✅ CI runs tests on every PR
- ✅ Test report uploaded as artifact

---

## 📋 Summary Checklist

### By Feature ID

- [ ] **#12 Prompt Library**
  - [ ] Save prompt to Firestore
  - [ ] Prompts persist across reloads
  - [ ] Insert prompt into new service
  - [ ] Playwright test passes

- [ ] **#13 AI Confidence / Preview**
  - [ ] Modal with 3 states (loading, preview, accepted)
  - [ ] Confidence % displayed
  - [ ] Accept inserts content
  - [ ] Regenerate updates content
  - [ ] Temperature ≤ 0.3
  - [ ] Audit trail stored
  - [ ] Playwright test passes

- [ ] **#17 Empty & Error States**
  - [ ] Empty states in Templates, Services, Intakes
  - [ ] Error states with "Retry" CTA
  - [ ] Screenshot snapshots validated
  - [ ] Playwright test passes

- [ ] **#18 Basic Branding**
  - [ ] Upload logo in Settings
  - [ ] Choose accent color
  - [ ] Logo + color applied to intake
  - [ ] CSS variables work
  - [ ] Playwright test passes

- [ ] **#22 Audit Logging**
  - [ ] `activityLogs` collection created
  - [ ] Logs intake submissions
  - [ ] Logs document generations
  - [ ] Activity Log page shows entries
  - [ ] Playwright test passes

- [ ] **#25 Email Notifications**
  - [ ] Email on intake submission
  - [ ] Email on doc generation
  - [ ] Dev mode logs to console
  - [ ] "Email sent" appears in Activity Log
  - [ ] Playwright test passes

- [ ] **#30 E2E Tests**
  - [ ] Core flow test passes
  - [ ] All 8 feature tests created
  - [ ] ≥70% pass rate in CI
  - [ ] Screenshot snapshots stored

- [ ] **#32 Usage Metrics**
  - [ ] `usageDaily` collection created
  - [ ] Counter increments on doc generation
  - [ ] Usage widget displays count
  - [ ] Playwright test passes

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All feature flags default to `false` in prod
- [ ] Firestore rules deployed and tested
- [ ] Environment variables set (email, etc.)
- [ ] Tests passing in CI (≥70%)

### Deployment
- [ ] Run `npm run build` → No errors
- [ ] Deploy to staging: `firebase deploy --only hosting:staging`
- [ ] Smoke test in staging
- [ ] Deploy to prod: `firebase deploy --only hosting`

### Post-Deployment
- [ ] Flip feature flags one by one in production
- [ ] Monitor Activity Logs for errors
- [ ] Watch usage metrics
- [ ] Run E2E tests against production

### Rollout Order
1. **Day 1:** `auditLog`, `usageMetrics` (infrastructure, low risk)
2. **Day 2:** `aiPreviewModal` (high value, safety feature)
3. **Day 3:** `promptLibrary` (UX enhancement)
4. **Day 4:** `brandingBasic` (visual changes)
5. **Day 5:** `notifAuto` (external dependency)

---

## 📊 Time Estimates

| Phase | Features | Estimated Time |
|-------|----------|----------------|
| Phase 0: Foundation | Flags, Schema, Git | 8 hours (1 day) |
| Phase 1: Backend | #22, #32, #25 | 24 hours (3 days) |
| Phase 2: AI Features | #13, #12 | 18 hours (2.5 days) |
| Phase 3: UX Polish | #17, #18 | 18 hours (2.5 days) |
| Phase 4: Testing | #30 | 16 hours (2 days) |
| **Total** | **8 features** | **84 hours (~11 days)** |

### With Buffer (Recommended)
- **Development:** 11 days
- **Testing & QA:** 3 days
- **Total MVP Close-Out:** **14 days (2 weeks)**

---

## 📖 References

- **Instructions:** `.github/instructions/featurelist.instructions.md`
- **PR Template:** Use checklist from instructions
- **Exit Criteria:** Each feature has explicit pass conditions
- **Test Coverage:** ≥70% E2E pass rate

---

## ✅ Next Steps

**Option A: Start with Foundation**
```bash
# Begin with Task 0.1, 0.2, 0.3
# Estimated: 8 hours
```

**Option B: Start with Highest Priority**
```bash
# Begin with Feature #13 (AI Confidence)
# Reason: Safety-critical, blocks other features
# Estimated: 12 hours
```

**Option C: Start with Quick Wins**
```bash
# Begin with Feature #17 (Empty/Error States)
# Reason: Visual improvements, no backend changes
# Estimated: 8 hours
```

**Recommended:** Start with **Option A (Foundation)** to enable parallel development of features.

---

**Ready to begin? Which task should I start with?**
