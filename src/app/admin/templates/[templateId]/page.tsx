'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const TemplateEditor = dynamic(() => import('@/components/admin/TemplateEditor'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center min-h-screen">Loading...</div>
});

export default function TemplateEditorPage({ params }: { params: { templateId: string } }) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Button onClick={() => router.back()} variant="ghost">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Templates
          </Button>
        </div>

        <TemplateEditor
          templateId={params.templateId}
          onClose={() => router.back()}
        />
      </div>
    </div>
  );
}
