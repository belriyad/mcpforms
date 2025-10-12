# Bug Fix: AI Section Not Working Properly

## Date
October 12, 2025

## Issues Reported

### Issue #1: AI Section Not Using OpenAI API Correctly
**Problem:** The AI-generated content is not contextually appropriate or legally correct.

**Root Cause:** The API route is receiving a combined string (`placeholder|prompt`) but treating it as just a prompt. The placeholder information is being lost, and the actual prompt may not be extracted properly.

### Issue #2: Generated AI Section Not Added to Final Document
**Problem:** Even when AI sections are generated, they don't appear in the final generated documents.

**Root Causes:**
1. The `aiSection` object doesn't have a `placeholder` field stored properly
2. The document generation code looks for `aiSection.placeholder` which doesn't exist
3. The placeholder matching logic in `generate-documents/route.ts` is incorrect

## Technical Analysis

### Current Data Flow

**Frontend (Service Page):**
```typescript
// User inputs:
// - Placeholder: "{{ai_liability_clause}}"
// - Prompt: "Generate a liability disclaimer..."

// Combines them with pipe separator:
setAiPrompt(`${placeholder}|${prompt}`)

// Sends to API:
{
  serviceId: "...",
  templateId: "...",
  prompt: "{{ai_liability_clause}}|Generate a liability disclaimer..."
}
```

**API Route (generate-ai-section/route.ts):**
```typescript
// ❌ PROBLEM: Treats entire string as prompt
const { serviceId, templateId, prompt } = body

// Sends entire string to OpenAI
const completion = await openai.chat.completions.create({
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: prompt }  // ← includes placeholder!
  ]
})

// ❌ PROBLEM: No placeholder field saved
const aiSection = {
  id: "...",
  templateId,
  prompt,  // ← full string with placeholder
  generatedContent,
  approved: false,
  createdAt: "..."
  // Missing: placeholder field!
}
```

**Document Generation (generate-documents/route.ts):**
```typescript
// ❌ PROBLEM: Looks for placeholder field that doesn't exist
if (aiSection.generatedContent && aiSection.placeholder) {
  aiSections[aiSection.placeholder.replace(/^ai_/, '')] = aiSection.generatedContent
}
// This never runs because aiSection.placeholder is undefined!
```

**Document Generator Library:**
```typescript
// Adds AI sections with prefix
if (aiSections) {
  Object.entries(aiSections).forEach(([key, value]) => {
    data[`ai_${key}`] = value ?? ''
  })
}
```

## Solution

### Fix #1: Parse Placeholder and Prompt Separately

**File:** `src/app/api/services/generate-ai-section/route.ts`

Extract placeholder and prompt from the combined string:

```typescript
const body = await request.json()
const { serviceId, templateId, prompt: combinedPrompt } = body

// Parse placeholder and actual prompt
const parts = combinedPrompt.split('|')
const placeholderRaw = parts[0]?.trim() || ''
const actualPrompt = parts[1]?.trim() || combinedPrompt.trim()

// Extract placeholder name (remove {{ }} if present)
const placeholder = placeholderRaw.replace(/^\{\{|\}\}$/g, '').trim()

if (!placeholder || !actualPrompt) {
  return NextResponse.json(
    { error: 'Missing placeholder or prompt' },
    { status: 400 }
  )
}

// Now use actualPrompt for OpenAI
const completion = await openai.chat.completions.create({
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: actualPrompt }  // ← Clean prompt only
  ]
})

// Save with separate fields
const aiSection = {
  id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  templateId,
  placeholder,  // ← ADD THIS
  prompt: actualPrompt,  // ← Clean prompt
  generatedContent,
  approved: false,
  createdAt: new Date().toISOString()
}
```

### Fix #2: Update Document Generation to Use Correct Placeholder

**File:** `src/app/api/services/generate-documents/route.ts`

The logic is close but needs minor adjustment:

```typescript
// Prepare AI sections - ALREADY CORRECT but needs data
const aiSections: Record<string, string> = {}
if (template.aiSections && template.aiSections.length > 0) {
  for (const aiSection of template.aiSections) {
    if (aiSection.generatedContent && aiSection.placeholder) {
      // Remove 'ai_' prefix if present in placeholder
      const cleanPlaceholder = aiSection.placeholder.replace(/^ai_/, '')
      aiSections[cleanPlaceholder] = aiSection.generatedContent
    }
  }
}
```

This part is actually correct! The issue is that `aiSection.placeholder` doesn't exist in the saved data.

### Fix #3: Enhanced System Prompt for Better Legal Content

**File:** `src/app/api/services/generate-ai-section/route.ts`

Improve the system prompt to generate more legally appropriate content:

