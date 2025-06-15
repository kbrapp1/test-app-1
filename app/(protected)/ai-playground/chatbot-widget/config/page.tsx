'use client';

import { Suspense } from 'react';
import { AdvancedParametersSection } from '@/lib/chatbot-widget/presentation/components/admin/configuration';

export default function ChatbotConfigPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<div>Loading configuration...</div>}>
        <AdvancedParametersSection />
      </Suspense>
    </div>
  );
} 