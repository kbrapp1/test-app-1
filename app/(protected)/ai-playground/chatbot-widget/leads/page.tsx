'use client';

import { Suspense } from 'react';
import { LeadSettingsSection } from '@/lib/chatbot-widget/presentation/components/admin/LeadSettingsSection';

export default function LeadSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Lead Settings</h2>
        <p className="text-muted-foreground">
          Configure how your chatbot captures and qualifies leads from website visitors.
        </p>
      </div>
      
      <Suspense fallback={<div>Loading lead settings...</div>}>
        <LeadSettingsSection />
      </Suspense>
    </div>
  );
} 