import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: NextRequest) {
  try {
    const { prompt, documentContext, temperature = 0.3 } = await request.json()

    // Validate inputs
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
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

    console.log('🤖 Generating document section with OpenAI:', {
      promptLength: prompt.length,
      hasContext: !!documentContext,
      temperature
    })

    // Build system message for legal document context
    const systemMessage = `You are an expert legal document writer. Generate professional, legally sound content for documents.

Guidelines:
- Use formal, professional legal language
- Be clear, precise, and unambiguous
- Follow standard legal document formatting
- Include appropriate legal terminology
- Ensure content is comprehensive yet concise
- Use proper paragraph structure
- Avoid contradictions or vague statements`

    // Build user message with context
    let userMessage = prompt

    if (documentContext) {
      userMessage = `Document Context:
${documentContext}

---

User Request:
${prompt}

---

Please generate the requested section following legal document best practices.`
    }

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage }
      ],
      temperature: temperature,
      max_tokens: 2000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0
    })

    const generatedText = completion.choices[0]?.message?.content || ''

    // Calculate confidence score (simplified)
    const finishReason = completion.choices[0]?.finish_reason
    const confidence = finishReason === 'stop' ? 95 : 75

    console.log('✅ OpenAI section generated:', {
      textLength: generatedText.length,
      finishReason,
      confidence,
      tokensUsed: completion.usage?.total_tokens
    })

    return NextResponse.json({
      text: generatedText,
      confidence,
      metadata: {
        model: completion.model,
        tokensUsed: completion.usage?.total_tokens,
        finishReason
      }
    })

  } catch (error: any) {
    console.error('❌ Error generating section:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate section', 
        details: error.message 
      },
      { status: 500 }
    )
  }
}
