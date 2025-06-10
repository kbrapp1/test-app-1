// TTS-specific TypeScript types
// Re-export from domain for backward compatibility
export type { TtsVoice, VoiceGender, VoiceAccent } from '@/lib/tts/domain';

/**
 * Represents a TTS history entry for display.
 */
export interface TtsHistoryEntry {
  id: string; // DB ID of the TtsPrediction record
  replicatePredictionId: string;
  status: string;
  inputText: string | null;
  outputUrl: string | null; // URL to the final audio (Supabase Storage)
  createdAt: string; // Or Date object
  sourceAssetId?: string | null;
  voiceId?: string | null;
  outputAssetId?: string | null; // ID of the saved DAM asset, if linked
}

/**
 * Supported Text-to-Speech providers
 */
export type TtsProvider = 'replicate' | 'elevenlabs'; 