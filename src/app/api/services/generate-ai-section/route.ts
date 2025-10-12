import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { serviceId, templateId, prompt: combinedPrompt } = body

    if (!serviceId || !templateId || !combinedPrompt) {
      return NextResponse.json(
        { error: 'Missing required fields: serviceId, templateId, prompt' },
        { status: 400 }
      )
    }

    // Parse placeholder and actual prompt from combined string
    // Format: "{{ai_placeholder}}|actual prompt text"
    const parts = combinedPrompt.split('|')
    const placeholderRaw = parts[0]?.trim() || ''
    const actualPrompt = parts[1]?.trim() || combinedPrompt.trim()

    // Extract placeholder name (remove {{ }} if present)
    const placeholder = placeholderRaw.replace(/^\{\{|\}\}$/g, '').trim()

    console.log('🔍 Parsing AI request:', {
      combinedPrompt: combinedPrompt.substring(0, 100) + '...',
      placeholder,
      promptLength: actualPrompt.length
    })

    if (!placeholder || !actualPrompt) {
      return NextResponse.json(
        { 
          error: 'Invalid prompt format', 
          details: 'Expected format: "{{placeholder}}|prompt text". Both placeholder and prompt are required.' 
        },
        { status: 400 }
      )
    }

    // Check OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Initialize Firebase Admin and get database
    let adminDb
    try {
      adminDb = getAdminDb()
    } catch (error) {
      return NextResponse.json(
        { error: 'Firebase Admin not initialized', details: 'Missing or insufficient permissions.' },
        { status: 500 }
      )
    }

    // Get service and template details for context
    const serviceDoc = await adminDb.collection('services').doc(serviceId).get()
    if (!serviceDoc.exists) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    const serviceData = serviceDoc.data()
    if (!serviceData) {
      return NextResponse.json({ error: 'Service data not found' }, { status: 404 })
    }
    
    const template = serviceData.templates?.find((t: any) => t.templateId === templateId)
    
    if (!template) {
      return NextResponse.json({ error: 'Template not found in service' }, { status: 404 })
    }

    // Generate AI section with improved legal prompt
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

    console.log('🤖 Sending to OpenAI:', {
      model: 'gpt-4o-mini',
      promptLength: actualPrompt.length,
      temperature: 0.7
    })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: actualPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1000
    })

    const generatedContent = completion.choices[0]?.message?.content || ''

    console.log('✅ OpenAI Response:', {
      contentLength: generatedContent.length,
      preview: generatedContent.substring(0, 100) + '...'
    })

    if (!generatedContent) {
      return NextResponse.json(
        { error: 'Failed to generate content' },
        { status: 500 }
      )
    }

    // Create AI section object with placeholder field
    const aiSection = {
      id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      templateId,
      placeholder,  // IMPORTANT: Store placeholder for document generation
      prompt: actualPrompt,  // Store clean prompt without placeholder
      generatedContent,
      approved: false,
      createdAt: new Date().toISOString()
    }

    console.log('💾 Saving AI section:', {
      id: aiSection.id,
      placeholder: aiSection.placeholder,
      promptLength: aiSection.prompt.length,
      contentLength: aiSection.generatedContent.length
    })

    // Update service with new AI section
    const updatedTemplates = serviceData.templates.map((t: any) => {
      if (t.templateId === templateId) {
        return {
          ...t,
          aiSections: [...(t.aiSections || []), aiSection]
        }
      }
      return t
    })

    await adminDb.collection('services').doc(serviceId).update({
      templates: updatedTemplates,
      updatedAt: FieldValue.serverTimestamp()
    })

    return NextResponse.json({
      success: true,
      aiSection,
      message: 'AI section generated successfully'
    })
  } catch (error) {
    console.error('Error generating AI section:', error)
    return NextResponse.json(
      { error: 'Failed to generate AI section', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
