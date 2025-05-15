import { StartSpeechSchema, type StartSpeechInput } from '@/lib/schemas/ttsSchemas';
import { createReplicatePrediction } from '@/lib/services/ttsService';
import { createClient } from '@/lib/supabase/server';
import { getActiveOrganizationId } from '@/lib/auth/server-action';

/**
 * Usecase: Validates input, initiates speech generation via the specified provider, and saves initial prediction to DB.
 */
export async function startSpeechGeneration(
  inputText: string, 
  voiceId: string, 
  provider: string
): Promise<{ success: boolean; predictionId?: string; ttsPredictionDbId?: string; error?: string; /*errors?: Record<string, string[]>*/ }> {
  
  // Basic validation for now, assuming form-level Zod validation handled more complex cases.
  if (!inputText || !voiceId || !provider) {
    console.error('TTS Usecase (startSpeechGeneration): Missing inputText, voiceId, or provider.');
    return { success: false, error: 'Missing required parameters (inputText, voiceId, or provider).' };
  }

  // Provider-specific logic will go here. For now, only Replicate is supported.
  if (provider !== 'replicate') {
    console.warn(`TTS Usecase (startSpeechGeneration): Unsupported provider: ${provider}`);
    return { success: false, error: `Provider '${provider}' is not currently supported.` };
  }

  // Construct the input for Replicate (matches StartSpeechInput without FormData parsing)
  const replicateInput: StartSpeechInput = { inputText, voiceId };

  try {
    console.log(`TTS Usecase (startSpeechGeneration): Calling Replicate for provider '${provider}' to create prediction...`);
    const prediction = await createReplicatePrediction(replicateInput);
    console.log(`TTS Usecase (startSpeechGeneration): Replicate prediction created for provider '${provider}':`, prediction.id);
    
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('TTS Usecase (startSpeechGeneration): User not authenticated.', authError);
      return { success: false, error: 'User not authenticated.' };
    }

    const organizationId = await getActiveOrganizationId();
    if (!organizationId) {
      console.error('TTS Usecase (startSpeechGeneration): Active organization not found for user:', user.id);
      return { success: false, error: 'Active organization not found.' };
    }

    const initialDbRecord = {
      // Storing Replicate's prediction ID. If other providers are used,
      // this field will store their respective prediction IDs.
      // Consider renaming this field to `providerPredictionId` in a future schema migration.
      replicatePredictionId: prediction.id, 
      status: prediction.status || 'starting', 
      inputText: replicateInput.inputText,
      voiceId: replicateInput.voiceId,
      userId: user.id,
      organization_id: organizationId,
      prediction_provider: provider, // Store the provider
      // sourceAssetId: validatedInput.sourceAssetId, // TODO: Add to StartSpeechInput if needed
    };

    console.log('TTS Usecase (startSpeechGeneration): Saving initial prediction to DB:', initialDbRecord);
    const { data: newTtsPrediction, error: dbError } = await supabase
      .from('TtsPrediction')
      .insert(initialDbRecord)
      .select('id')
      .single();

    if (dbError) {
      console.error('TTS Usecase (startSpeechGeneration): Error saving initial prediction to DB:', dbError);
      // Note: Replicate prediction was started. Consider how to handle this inconsistency.
      // For now, returning an error that saving failed, but Replicate task is running.
      return { success: false, error: `Failed to save prediction to database: ${dbError.message}. Replicate task ID: ${prediction.id}` };
    }

    if (!newTtsPrediction) {
      console.error('TTS Usecase (startSpeechGeneration): Failed to retrieve new prediction from DB after insert.');
      return { success: false, error: `Failed to retrieve prediction from database after insert. Replicate task ID: ${prediction.id}` };
    }

    console.log('TTS Usecase (startSpeechGeneration): Initial prediction saved to DB with ID:', newTtsPrediction.id);
    return { success: true, predictionId: prediction.id, ttsPredictionDbId: newTtsPrediction.id };
  } catch (error: any) {
    console.error('TTS Usecase (startSpeechGeneration): Error starting speech generation:', error);
    return { success: false, error: error.message || 'Failed to start speech generation.' };
  }
} 