'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  MapPin,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useToast } from '@/components/ui/use-toast';
import type { Placeholder } from '@/types/template';

interface PlaceholderEditorProps {
  placeholders: Placeholder[];
  onChange: (placeholders: Placeholder[]) => void;
  readOnly: boolean;
  templateId: string;
}

export default function PlaceholderEditor({
  placeholders,
  onChange,
  readOnly,
  templateId,
}: PlaceholderEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Placeholder | null>(null);
  const [suggestingFor, setSuggestingFor] = useState<string | null>(null);
  const { toast } = useToast();
  const functions = getFunctions();

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditForm({ ...placeholders[index] });
  };

  const handleSave = () => {
    if (editForm && editingIndex !== null) {
      const updated = [...placeholders];
      updated[editingIndex] = editForm;
      onChange(updated);
      setEditingIndex(null);
      setEditForm(null);
    }
  };

  const handleCancel = () => {
    setEditingIndex(null);
    setEditForm(null);
  };

  const handleDelete = (index: number) => {
    const updated = placeholders.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleAdd = () => {
    const newPlaceholder: Placeholder = {
      field_key: `new_field_${Date.now()}`,
      label: 'New Field',
      type: 'text',
      required: false,
      locations: [],
    };
    onChange([...placeholders, newPlaceholder]);
    setEditingIndex(placeholders.length);
    setEditForm(newPlaceholder);
  };

  const getAISuggestion = async (fieldKey: string) => {
    try {
      setSuggestingFor(fieldKey);
      const suggestPlaceholder = httpsCallable(functions, 'suggestPlaceholder');
      const result: any = await suggestPlaceholder({
        templateId,
        field_key: fieldKey,
        context: {
          existingFields: placeholders.map((p) => p.field_key),
        },
      });

      if (result.data.success && result.data.data) {
        toast({
          title: 'AI Suggestion',
          description: `Suggested type: ${result.data.data.type}, Description: ${result.data.data.description}`,
        });

        // Apply suggestion if editing
        if (editForm && editForm.field_key === fieldKey) {
          setEditForm({
            ...editForm,
            type: result.data.data.type || editForm.type,
            description: result.data.data.description || editForm.description,
          });
        }
      }
    } catch (error: any) {
      toast({
        title: 'AI Error',
        description: error.message || 'Failed to get AI suggestion',
        variant: 'destructive',
      });
    } finally {
      setSuggestingFor(null);
    }
  };

  const getFieldTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      text: 'bg-blue-100 text-blue-800',
      number: 'bg-green-100 text-green-800',
      date: 'bg-purple-100 text-purple-800',
      email: 'bg-yellow-100 text-yellow-800',
      phone: 'bg-orange-100 text-orange-800',
      address: 'bg-red-100 text-red-800',
      currency: 'bg-emerald-100 text-emerald-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Placeholders</CardTitle>
            <CardDescription>
              Manage fields that will be filled in during intake
            </CardDescription>
          </div>
          {!readOnly && (
            <Button onClick={handleAdd} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Field
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {placeholders.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-4" />
                <p>No placeholders defined yet</p>
                {!readOnly && <p className="text-sm">Click "Add Field" to get started</p>}
              </div>
            ) : (
              placeholders.map((placeholder, index) => (
                <div
                  key={placeholder.field_key}
                  className="border rounded-lg p-4 space-y-3"
                >
                  {editingIndex === index ? (
                    // Edit Mode
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Field Key</Label>
                          <Input
                            value={editForm?.field_key || ''}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm!,
                                field_key: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label>Label</Label>
                          <Input
                            value={editForm?.label || ''}
                            onChange={(e) =>
                              setEditForm({ ...editForm!, label: e.target.value })
                            }
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Type</Label>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={editForm?.type || 'text'}
                            onChange={(e) =>
                              setEditForm({ ...editForm!, type: e.target.value })
                            }
                          >
                            <option value="text">Text</option>
                            <option value="number">Number</option>
                            <option value="date">Date</option>
                            <option value="email">Email</option>
                            <option value="phone">Phone</option>
                            <option value="address">Address</option>
                            <option value="currency">Currency</option>
                          </select>
                        </div>
                        <div className="flex items-end">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={editForm?.required || false}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm!,
                                  required: e.target.checked,
                                })
                              }
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm">Required</span>
                          </label>
                        </div>
                      </div>

                      <div>
                        <Label>Description</Label>
                        <Input
                          value={editForm?.description || ''}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm!,
                              description: e.target.value,
                            })
                          }
                          placeholder="Optional description"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button onClick={handleSave} size="sm">
                          <Save className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                        <Button onClick={handleCancel} size="sm" variant="outline">
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                        <Button
                          onClick={() => getAISuggestion(placeholder.field_key)}
                          size="sm"
                          variant="secondary"
                          disabled={suggestingFor === placeholder.field_key}
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          {suggestingFor === placeholder.field_key
                            ? 'Getting AI Suggestion...'
                            : 'AI Suggest'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-semibold">{placeholder.label}</h4>
                            <Badge className={getFieldTypeColor(placeholder.type)}>
                              {placeholder.type}
                            </Badge>
                            {placeholder.required && (
                              <Badge variant="destructive">Required</Badge>
                            )}
                            {placeholder.confidence && placeholder.confidence < 0.7 && (
                              <Badge variant="secondary">
                                Low Confidence: {Math.round(placeholder.confidence * 100)}%
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            <code className="bg-gray-100 px-2 py-1 rounded">
                              {placeholder.field_key}
                            </code>
                          </p>
                          {placeholder.description && (
                            <p className="text-sm text-gray-500">
                              {placeholder.description}
                            </p>
                          )}
                          {placeholder.locations && placeholder.locations.length > 0 && (
                            <div className="mt-2 flex items-center space-x-1 text-xs text-gray-500">
                              <MapPin className="w-3 h-3" />
                              <span>
                                {placeholder.locations.length} location
                                {placeholder.locations.length > 1 ? 's' : ''} in document
                              </span>
                            </div>
                          )}
                        </div>
                        {!readOnly && (
                          <div className="flex items-center space-x-2">
                            <Button
                              onClick={() => handleEdit(index)}
                              size="sm"
                              variant="ghost"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => handleDelete(index)}
                              size="sm"
                              variant="ghost"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
