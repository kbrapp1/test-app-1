// TTS-specific TypeScript types

/**
 * Represents an available TTS voice.
 */
export interface TtsVoice {
  id: string;
  name: string;
  gender: 'Female' | 'Male';
  accent: 'American' | 'British' | 'Other';
}

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