```typescript
const systemPrompt = `You are an expert legal document assistant helping lawyers draft professional clauses and sections.

Context:
- Document Type: ${template.name}
- File: ${template.fileName}
- Service: ${serviceData.name}
- Client: ${serviceData.clientName}

Generate a professional, legally sound clause or section based on the lawyer's request.

IMPORTANT GUIDELINES:
1. Use formal legal language and proper terminology
2. Be precise and unambiguous in wording
3. Include appropriate legal qualifiers and disclaimers where needed
4. Structure the content with proper paragraphs or numbered points
5. Follow standard legal document formatting conventions
6. Make the content ready to insert directly into the document
7. Do NOT include explanations, comments, or notes - only the clause text
8. Do NOT include placeholder text or brackets
9. Use proper capitalization for legal terms (e.g., "Agreement", "Party", "Services")

The generated content should be complete and ready for immediate use in a professional legal document.`
```

## Changes Required

### 1. Update API Route

**File:** `src/app/api/services/generate-ai-section/route.ts`

- Parse `placeholder` and `prompt` from combined string
- Send only clean prompt to OpenAI
- Save `placeholder` field in aiSection object
- Improve system prompt for better legal content

### 2. No Changes Needed (But Verify)

**File:** `src/app/api/services/generate-documents/route.ts`

The logic is already correct - it just needs the data to be saved properly:
```typescript
if (aiSection.generatedContent && aiSection.placeholder) {
  const cleanPlaceholder = aiSection.placeholder.replace(/^ai_/, '')
  aiSections[cleanPlaceholder] = aiSection.generatedContent
}
```

**File:** `src/lib/document-generator.ts`

Also already correct:
```typescript
if (aiSections) {
  Object.entries(aiSections).forEach(([key, value]) => {
    data[`ai_${key}`] = value ?? ''
  })
}
```

### 3. Frontend Already Correct

**File:** `src/app/admin/services/[serviceId]/page.tsx`

The frontend properly combines placeholder and prompt with `|` separator.

## Testing Instructions

### Test #1: Verify Placeholder Parsing
1. Go to service detail page
2. Click "Add AI Section" on a template
3. Enter placeholder: `{{ai_liability_clause}}`
4. Enter prompt: `"Generate a liability disclaimer for consulting services"`
5. Open browser console (F12)
6. Click "Generate AI Section"
7. Check console logs - should show separated placeholder and prompt

### Test #2: Verify AI Content Quality
1. After generating, check the `aiSections` array in Firestore
2. Verify it has these fields:
   ```javascript
   {
     id: "ai_...",
     templateId: "...",
     placeholder: "ai_liability_clause",  // ← Should be present
     prompt: "Generate a liability...",   // ← Should be clean
     generatedContent: "...",             // ← Should be legal text
     approved: false,
     createdAt: "..."
   }
   ```

### Test #3: Verify Document Generation
1. Submit intake form for the service
2. Generate documents
3. Download the document
4. Open in Word
5. Verify the `{{ai_liability_clause}}` placeholder is replaced with generated content
6. Content should be properly formatted legal text

### Expected Results

**Before Fix:**
- ❌ Placeholder sent to OpenAI as part of prompt
- ❌ `aiSection.placeholder` field missing
- ❌ AI sections not appearing in final documents
- ❌ Generic or inappropriate content

**After Fix:**
- ✅ Clean prompt sent to OpenAI
- ✅ `placeholder` field saved properly
- ✅ AI sections appear in final documents
- ✅ Professional, legally appropriate content

## Implementation Checklist

- [ ] Update `src/app/api/services/generate-ai-section/route.ts`
  - [ ] Parse placeholder and prompt separately
  - [ ] Add `placeholder` field to aiSection object
  - [ ] Improve system prompt for legal content
  - [ ] Add validation for both fields
- [ ] Test AI generation with console logging
- [ ] Verify Firestore data structure
- [ ] Test document generation end-to-end
- [ ] Verify AI content appears in final DOCX files
- [ ] Deploy to production
- [ ] Create user documentation

## Related Files

- **API Route:** `src/app/api/services/generate-ai-section/route.ts` (NEEDS FIX)
- **Document Gen:** `src/app/api/services/generate-documents/route.ts` (OK)
- **Doc Library:** `src/lib/document-generator.ts` (OK)
- **Frontend:** `src/app/admin/services/[serviceId]/page.tsx` (OK)

## Success Criteria

1. ✅ Placeholder and prompt are parsed correctly
2. ✅ OpenAI receives only the clean prompt
3. ✅ Generated content is professional and legally appropriate
4. ✅ `aiSection.placeholder` field is saved to Firestore
5. ✅ AI sections appear in generated documents
6. ✅ Placeholders are correctly replaced in final DOCX files
