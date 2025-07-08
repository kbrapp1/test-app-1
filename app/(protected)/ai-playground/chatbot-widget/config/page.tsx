'use client';

import { Suspense } from 'react';
import { BotIdentityForm } from '@/lib/chatbot-widget/presentation/components/admin/configuration';

/**
 * Chatbot Config Page
 * 
 * AI INSTRUCTIONS:
 * - Feature flag protection is handled at layout level
 * - Focus on rendering the configuration form
 * - Client component for form interactions
 */
export default function ChatbotConfigPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Chatbot Configuration</h1>
        <p className="text-muted-foreground">
          Configure your chatbot&apos;s basic settings including name, description, personality, and status.
        </p>
      </div>
      
      <Suspense fallback={<div>Loading configuration...</div>}>
        <BotIdentityForm />
      </Suspense>
    </div>
  );
} 