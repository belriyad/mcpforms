'use client';

/**
 * Prompt Library Management Page
 * Feature #12: Prompt Library
 * 
 * Full-page interface for managing AI prompts
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Download, Upload, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import PromptLibrary from '@/components/admin/PromptLibrary';
import PromptEditor from '@/components/admin/PromptEditor';
import { 
  AIPrompt, 
  getPrompts, 
  savePrompt, 
  updatePrompt,
  exportPromptsToJSON,
  importPromptsFromJSON 
} from '@/lib/prompts-client';
import { isFeatureEnabled } from '@/lib/feature-flags';

export default function PromptsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [prompts, setPrompts] = useState<AIPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<AIPrompt | null>(null);
  const [importing, setImporting] = useState(false);

  const featureEnabled = isFeatureEnabled('promptLibrary');

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/login');
      return;
    }

    if (!featureEnabled) {
      router.push('/admin');
      return;
    }

    loadPrompts();
  }, [user, authLoading, featureEnabled, router]);

  const loadPrompts = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const data = await getPrompts(user.uid);
      setPrompts(data);
    } catch (error) {
      console.error('Failed to load prompts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrompt = async (promptData: Omit<AIPrompt, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => {
    if (!user) return;

    try {
      if (editingPrompt) {
        // Update existing
        await updatePrompt(user.uid, editingPrompt.id, promptData);
      } else {
        // Create new
        await savePrompt(user.uid, promptData);
      }
      
      await loadPrompts();
      setShowEditor(false);
      setEditingPrompt(null);
    } catch (error) {
      console.error('Failed to save prompt:', error);
      throw error;
    }
  };

  const handleEdit = (prompt: AIPrompt) => {
    setEditingPrompt(prompt);
    setShowEditor(true);
  };

  const handleExport = () => {
    try {
      const json = exportPromptsToJSON(prompts);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prompts-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export prompts');
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !user) return;

      setImporting(true);
      try {
        const text = await file.text();
        const imported = importPromptsFromJSON(text);
        
        // Save all imported prompts
        for (const prompt of imported) {
          const { id, createdAt, updatedAt, usageCount, ...promptData } = prompt;
          await savePrompt(user.uid, promptData);
        }
        
        await loadPrompts();
        alert(`✅ Successfully imported ${imported.length} prompt(s)`);
      } catch (error) {
        console.error('Import failed:', error);
        alert(`❌ Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setImporting(false);
      }
    };
    input.click();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading prompts...</p>
        </div>
      </div>
    );
  }

  if (!featureEnabled) {
    return null;
  }

  // Calculate stats
  const totalUsage = prompts.reduce((sum, p) => sum + (p.usageCount || 0), 0);
  const mostUsed = [...prompts].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))[0];
  const byCategory = {
    contract: prompts.filter(p => p.category === 'contract').length,
    clause: prompts.filter(p => p.category === 'clause').length,
    general: prompts.filter(p => p.category === 'general').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin')}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Prompt Library</h1>
                <p className="text-gray-600 mt-1">Manage your AI prompt templates</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleExport}
                disabled={prompts.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                onClick={handleImport}
                disabled={importing}
              >
                <Upload className="w-4 h-4 mr-2" />
                {importing ? 'Importing...' : 'Import'}
              </Button>
              <Button
                onClick={() => {
                  setEditingPrompt(null);
                  setShowEditor(true);
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Prompt
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="text-sm text-gray-600 mb-1">Total Prompts</div>
            <div className="text-3xl font-bold text-gray-900">{prompts.length}</div>
          </Card>
          
          <Card className="p-6">
            <div className="text-sm text-gray-600 mb-1">Total Usage</div>
            <div className="text-3xl font-bold text-blue-600">{totalUsage}</div>
          </Card>
          
          <Card className="p-6">
            <div className="text-sm text-gray-600 mb-1">Most Used</div>
            <div className="text-lg font-semibold text-gray-900 truncate">
              {mostUsed ? `${mostUsed.title} (${mostUsed.usageCount}x)` : 'N/A'}
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="text-sm text-gray-600 mb-1">By Category</div>
            <div className="text-sm text-gray-700">
              Contract: {byCategory.contract} | Clause: {byCategory.clause} | General: {byCategory.general}
            </div>
          </Card>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">💡 How to use prompts</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Create reusable AI prompts for common legal sections</li>
                <li>Browse and insert saved prompts when generating AI content</li>
                <li>Export/import prompts to share with your team</li>
                <li>Track usage to identify your most valuable prompts</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Prompt Library Component */}
        <Card className="p-6">
          {user && (
            <PromptLibrary
              userId={user.uid}
              onSelect={() => {}}
              onEdit={handleEdit}
              embedded={true}
            />
          )}
        </Card>
      </div>

      {/* Editor Modal */}
      {showEditor && (
        <PromptEditor
          prompt={editingPrompt}
          onSave={handleSavePrompt}
          onClose={() => {
            setShowEditor(false);
            setEditingPrompt(null);
          }}
        />
      )}
    </div>
  );
}
