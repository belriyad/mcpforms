'use client'

import { useState, useEffect } from 'react'
import { X, Sparkles, Loader2, FileText, Plus, Save, AlertCircle, CheckCircle2 } from 'lucide-react'
import { showSuccessToast, showErrorToast, showLoadingToast } from '@/lib/toast-helpers'
import { toast } from 'react-hot-toast'

interface DocumentEditorModalProps {
  isOpen: boolean
  onClose: () => void
  document: {
    id: string
    fileName: string
    content?: string
    templateName?: string
  }
  serviceId: string
  onSave?: (updatedContent: string) => void
}

export default function DocumentEditorModal({
  isOpen,
  onClose,
  document,
  serviceId,
  onSave
}: DocumentEditorModalProps) {
  const [content, setContent] = useState('')
  const [aiPrompt, setAiPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedSection, setGeneratedSection] = useState<string | null>(null)
  const [confidence, setConfidence] = useState<number | null>(null)
  const [showAIPanel, setShowAIPanel] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (isOpen && document.content) {
      setContent(document.content)
    }
  }, [isOpen, document])

  const handleGenerateSection = async () => {
    if (!aiPrompt.trim()) {
      showErrorToast('Please enter a description for the section you want to generate')
      return
    }

    setIsGenerating(true)
    const loadingToastId = showLoadingToast('Generating section with AI...')

    try {
      const response = await fetch('/api/documents/generate-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          documentContext: content.substring(0, 1000), // Send first 1000 chars for context
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
    if (generatedSection) {
      // Add the generated section to the document content
      setContent(content + '\n\n' + generatedSection)
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

  const handleSave = async () => {
    setIsSaving(true)
    const loadingToastId = showLoadingToast('Saving document...')

    try {
      // Save document content via API
      const response = await fetch(`/api/services/${serviceId}/documents/${document.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save document')
      }

      // Call the callback if provided
      if (onSave) {
        onSave(content)
      }
      
      toast.dismiss(loadingToastId)
      showSuccessToast('Document saved successfully!')
      
      // Close modal after short delay
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Document Editor</h2>
              <p className="text-sm text-gray-600">{document.fileName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Main Editor */}
          <div className="flex-1 flex flex-col p-6 overflow-hidden">
            <div className="mb-4 flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Document Content
              </label>
              <button
                onClick={() => setShowAIPanel(!showAIPanel)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all text-sm font-medium"
              >
                <Sparkles className="w-4 h-4" />
                {showAIPanel ? 'Hide AI Assistant' : 'AI Assistant'}
              </button>
            </div>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-none"
              placeholder="Document content will appear here..."
            />

            <div className="mt-4 text-sm text-gray-500">
              {content.length.toLocaleString()} characters
            </div>
          </div>

          {/* AI Panel */}
          {showAIPanel && (
            <div className="w-96 border-l border-gray-200 bg-gradient-to-br from-purple-50 to-pink-50 p-6 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    AI Section Generator
                  </h3>
                  <p className="text-sm text-gray-600">
                    Describe the section you want to add and AI will generate professional legal content.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Describe the section
                  </label>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g., 'Add a clause about property distribution to surviving spouse' or 'Add executor responsibilities section'"
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
                          AI-generated content should be reviewed by a legal professional before use.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleAcceptSection}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        <Plus className="w-4 h-4 inline mr-2" />
                        Add to Document
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
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
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
  )
}
