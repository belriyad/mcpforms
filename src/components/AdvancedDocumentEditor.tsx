'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Save, Loader2, FileText, Sparkles, Download, Printer, CheckCircle2, AlertCircle, Maximize2, Minimize2, Wand2 } from 'lucide-react'
import { showSuccessToast, showErrorToast, showLoadingToast } from '@/lib/toast-helpers'
import { toast } from 'react-hot-toast'
import { Editor } from '@tinymce/tinymce-react'
import { usePermissions } from '@/contexts/PermissionsContext'

interface AdvancedDocumentEditorProps {
  isOpen: boolean
  onClose: () => void
  document: {
    id: string
    fileName: string
    content?: string
    templateName?: string
    populatedFields?: Record<string, any>
  }
  serviceId: string
  intakeData?: Record<string, any>
  onSave?: (updatedContent: string) => void
}

export default function AdvancedDocumentEditor({
  isOpen,
  onClose,
  document,
  serviceId,
  intakeData,
  onSave
}: AdvancedDocumentEditorProps) {
  const { hasPermission } = usePermissions()
  const [content, setContent] = useState('')
  const [aiPrompt, setAiPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isFormatting, setIsFormatting] = useState(false)
  const [generatedSection, setGeneratedSection] = useState<string | null>(null)
  const [confidence, setConfidence] = useState<number | null>(null)
  const [showAIPanel, setShowAIPanel] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  const [pageCount, setPageCount] = useState(1)
  const editorRef = useRef<any>(null)

  useEffect(() => {
    if (isOpen && document) {
      console.log('📄 AdvancedDocumentEditor received document:', {
        fileName: document.fileName,
        hasContent: !!document.content,
        contentLength: document.content?.length || 0,
        contentPreview: document.content?.substring(0, 200),
        allFields: Object.keys(document)
      })
      
      if (!document.content || document.content.trim() === '') {
        console.warn('⚠️ Document has no content! Setting placeholder message.')
        const placeholderContent = `
          <div style="padding: 20px; background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; margin: 20px;">
            <h2 style="color: #856404; margin-top: 0;">⚠️ Document Content Not Available</h2>
            <p style="color: #856404;">
              <strong>Issue:</strong> This document doesn't have editable content saved yet.
            </p>
            <p style="color: #856404;">
              <strong>Possible reasons:</strong>
            </p>
            <ul style="color: #856404;">
              <li>The document was generated before the content-saving feature was added</li>
              <li>There was an error during document generation</li>
              <li>The document needs to be regenerated</li>
            </ul>
            <p style="color: #856404;">
              <strong>To fix:</strong> Go back and click "Generate All Documents" again to regenerate this document with editable content.
            </p>
          </div>
        `
        setContent(placeholderContent)
        showErrorToast('Document content not available. Document may need to be regenerated.')
      } else {
        // Convert plain text to HTML if needed
        const htmlContent = document.content.includes('<') 
          ? document.content 
          : `<p>${document.content.split('\n').join('</p><p>')}</p>`
        setContent(htmlContent)
        updateStats(htmlContent)
        console.log('✅ Document content loaded successfully')
      }
    }
  }, [isOpen, document])

  const updateStats = (html: string) => {
    // Count words
    const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    const words = text.split(' ').filter(w => w.length > 0).length
    setWordCount(words)
    
    // Estimate pages (roughly 250 words per page)
    const pages = Math.max(1, Math.ceil(words / 250))
    setPageCount(pages)
  }

  const handleEditorChange = (newContent: string, editor: any) => {
    setContent(newContent)
    updateStats(newContent)
  }

  const handleGenerateSection = async () => {
    if (!aiPrompt.trim()) {
      showErrorToast('Please enter a description for the section you want to generate')
      return
    }

    setIsGenerating(true)
    const loadingToastId = showLoadingToast('Generating section with AI...')

    try {
      // Get plain text context from editor
      const plainText = editorRef.current?.getContent({ format: 'text' }) || ''
      
      const response = await fetch('/api/documents/generate-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          documentContext: plainText.substring(0, 1000),
          temperature: 0.3
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate section')
      }

      const data = await response.json()
      
      toast.dismiss(loadingToastId)
      setGeneratedSection(data.text)
      setConfidence(data.confidence)
      showSuccessToast('Section generated successfully!')
      
    } catch (error: any) {
      toast.dismiss(loadingToastId)
      console.error('AI generation error:', error)
      showErrorToast(error.message || 'Failed to generate section')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAcceptSection = () => {
    if (generatedSection && editorRef.current) {
      // Format the generated section with proper HTML
      const formattedSection = `<div class="ai-generated-section">
        <h3>AI Generated Section</h3>
        ${generatedSection.split('\n\n').map(para => `<p>${para}</p>`).join('')}
      </div>`
      
      // Insert at cursor position or append at end
      editorRef.current.insertContent(formattedSection)
      
      setGeneratedSection(null)
      setAiPrompt('')
      setConfidence(null)
      showSuccessToast('Section added to document')
    }
  }

  const handleRegenerateSection = () => {
    setGeneratedSection(null)
    setConfidence(null)
    handleGenerateSection()
  }

  const handleFormatDocument = async () => {
    if (!content || !editorRef.current) {
      showErrorToast('No content to format')
      return
    }

    // Confirm action
    if (!window.confirm('Format entire document with AI?\n\nThis will improve consistency in formatting, headings, spacing, and alignment WITHOUT changing any:\n• Names, dates, or amounts\n• Legal terms or clauses\n• Material content or meaning\n\nOnly formatting will be improved.')) {
      return
    }

    setIsFormatting(true)
    const loadingToastId = showLoadingToast('AI is formatting your document... This may take 30-60 seconds.')

    try {
      // Get plain text from editor
      const plainText = editorRef.current.getContent({ format: 'text' })
      
      // Prepare intake data for AI
      const intakeFields: Record<string, any> = {}
      
      // Extract from document populated fields
      if (document.populatedFields) {
        for (const [key, fieldData] of Object.entries(document.populatedFields)) {
          if (typeof fieldData === 'object' && fieldData !== null && 'value' in fieldData) {
            intakeFields[key] = (fieldData as any).value
          } else {
            intakeFields[key] = fieldData
          }
        }
      }
      
      // Merge with any additional intake data passed as prop
      if (intakeData) {
        Object.assign(intakeFields, intakeData)
      }
      
      console.log('📋 Sending intake data to formatter:', intakeFields)
      
      const response = await fetch('/api/documents/format-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          htmlContent: content,
          plainText: plainText,
          documentName: document.fileName,
          intakeData: intakeFields
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to format document')
      }

      const data = await response.json()
      
      // Update content with formatted version
      setContent(data.formattedContent)
      editorRef.current.setContent(data.formattedContent)
      updateStats(data.formattedContent)
      
      toast.dismiss(loadingToastId)
      showSuccessToast('Document formatted successfully! Review the changes before saving.')
      
    } catch (error: any) {
      toast.dismiss(loadingToastId)
      console.error('Formatting error:', error)
      showErrorToast(error.message || 'Failed to format document')
    } finally {
      setIsFormatting(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    const loadingToastId = showLoadingToast('Saving document...')

    try {
      const response = await fetch(`/api/services/${serviceId}/documents/${document.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save document')
      }

      if (onSave) {
        onSave(content)
      }
      
      toast.dismiss(loadingToastId)
      showSuccessToast('Document saved successfully!')
      
      setTimeout(() => {
        onClose()
      }, 500)
      
    } catch (error: any) {
      toast.dismiss(loadingToastId)
      console.error('Save error:', error)
      showErrorToast(error.message || 'Failed to save document')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePrint = () => {
    if (editorRef.current) {
      const printWindow = window.open('', '', 'width=800,height=600')
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${document.fileName}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
                @page { margin: 1in; }
                @media print { body { padding: 0; } }
              </style>
            </head>
            <body>${content}</body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
      }
    }
  }

  const handleExport = () => {
    const blob = new Blob([content], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = window.document.createElement('a')
    link.href = url
    link.download = `${document.fileName.replace(/\.[^/.]+$/, '')}.html`
    window.document.body.appendChild(link)
    link.click()
    window.document.body.removeChild(link)
    URL.revokeObjectURL(url)
    showSuccessToast('Document exported as HTML!')
  }

  const handleExportDOCX = async () => {
    const loadingToastId = showLoadingToast('Converting to DOCX...')
    
    try {
      const response = await fetch('/api/documents/html-to-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          htmlContent: content,
          fileName: document.fileName
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to convert to DOCX')
      }

      // Download the DOCX file
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = window.document.createElement('a')
      link.href = url
      link.download = document.fileName
      window.document.body.appendChild(link)
      link.click()
      window.document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.dismiss(loadingToastId)
      showSuccessToast('Document exported as DOCX!')
      
    } catch (error: any) {
      toast.dismiss(loadingToastId)
      console.error('Export DOCX error:', error)
      showErrorToast(error.message || 'Failed to export as DOCX')
    }
  }

  if (!isOpen) return null

  return (
    <div className={`fixed inset-0 z-50 ${isFullscreen ? '' : 'p-4'}`}>
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className={`relative bg-white shadow-2xl flex flex-col ${
        isFullscreen 
          ? 'h-screen w-screen'
          : 'max-w-7xl mx-auto rounded-xl h-[90vh] w-full'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {document.fileName}
              </h2>
              <p className="text-sm text-gray-600">
                {document.templateName && `Template: ${document.templateName}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-sm text-gray-600 bg-white px-4 py-2 rounded-lg border border-gray-200">
              <div className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                <span className="font-medium">{wordCount}</span>
                <span>words</span>
              </div>
              <div className="w-px h-4 bg-gray-300" />
              <div className="flex items-center gap-1">
                <span className="font-medium">{pageCount}</span>
                <span>pages</span>
              </div>
            </div>

            <button
              onClick={handlePrint}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Print"
            >
              <Printer className="w-5 h-5 text-gray-600" />
            </button>
            
            <button
              onClick={handleExport}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Export as HTML"
            >
              <Download className="w-5 h-5 text-gray-600" />
            </button>
            
            <button
              onClick={handleExportDOCX}
              className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              title="Export as DOCX (with all edits)"
            >
              <Download className="w-4 h-4" />
              DOCX
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5 text-gray-600" />
              ) : (
                <Maximize2 className="w-5 h-5 text-gray-600" />
              )}
            </button>

            {/* AI Format Button - Always Visible */}
            <button
              onClick={handleFormatDocument}
              disabled={isFormatting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              title="Format entire document with AI"
            >
              {isFormatting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Formatting...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  AI Format
                </>
              )}
            </button>

            {/* AI Assistant Button */}
            {hasPermission('canGenerateAISections') && (
              <button
                onClick={() => setShowAIPanel(!showAIPanel)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all text-sm font-medium"
              >
                <Sparkles className="w-4 h-4" />
                {showAIPanel ? 'Hide AI' : 'AI Assistant'}
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Main Editor */}
          <div className="flex-1 overflow-hidden">
            <Editor
              apiKey="fxuqt1nodkz7drcdwflwssmwja6t1w4bu0m7ft6he4z5pe1r"
              onInit={(evt, editor) => editorRef.current = editor}
              value={content}
              onEditorChange={handleEditorChange}
              init={{
                height: '100%',
                menubar: true,
                plugins: [
                  'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                  'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                  'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount',
                  'pagebreak', 'nonbreaking', 'save', 'directionality', 'template',
                  'textpattern', 'emoticons', 'autosave', 'quickbars'
                ],
                toolbar: 'undo redo | blocks fontfamily fontsize | ' +
                  'bold italic underline strikethrough forecolor backcolor | ' +
                  'alignleft aligncenter alignright alignjustify | ' +
                  'bullist numlist outdent indent | ' +
                  'table link image media | ' +
                  'pagebreak nonbreaking | ' +
                  'code preview fullscreen | ' +
                  'removeformat help',
                toolbar_mode: 'sliding',
                content_style: `
                  body { 
                    font-family: 'Times New Roman', Georgia, serif; 
                    font-size: 12pt;
                    line-height: 1.6;
                    max-width: 8.5in;
                    margin: 0 auto;
                    padding: 1in;
                  }
                  @page {
                    size: letter;
                    margin: 1in;
                  }
                  h1 { font-size: 18pt; margin-top: 24pt; margin-bottom: 12pt; }
                  h2 { font-size: 16pt; margin-top: 18pt; margin-bottom: 10pt; }
                  h3 { font-size: 14pt; margin-top: 14pt; margin-bottom: 8pt; }
                  p { margin-bottom: 10pt; }
                `,
                mobile: {
                  theme: 'silver',
                  plugins: 'autosave lists autolink',
                  toolbar: 'undo redo bold italic underline | bullist numlist'
                },
                autosave_interval: '30s',
                autosave_prefix: 'tinymce-autosave-{path}{query}-{id}-',
                autosave_restore_when_empty: true,
              }}
            />
          </div>

          {/* AI Panel */}
          {showAIPanel && (
            <div className="w-96 border-l border-gray-200 bg-gradient-to-br from-purple-50 to-pink-50 overflow-y-auto">
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    AI Section Generator
                  </h3>
                  <p className="text-sm text-gray-600">
                    Describe the section you want to add and AI will generate professional content.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Describe the section
                  </label>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g., 'Add a confidentiality clause' or 'Add executor responsibilities section'"
                    className="w-full px-4 py-3 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm resize-none"
                    rows={4}
                    disabled={isGenerating}
                  />
                </div>

                <button
                  onClick={handleGenerateSection}
                  disabled={isGenerating || !aiPrompt.trim()}
                  className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Section
                    </>
                  )}
                </button>

                {/* Generated Section Preview */}
                {generatedSection && (
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        Generated Section
                      </h4>
                      {confidence && (
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          {confidence}% confidence
                        </span>
                      )}
                    </div>

                    <div className="bg-white border border-purple-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {generatedSection}
                      </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-blue-800">
                          AI-generated content should be reviewed by a professional before use.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleAcceptSection}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Insert into Document
                      </button>
                      <button
                        onClick={handleRegenerateSection}
                        className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                      >
                        Regenerate
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span>Full document editing with auto-save enabled</span>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Document
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
