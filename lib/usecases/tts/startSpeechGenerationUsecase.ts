import { StartSpeechSchema, type StartSpeechInput } from '@/lib/schemas/ttsSchemas';
import { createReplicatePrediction } from '@/lib/services/ttsService';
import { submitTts as submitElevenLabsTts } from '@/lib/services/elevenlabsService';
import { createClient } from '@/lib/supabase/server';
import { getActiveOrganizationId } from '@/lib/auth/server-action';
import { ttsProvidersConfig } from '@/lib/config/ttsProviderConfig';
import { uploadAudioBuffer } from '@/lib/services/ttsService';

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

  // Determine which service to use
  let predictionId: string;
  let status: string;
  let outputUrl: string | null = null;
  let outputStoragePath: string | null = null;
  let outputContentType: string | null = null;
  let outputFileSize: number | null = null;

  const ttsInput: StartSpeechInput = { inputText, voiceId };

  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: 'User not authenticated.' };
    }

    const organizationId = await getActiveOrganizationId();
    if (!organizationId) {
      return { success: false, error: 'Active organization not found.' };
    }

    // Invoke the appropriate TTS service
    if (provider === 'replicate') {
      const replicateModelId = providerConfig.defaultModel!;
      const prediction = await createReplicatePrediction(ttsInput, replicateModelId);
      predictionId = prediction.id;
      status = prediction.status || 'starting';
      // For Replicate, these fields will be null or set later during "Save to DAM"
      outputUrl = prediction.status === 'succeeded' && prediction.output ? prediction.output as string : null;
    } else if (provider === 'elevenlabs') {
      // ElevenLabs returns raw audio buffer synchronously
      const audioBuffer = await submitElevenLabsTts(inputText, voiceId);
      // Upload buffer to DAM and get public URL
      const uploadResult = await uploadAudioBuffer(audioBuffer, organizationId, user.id);
      outputUrl = uploadResult.publicUrl;
      outputStoragePath = uploadResult.storagePath;
      outputContentType = uploadResult.contentType;
      outputFileSize = uploadResult.blobSize;
      predictionId = crypto.randomUUID(); // generate an internal ID
      status = 'succeeded';
    } else {
      return { success: false, error: `Provider '${provider}' is not currently supported for speech generation.` };
    }

    const initialDbRecord: any = { // Use 'any' for now, will need to update TtsPrediction schema type
      replicatePredictionId: predictionId, // This might need renaming or a more generic external_prediction_id
      status,
      inputText: ttsInput.inputText,
      voiceId: ttsInput.voiceId,
      outputUrl: outputUrl,
      userId: user.id,
      organization_id: organizationId,
      prediction_provider: provider,
    };

    if (provider === 'elevenlabs') {
      initialDbRecord.output_storage_path = outputStoragePath;
      initialDbRecord.output_content_type = outputContentType;
      initialDbRecord.output_file_size = outputFileSize;
    }
    
    // Ensure TtsPrediction table has:
    // output_storage_path TEXT NULLABLE
    // output_content_type TEXT NULLABLE
    // output_file_size INTEGER NULLABLE

    const { data: newTtsPrediction, error: dbError } = await supabase
      .from('TtsPrediction')
      .insert(initialDbRecord)
      .select('id')
      .single();

    if (dbError) {
      return { success: false, error: `Failed to save prediction to database: ${dbError.message}. Task ID: ${predictionId}` };
    }

    if (!newTtsPrediction) {
      return { success: false, error: `Failed to retrieve prediction from database after insert. Task ID: ${predictionId}` };
    }

    return { success: true, predictionId: predictionId, ttsPredictionDbId: newTtsPrediction.id };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to start speech generation.' };
  }
} 