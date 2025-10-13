import { NextRequest, NextResponse } from 'next/server'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'

/**
 * Accept AI-generated content endpoint (Feature #13)
 * 
 * Called when user reviews and approves AI content in preview modal
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      serviceId, 
      templateId, 
      content,
      originalContent,
      prompt, 
      placeholder,
      model,
      temperature,
      userEdits,
      feedback,
      userId
    } = body

    if (!serviceId || !templateId || !content || !placeholder) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('✅ Accepting AI content:', {
      serviceId,
      templateId,
      placeholder,
      hasEdits: !!userEdits,
      feedback
    })

    const adminDb = getAdminDb()

    // Load service
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

    // Create approved AI section with full audit trail
    const aiSection = {
      id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      templateId,
      placeholder,
      
      // Generation details
      prompt: prompt || '',
      originalContent: originalContent || content,
      finalContent: content,
      model: model || 'gpt-4o-mini',
      temperature: temperature || 0.3,
      generatedAt: new Date().toISOString(),
      
      // User review
      approved: true,
      approvedAt: new Date().toISOString(),
      approvedBy: userId || serviceData.createdBy || 'unknown',
      userEdits: userEdits || null,  // Store what changed if edited
      wasEdited: !!userEdits && userEdits !== content,
      feedback: feedback || null,  // 'positive' | 'negative' | null
      
      // Legacy field for compatibility
      generatedContent: content
    }

    console.log('💾 Saving approved AI section:', {
      id: aiSection.id,
      placeholder: aiSection.placeholder,
      wasEdited: aiSection.wasEdited,
      feedback: aiSection.feedback,
      contentLength: aiSection.finalContent.length
    })

    // Update service with approved AI section
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

    // Log AI section acceptance with audit details
    try {
      await adminDb.collection('activityLogs').add({
        type: 'ai_section_accepted',
        userId: aiSection.approvedBy,
        serviceId: serviceId,
        timestamp: Timestamp.now(),
        meta: {
          placeholder,
          templateName: template.name,
          promptLength: prompt?.length || 0,
          originalLength: originalContent?.length || content.length,
          finalLength: content.length,
          wasEdited: aiSection.wasEdited,
          feedback: feedback || 'none',
          model,
          temperature
        }
      })
      console.log('📝 Logged AI section acceptance');
    } catch (logError) {
      console.error('⚠️ Failed to log AI acceptance:', logError);
      // Don't fail the request if logging fails
    }

    return NextResponse.json({
      success: true,
      aiSection: {
        id: aiSection.id,
        placeholder: aiSection.placeholder,
        content: aiSection.finalContent,
        approved: true
      },
      message: 'AI content accepted and saved successfully'
    })
  } catch (error) {
    console.error('❌ Error accepting AI content:', error)
    return NextResponse.json(
      { 
        error: 'Failed to accept AI content', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
