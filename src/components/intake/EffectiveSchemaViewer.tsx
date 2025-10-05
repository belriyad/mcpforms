'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { FileText, Plus, Edit, AlertCircle } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';

interface CustomerOverride {
  id: string;
  override_type: string;
  target_field?: string;
  new_field?: any;
  modifications?: any;
  custom_clause?: {
    text: string;
    position: string;
  };
}

interface EffectiveSchemaViewerProps {
  customerId: string;
  serviceId: string;
  overrides: CustomerOverride[];
}

interface Field {
  field_key: string;
  label: string;
  type: string;
  required: boolean;
  description?: string;
  source: 'base' | 'override';
}

export default function EffectiveSchemaViewer({
  customerId,
  serviceId,
  overrides,
}: EffectiveSchemaViewerProps) {
  const [effectiveSchema, setEffectiveSchema] = useState<{
    fields: Field[];
    custom_clauses: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadEffectiveSchema();
  }, [customerId, serviceId, overrides]);

  const loadEffectiveSchema = async () => {
    try {
      setLoading(true);
      const functions = getFunctions();

      const getSchema = httpsCallable(functions, 'getEffectiveSchema');
      const result: any = await getSchema({
        customerId,
        serviceId,
      });

      if (result.data.success) {
        setEffectiveSchema(result.data.data);
      } else {
        throw new Error(result.data.error || 'Failed to load schema');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load effective schema',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getFieldIcon = (source: string) => {
    return source === 'override' ? (
      <Plus className="w-4 h-4 text-green-600" />
    ) : (
      <FileText className="w-4 h-4 text-gray-400" />
    );
  };

  const getFieldBadge = (source: string) => {
    return source === 'override' ? (
      <Badge className="bg-green-100 text-green-800">Custom</Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800">Base</Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          Loading effective schema...
        </CardContent>
      </Card>
    );
  }

  if (!effectiveSchema) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
          <p className="text-gray-600">Failed to load schema</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Fields Section */}
      <Card>
        <CardHeader>
          <CardTitle>Effective Schema</CardTitle>
          <CardDescription>
            This shows your final intake form with base fields and approved customizations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3">
              {effectiveSchema.fields.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4" />
                  <p>No fields in schema</p>
                </div>
              ) : (
                effectiveSchema.fields.map((field) => (
                  <div key={field.field_key} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        {getFieldIcon(field.source)}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-semibold">{field.label}</span>
                            {getFieldBadge(field.source)}
                            <Badge className="bg-blue-100 text-blue-800">{field.type}</Badge>
                            {field.required && (
                              <Badge className="bg-red-100 text-red-800">Required</Badge>
                            )}
                          </div>
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                            {field.field_key}
                          </code>
                          {field.description && (
                            <p className="text-sm text-gray-600 mt-2">{field.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Custom Clauses Section */}
      {effectiveSchema.custom_clauses && effectiveSchema.custom_clauses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Custom Clauses</CardTitle>
            <CardDescription>
              Additional clauses added to your documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {effectiveSchema.custom_clauses.map((clause, index) => (
                <div key={index} className="border rounded-lg p-4 bg-green-50">
                  <div className="flex items-start space-x-2 mb-2">
                    <FileText className="w-4 h-4 text-green-600 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-semibold text-sm text-gray-700">
                          Custom Clause #{index + 1}
                        </span>
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          Position: {clause.position}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{clause.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-900">
                {effectiveSchema.fields.filter((f) => f.source === 'base').length}
              </p>
              <p className="text-sm text-blue-700">Base Fields</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-900">
                {effectiveSchema.fields.filter((f) => f.source === 'override').length}
              </p>
              <p className="text-sm text-green-700">Custom Fields</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-900">
                {effectiveSchema.custom_clauses?.length || 0}
              </p>
              <p className="text-sm text-purple-700">Custom Clauses</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
