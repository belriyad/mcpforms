'use client';

/**
 * Prompt Library Component
 * Feature #12: Prompt Library
 * 
 * Browse and select from saved AI prompts
 */

import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, TrendingUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AIPrompt, getPrompts, deletePrompt } from '@/lib/prompts-client';
import { isFeatureEnabled } from '@/lib/feature-flags';

interface PromptLibraryProps {
  userId: string;
  onSelect: (prompt: AIPrompt) => void;
  onEdit?: (prompt: AIPrompt) => void;
  onClose?: () => void;
  embedded?: boolean; // If true, shown as embedded component; if false, as modal
}

type CategoryFilter = 'all' | 'contract' | 'clause' | 'general';

export default function PromptLibrary({ 
  userId, 
  onSelect, 
  onEdit,
  onClose,
  embedded = false 
}: PromptLibraryProps) {
  const [prompts, setPrompts] = useState<AIPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Check if feature is enabled
  const featureEnabled = isFeatureEnabled('promptLibrary');

  // Load prompts
  useEffect(() => {
    if (!featureEnabled) return;
    
    loadPrompts();
  }, [userId, featureEnabled]);

  const loadPrompts = async () => {
    setLoading(true);
    try {
      const data = await getPrompts(userId);
      setPrompts(data);
    } catch (error) {
      console.error('Failed to load prompts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (promptId: string) => {
    try {
      await deletePrompt(userId, promptId);
      setPrompts(prev => prev.filter(p => p.id !== promptId));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete prompt:', error);
      alert('Failed to delete prompt. Please try again.');
    }
  };

  // Filter prompts
  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         prompt.body.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || prompt.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Sort by usage count (most used first), then by date
  const sortedPrompts = [...filteredPrompts].sort((a, b) => {
    const usageA = a.usageCount || 0;
    const usageB = b.usageCount || 0;
    if (usageA !== usageB) return usageB - usageA;
    
    const dateA = a.createdAt?.toDate?.() || new Date(0);
    const dateB = b.createdAt?.toDate?.() || new Date(0);
    return dateB.getTime() - dateA.getTime();
  });

  if (!featureEnabled) {
    return null;
  }

  const content = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Prompt Library</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Search and Filter */}
      <div className="space-y-3 mb-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search prompts..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto">
          {(['all', 'contract', 'clause', 'general'] as CategoryFilter[]).map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Prompts List */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">
          Loading prompts...
        </div>
      ) : sortedPrompts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchQuery || categoryFilter !== 'all' ? (
            <p>No prompts match your filters.</p>
          ) : (
            <div className="space-y-2">
              <p>No saved prompts yet.</p>
              <p className="text-sm">Create your first prompt to get started!</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {sortedPrompts.map(prompt => (
            <Card key={prompt.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Title and Category */}
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900 truncate">
                      {prompt.title}
                    </h4>
                    {prompt.category && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                        {prompt.category}
                      </span>
                    )}
                  </div>

                  {/* Preview */}
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                    {prompt.body}
                  </p>

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {prompt.placeholder && (
                      <span className="flex items-center gap-1">
                        <span className="text-gray-400">For:</span>
                        <code className="bg-gray-100 px-1 py-0.5 rounded">
                          {prompt.placeholder}
                        </code>
                      </span>
                    )}
                    {(prompt.usageCount || 0) > 0 && (
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        Used {prompt.usageCount}x
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSelect(prompt)}
                    className="text-xs"
                  >
                    Use
                  </Button>
                  {onEdit && (
                    <button
                      onClick={() => onEdit(prompt)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      title="Edit prompt"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setDeleteConfirm(prompt.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete prompt"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Delete Confirmation */}
              {deleteConfirm === prompt.id && (
                <div className="mt-3 pt-3 border-t flex items-center justify-between">
                  <span className="text-sm text-gray-700">Delete this prompt?</span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDeleteConfirm(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDelete(prompt.id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Stats Footer */}
      {sortedPrompts.length > 0 && (
        <div className="mt-4 pt-4 border-t text-xs text-gray-500 text-center">
          Showing {sortedPrompts.length} of {prompts.length} prompt{prompts.length !== 1 ? 's' : ''}
        </div>
      )}
    </>
  );

  if (embedded) {
    return <div>{content}</div>;
  }

  // Modal version
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        {content}
      </Card>
    </div>
  );
}
