'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, GitBranch, RotateCcw, Eye, Clock, User } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

interface TemplateVersion {
  version: number;
  reason: string;
  createdAt: Date;
  createdBy: string;
  placeholders: any[];
  storageUrl: string;
  changesSummary?: {
    added: string[];
    removed: string[];
    modified: string[];
  };
}

interface VersionHistoryProps {
  templateId: string;
  currentVersion?: number;
}

export default function VersionHistory({ templateId, currentVersion }: VersionHistoryProps) {
  const [versions, setVersions] = useState<TemplateVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState<[number | null, number | null]>([null, null]);
  const [diffView, setDiffView] = useState<any>(null);
  const { toast } = useToast();
  const functions = getFunctions();

  useEffect(() => {
    loadVersions();
  }, [templateId]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      const listVersions = httpsCallable(functions, 'listTemplateVersions');
      const result: any = await listVersions({ templateId });

      if (result.data.success) {
        setVersions(result.data.data.versions || []);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load version history',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const rollbackToVersion = async (version: number) => {
    if (!confirm(`Are you sure you want to rollback to version ${version}?`)) {
      return;
    }

    try {
      const rollback = httpsCallable(functions, 'rollbackToVersion');
      const result: any = await rollback({ templateId, targetVersion: version });

      if (result.data.success) {
        toast({
          title: 'Rollback Successful',
          description: `Template rolled back to version ${version}`,
        });
        await loadVersions();
      } else {
        toast({
          title: 'Rollback Failed',
          description: result.data.error || 'Failed to rollback',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to rollback',
        variant: 'destructive',
      });
    }
  };

  const compareVersions = async () => {
    if (comparing[0] === null || comparing[1] === null) {
      toast({
        title: 'Select Versions',
        description: 'Please select two versions to compare',
        variant: 'destructive',
      });
      return;
    }

    try {
      const compare = httpsCallable(functions, 'compareVersions');
      const result: any = await compare({
        templateId,
        version1: comparing[0],
        version2: comparing[1],
      });

      if (result.data.success) {
        setDiffView(result.data.data);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to compare versions',
        variant: 'destructive',
      });
    }
  };

  const toggleCompareSelection = (version: number) => {
    if (comparing[0] === version) {
      setComparing([null, comparing[1]]);
    } else if (comparing[1] === version) {
      setComparing([comparing[0], null]);
    } else if (comparing[0] === null) {
      setComparing([version, comparing[1]]);
    } else if (comparing[1] === null) {
      setComparing([comparing[0], version]);
    } else {
      setComparing([version, null]);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          Loading version history...
        </CardContent>
      </Card>
    );
  }

  if (diffView) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Version Comparison: v{comparing[0]} vs v{comparing[1]}
            </CardTitle>
            <Button onClick={() => setDiffView(null)} variant="outline" size="sm">
              Close Diff
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {diffView.changesSummary?.added && diffView.changesSummary.added.length > 0 && (
              <div>
                <h4 className="font-semibold text-green-600 mb-2">Added Fields</h4>
                <div className="space-y-1">
                  {diffView.changesSummary.added.map((field: string) => (
                    <div key={field} className="bg-green-50 p-2 rounded">
                      <code className="text-sm">+ {field}</code>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {diffView.changesSummary?.removed && diffView.changesSummary.removed.length > 0 && (
              <div>
                <h4 className="font-semibold text-red-600 mb-2">Removed Fields</h4>
                <div className="space-y-1">
                  {diffView.changesSummary.removed.map((field: string) => (
                    <div key={field} className="bg-red-50 p-2 rounded">
                      <code className="text-sm">- {field}</code>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {diffView.changesSummary?.modified && diffView.changesSummary.modified.length > 0 && (
              <div>
                <h4 className="font-semibold text-blue-600 mb-2">Modified Fields</h4>
                <div className="space-y-1">
                  {diffView.changesSummary.modified.map((field: string) => (
                    <div key={field} className="bg-blue-50 p-2 rounded">
                      <code className="text-sm">~ {field}</code>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <History className="w-5 h-5" />
              <span>Version History</span>
            </CardTitle>
            <CardDescription>
              {versions.length} version{versions.length !== 1 ? 's' : ''} available
            </CardDescription>
          </div>
          {comparing[0] !== null && comparing[1] !== null && (
            <Button onClick={compareVersions} size="sm">
              <GitBranch className="w-4 h-4 mr-2" />
              Compare Selected
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {versions.map((version) => (
              <div
                key={version.version}
                className={`border rounded-lg p-4 ${
                  comparing.includes(version.version) ? 'border-blue-500 bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={comparing.includes(version.version)}
                      onChange={() => toggleCompareSelection(version.version)}
                      className="rounded border-gray-300"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold">Version {version.version}</h4>
                        {version.version === currentVersion && (
                          <Badge variant="default">Current</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{version.reason}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{format(new Date(version.createdAt), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <User className="w-3 h-3" />
                    <span>{version.createdBy}</span>
                  </div>
                </div>

                {version.changesSummary && (
                  <div className="flex items-center space-x-4 text-xs mb-3">
                    {version.changesSummary.added.length > 0 && (
                      <span className="text-green-600">
                        +{version.changesSummary.added.length} added
                      </span>
                    )}
                    {version.changesSummary.removed.length > 0 && (
                      <span className="text-red-600">
                        -{version.changesSummary.removed.length} removed
                      </span>
                    )}
                    {version.changesSummary.modified.length > 0 && (
                      <span className="text-blue-600">
                        ~{version.changesSummary.modified.length} modified
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => window.open(version.storageUrl, '_blank')}
                    size="sm"
                    variant="outline"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                  {version.version !== currentVersion && (
                    <Button
                      onClick={() => rollbackToVersion(version.version)}
                      size="sm"
                      variant="ghost"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Rollback
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
