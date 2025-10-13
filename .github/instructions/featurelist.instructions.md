---
applyTo: '**'
---
MCPForms • Copilot Instruction Pack (MVP Close-Out)
Goal: finish MVP by implementing the remaining features in a way that is:
minimal change to existing architecture (Next.js 14 + TS + Firebase + docxtemplater),
fully UI-testable via Playwright,
gated by explicit exit criteria (below),
protected against AI hallucinations and regressions.
Do not refactor stable, working flows unless required to meet an exit criterion.
0) Scope (only build what’s left)
Focus only on these features (IDs match the tracker table):
#12 Prompt Library (Reusable Prompts) — In Progress
#13 AI Confidence / Preview Step — Not Started
#17 Empty & Error States — In Progress
#18 Basic Branding (Logo/Colors) — Not Started
#22 Audit Logging (Basic) — Not Started
#25 Email Notifications (Intake/Docs) — In Progress
#30 Playwright E2E Tests (Core Flow) — In Progress
#32 Usage Logs / Metrics — Not Started
All other MVP items are considered done and out of scope unless they break due to changes here.
1) Non-negotiable Exit Criteria (Definition of Done)
A feature is not done until its exit criteria pass locally and in CI. Copilot must generate code and tests to satisfy each.
ID	Feature	Exit Criteria
12	Prompt Library	User can save a prompt, it persists across reloads, and can be reused in a new service. Playwright test covers save→reload→reuse.
13	AI Confidence / Preview	Generated text appears in a modal with confidence %, Accept and Regenerate. Accept inserts into doc context; Regenerate replaces preview. Playwright test asserts modal flow and insertion.
17	Empty & Error States	Each main view (Templates, Services, Intakes) shows a friendly empty state and a recoverable error state (retry CTA). Playwright screenshots validated.
18	Basic Branding	Admin can upload logo and choose an accent color. Branding applied to public intake and outbound emails. Playwright verifies brand CSS var on intake and presence of logo.
22	Audit Logging	Each intake submission and document generation creates a log entry with timestamp, userId/serviceId, type. A simple Activity Log page shows the latest 50 entries. Playwright checks new log appears after action.
25	Email Notifications	Automatic email on intake submission and doc generation (stub to dev mailbox or console in dev). ≥95% delivery in test env; Playwright checks “notification sent” event in UI activity panel.
30	Playwright E2E	Automated test covers Upload → Extract → Send → Submit → Generate → Download and new features above; overall ≥70% pass in CI.
32	Usage Logs / Metrics	Every document generation increments per-user daily counter; simple Usage widget displays counts. Playwright asserts counter increments after generation.
2) Architecture Guardrails (no major rework)
Keep Next.js 14 pages/routes and Firebase (Auth/Firestore/Storage/Functions).
New UI: build as small components in existing pages; prefer feature flags for new modals or panels.
Data:
userSettings/{uid} → add branding.logoUrl, branding.accentColor, prompts[].
activityLogs/{id} → { type: 'intake_submitted'|'doc_generated'|'email_sent', ts, userId, serviceId? }.
usageDaily/{uid}/{yyyy-mm-dd} → { docGeneratedCount }.
Do not change existing collections’ core shapes.
Email: in dev, route to a single DEV_MAILBOX (env) or log to activityLogs + console; in prod, wire the current provider (keep secrets in .env).
3) Hallucination Controls (AI Safety)
Strictly apply for #13:
Show confidence % (if model doesn’t return natively, compute proxy using classifier or heuristic).
Default temperature ≤ 0.3 for legal text.
Never auto-insert AI text: preview first; require explicit Accept.
Store prompt, model, raw response, and user edits alongside the service for traceability.
Display a subtle “AI-generated—review required” badge until approved.
Playwright must validate: modal presence, confidence badge exists, Accept inserts, Regenerate changes content.
4) Regression Safeguards
Feature flags: aiPreviewModal, promptLibrary, brandingBasic, auditLog, notifAuto, usageMetrics.
Snapshot tests (Playwright screenshot assertions) for:
Empty states (Templates, Services, Intakes),
Branding on intake page,
AI preview modal.
Do not modify core working APIs unless absolutely necessary. If changed, add compatibility shim.
Add integration test for “old” happy path to ensure no disruption.
5) Multi-Agent Work Plan
Assign or simulate with Copilot agents. Keep PRs small (one feature per PR).
Agent A — UX & Frontend
Build AI Preview Modal (ID 13), Branding UI (ID 18), Empty/Error states (ID 17), Prompt Library UI (ID 12).
Add Activity Log page (ID 22) and Usage Widget (ID 32).
Expose flags in a simple Admin → Labs panel (checkbox toggles stored in local storage for dev).
Agent B — Backend (Cloud Functions) & Firestore
Create write helpers for activityLogs and usageDaily (IDs 22, 32).
Implement email triggers (ID 25) on intakeSubmissions and docGenerations.
Add branding read-through for intake/public email renderers.
Agent C — AI Orchestration
Implement confidence scoring and low-temp generation profile (ID 13).
Persist prompt/response/edit audit blob on Accept.
Finalize Prompt Library persistence (ID 12).
Agent D — QA / Playwright
Author E2E specs for each exit criterion (IDs 12, 13, 17, 18, 22, 25, 30, 32).
Add screenshot snapshots for empty/error/branding.
Add flaky retry only for network-bound steps; otherwise fail fast.
Agent E — Security & DevEx
Verify Firestore rules for new collections (activityLogs, usageDaily, userSettings.branding).
Ensure secrets in .env, never in client bundle.
Add a PR template and checklist (below).
6) UI Acceptance Tests (Gherkin-style)
ID 13 – AI Confidence / Preview
Given I am on a Service detail page
When I click "Generate AI Section"
Then a modal opens showing generated text and a confidence percentage
When I click "Regenerate"
Then the text updates and the confidence is shown again
When I click "Accept"
Then the section is inserted into the document context and the modal closes
ID 12 – Prompt Library
Given I open AI Prompts panel
When I enter a prompt and click "Save Prompt"
Then it appears in "Saved Prompts"
And after I reload the page
Then it still appears
When I start a new Service
Then I can insert that saved prompt into AI generation
ID 17 – Empty/Error States
Given there are no Templates/Services/Intakes (seeded state)
Then I see a friendly empty state with a CTA button
When an API call fails (mock 500)
Then I see an error state with a "Retry" button that retries the call
ID 18 – Basic Branding
Given I upload a logo and choose an accent color
Then the Admin UI shows a preview
When I open the public intake form
Then I see the logo rendered and CSS variables reflect the accent color
ID 22 – Audit Logging
When I submit an intake and generate a document
Then the Activity Log shows two new entries with correct type, timestamp, and user
ID 25 – Email Notifications
When an intake is submitted and a document is generated
Then a "notification sent" log entry appears
And (in dev) I can see a placeholder delivery confirmation in the Activity Log
ID 32 – Usage Metrics
When I generate a document
Then my daily docGeneratedCount increments by 1
And the Usage widget shows the updated count
ID 30 – E2E Core Flow
Upload → Extract → Send Link → Public Submit → Approve → Generate → Download succeeds
7) Implementation Notes
Branding (ID 18):
Store branding.logoUrl (Storage path) and branding.accentColor (hex or HSL) under userSettings/{uid}.
Use CSS variables: --brand-accent applied to buttons/links on intake.
Intake SSR route reads settings; fallback to defaults if missing.
AI Preview (ID 13):
Modal component with three states: loading, preview, accepted.
Show read-only prompt (collapsible) and model id for transparency.
Block “Accept” if content empty; “Regenerate” replaces content.
Prompt Library (ID 12):
userSettings/{uid}.prompts[] = { id, title, body, createdAt }
Simple list with “Insert” button feeds the AI request.
Audit Log (ID 22):
activityLogs/{id} = { type, ts, userId, serviceId?, meta? }
Add a lightweight page at /admin/activity with table + filters.
Usage Metrics (ID 32):
Cloud Function increments usageDaily/{uid}/{yyyy-mm-dd}.docGeneratedCount on successful generation.
Email (ID 25):
In dev: write { type:'email_sent', template:'intake_submitted'|'doc_ready' } to activityLogs and console.log.
In prod: use existing provider; same log entry for UI observability.
8) PR Template (paste into .github/pull_request_template.md)
## Summary
<what changed>

