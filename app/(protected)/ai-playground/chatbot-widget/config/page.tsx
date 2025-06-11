'use client';

import { Suspense } from 'react';
import { BotConfigurationSection } from '@/lib/chatbot-widget/presentation/components/admin/BotConfigurationSection';

export default function ChatbotConfigPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<div>Loading configuration...</div>}>
        <BotConfigurationSection />
      </Suspense>
    </div>
  );
} 