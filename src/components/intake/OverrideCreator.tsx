'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Save } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';

interface OverrideCreatorProps {
  customerId: string;
  serviceId: string;
  onOverrideCreated: (override: any) => void;
}

export default function OverrideCreator({
  customerId,
  serviceId,
  onOverrideCreated,
}: OverrideCreatorProps) {
  const [overrideType, setOverrideType] = useState<'add_field' | 'modify_field' | 'custom_clause'>(
    'add_field'
  );
  const [fieldKey, setFieldKey] = useState('');
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldType, setFieldType] = useState('text');
  const [required, setRequired] = useState(false);
  const [description, setDescription] = useState('');
  const [clauseText, setClauseText] = useState('');
  const [clausePosition, setClausePosition] = useState('end');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    try {
      setSaving(true);
      const functions = getFunctions();

      let overrideData: any = {
        customerId,
        serviceId,
        override_type: overrideType,
      };

      if (overrideType === 'add_field') {
        if (!fieldKey || !fieldLabel) {
          toast({
            title: 'Validation Error',
            description: 'Please fill in field key and label',
            variant: 'destructive',
          });
          return;
        }

        overrideData.new_field = {
          field_key: fieldKey,
          label: fieldLabel,
          type: fieldType,
          required,
          description,
        };
      } else if (overrideType === 'custom_clause') {
        if (!clauseText) {
          toast({
            title: 'Validation Error',
            description: 'Please enter clause text',
            variant: 'destructive',
          });
          return;
        }

        overrideData.custom_clause = {
          text: clauseText,
          position: clausePosition,
        };
      }

      const createOverride = httpsCallable(functions, 'createCustomerOverride');
      const result: any = await createOverride(overrideData);

      if (result.data.success) {
        toast({
          title: 'Override Created',
          description: 'Your customization has been submitted for approval',
        });

        // Reset form
        setFieldKey('');
        setFieldLabel('');
        setFieldType('text');
        setRequired(false);
        setDescription('');
        setClauseText('');
        setClausePosition('end');

        onOverrideCreated(result.data.data);
      } else {
        toast({
          title: 'Error',
          description: result.data.error || 'Failed to create override',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create override',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Custom Override</CardTitle>
        <CardDescription>
          Add custom fields or clauses to your intake form
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Override Type Selector */}
        <div>
          <Label>Override Type</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-2"
            value={overrideType}
            onChange={(e) => setOverrideType(e.target.value as any)}
          >
            <option value="add_field">Add Field</option>
            <option value="modify_field">Modify Field</option>
            <option value="custom_clause">Custom Clause</option>
          </select>
        </div>

        {/* Add Field Form */}
        {overrideType === 'add_field' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Field Key</Label>
                <Input
                  value={fieldKey}
                  onChange={(e) => setFieldKey(e.target.value)}
                  placeholder="e.g., custom_field_1"
                />
              </div>
              <div>
                <Label>Field Label</Label>
                <Input
                  value={fieldLabel}
                  onChange={(e) => setFieldLabel(e.target.value)}
                  placeholder="e.g., Special Instructions"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Field Type</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-2"
                  value={fieldType}
                  onChange={(e) => setFieldType(e.target.value)}
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
                    checked={required}
                    onChange={(e) => setRequired(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Required</span>
                </label>
              </div>
            </div>

            <div>
              <Label>Description (Optional)</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Help text for this field"
              />
            </div>
          </div>
        )}

        {/* Custom Clause Form */}
        {overrideType === 'custom_clause' && (
          <div className="space-y-4">
            <div>
              <Label>Clause Text</Label>
              <textarea
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-2"
                value={clauseText}
                onChange={(e) => setClauseText(e.target.value)}
                placeholder="Enter your custom clause text..."
              />
            </div>

            <div>
              <Label>Position in Document</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-2"
                value={clausePosition}
                onChange={(e) => setClausePosition(e.target.value)}
              >
                <option value="start">Beginning</option>
                <option value="end">End</option>
                <option value="before_signature">Before Signature</option>
              </select>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <Button onClick={handleSubmit} disabled={saving} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Creating...' : 'Create Override'}
        </Button>
      </CardContent>
    </Card>
  );
}
