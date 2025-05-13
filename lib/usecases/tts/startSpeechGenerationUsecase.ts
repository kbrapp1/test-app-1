import { StartSpeechSchema, type StartSpeechInput } from '@/lib/schemas/ttsSchemas';
import { createReplicatePrediction } from '@/lib/services/ttsService';

/**
 * Usecase: Validates input and initiates speech generation via Replicate.
 */
export async function startSpeechGeneration(formData: FormData): Promise<{ success: boolean; predictionId?: string; error?: string; errors?: Record<string, string[]> }> {
  // Validate input using Zod schema
  const parsed = StartSpeechSchema.safeParse({
    inputText: formData.get('inputText'),
    voiceId: formData.get('voiceId'),
    // TODO: Handle sourceAssetId if passed from form
  });

  if (!parsed.success) {
    console.error('TTS Usecase (startSpeechGeneration): Input validation failed', parsed.error.flatten().fieldErrors);
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const validatedInput: StartSpeechInput = parsed.data;

  try {
    console.log('TTS Usecase (startSpeechGeneration): Calling Replicate to create prediction...');
    const prediction = await createReplicatePrediction(validatedInput);
    console.log('TTS Usecase (startSpeechGeneration): Replicate prediction created:', prediction.id);
    // TODO: Consider saving initial prediction state to DB here (e.g., tts_predictions table)
    return { success: true, predictionId: prediction.id };
  } catch (error: any) {
    console.error('TTS Usecase (startSpeechGeneration): Error starting speech generation:', error);
    return { success: false, error: error.message || 'Failed to start speech generation.' };
  }
} 