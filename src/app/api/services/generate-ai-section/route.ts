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
    const { serviceId, templateId, prompt } = body

    if (!serviceId || !templateId || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields: serviceId, templateId, prompt' },
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

    // Generate AI section
    const systemPrompt = `You are a legal document assistant helping lawyers draft clauses and sections for legal documents.
    
Context:
- Document Type: ${template.name}
- File: ${template.fileName}
- Service: ${serviceData.name}
- Client: ${serviceData.clientName}

Generate a professional legal clause or section based on the lawyer's request. 
The output should be:
1. Legally sound and professional
2. Clear and unambiguous
3. Formatted as a complete clause/section ready to insert
4. Include any necessary definitions or references
5. Follow standard legal document formatting

Do not include explanations or comments, just the clause text itself.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1000
    })

    const generatedContent = completion.choices[0]?.message?.content || ''

    if (!generatedContent) {
      return NextResponse.json(
        { error: 'Failed to generate content' },
        { status: 500 }
      )
    }

    // Create AI section object
    const aiSection = {
      id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      templateId,
      prompt,
      generatedContent,
      approved: false,
      createdAt: new Date().toISOString()
    }

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
