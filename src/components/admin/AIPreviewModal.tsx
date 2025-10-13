/**
 * AI Preview Modal (MVP Feature #13)
 * 
 * Critical safety feature for reviewing AI-generated content before insertion
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  Eye, 
  ThumbsUp, 
  ThumbsDown,
  Sparkles,
  AlertTriangle,
  FileText,
  Zap,
  X
} from 'lucide-react'
import { isFeatureEnabled } from '@/lib/feature-flags'

interface AIPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  generatedContent: string
  prompt: string
  placeholder: string
  templateName: string
  onAccept: (content: string, edits?: string, feedback?: 'positive' | 'negative' | null) => Promise<void>
  onRegenerate: () => Promise<void>
  isRegenerating?: boolean
  confidenceScore?: number
  model?: string
  temperature?: number
}

export default function AIPreviewModal({
  isOpen,
  onClose,
  generatedContent,
  prompt,
  placeholder,
  templateName,
  onAccept,
  onRegenerate,
  isRegenerating = false,
  confidenceScore,
  model,
  temperature
}: AIPreviewModalProps) {
  const [editedContent, setEditedContent] = useState(generatedContent)
  const [isAccepting, setIsAccepting] = useState(false)
  const [showRawPrompt, setShowRawPrompt] = useState(false)
  const [userFeedback, setUserFeedback] = useState<'positive' | 'negative' | null>(null)

  // Check feature flag
  const enabled = isFeatureEnabled('aiPreviewModal')

  // Update edited content when generated content changes
  useEffect(() => {
    setEditedContent(generatedContent)
  }, [generatedContent])

  // If feature disabled, don't render (fallback to old behavior)
  if (!enabled || !isOpen) {
    return null
  }

  // Calculate confidence score if not provided
  // Heuristic based on content quality indicators
  const calculateConfidence = (): number => {
    if (confidenceScore !== undefined) return confidenceScore

    let score = 70 // Base score

    // Quality indicators
    const contentLength = generatedContent.length
    const hasProperCapitalization = /[A-Z]/.test(generatedContent)
    const hasPunctuation = /[.!?]/.test(generatedContent)
    const hasLegalTerms = /\b(Agreement|Party|Parties|Services|Terms|Conditions|Liability|Indemnify|Warranty)\b/.test(generatedContent)
    const hasNumberedPoints = /\d+\./.test(generatedContent)
    const hasBulletPoints = /[•\-\*]\s/.test(generatedContent)
    
    // Adjust score based on quality
    if (contentLength > 100) score += 5
    if (contentLength > 300) score += 5
    if (hasProperCapitalization) score += 5
    if (hasPunctuation) score += 5
    if (hasLegalTerms) score += 10
    if (hasNumberedPoints || hasBulletPoints) score += 5
    
    // Cap at 95 (never 100% confident with AI)
    return Math.min(95, score)
  }

  const confidence = calculateConfidence()
  const isHighConfidence = confidence >= 80
  const isMediumConfidence = confidence >= 60 && confidence < 80
  const isLowConfidence = confidence < 60

  const handleAccept = async () => {
    try {
      setIsAccepting(true)
      const edits = editedContent !== generatedContent ? editedContent : undefined
      await onAccept(editedContent, edits, userFeedback)
      // Modal will close via parent component
    } catch (error) {
      console.error('Failed to accept AI content:', error)
      alert('Failed to accept content. Please try again.')
    } finally {
      setIsAccepting(false)
    }
  }

  const handleRegenerate = async () => {
    setUserFeedback(null) // Reset feedback
    await onRegenerate()
  }

  const hasBeenEdited = editedContent !== generatedContent
  const wordCount = editedContent.trim().split(/\s+/).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">AI-Generated Content Preview</h2>
              <p className="text-sm text-gray-500">Review and approve before inserting into document</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Confidence Badge */}
            <div className={`px-3 py-1.5 rounded-full flex items-center gap-2 text-sm font-semibold ${
              isHighConfidence 
                ? 'bg-green-100 text-green-700' 
                : isMediumConfidence 
                ? 'bg-yellow-100 text-yellow-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {isHighConfidence ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : isMediumConfidence ? (
                <AlertCircle className="w-4 h-4" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
              <span>{confidence}% Confidence</span>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              disabled={isAccepting || isRegenerating}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Warning Banner (always show for AI content) */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-yellow-900">AI-Generated Content - Review Required</p>
              <p className="text-sm text-yellow-700 mt-1">
                This content was generated by AI. Please carefully review for accuracy, completeness, 
                and appropriateness before accepting. You can edit the content below if needed.
              </p>
            </div>
          </div>

          {/* Context Information */}
          <Card className="p-4 bg-gray-50">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold text-gray-700">Template:</span>
                <p className="text-gray-900 mt-1 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  {templateName}
                </p>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Placeholder:</span>
                <p className="text-gray-900 mt-1 font-mono text-xs bg-gray-200 px-2 py-1 rounded inline-block">
                  {placeholder}
                </p>
              </div>
            </div>
            
            {/* Prompt Display (Collapsible) */}
            <div className="mt-4 border-t pt-4">
              <button
                onClick={() => setShowRawPrompt(!showRawPrompt)}
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900"
              >
                <Eye className="w-4 h-4" />
                {showRawPrompt ? 'Hide' : 'Show'} Original Prompt
              </button>
              {showRawPrompt && (
                <div className="mt-2 p-3 bg-white border rounded text-sm text-gray-700 whitespace-pre-wrap">
                  {prompt}
                </div>
              )}
            </div>
          </Card>

          {/* Generated Content Preview/Editor */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-700">
                Generated Content {hasBeenEdited && <span className="text-blue-600">(Edited)</span>}
              </label>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>{wordCount} words</span>
                <span>{editedContent.length} characters</span>
              </div>
            </div>
            
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-none"
              placeholder="AI-generated content will appear here..."
            />
            
            {hasBeenEdited && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <AlertCircle className="w-4 h-4" />
                <span>You have edited this content. Your changes will be saved.</span>
              </div>
            )}
          </div>

          {/* Feedback Buttons */}
          <div className="flex items-center gap-4 pt-2">
            <span className="text-sm font-semibold text-gray-700">Quality Feedback:</span>
            <div className="flex gap-2">
              <Button
                variant={userFeedback === 'positive' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUserFeedback('positive')}
                className="flex items-center gap-2"
              >
                <ThumbsUp className="w-4 h-4" />
                Good
              </Button>
              <Button
                variant={userFeedback === 'negative' ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => setUserFeedback('negative')}
                className="flex items-center gap-2"
              >
                <ThumbsDown className="w-4 h-4" />
                Needs Work
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex flex-col sm:flex-row gap-2 justify-end">
          {/* Cancel */}
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isAccepting || isRegenerating}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>

          {/* Regenerate */}
          <Button
            variant="outline"
            onClick={handleRegenerate}
            disabled={isAccepting || isRegenerating}
            className="w-full sm:w-auto flex items-center gap-2"
          >
            {isRegenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Regenerating...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Regenerate
              </>
            )}
          </Button>

          {/* Accept */}
          <Button
            onClick={handleAccept}
            disabled={isAccepting || isRegenerating || !editedContent.trim()}
            className="w-full sm:w-auto flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isAccepting ? (
              <>
                <Zap className="w-4 h-4 animate-pulse" />
                Accepting...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Accept & Insert
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
