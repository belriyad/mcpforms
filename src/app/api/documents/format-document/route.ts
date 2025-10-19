import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { htmlContent, plainText, documentName, intakeData } = body

    if (!htmlContent || !plainText) {
      return NextResponse.json(
        { error: 'HTML content and plain text are required' },
        { status: 400 }
      )
    }

    console.log('🎨 Formatting document with AI:', {
      documentName,
      contentLength: htmlContent.length,
      plainTextLength: plainText.length,
      hasIntakeData: !!intakeData
    })

    // Extract intake field information for context
    let intakeContext = ''
    if (intakeData && Object.keys(intakeData).length > 0) {
      intakeContext = '\n\nIMPORTANT - Available Intake Data (use these exact values when filling placeholders):\n'
      for (const [key, value] of Object.entries(intakeData)) {
        if (value && typeof value === 'string') {
          intakeContext += `• ${key}: ${value}\n`
        }
      }
    }

    // Create a comprehensive prompt for professional document formatting
    const systemPrompt = `You are a professional legal document formatting expert. Your job is to transform raw document HTML into a perfectly formatted, professional legal document.

CRITICAL RULES - CONTENT PRESERVATION:
1. DO NOT change, modify, or rephrase ANY substantive content, legal terms, or clauses
2. DO NOT change ANY names, dates, amounts, numbers, or legal language
3. DO NOT alter the meaning or legal interpretation of ANY content
4. Preserve ALL original text exactly as written

MANDATORY DOCUMENT STRUCTURE:
1. TITLE must be at the very top as <h1> (e.g., "CERTIFICATE OF TRUST", "SERVICE AGREEMENT")
2. Introductory paragraph(s) immediately after title
3. Main sections ordered logically by importance and readability
4. AI-generated sections MUST BE INTEGRATED into appropriate positions, NOT at the top
5. Signature blocks at the bottom
6. Date/notary sections at the very end

FORMATTING REQUIREMENTS:

📐 HEADINGS:
✅ Main title: <h1> (centered, all caps, bold)
✅ Major sections: <h2> (e.g., "ARTICLE I - TRUST NAME", "SECTION 1: DEFINITIONS")
✅ Subsections: <h3> (e.g., "1.1 Purpose", "A. Trustee Powers")
✅ Use consistent capitalization and numbering

📝 PARAGRAPHS:
✅ Proper spacing between paragraphs
✅ Justified or left-aligned text
✅ Consistent line height (1.5-1.8)
✅ No orphaned lines

🔢 NUMBERING & BULLETS:
✅ Fix inconsistent numbering (1, 2, 3 vs i, ii, iii vs a, b, c)
✅ Use <ol> for numbered lists with proper nesting
✅ Use <ul> for bullet points
✅ Maintain hierarchical structure (I. > A. > 1. > a.)

📋 SECTIONS:
✅ Order sections logically:
   - Title
   - Preamble/Introduction
   - Definitions (if present)
   - Main body sections
   - Signatures/Execution
   - Notary/Date
✅ AI-generated sections go in the main body, NOT at top
✅ Group related content together

🎯 PLACEHOLDERS:
✅ If you see placeholders like [Grantor Name], {{grantor}}, or blank spaces for names/dates
✅ AND intake data is provided with matching information
✅ Fill in the placeholders with the provided intake data
✅ Use exact values from intake data
✅ Maintain proper capitalization

📄 VISUAL POLISH:
✅ Consistent margins and padding
✅ Professional typography
✅ Proper whitespace
✅ Clear visual hierarchy
✅ Clean HTML structure

WHAT YOU CANNOT DO:
❌ Add new legal clauses or content
❌ Remove existing clauses or content
❌ Change legal terminology
❌ Alter numerical values or dates
❌ Modify the legal substance of the document
❌ Invent data not provided in intake

Return ONLY the formatted HTML. Ensure the document looks like a final, professional legal document ready for execution.`

    const userPrompt = `Format this legal document into a professional, final document.

Document Name: ${documentName || 'Legal Document'}
${intakeContext}

Plain Text Reference (preserve all content):
${plainText.substring(0, 2000)}

HTML to Format:
${htmlContent}

REQUIREMENTS:
1. Put document TITLE at the very top as <h1>
2. Order sections logically (intro → main sections → signatures → date)
3. Merge AI-generated sections into appropriate positions in main body
4. Fix all numbering and bullet points
5. Fill placeholders using intake data if provided
6. Ensure professional formatting throughout
7. Do NOT change any substantive legal content

Return the fully formatted HTML.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.1, // Very low temperature for consistency
      max_tokens: 4000,
    })

    const formattedContent = response.choices[0]?.message?.content || htmlContent

    // Remove code blocks if AI wrapped the response
    let cleanedContent = formattedContent
      .replace(/```html\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    // Ensure content is wrapped in a div if not already
    if (!cleanedContent.startsWith('<div')) {
      cleanedContent = `<div style="max-width: 8.5in; margin: 0 auto; padding: 40px; font-family: 'Times New Roman', serif; line-height: 1.6;">
${cleanedContent}
</div>`
    }

    console.log('✅ Document formatted:', {
      originalLength: htmlContent.length,
      formattedLength: cleanedContent.length,
      tokensUsed: response.usage?.total_tokens || 0
    })

    return NextResponse.json({
      success: true,
      formattedContent: cleanedContent,
      stats: {
        originalLength: htmlContent.length,
        formattedLength: cleanedContent.length,
        tokensUsed: response.usage?.total_tokens || 0,
        model: 'gpt-4'
      }
    })

  } catch (error: any) {
    console.error('❌ Document formatting error:', error)
    
    return NextResponse.json(
      {
        error: 'Failed to format document',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}
