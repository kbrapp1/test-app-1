import { TtsGenerationService, TtsGenerationResult, TtsProviderConfig } from '../../application/services/TtsGenerationService';
import { StartSpeechInput } from '../../application/schemas/ttsSchemas';
import { createReplicatePrediction, createElevenLabsSpeech, uploadAudioBuffer, downloadAndUploadAudio } from '../providers/ttsService';
import { ttsProvidersConfig } from '../providers/ttsProviderConfig';

export class ConcreteTtsGenerationService implements TtsGenerationService {
  getProviderConfig(provider: string): TtsProviderConfig | undefined {
    const config = ttsProvidersConfig[provider];
    if (!config) {
      return undefined;
    }

    return {
      displayName: config.displayName,
      defaultModel: config.defaultModel,
      linkExpiryMinutes: config.linkExpiryMinutes,
    };
  }

  async generateSpeech(
    input: StartSpeechInput,
    provider: string,
    organizationId: string,
    userId: string
  ): Promise<TtsGenerationResult> {
    const providerConfig = this.getProviderConfig(provider);
    if (!providerConfig) {
      throw new Error(`Provider '${provider}' is not supported or configured.`);
    }

    if (provider === 'replicate') {
      const replicateModelId = providerConfig.defaultModel!;
      const prediction = await createReplicatePrediction(input, replicateModelId);
      return {
        predictionId: prediction.predictionId,
        outputUrl: prediction.outputUrl,
      };
    } else if (provider === 'elevenlabs') {
      // ElevenLabs returns raw audio buffer synchronously
      const result = await createElevenLabsSpeech(input);
      // Upload buffer to DAM and get public URL
      const uploadResult = await uploadAudioBuffer(result.audioBuffer, organizationId, userId);
      return {
        predictionId: crypto.randomUUID(),
        outputUrl: uploadResult.publicUrl,
        outputStoragePath: uploadResult.storagePath,
        outputContentType: uploadResult.contentType,
        outputFileSize: uploadResult.blobSize,
      };
    } else {
      throw new Error(`Provider '${provider}' is not currently supported for speech generation.`);
    }
  }

  async downloadAndUploadAudio(
    audioUrl: string,
    organizationId: string,
    userId: string
  ): Promise<{
    storagePath: string;
    contentType: string;
    blobSize: number;
  }> {
    const result = await downloadAndUploadAudio(audioUrl, organizationId, userId);
    return {
      storagePath: result.storagePath,
      contentType: result.contentType,
      blobSize: result.blobSize,
    };
  }
} 