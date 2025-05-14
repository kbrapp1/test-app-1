import { StartSpeechSchema, type StartSpeechInput } from '@/lib/schemas/ttsSchemas';
import { createReplicatePrediction } from '@/lib/services/ttsService';
import { createClient } from '@/lib/supabase/server';
import { getActiveOrganizationId } from '@/lib/auth/server-action';

/**
 * Usecase: Validates input, initiates speech generation via Replicate, and saves initial prediction to DB.
 */
export async function startSpeechGeneration(formData: FormData): Promise<{ success: boolean; predictionId?: string; ttsPredictionDbId?: string; error?: string; errors?: Record<string, string[]> }> {
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
      replicatePredictionId: prediction.id,
      status: prediction.status || 'starting', // Use status from Replicate if available, otherwise 'starting'
      inputText: validatedInput.inputText,
      voiceId: validatedInput.voiceId,
      userId: user.id,
      organization_id: organizationId,
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