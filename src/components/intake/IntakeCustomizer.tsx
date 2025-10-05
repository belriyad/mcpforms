'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import {
  Settings,
  Plus,
  FileText,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';

import OverrideCreator from './OverrideCreator';
import AIClauseGenerator from './AIClauseGenerator';
import OverrideApprovalPanel from './OverrideApprovalPanel';
import EffectiveSchemaViewer from './EffectiveSchemaViewer';
import { getFunctions, httpsCallable } from 'firebase/functions';

interface Service {
  id: string;
  name: string;
  template_id: string;
  active: boolean;
}

interface CustomerOverride {
  id: string;
  customer_id: string;
  service_id: string;
  override_type: 'add_field' | 'remove_field' | 'modify_field' | 'custom_clause';
  target_field?: string;
  new_field?: any;
  modifications?: any;
  custom_clause?: {
    text: string;
    position: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  created_at: Date;
  reviewed_at?: Date;
  reviewed_by?: string;
}

interface IntakeCustomizerProps {
  customerId: string;
  serviceId?: string;
}

export default function IntakeCustomizer({ customerId, serviceId: initialServiceId }: IntakeCustomizerProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(initialServiceId || null);
  const [overrides, setOverrides] = useState<CustomerOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overrides');
  const { toast } = useToast();

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    if (selectedService) {
      loadOverrides();
    }
  }, [selectedService]);

  const loadServices = async () => {
    try {
      // Mock services for now since listServices function might not exist
      const mockServices: Service[] = [
        {
          id: 'service_001',
          name: 'Employment Contract',
          template_id: 'template_001',
          active: true,
        },
        {
          id: 'service_002',
          name: 'Non-Disclosure Agreement',
          template_id: 'template_002',
          active: true,
        },
        {
          id: 'service_003',
          name: 'Consulting Agreement',
          template_id: 'template_003',
          active: true,
        },
      ];

      setServices(mockServices);
      if (!selectedService && mockServices.length > 0) {
        setSelectedService(mockServices[0].id);
      }
      setLoading(false);
    } catch (error: any) {
      console.error('Error loading services:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load services',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const loadOverrides = async () => {
    if (!selectedService) return;

    try {
      const functions = getFunctions();
      const getOverrides = httpsCallable(functions, 'getOverrides');
      const result: any = await getOverrides({
        customerId,
        serviceId: selectedService,
      });

      if (result.data.success) {
        setOverrides(result.data.data.overrides || []);
      }
    } catch (error: any) {
      console.error('Error loading overrides:', error);
      // Mock empty overrides for now
      setOverrides([]);
    }
  };

  const handleOverrideCreated = (override: CustomerOverride) => {
    setOverrides([override, ...overrides]);
    toast({
      title: 'Override Created',
      description: 'Your customization has been submitted for approval',
    });
  };

  const handleOverrideApproved = (overrideId: string) => {
    setOverrides(
      overrides.map((o) =>
        o.id === overrideId ? { ...o, status: 'approved' as const } : o
      )
    );
  };

  const handleOverrideRejected = (overrideId: string) => {
    setOverrides(
      overrides.map((o) =>
        o.id === overrideId ? { ...o, status: 'rejected' as const } : o
      )
    );
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: 'secondary' as const, icon: Clock },
      approved: { variant: 'default' as const, icon: CheckCircle },
      rejected: { variant: 'destructive' as const, icon: AlertCircle },
    };
    const config = variants[status as keyof typeof variants] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        <Icon className="w-3 h-3" />
        <span className="capitalize">{status}</span>
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Loading customizer...</p>
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
              <Settings className="w-8 h-8 text-blue-600" />
              <div>
                <CardTitle>Intake Customizer</CardTitle>
                <CardDescription>
                  Customize your intake forms with additional fields and custom clauses
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Service Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Service</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {services.map((service) => (
              <button
                key={service.id}
                onClick={() => setSelectedService(service.id)}
                className={`p-4 border rounded-lg text-left transition-all ${
                  selectedService === service.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold">{service.name}</span>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      {selectedService && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overrides">
              <FileText className="w-4 h-4 mr-2" />
              My Overrides
            </TabsTrigger>
            <TabsTrigger value="create">
              <Plus className="w-4 h-4 mr-2" />
              Create Override
            </TabsTrigger>
            <TabsTrigger value="ai">
              <MessageSquare className="w-4 h-4 mr-2" />
              AI Clause Generator
            </TabsTrigger>
            <TabsTrigger value="preview">
              <FileText className="w-4 h-4 mr-2" />
              Effective Schema
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overrides" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Customizations</CardTitle>
                <CardDescription>
                  View and manage your custom fields and clauses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {overrides.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <AlertCircle className="w-12 h-12 mx-auto mb-4" />
                        <p>No customizations yet</p>
                        <p className="text-sm">
                          Use the "Create Override" tab to add custom fields
                        </p>
                      </div>
                    ) : (
                      overrides.map((override) => (
                        <div key={override.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-semibold capitalize">
                                  {override.override_type.replace('_', ' ')}
                                </span>
                                {getStatusBadge(override.status)}
                              </div>
                              {override.target_field && (
                                <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                                  {override.target_field}
                                </code>
                              )}
                            </div>
                          </div>

                          {override.custom_clause && (
                            <div className="mt-2 p-3 bg-gray-50 rounded">
                              <p className="text-sm">{override.custom_clause.text}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Position: {override.custom_clause.position}
                              </p>
                            </div>
                          )}

                          <div className="mt-2 text-xs text-gray-500">
                            Created: {new Date(override.created_at).toLocaleDateString()}
                            {override.reviewed_at && (
                              <> • Reviewed: {new Date(override.reviewed_at).toLocaleDateString()}</>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {overrides.some((o) => o.status === 'pending') && (
              <OverrideApprovalPanel
                customerId={customerId}
                serviceId={selectedService}
                overrides={overrides.filter((o) => o.status === 'pending')}
                onApprove={handleOverrideApproved}
                onReject={handleOverrideRejected}
              />
            )}
          </TabsContent>

          <TabsContent value="create">
            <OverrideCreator
              customerId={customerId}
              serviceId={selectedService}
              onOverrideCreated={handleOverrideCreated}
            />
          </TabsContent>

          <TabsContent value="ai">
            <AIClauseGenerator
              customerId={customerId}
              serviceId={selectedService}
              onClauseGenerated={handleOverrideCreated}
            />
          </TabsContent>

          <TabsContent value="preview">
            <EffectiveSchemaViewer
              customerId={customerId}
              serviceId={selectedService}
              overrides={overrides.filter((o) => o.status === 'approved')}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
