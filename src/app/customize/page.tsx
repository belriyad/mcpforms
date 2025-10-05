'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Toaster } from '@/components/ui/toaster';

const IntakeCustomizer = dynamic(() => import('@/components/intake/IntakeCustomizer'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center min-h-screen">Loading...</div>
});

export default function CustomizePage() {
  // In production, get customerId from authentication
  const customerId = 'customer_123';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Customize Your Intake</h1>
          <p className="text-gray-600 mt-2">
            Add custom fields and clauses to your intake forms
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        <IntakeCustomizer customerId={customerId} />
      </div>

      <Toaster />
    </div>
  );
}
