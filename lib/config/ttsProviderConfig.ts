export interface TtsProviderSettings {
  displayName: string;
  linkExpiryMinutes?: number; // Optional: some providers might not have expiring links
  // Future: could include things like:
  // - websiteUrl: string;
  // - requiresPolling: boolean;
  // - supportedVoices?: string[]; // Could be useful later
}

export const ttsProviderConfigs: Record<string, TtsProviderSettings> = {
  replicate: {
    displayName: 'Replicate',
    linkExpiryMinutes: 60,
  },
  // Example for another provider (you can add more later)
  // elevenlabs: {
  //   displayName: 'ElevenLabs',
  //   linkExpiryMinutes: 120, 
  // },
  // anotherProviderWithoutExpiry: {
  //   displayName: 'Local TTS',
  //   // No linkExpiryMinutes means we assume links don't expire by this logic
  // }
};

// Helper function to get a specific provider's config
export const getTtsProviderConfig = (providerName?: string | null): TtsProviderSettings | undefined => {
  if (!providerName) {
    return undefined;
  }
  return ttsProviderConfigs[providerName];
}; 