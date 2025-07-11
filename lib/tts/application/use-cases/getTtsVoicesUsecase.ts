import type { TtsVoice } from '@/types/tts';
import { ttsProvidersConfig } from '../../infrastructure/providers/ttsProviderConfig';
import { TtsProviderManager } from '../../infrastructure/providers/TtsProviderManager';

/**
 * Usecase: Fetches the list of available TTS voices for a given provider and optionally a specific model.
 */
export async function getTtsVoices(
  providerId?: string,
  modelId?: string
): Promise<{ success: boolean; data?: TtsVoice[]; error?: string }> {
  if (!providerId) {
    return { success: false, error: 'Provider ID is required.' };
  }

  // Handle ElevenLabs dynamically
  if (providerId === 'elevenlabs') {
    try {
      const adapter = await TtsProviderManager.getElevenLabsAdapter();
      const elevenLabsVoices = await adapter.listVoices(); 
      return { success: true, data: elevenLabsVoices };
          } catch (error: unknown) {
        console.error('Error fetching ElevenLabs voices:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch ElevenLabs voices.';
        return { success: false, error: errorMessage };
    }
  }

  // Existing logic for other providers (e.g., Replicate)
  const providerConfig = ttsProvidersConfig[providerId];

  if (!providerConfig) {
    return { success: false, error: `Configuration for provider '${providerId}' not found.` };
  }

  // If a specific modelId is provided
  if (modelId) {
    if (providerConfig.models && providerConfig.models[modelId]) {
      return { success: true, data: providerConfig.models[modelId].voices };
    }
    // If modelId is given but not found in config for this provider
    return { success: false, error: `Model '${modelId}' not found for provider '${providerId}'.` };
  }

  // If no modelId is provided, try to use the default model for the provider
  if (providerConfig.defaultModel && providerConfig.models && providerConfig.models[providerConfig.defaultModel]) {
    return { success: true, data: providerConfig.models[providerConfig.defaultModel].voices };
  }

  // If no specific model and no default model, but voices are defined at the provider level
  if (providerConfig.voices) {
    return { success: true, data: providerConfig.voices };
  }
  
  // If voices are meant to be fetched dynamically (placeholder for future)
  // if (providerConfig.fetchVoicesFn) { 
  //   try {
  //     // Assuming fetchVoicesFn might need an API key, which needs to be securely retrieved.
  //     // This part is highly dependent on the specific provider's API and auth.
  //     // const apiKey = await getApiKeyForProvider(providerId); // Placeholder
  //     const voices = await providerConfig.fetchVoicesFn(); 
  //     return { success: true, data: voices };
  //   } catch (e: unknown) {
  //     const errorMessage = e instanceof Error ? e.message : 'Unknown error';
  //     return { success: false, error: `Failed to dynamically fetch voices for ${providerId}: ${errorMessage}` };
  //   }
  // }

  console.warn(`getTtsVoicesUsecase: No voices found for provider: ${providerId} with the given parameters (modelId: ${modelId}).`);
  return { success: true, data: [], error: `No voice list configured or dynamically fetchable for provider '${providerId}' with the specified model.` };
} 