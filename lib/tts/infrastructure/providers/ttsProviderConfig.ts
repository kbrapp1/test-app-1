import type { TtsVoice } from '@/types/tts';

// --- Replicate Specific ---
export const REPLICATE_MODELS = {
  KOKORO_82M: 'jaaari/kokoro-82m:f559560eb822dc509045f3921a1921234918b91739db4bf3daab2169b71c7a13',
  // Add other Replicate models here if you use them in the future
} as const;

const REPLICATE_KOKORO_VOICES: TtsVoice[] = [
  // American English
  { id: 'af_alloy', name: 'Alloy (US Female)', gender: 'Female', accent: 'American' },
  { id: 'af_aoede', name: 'Aoede (US Female)', gender: 'Female', accent: 'American' },
  { id: 'af_bella', name: 'Bella (US Female)', gender: 'Female', accent: 'American' },
  { id: 'af_jessica', name: 'Jessica (US Female)', gender: 'Female', accent: 'American' },
  { id: 'af_kore', name: 'Kore (US Female)', gender: 'Female', accent: 'American' },
  { id: 'af_nicole', name: 'Nicole (US Female)', gender: 'Female', accent: 'American' },
  { id: 'af_nova', name: 'Nova (US Female)', gender: 'Female', accent: 'American' },
  { id: 'af_river', name: 'River (US Female)', gender: 'Female', accent: 'American' },
  { id: 'af_sarah', name: 'Sarah (US Female)', gender: 'Female', accent: 'American' },
  { id: 'af_sky', name: 'Sky (US Female)', gender: 'Female', accent: 'American' },
  { id: 'am_adam', name: 'Adam (US Male)', gender: 'Male', accent: 'American' },
  { id: 'am_echo', name: 'Echo (US Male)', gender: 'Male', accent: 'American' },
  { id: 'am_eric', name: 'Eric (US Male)', gender: 'Male', accent: 'American' },
  { id: 'am_fenrir', name: 'Fenrir (US Male)', gender: 'Male', accent: 'American' },
  { id: 'am_liam', name: 'Liam (US Male)', gender: 'Male', accent: 'American' },
  { id: 'am_michael', name: 'Michael (US Male)', gender: 'Male', accent: 'American' },
  { id: 'am_onyx', name: 'Onyx (US Male)', gender: 'Male', accent: 'American' },
  { id: 'am_puck', name: 'Puck (US Male)', gender: 'Male', accent: 'American' },
  // British English
  { id: 'bf_alice', name: 'Alice (UK Female)', gender: 'Female', accent: 'British' },
  { id: 'bf_emma', name: 'Emma (UK Female)', gender: 'Female', accent: 'British' },
  { id: 'bf_isabella', name: 'Isabella (UK Female)', gender: 'Female', accent: 'British' },
  { id: 'bf_lily', name: 'Lily (UK Female)', gender: 'Female', accent: 'British' },
  { id: 'bm_daniel', name: 'Daniel (UK Male)', gender: 'Male', accent: 'British' },
  { id: 'bm_fable', name: 'Fable (UK Male)', gender: 'Male', accent: 'British' },
  { id: 'bm_george', name: 'George (UK Male)', gender: 'Male', accent: 'British' },
  { id: 'bm_lewis', name: 'Lewis (UK Male)', gender: 'Male', accent: 'British' },
  // TODO: Add other languages for Kokoro (French, Hindi, Italian, Japanese, Mandarin Chinese)
  // For now, accent 'Other' can be used, or the TtsVoice type can be expanded.
];

// --- ElevenLabs Specific (Hypothetical/Placeholder) ---
const ELEVENLABS_PREDEFINED_VOICES: TtsVoice[] = [
  { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Rachel (ElevenLabs)', gender: 'Female', accent: 'American' },
  { id: 'SOYHLrjzK2X1ezoPC6cr', name: 'Adam (ElevenLabs)', gender: 'Male', accent: 'American' },
  // In a real scenario, these would be actual ElevenLabs voice IDs and names.
  // Or, these could be fetched dynamically via ElevenLabs API in the getTtsVoicesUsecase.
];

// --- Main Configuration Object ---
interface ModelConfig {
  voices: TtsVoice[];
}

export interface ProviderConfig {
  displayName: string;
  defaultModel?: string; // Key from REPLICATE_MODELS or a specific model ID string
  models?: {
    [modelInternalId: string]: ModelConfig; // e.g., REPLICATE_MODELS.KOKORO_82M as key
  };
  voices?: TtsVoice[]; // For providers that don't have a "model" concept for voice selection (e.g., ElevenLabs list)
  linkExpiryMinutes?: number; // Optional: time in minutes after which a generated link might expire
  // Future: fetchVoicesFn?: (apiKey?: string) => Promise<TtsVoice[]>; // For dynamic fetching
}

export const ttsProvidersConfig: { [providerId: string]: ProviderConfig } = {
  replicate: {
    displayName: 'Replicate',
    defaultModel: REPLICATE_MODELS.KOKORO_82M,
    linkExpiryMinutes: 60,
    models: {
      [REPLICATE_MODELS.KOKORO_82M]: {
        voices: REPLICATE_KOKORO_VOICES,
  },
      // Potentially add other replicate models here with their voices
    },
  },
  elevenlabs: {
    displayName: 'ElevenLabs',
    voices: ELEVENLABS_PREDEFINED_VOICES,
    // If ElevenLabs voices are fetched dynamically, this 'voices' array might be empty or
    // used as a fallback. The use case would handle the API call.
  },
  // Example for a provider that might require dynamic fetching
  // someOtherProvider: {
  //   displayName: 'Dynamic Provider',
  //   fetchVoicesFn: async (apiKey) => { /* fetch logic here */ return []; }
  // }
};

// Helper function to get a specific provider's config
export const getTtsProviderConfig = (providerName?: string | null): ProviderConfig | undefined => {
  if (!providerName) {
    return undefined;
  }
  return ttsProvidersConfig[providerName];
}; 