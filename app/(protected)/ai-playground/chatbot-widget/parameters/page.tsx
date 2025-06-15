'use client';

import { AdvancedParametersSection } from '../../../../../lib/chatbot-widget/presentation/components/admin/configuration/AdvancedParametersSection';

export default function ParametersPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Advanced Parameters</h1>
        <p className="text-muted-foreground">
          Configure advanced AI behavior, performance settings, and monitoring parameters for your chatbot.
        </p>
      </div>
      
      <AdvancedParametersSection />
    </div>
  );
} 