# Document Generation Timeout Fix

## Problem
Document generation takes a long time and doesn't finish successfully.

## Root Causes Identified

### 1. No Request Timeout
- Fetch request has no timeout mechanism
- Can hang indefinitely waiting for response
- User has no feedback about progress

### 2. Long Processing Time
- AI document generation via Cloud Function takes time
- OpenAI API calls can be slow (30-60+ seconds)
- No progress indicators during processing

### 3. Cloud Function Issues
- May be cold-starting (adds 5-10 seconds)
- OpenAI API may be rate-limited or slow
- Large documents take longer to process

## Solutions Implemented

### Quick Fix: Add Timeout to Frontend

Add this to `/src/app/admin/services/[serviceId]/page.tsx`:

```typescript
const handleGenerateDocs = async () => {
  if (!service) return
  
  console.log('🚀 Starting document generation...')
  setGeneratingDocs(true)
  
  try {
    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      controller.abort()
    }, 120000) // 120 second (2 minute) timeout
    
    console.log('⏱️ Starting request with 2-minute timeout...')
    
    const response = await fetch('/api/services/generate-documents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        serviceId: service.id,
        useAI: true
      }),
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const result = await response.json()
    console.log(`📊 API Response:`, result)
    
    if (result.success) {
      alert('✅ Documents generated successfully!')
      // Refresh service data...
    } else {
      alert(`❌ Error: ${result.error || 'Unknown error'}`)
    }
    
  } catch (err: any) {
    console.error('Error generating documents:', err)
    
    if (err.name === 'AbortError') {
      alert('⏱️ Request timed out after 2 minutes. The document may still be generating in the background. Please refresh the page in a moment.')
    } else if (err.message.includes('Failed to fetch')) {
      alert('🌐 Network error. Please check your connection and try again.')
    } else {
      alert(`❌ Error: ${err.message}`)
    }
  } finally {
    setGeneratingDocs(false)
  }
}
```

### Alternative: Switch to Non-AI Generation

If AI generation is too slow, temporarily disable it:

```typescript
body: JSON.stringify({ 
  serviceId: service.id,
  useAI: false // Use faster docxtemplater method
}),
```

### Better Solution: Add Progress Tracking

Use Firestore real-time updates to track progress:

```typescript
// In Cloud Function, update progress
await db.collection('services').doc(serviceId).update({
  generationProgress: {
    status: 'processing',
    step: 'Calling OpenAI API...',
    percent: 50,
    updatedAt: FieldValue.serverTimestamp()
  }
})

// In frontend, listen for updates
const unsubscribe = onSnapshot(
  doc(db, 'services', service.id),
  (snapshot) => {
    const data = snapshot.data()
    if (data?.generationProgress) {
      setProgressMessage(data.generationProgress.step)
      setProgressPercent(data.generationProgress.percent)
    }
  }
)
```

## Immediate Workarounds

### Option 1: Increase Timeout
Change timeout from 60s to 180s (3 minutes):

```typescript
setTimeout(() => controller.abort(), 180000)
```

### Option 2: Use Docxtemplater Instead
Much faster, no AI calls:

```typescript
useAI: false
```

### Option 3: Background Processing
Make it asynchronous:

```typescript
// Start generation without waiting
fetch('/api/services/generate-documents', {
  method: 'POST',
  body: JSON.stringify({ serviceId, useAI: true, async: true })
})

// Poll for completion
const pollForCompletion = setInterval(async () => {
  const doc = await getDoc(docRef)
  if (doc.data().generatedDocuments?.length > 0) {
    clearInterval(pollForCompletion)
    alert('✅ Documents ready!')
  }
}, 5000)
```

## Debug Commands

Check Cloud Function logs:
```bash
firebase functions:log --only generateDocumentsWithAI
```

Test API directly:
```bash
curl -X POST http://localhost:3001/api/services/generate-documents \
  -H "Content-Type: application/json" \
  -d '{"serviceId":"SERVICE_ID","useAI":false}'
```

Check OpenAI API status:
```bash
curl https://status.openai.com/api/v2/status.json
```

## Long-term Improvements

1. **Streaming responses** - Show real-time progress
2. **Queue system** - Use Cloud Tasks for long-running operations
3. **Webhooks** - Notify when complete instead of waiting
4. **Client-side generation** - Generate in browser (for small docs)
5. **Caching** - Cache AI-generated sections
6. **Retries** - Auto-retry on timeout with exponential backoff
