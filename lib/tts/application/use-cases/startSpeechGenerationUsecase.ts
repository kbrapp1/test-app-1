import { StartSpeechSchema, type StartSpeechInput } from '../schemas/ttsSchemas';
import { createReplicatePrediction, createElevenLabsSpeech, uploadAudioBuffer } from '../../infrastructure/providers/ttsService';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { getActiveOrganizationId } from '@/lib/auth/server-action';
import { ttsProvidersConfig } from '../../infrastructure/providers/ttsProviderConfig';
import { TextInput } from '../../domain/value-objects/TextInput';
import { VoiceId } from '../../domain/value-objects/VoiceId';
import { PredictionStatus } from '../../domain/value-objects/PredictionStatus';
import { TtsPrediction } from '../../domain/entities/TtsPrediction';
import { TtsPredictionSupabaseRepository } from '../../infrastructure/persistence/supabase/TtsPredictionSupabaseRepository';
import { TtsValidationService } from '../../domain/services/TtsValidationService';
import { TtsPredictionService } from '../../domain/services/TtsPredictionService';

/**
 * Usecase: Validates input, initiates speech generation via the specified provider, and saves initial prediction to DB.
 * Now using DDD patterns with repository and domain services.
 */
export async function startSpeechGeneration(
  inputText: string, 
  voiceId: string, 
  provider: string
): Promise<{ success: boolean; predictionId?: string; ttsPredictionDbId?: string; error?: string; }> {
  
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: 'User not authenticated.' };
    }

    const organizationId = await getActiveOrganizationId();
    if (!organizationId) {
      return { success: false, error: 'Active organization not found.' };
    }

    // Initialize services - note: TtsPredictionService needs repository
    const repository = new TtsPredictionSupabaseRepository();
    const predictionService = new TtsPredictionService(repository);

    // Validate input using domain services (static methods)
    const validationResult = TtsValidationService.validateTtsRequest({
      text: inputText,
      voiceId: voiceId,
      provider: provider
    });
    if (!validationResult.isValid) {
      return { success: false, error: validationResult.errors.join(', ') };
    }

    const providerConfig = ttsProvidersConfig[provider];
    if (!providerConfig) {
      return { success: false, error: `Provider '${provider}' is not supported or configured.` };
    }

    // Create domain value objects
    const textInputVO = new TextInput(inputText);
    const voiceIdVO = new VoiceId(voiceId);
    const ttsInput: StartSpeechInput = { inputText: textInputVO.forTts, voiceId: voiceIdVO.value };

    // Determine which service to use and create prediction
    let predictionId: string;
    let outputUrl: string | null = null;
    let outputStoragePath: string | null = null;
    let outputContentType: string | null = null;
    let outputFileSize: number | null = null;

    // Invoke the appropriate TTS service
    if (provider === 'replicate') {
      const replicateModelId = providerConfig.defaultModel!;
      const prediction = await createReplicatePrediction(ttsInput, replicateModelId);
      predictionId = prediction.predictionId;
      outputUrl = null;
    } else if (provider === 'elevenlabs') {
      // ElevenLabs returns raw audio buffer synchronously
      const result = await createElevenLabsSpeech(ttsInput);
      // Upload buffer to DAM and get public URL
      const uploadResult = await uploadAudioBuffer(result.audioBuffer, organizationId, user.id);
      outputUrl = uploadResult.publicUrl;
      outputStoragePath = uploadResult.storagePath;
      outputContentType = uploadResult.contentType;
      outputFileSize = uploadResult.blobSize;
      predictionId = crypto.randomUUID();
    } else {
      return { success: false, error: `Provider '${provider}' is not currently supported for speech generation.` };
    }

    // Create domain entity using domain service
    const savedPrediction = await predictionService.createPrediction({
      externalProviderId: predictionId,
      textInput: textInputVO,
      voiceId: voiceIdVO,
      userId: user.id,
      organizationId: organizationId,
      provider: provider,
    });

    // For ElevenLabs, update with additional output info
    if (provider === 'elevenlabs' && outputUrl) {
      const completedPrediction = await predictionService.completePrediction(savedPrediction.id, outputUrl, {
        outputStoragePath: outputStoragePath || undefined,
        outputContentType: outputContentType || undefined,
        outputFileSize: outputFileSize || undefined
      });
    }

    return { 
      success: true, 
      predictionId: predictionId, 
      ttsPredictionDbId: savedPrediction.id 
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to start speech generation.' };
  }
} 