import { StartSpeechSchema, type StartSpeechInput } from '@/lib/schemas/ttsSchemas';
import { createReplicatePrediction } from '@/lib/services/ttsService';
import { createClient } from '@/lib/supabase/server';
import { getActiveOrganizationId } from '@/lib/auth/server-action';
import { ttsProvidersConfig } from '@/lib/config/ttsProviderConfig';

/**
 * Usecase: Validates input, initiates speech generation via the specified provider, and saves initial prediction to DB.
 */
export async function startSpeechGeneration(
  inputText: string, 
  voiceId: string, 
  provider: string
): Promise<{ success: boolean; predictionId?: string; ttsPredictionDbId?: string; error?: string; /*errors?: Record<string, string[]>*/ }> {
  
  if (!inputText || !voiceId || !provider) {
    return { success: false, error: 'Missing required parameters (inputText, voiceId, or provider).' };
  }

  const providerConfig = ttsProvidersConfig[provider];
  if (!providerConfig) {
    return { success: false, error: `Provider '${provider}' is not supported or configured.` };
  }

  let replicateModelId: string | undefined;
  if (provider === 'replicate') {
    if (!providerConfig.defaultModel) {
      return { success: false, error: `Default model not configured for Replicate provider.` };
    }
    replicateModelId = providerConfig.defaultModel;
  } else {
    // Handle other providers or return error if only replicate is supported for actual generation for now
    return { success: false, error: `Provider '${provider}' is not currently supported for speech generation.` };
  }

  const ttsInput: StartSpeechInput = { inputText, voiceId };

  try {
    let prediction;
    if (provider === 'replicate') {
      if (!replicateModelId) { // Should be set if provider is replicate, but for type safety
        return { success: false, error: 'Replicate Model ID could not be determined.' };
      }
      prediction = await createReplicatePrediction(ttsInput, replicateModelId);
    } else {
      // This case is already handled above, but as a safeguard:
      return { success: false, error: `Speech generation for provider '${provider}' is not implemented.` };
    }
    
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: 'User not authenticated.' };
    }

    const organizationId = await getActiveOrganizationId();
    if (!organizationId) {
      return { success: false, error: 'Active organization not found.' };
    }

    const initialDbRecord = {
      replicatePredictionId: prediction.id, 
      status: prediction.status || 'starting', 
      inputText: ttsInput.inputText,
      voiceId: ttsInput.voiceId,
      userId: user.id,
      organization_id: organizationId,
      prediction_provider: provider,
    };

    const { data: newTtsPrediction, error: dbError } = await supabase
      .from('TtsPrediction')
      .insert(initialDbRecord)
      .select('id')
      .single();

    if (dbError) {
      return { success: false, error: `Failed to save prediction to database: ${dbError.message}. Replicate task ID: ${prediction.id}` };
    }

    if (!newTtsPrediction) {
      return { success: false, error: `Failed to retrieve prediction from database after insert. Replicate task ID: ${prediction.id}` };
    }

    return { success: true, predictionId: prediction.id, ttsPredictionDbId: newTtsPrediction.id };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to start speech generation.' };
  }
} 