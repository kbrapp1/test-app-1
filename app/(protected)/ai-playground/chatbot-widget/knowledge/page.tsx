'use client';

import { Suspense } from 'react';
import { KnowledgeBaseSection } from '@/lib/chatbot-widget/presentation/components/admin/KnowledgeBaseSection';

export default function KnowledgeBasePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Knowledge Base</h2>
        <p className="text-muted-foreground">
          Manage your chatbot's knowledge base including company information, FAQs, and support documentation.
        </p>
      </div>
      
      <Suspense fallback={<div>Loading knowledge base...</div>}>
        <KnowledgeBaseSection />
      </Suspense>
    </div>
  );
} 