## Feature ID(s)
- #12 / #13 / #17 / #18 / #22 / #25 / #30 / #32 (pick)

## Exit Criteria Verification
- [ ] Meets explicit exit criteria listed in instruction pack (describe proof)
- [ ] Playwright tests added/updated and passing locally
- [ ] Screenshots for empty/error/branding (if applicable)

## Safety & Regressions
- [ ] Feature flag added and default off in prod
- [ ] No secrets in client bundle (.env verified)
- [ ] E2E baseline (Upload→Generate→Download) still passes

## Data
- [ ] Firestore rules updated for new collections/fields
- [ ] Backfill/migration not required OR script provided

## Docs
- [ ] README/ADMIN notes updated (how to use the feature)
9) Test Suite Checklist (Playwright)
e2e/core-flow.spec.ts — unchanged baseline should still pass.
e2e/ai-preview.spec.ts — modal + accept/regenerate + confidence.
e2e/prompt-library.spec.ts — save→reload→reuse.
e2e/empty-error-states.spec.ts — per view with screenshot snapshots.
e2e/branding.spec.ts — logo + accent on intake.
e2e/audit-logs.spec.ts — entries after actions.
e2e/notifications.spec.ts — notification-sent log displayed.
e2e/usage-metrics.spec.ts — counter increments.
Target: ≥70% passing in CI with these additions.
10) Rollout Plan
Ship behind flags → verify in staging.
Run E2E in CI on each PR + nightly.
Flip flags progressively: aiPreviewModal first, then promptLibrary, auditLog, brandingBasic, usageMetrics, notifAuto.
Watch activityLogs volume and error rates for 48 hours before fully enabling in prod.
11) Non-Goals
New pricing/billing, collaboration roles, or heavy refactors.
Changing collection names or core document shapes.
Replacing docxtemplater or Firebase stack.