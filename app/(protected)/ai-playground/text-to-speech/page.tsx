import { Ban } from 'lucide-react';
import { getActiveOrganizationWithFlags } from '@/lib/organization/application/services/getActiveOrganizationWithFlags';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { TtsPageClient } from '@/lib/tts/presentation/components/TtsPageClient';

// TODO: Implement the TTS UI according to the design spec
// FSD: docs/text-to-speech/tts-fsd.md
// UX: docs/text-to-speech/tts-ux-design.md

export default async function TextToSpeechPage() {
  // Feature flag check - server-side
  const supabase = createSupabaseServerClient();
  const organization = await getActiveOrganizationWithFlags(supabase);
  const flags = organization?.feature_flags as Record<string, boolean> | undefined;
  const isTtsEnabled = flags?.tts ?? false;

  // If TTS feature is not enabled, show feature not enabled message
  if (!isTtsEnabled) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[calc(100vh-200px)] text-center">
        <Ban className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Feature Not Enabled</h1>
        <p className="text-muted-foreground">
          The Text-to-Speech feature is not enabled for your organization.
        </p>
        <p className="text-muted-foreground mt-1">
          Please contact your administrator for more information.
        </p>
      </div>
    );
  }

  return <TtsPageClient />;
} 