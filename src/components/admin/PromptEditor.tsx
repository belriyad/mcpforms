'use client';

/**
 * Prompt Editor Modal
 * Feature #12: Prompt Library
 * 
 * Modal for creating/editing AI prompts
 */

import { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AIPrompt } from '@/lib/prompts-client';

interface PromptEditorProps {
  prompt?: AIPrompt | null;
  onSave: (prompt: Omit<AIPrompt, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => Promise<void>;
  onClose: () => void;
}

export default function PromptEditor({ prompt, onSave, onClose }: PromptEditorProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [category, setCategory] = useState<'contract' | 'clause' | 'general'>('general');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Load existing prompt data
  useEffect(() => {
    if (prompt) {
      setTitle(prompt.title);
      setBody(prompt.body);
      setPlaceholder(prompt.placeholder || '');
      setCategory(prompt.category || 'general');
    }
  }, [prompt]);

  const handleSave = async () => {
    // Validation
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!body.trim()) {
      setError('Prompt body is required');
      return;
    }
    if (body.trim().length < 10) {
      setError('Prompt must be at least 10 characters');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await onSave({
        title: title.trim(),
        body: body.trim(),
        placeholder: placeholder.trim() || undefined,
        category,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save prompt');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {prompt ? 'Edit Prompt' : 'New Prompt'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={saving}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Standard Employment Contract Clause"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={saving}
              maxLength={100}
            />
            <div className="text-xs text-gray-500 mt-1">
              {title.length}/100 characters
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={saving}
            >
              <option value="general">General</option>
              <option value="contract">Contract</option>
              <option value="clause">Clause</option>
            </select>
          </div>

          {/* Placeholder (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Placeholder Name (optional)
            </label>
            <input
              type="text"
              value={placeholder}
              onChange={(e) => setPlaceholder(e.target.value)}
              placeholder="e.g., {{EMPLOYMENT_TERMS}}"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={saving}
              maxLength={50}
            />
            <div className="text-xs text-gray-500 mt-1">
              Used to associate this prompt with specific placeholders
            </div>
          </div>

          {/* Prompt Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prompt <span className="text-red-500">*</span>
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter your AI prompt here... Be specific and include context for best results."
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={saving}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{body.length} characters</span>
              <span className={body.length < 10 ? 'text-red-500' : ''}>
                Minimum 10 characters
              </span>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Tips for Good Prompts</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Be specific about the legal context and jurisdiction</li>
              <li>• Include desired tone (formal, conversational, etc.)</li>
              <li>• Specify length expectations (brief, detailed, etc.)</li>
              <li>• Reference relevant legal standards or precedents</li>
              <li>• Use placeholders like [CLIENT_NAME] for dynamic content</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !title.trim() || !body.trim() || body.trim().length < 10}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Prompt'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
