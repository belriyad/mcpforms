import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    const openai = new OpenAI({
      apiKey: apiKey
    })

    const { description, existingFields, serviceContext } = await request.json()

    if (!description || !description.trim()) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      )
    }

    const prompt = `You are a form field expert. Analyze the following description and generate appropriate form fields.

Service Context:
- Service Name: ${serviceContext?.name || 'N/A'}
- Service Description: ${serviceContext?.description || 'N/A'}

Existing Fields (avoid duplicates): ${existingFields?.join(', ') || 'None'}

User Description:
${description}

Generate form fields based on the description. For each field, provide:
1. name: A valid field name (lowercase, underscores, no spaces)
2. label: User-friendly display label
3. type: One of: text, textarea, select, radio, checkbox, number, email, tel, date
4. required: Boolean indicating if the field should be mandatory
5. placeholder: Example placeholder text (optional)
6. description: Brief help text (optional)
7. options: Array of options (only for select, radio, checkbox types)

Return ONLY a valid JSON object with a "fields" array. Do not include any markdown formatting or explanations.

Example response format:
{
  "fields": [
    {
      "name": "full_name",
      "label": "Full Name",
      "type": "text",
      "required": true,
      "placeholder": "Enter your full name",
      "description": "Please provide your legal name"
    },
    {
      "name": "department",
      "label": "Department",
      "type": "select",
      "required": true,
      "options": ["Sales", "Marketing", "Engineering", "HR"],
      "description": "Select your department"
    }
  ]
}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a form field generation expert. Always respond with valid JSON only, no markdown or explanations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })

    const responseText = completion.choices[0]?.message?.content?.trim()
    
    if (!responseText) {
      throw new Error('Empty response from AI')
    }

    // Remove markdown code blocks if present
    let cleanedResponse = responseText
    if (responseText.includes('```json')) {
      cleanedResponse = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    } else if (responseText.includes('```')) {
      cleanedResponse = responseText.replace(/```\n?/g, '').trim()
    }

    const result = JSON.parse(cleanedResponse)

    if (!result.fields || !Array.isArray(result.fields)) {
      throw new Error('Invalid response format from AI')
    }

    // Validate and clean up fields
    const validatedFields = result.fields.map((field: any) => {
      // Ensure field name doesn't conflict with existing fields
      let fieldName = field.name || field.label?.toLowerCase().replace(/\s+/g, '_')
      
      // Make sure field name is unique
      let counter = 1
      let originalName = fieldName
      while (existingFields?.includes(fieldName)) {
        fieldName = `${originalName}_${counter}`
        counter++
      }

      return {
        name: fieldName,
        label: field.label || field.name,
        type: ['text', 'textarea', 'select', 'radio', 'checkbox', 'number', 'email', 'tel', 'date'].includes(field.type) 
          ? field.type 
          : 'text',
        required: Boolean(field.required),
        placeholder: field.placeholder || undefined,
        description: field.description || undefined,
        options: field.options && Array.isArray(field.options) ? field.options : undefined
      }
    })

    return NextResponse.json({
      success: true,
      fields: validatedFields,
      count: validatedFields.length
    })

  } catch (error: any) {
    console.error('Error generating fields with AI:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to generate fields with AI',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
