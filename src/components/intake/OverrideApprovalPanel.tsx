'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle, XCircle, Shield, AlertCircle } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';

interface CustomerOverride {
  id: string;
  override_type: string;
  target_field?: string;
  new_field?: any;
  custom_clause?: {
    text: string;
    position: string;
  };
  created_at: Date;
}

interface OverrideApprovalPanelProps {
  customerId: string;
  serviceId: string;
  overrides: CustomerOverride[];
  onApprove: (overrideId: string) => void;
  onReject: (overrideId: string) => void;
}

export default function OverrideApprovalPanel({
  customerId,
  serviceId,
  overrides,
  onApprove,
  onReject,
}: OverrideApprovalPanelProps) {
  const [processing, setProcessing] = useState<string | null>(null);
  const { toast } = useToast();

  const handleApprove = async (overrideId: string) => {
    try {
      setProcessing(overrideId);
      const functions = getFunctions();

      const approve = httpsCallable(functions, 'approveCustomerOverride');
      const result: any = await approve({
        overrideId,
        approved: true,
      });

      if (result.data.success) {
        toast({
          title: 'Override Approved',
          description: 'The customization is now active',
        });
        onApprove(overrideId);
      } else {
        throw new Error(result.data.error || 'Approval failed');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve override',
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (overrideId: string) => {
    if (!confirm('Are you sure you want to reject this customization?')) {
      return;
    }

    try {
      setProcessing(overrideId);
      const functions = getFunctions();

      const approve = httpsCallable(functions, 'approveCustomerOverride');
      const result: any = await approve({
        overrideId,
        approved: false,
      });

      if (result.data.success) {
        toast({
          title: 'Override Rejected',
          description: 'The customization has been rejected',
        });
        onReject(overrideId);
      } else {
        throw new Error(result.data.error || 'Rejection failed');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject override',
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
    }
  };

  if (overrides.length === 0) {
    return null;
  }

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-yellow-600" />
          <CardTitle className="text-yellow-900">Pending Approval</CardTitle>
        </div>
        <CardDescription className="text-yellow-700">
          These customizations are awaiting admin approval
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-3">
            {overrides.map((override) => (
              <div key={override.id} className="bg-white border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold capitalize">
                        {override.override_type.replace('_', ' ')}
                      </span>
                      <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                    </div>
                    {override.target_field && (
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {override.target_field}
                      </code>
                    )}
                  </div>
                </div>

                {override.new_field && (
                  <div className="mt-2 p-3 bg-gray-50 rounded">
                    <p className="text-sm font-semibold">{override.new_field.label}</p>
                    <p className="text-xs text-gray-500">
                      Type: {override.new_field.type} • Required: {override.new_field.required ? 'Yes' : 'No'}
                    </p>
                    {override.new_field.description && (
                      <p className="text-xs text-gray-600 mt-1">{override.new_field.description}</p>
                    )}
                  </div>
                )}

                {override.custom_clause && (
                  <div className="mt-2 p-3 bg-gray-50 rounded">
                    <p className="text-sm">{override.custom_clause.text}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Position: {override.custom_clause.position}
                    </p>
                  </div>
                )}

                <div className="mt-3 flex items-center space-x-2">
                  <Button
                    onClick={() => handleApprove(override.id)}
                    disabled={processing === override.id}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleReject(override.id)}
                    disabled={processing === override.id}
                    size="sm"
                    variant="destructive"
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
