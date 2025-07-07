'use client';

import { Suspense } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChatSimulator } from '@/lib/chatbot-widget/presentation/components/admin/simulation/ChatSimulator';
import { useOrganization } from '@/lib/organization/application/providers/OrganizationProvider';
import { useQuery } from '@tanstack/react-query';
import { getChatbotConfigByOrganization } from '@/lib/chatbot-widget/presentation/actions/configActions';

export default function TestingPage() {
  const { activeOrganizationId } = useOrganization();
  
  // Query for existing chatbot config
  const { data: configResult, isLoading, error } = useQuery({
    queryKey: ['chatbot-config', activeOrganizationId],
    queryFn: () => activeOrganizationId ? getChatbotConfigByOrganization(activeOrganizationId) : null,
    enabled: !!activeOrganizationId,
  });

  const existingConfig = configResult?.success ? configResult.data : null;


  if (isLoading) {
    return (
      <Alert>
        <AlertDescription>
          Loading chatbot configuration...
        </AlertDescription>
      </Alert>
    );
  }

  if (error || !existingConfig) {
    return (
      <Alert>
        <AlertDescription>
          No chatbot configuration found. Please create a configuration first in the Config tab.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Suspense fallback={<div>Loading simulator...</div>}>
      <ChatSimulator />
    </Suspense>
  );
} 