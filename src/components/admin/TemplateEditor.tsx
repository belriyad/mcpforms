'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { 
  FileText, 
  Edit, 
  History, 
  Lock, 
  Unlock, 
  Eye, 
  Save, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Sparkles
} from 'lucide-react';

import PlaceholderEditor from './PlaceholderEditor';
import VersionHistory from './VersionHistory';
import AIAssistant from './AIAssistant';
import { getFunctions, httpsCallable } from 'firebase/functions';
import type { Template, Placeholder } from '@/types/template';

interface TemplateEditorProps {
  templateId: string;
  onClose?: () => void;
}

export default function TemplateEditor({ templateId, onClose }: TemplateEditorProps) {
  const [template, setTemplate] = useState<Template | null>(null);
  const [placeholders, setPlaceholders] = useState<Placeholder[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockHolder, setLockHolder] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('editor');
  const { toast } = useToast();

  const functions = getFunctions();

  // Load template data
  useEffect(() => {
    loadTemplate();
  }, [templateId]);

  // Auto-refresh lock every 2 minutes
  useEffect(() => {
    if (isLocked) {
      const interval = setInterval(() => {
        refreshLock();
      }, 2 * 60 * 1000); // 2 minutes

      return () => clearInterval(interval);
    }
  }, [isLocked]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      const getTemplate = httpsCallable(functions, 'getTemplate');
      const result: any = await getTemplate({ templateId });

      if (result.data.success) {
        setTemplate(result.data.data);
        
        // Load latest version placeholders
        if (result.data.data.currentVersion) {
          await loadPlaceholders(result.data.data.currentVersion);
        }

        // Check lock status
        await checkLock();
      } else {
        toast({
          title: 'Error',
          description: result.data.error || 'Failed to load template',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load template',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPlaceholders = async (version: number) => {
    try {
      const getTemplateVersion = httpsCallable(functions, 'getTemplateVersion');
      const result: any = await getTemplateVersion({ templateId, version });

      if (result.data.success) {
        setPlaceholders(result.data.data.placeholders || []);
      }
    } catch (error: any) {
      console.error('Failed to load placeholders:', error);
    }
  };

  const checkLock = async () => {
    try {
      const checkTemplateLock = httpsCallable(functions, 'checkTemplateLock');
      const result: any = await checkTemplateLock({ templateId });

      if (result.data.success) {
        setIsLocked(result.data.data.isLocked);
        setLockHolder(result.data.data.lockedBy || null);
      }
    } catch (error: any) {
      console.error('Failed to check lock:', error);
    }
  };

  const acquireLock = async () => {
    try {
      const acquireTemplateLock = httpsCallable(functions, 'acquireTemplateLock');
      const result: any = await acquireTemplateLock({ templateId });

      if (result.data.success && result.data.data.acquired) {
        setIsLocked(true);
        setLockHolder('you');
        toast({
          title: 'Lock Acquired',
          description: 'You can now edit this template',
        });
      } else {
        toast({
          title: 'Lock Unavailable',
          description: `Template is locked by ${result.data.data.currentHolder}`,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to acquire lock',
        variant: 'destructive',
      });
    }
  };

  const releaseLock = async () => {
    try {
      const releaseTemplateLock = httpsCallable(functions, 'releaseTemplateLock');
      const result: any = await releaseTemplateLock({ templateId });

      if (result.data.success) {
        setIsLocked(false);
        setLockHolder(null);
        toast({
          title: 'Lock Released',
          description: 'Template is now available for others to edit',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to release lock',
        variant: 'destructive',
      });
    }
  };

  const refreshLock = async () => {
    if (!isLocked || lockHolder !== 'you') return;

    try {
      const acquireTemplateLock = httpsCallable(functions, 'acquireTemplateLock');
      await acquireTemplateLock({ templateId });
    } catch (error: any) {
      console.error('Failed to refresh lock:', error);
      toast({
        title: 'Lock Expired',
        description: 'Your edit lock has expired. Please reacquire to continue editing.',
        variant: 'destructive',
      });
      setIsLocked(false);
      setLockHolder(null);
    }
  };

  const saveVersion = async () => {
    if (!isLocked || lockHolder !== 'you') {
      toast({
        title: 'Cannot Save',
        description: 'You must acquire the edit lock first',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      const publishTemplateVersion = httpsCallable(functions, 'publishTemplateVersion');
      const result: any = await publishTemplateVersion({
        templateId,
        placeholders,
        reason: 'Updated via Template Editor',
      });

      if (result.data.success) {
        setHasChanges(false);
        toast({
          title: 'Saved Successfully',
          description: `Version ${result.data.data.version} created`,
        });
        await loadTemplate(); // Reload to get new version
      } else {
        toast({
          title: 'Save Failed',
          description: result.data.error || 'Failed to save version',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save version',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePlaceholderChange = (updatedPlaceholders: Placeholder[]) => {
    setPlaceholders(updatedPlaceholders);
    setHasChanges(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
        <p className="text-gray-600">Template not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <FileText className="w-8 h-8 text-blue-600" />
              <div>
                <CardTitle>{template.name}</CardTitle>
                <CardDescription>
                  {template.originalFileName} • Version {template.currentVersion || 0}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Lock Status */}
              {isLocked && lockHolder === 'you' ? (
                <Badge variant="default" className="flex items-center space-x-1">
                  <Lock className="w-3 h-3" />
                  <span>Editing</span>
                </Badge>
              ) : isLocked ? (
                <Badge variant="destructive" className="flex items-center space-x-1">
                  <Lock className="w-3 h-3" />
                  <span>Locked by {lockHolder}</span>
                </Badge>
              ) : (
                <Badge variant="outline" className="flex items-center space-x-1">
                  <Unlock className="w-3 h-3" />
                  <span>Available</span>
                </Badge>
              )}

              {/* Changes Indicator */}
              {hasChanges && (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>Unsaved Changes</span>
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {!isLocked || lockHolder !== 'you' ? (
            <Button onClick={acquireLock} disabled={isLocked && lockHolder !== 'you'}>
              <Lock className="w-4 h-4 mr-2" />
              Acquire Edit Lock
            </Button>
          ) : (
            <>
              <Button onClick={saveVersion} disabled={saving || !hasChanges} variant="default">
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Version'}
              </Button>
              <Button onClick={releaseLock} variant="outline">
                <Unlock className="w-4 h-4 mr-2" />
                Release Lock
              </Button>
            </>
          )}
        </div>
        {onClose && (
          <Button onClick={onClose} variant="ghost">
            Close
          </Button>
        )}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="editor">
            <Edit className="w-4 h-4 mr-2" />
            Editor
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="w-4 h-4 mr-2" />
            History
          </TabsTrigger>
          <TabsTrigger value="ai">
            <Sparkles className="w-4 h-4 mr-2" />
            AI Assistant
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-4">
          <PlaceholderEditor
            placeholders={placeholders}
            onChange={handlePlaceholderChange}
            readOnly={!isLocked || lockHolder !== 'you'}
            templateId={templateId}
          />
        </TabsContent>

        <TabsContent value="history">
          <VersionHistory templateId={templateId} currentVersion={template.currentVersion} />
        </TabsContent>

        <TabsContent value="ai">
          <AIAssistant
            templateId={templateId}
            placeholders={placeholders}
            onSuggestionApply={(suggestion: Placeholder) => {
              setPlaceholders([...placeholders, suggestion]);
              setHasChanges(true);
            }}
          />
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Template Preview</CardTitle>
              <CardDescription>
                Preview how the template will look with placeholder values
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Preview functionality coming soon. This will show the template with sample data filled in.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {placeholders.slice(0, 6).map((placeholder) => (
                    <div key={placeholder.field_key} className="p-4 border rounded-lg">
                      <Label className="text-xs text-gray-500">{placeholder.label}</Label>
                      <Input
                        placeholder={`Sample ${placeholder.type}`}
                        className="mt-2"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
