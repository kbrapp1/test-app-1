import { StartSpeechInput } from '../schemas/ttsSchemas';

export interface TtsGenerationResult {
  predictionId: string;
  outputUrl?: string;
  outputStoragePath?: string;
  outputContentType?: string;
  outputFileSize?: number;
}

export interface TtsProviderConfig {
  displayName: string;
  defaultModel?: string;
  linkExpiryMinutes?: number;
}

export interface TtsGenerationService {
  /**
   * Get configuration for a TTS provider
   */
  getProviderConfig(provider: string): TtsProviderConfig | undefined;

  /**
   * Generate speech using the specified provider
   */
  generateSpeech(
    input: StartSpeechInput,
    provider: string,
    organizationId: string,
    userId: string
  ): Promise<TtsGenerationResult>;

  /**
   * Download audio from external URL and upload to storage
   */
  downloadAndUploadAudio(
    audioUrl: string,
    organizationId: string,
    userId: string
  ): Promise<{
    storagePath: string;
    contentType: string;
    blobSize: number;
  }>;
} 