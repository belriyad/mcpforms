import { NextRequest, NextResponse } from 'next/server'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx'

// Simple HTML parser that extracts text and basic structure
function parseHTMLtoDocxElements(html: string): any[] {
  const elements: any[] = []
  
  // Remove the wrapper div if present
  let cleanHtml = html.replace(/<div[^>]*style="max-width[^"]*"[^>]*>/i, '')
  cleanHtml = cleanHtml.replace(/<\/div>\s*$/i, '')
  
  // Split by common block elements
  const blocks = cleanHtml.split(/(?=<h[1-6]|<p|<div|<ul|<ol|<li)/i)
  
  for (const block of blocks) {
    const trimmed = block.trim()
    if (!trimmed) continue
    
    // Extract text content
    const text = trimmed
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim()
    
    if (!text) continue
    
    // Determine element type and create appropriate paragraph
    if (trimmed.match(/<h1/i)) {
      elements.push(
        new Paragraph({
          text: text,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 120 },
        })
      )
    } else if (trimmed.match(/<h2/i)) {
      elements.push(
        new Paragraph({
          text: text,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 120 },
        })
      )
    } else if (trimmed.match(/<h3/i)) {
      elements.push(
        new Paragraph({
          text: text,
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 },
        })
      )
    } else if (trimmed.match(/<h4/i)) {
      elements.push(
        new Paragraph({
          text: text,
          heading: HeadingLevel.HEADING_4,
          spacing: { before: 160, after: 80 },
        })
      )
    } else {
      // Regular paragraph
      const isBold = trimmed.match(/<(strong|b)>/i)
      const isItalic = trimmed.match(/<(em|i)>/i)
      
      elements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: text,
              bold: !!isBold,
              italics: !!isItalic,
            }),
          ],
          spacing: { after: 120 },
        })
      )
    }
  }
  
  // If no elements were parsed, create a simple paragraph with all text
  if (elements.length === 0) {
    const plainText = html
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim()
    
    if (plainText) {
      elements.push(
        new Paragraph({
          children: [new TextRun(plainText)],
        })
      )
    }
  }
  
  return elements
}

export async function POST(request: NextRequest) {
  try {
    const { htmlContent, fileName } = await request.json()

    if (!htmlContent) {
      return NextResponse.json(
        { error: 'HTML content is required' },
        { status: 400 }
      )
    }

    console.log('🔄 Converting HTML to DOCX...', {
      fileName,
      contentLength: htmlContent.length,
      contentPreview: htmlContent.substring(0, 200)
    })

    // Parse HTML and convert to DOCX elements
    const elements = parseHTMLtoDocxElements(htmlContent)
    
    console.log(`📄 Parsed ${elements.length} elements from HTML`)

    // Create DOCX document
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1440,    // 1 inch
                right: 1440,
                bottom: 1440,
                left: 1440,
              },
            },
          },
          children: elements,
        },
      ],
    })

    // Generate buffer
    const docxBuffer = await Packer.toBuffer(doc)

    console.log(`✅ DOCX generated: ${docxBuffer.length} bytes`)

    // Return as downloadable file
    return new NextResponse(Buffer.from(docxBuffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${fileName || 'document.docx'}"`,
        'Content-Length': docxBuffer.length.toString(),
      },
    })

  } catch (error: any) {
    console.error('❌ Error converting HTML to DOCX:', error)
    return NextResponse.json(
      { 
        error: 'Failed to convert document',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
