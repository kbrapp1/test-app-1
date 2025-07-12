import { type StartSpeechInput } from '../schemas/ttsSchemas';
import { TextInput } from '../../domain/value-objects/TextInput';
import { VoiceId } from '../../domain/value-objects/VoiceId';
import { TtsPredictionSupabaseRepository } from '../../infrastructure/persistence/supabase/TtsPredictionSupabaseRepository';
import { TtsValidationService } from '../../domain/services/TtsValidationService';
import { TtsPredictionService } from '../../domain/services/TtsPredictionService';
import { TtsGenerationService } from '../services/TtsGenerationService';

// Validates input, initiates speech generation via provider, and saves prediction to DB
export async function startSpeechGeneration(
  inputText: string, 
  voiceId: string, 
  provider: string,
  ttsGenerationService: TtsGenerationService,
  userId: string,
  organizationId: string
): Promise<{ success: boolean; predictionId?: string; ttsPredictionDbId?: string; error?: string; }> {
  
  try {
    // Use pre-validated context instead of independent validation
    // This eliminates redundant auth calls and improves performance

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
      userId
    );

    // Create domain entity using domain service
    const savedPrediction = await predictionService.createPrediction({
      externalProviderId: generationResult.predictionId,
      textInput: textInputVO,
      voiceId: voiceIdVO,
      userId: userId,
      organizationId: organizationId,
      provider: provider,
    });

    // For providers that return immediate results (like ElevenLabs), update with output info
    if (generationResult.outputUrl) {
      await predictionService.completePrediction(savedPrediction.id, generationResult.outputUrl, {
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
  } catch (error: unknown) {
    // AI: Use domain-specific error handling instead of generic errors
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to start speech generation.' };
  }
} 