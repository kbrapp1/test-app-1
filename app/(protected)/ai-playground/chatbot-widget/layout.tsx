import { ReactNode } from 'react';
import { Ban } from 'lucide-react';
import { getActiveOrganizationWithFlags } from '@/lib/organization/application/services/getActiveOrganizationWithFlags';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { ChatbotWidgetLayoutClient } from './layout-client';

/**
 * Chatbot Widget Layout (Server Component)
 * 
 * AI INSTRUCTIONS:
 * - Check feature flag on server side
 * - Show graceful feature disabled message if disabled
 * - Follow the same pattern as DAM and TTS features
 * - Only render layout if feature is enabled
 */
export default async function ChatbotWidgetLayout({ children }: { children: ReactNode }) {
  // Feature flag check - server-side
  const supabase = createSupabaseServerClient();
  const organization = await getActiveOrganizationWithFlags(supabase);
  const flags = organization?.feature_flags as Record<string, boolean> | undefined;
  
  // Default to true if flag is missing, but respect explicit false values
  const isChatbotEnabled = flags ? (flags.hasOwnProperty('chatbot_widget') ? flags['chatbot_widget'] : true) : true;

  // If chatbot widget feature is not enabled, show feature not enabled message
  if (!isChatbotEnabled) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[calc(100vh-200px)] text-center">
        <Ban className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Feature Not Enabled</h1>
        <p className="text-muted-foreground">
          The Chatbot Widget feature is not enabled for your organization.
        </p>
        <p className="text-muted-foreground mt-1">
          Please contact your administrator for more information.
        </p>
      </div>
    );
  }

  // Render the client-side layout if feature is enabled
  return <ChatbotWidgetLayoutClient>{children}</ChatbotWidgetLayoutClient>;
} 