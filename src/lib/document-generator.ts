import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'

export interface DocumentData {
  [key: string]: any
}

export interface GenerateDocumentOptions {
  templateBuffer: Buffer
  data: DocumentData
  fileName: string
}

/**
 * Generate a DOCX document from a template
 */
export async function generateDocument({
  templateBuffer,
  data,
  fileName
}: GenerateDocumentOptions): Promise<Buffer> {
  try {
    // Load the template
    const zip = new PizZip(templateBuffer)
    
    // Create docxtemplater instance
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: () => '' // Replace null/undefined with empty string
    })

    // Set the template data
    doc.render(data)

    // Generate the document
    const buffer = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE'
    })

    return buffer
  } catch (error: any) {
    console.error('Document generation error:', error)
    
    // Provide detailed error information
    if (error.properties && error.properties.errors) {
      const errorMessages = error.properties.errors.map((err: any) => {
        return `${err.message} at ${err.name}`
      }).join(', ')
      throw new Error(`Document generation failed: ${errorMessages}`)
    }
    
    throw new Error(`Document generation failed: ${error.message}`)
  }
}

/**
 * Prepare data for template rendering
 * Handles nested objects and arrays properly
 */
export function prepareTemplateData(
  clientResponses: Record<string, any>,
  aiSections?: Record<string, string>
): DocumentData {
  const data: DocumentData = {}

  // Add client responses
  Object.entries(clientResponses).forEach(([key, value]) => {
    // Handle different value types
    if (Array.isArray(value)) {
      data[key] = value.join(', ')
    } else if (typeof value === 'object' && value !== null) {
      data[key] = JSON.stringify(value)
    } else {
      data[key] = value ?? ''
    }
  })

  // Add AI-generated sections
  if (aiSections) {
    Object.entries(aiSections).forEach(([key, value]) => {
      data[`ai_${key}`] = value ?? ''
    })
  }

  // Add metadata
  data.generatedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  data.generatedTime = new Date().toLocaleTimeString('en-US')

  return data
}

/**
 * Extract placeholders from a DOCX template
 */
export async function extractPlaceholders(templateBuffer: Buffer): Promise<string[]> {
  try {
    const zip = new PizZip(templateBuffer)
    const doc = new Docxtemplater(zip)
    
    // Get all tags (placeholders) from the template
    const tags = doc.getFullText().match(/\{[^}]+\}/g) || []
    
    // Remove braces and duplicates
    const uniqueTags = new Set(tags.map(tag => tag.replace(/[{}]/g, '')))
    const placeholders = Array.from(uniqueTags)
    
    return placeholders
  } catch (error) {
    console.error('Error extracting placeholders:', error)
    return []
  }
}

/**
 * Validate that all required placeholders have data
 */
export function validateTemplateData(
  placeholders: string[],
  data: DocumentData
): { valid: boolean; missing: string[] } {
  const missing = placeholders.filter(placeholder => {
    const value = data[placeholder]
    return value === undefined || value === null || value === ''
  })

  return {
    valid: missing.length === 0,
    missing
  }
}
