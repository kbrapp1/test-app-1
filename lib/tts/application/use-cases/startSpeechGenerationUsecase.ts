import { StartSpeechSchema, type StartSpeechInput } from '../schemas/ttsSchemas';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { getActiveOrganizationId } from '@/lib/auth/server-action';
import { TextInput } from '../../domain/value-objects/TextInput';
import { VoiceId } from '../../domain/value-objects/VoiceId';
import { PredictionStatus } from '../../domain/value-objects/PredictionStatus';
import { TtsPrediction } from '../../domain/entities/TtsPrediction';
import { TtsPredictionSupabaseRepository } from '../../infrastructure/persistence/supabase/TtsPredictionSupabaseRepository';
import { TtsValidationService } from '../../domain/services/TtsValidationService';
import { TtsPredictionService } from '../../domain/services/TtsPredictionService';
import { TtsGenerationService } from '../services/TtsGenerationService';

/**
 * Usecase: Validates input, initiates speech generation via the specified provider, and saves initial prediction to DB.
 * Now using DDD patterns with repository and domain services, plus dependency injection for TTS generation.
 */
export async function startSpeechGeneration(
  inputText: string, 
  voiceId: string, 
  provider: string,
  ttsGenerationService: TtsGenerationService
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

    const providerConfig = ttsGenerationService.getProviderConfig(provider);
    if (!providerConfig) {
      return { success: false, error: `Provider '${provider}' is not supported or configured.` };
    }

    // Create domain value objects
    const textInputVO = new TextInput(inputText);
    const voiceIdVO = new VoiceId(voiceId);
    const ttsInput: StartSpeechInput = { inputText: textInputVO.forTts, voiceId: voiceIdVO.value };

    // Generate speech using the injected service
    const generationResult = await ttsGenerationService.generateSpeech(
      ttsInput,
      provider,
      organizationId,
      user.id
    );

    // Create domain entity using domain service
    const savedPrediction = await predictionService.createPrediction({
      externalProviderId: generationResult.predictionId,
      textInput: textInputVO,
      voiceId: voiceIdVO,
      userId: user.id,
      organizationId: organizationId,
      provider: provider,
    });

    // For providers that return immediate results (like ElevenLabs), update with output info
    if (generationResult.outputUrl) {
      const completedPrediction = await predictionService.completePrediction(savedPrediction.id, generationResult.outputUrl, {
        outputStoragePath: generationResult.outputStoragePath,
        outputContentType: generationResult.outputContentType,
        outputFileSize: generationResult.outputFileSize
      });
    }

    return { 
      success: true, 
      predictionId: generationResult.predictionId, 
      ttsPredictionDbId: savedPrediction.id 
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to start speech generation.' };
  }
} 