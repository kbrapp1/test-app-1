import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { getActiveOrganizationId } from '@/lib/auth/server-action';
import { createAssetRecordInDb, type CreateAssetDbRecordInput } from '@/lib/repositories/asset.db.repo';
import { downloadAndUploadAudio } from '@/lib/services/ttsService';
// import { cleanupStorageFile } from '@/lib/services/ttsService'; // For TODO

/**
 * Usecase: Saves generated TTS audio to the Digital Asset Management (DAM) system.
 * This involves downloading from the audio URL (for external providers) or using existing
 * storage details (for providers like ElevenLabs), uploading to Supabase Storage if necessary,
 * and creating an asset record in the database.
 */
export async function saveTtsAudioToDam(
  audioUrl: string, // For Replicate, this is external. For ElevenLabs, this is the publicUrl from our storage.
  desiredAssetName: string,
  ttsPredictionId: string
): Promise<{ success: boolean; assetId?: string; error?: string }> {
  try {
    console.log(`TTS Usecase (saveTtsAudioToDam): Saving audio for prediction ${ttsPredictionId} to DAM.`);

    const supabase = createSupabaseServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('TTS Usecase (saveTtsAudioToDam): Auth error.', userError);
      return { success: false, error: 'Authentication failed.' };
    }
    const userId = user.id;
    const organizationId = await getActiveOrganizationId();
    if (!organizationId) {
      console.error('TTS Usecase (saveTtsAudioToDam): Active organization not found.');
      return { success: false, error: 'Active organization context is missing.' };
    }

    // Fetch the TtsPrediction record
    const { data: ttsPrediction, error: predictionError } = await supabase
      .from('TtsPrediction')
      .select('*')
      .eq('id', ttsPredictionId)
      .single();

    if (predictionError || !ttsPrediction) {
      console.error('TTS Usecase (saveTtsAudioToDam): Could not fetch TtsPrediction record:', predictionError);
      return { success: false, error: 'Failed to retrieve TTS prediction details.' };
    }

    let storagePathValue: string;
    let contentTypeValue: string;
    let blobSizeValue: number;

    if (ttsPrediction.prediction_provider === 'elevenlabs') {
      console.log('TTS Usecase (saveTtsAudioToDam): ElevenLabs provider. Using stored asset details.');
      if (!ttsPrediction.output_storage_path || !ttsPrediction.output_content_type || ttsPrediction.output_file_size === null) {
        console.error('TTS Usecase (saveTtsAudioToDam): ElevenLabs prediction missing stored asset details.');
        return { success: false, error: 'ElevenLabs prediction is missing necessary stored asset details (path, type, or size).' };
      }
      storagePathValue = ttsPrediction.output_storage_path;
      contentTypeValue = ttsPrediction.output_content_type;
      blobSizeValue = ttsPrediction.output_file_size;
      console.log(`TTS Usecase (saveTtsAudioToDam): Using existing ElevenLabs asset at ${storagePathValue}`);
    } else {
      console.log(`TTS Usecase (saveTtsAudioToDam): Provider ${ttsPrediction.prediction_provider || 'unknown'}. Downloading and uploading from ${audioUrl}`);
      const uploadResult = await downloadAndUploadAudio(audioUrl, organizationId, userId);
      storagePathValue = uploadResult.storagePath;
      contentTypeValue = uploadResult.contentType;
      blobSizeValue = uploadResult.blobSize;
      console.log(`TTS Usecase (saveTtsAudioToDam): Audio uploaded to ${storagePathValue}`);
    }

    const { randomUUID } = await import('crypto');
    const newAssetId = randomUUID();
    
    const dbInput: CreateAssetDbRecordInput = {
      id: newAssetId,
      name: desiredAssetName,
      storagePath: storagePathValue,
      mimeType: contentTypeValue,
      size: blobSizeValue,
      userId: userId,
      organizationId: organizationId,
      folderId: null, 
    };

    const { data: newAssetRecord, error: dbError } = await createAssetRecordInDb(dbInput);

    if (dbError) {
      console.error('TTS Usecase (saveTtsAudioToDam): DB error creating asset record:', dbError);
      return { success: false, error: `Database error: ${dbError.message}` };
    }

    if (!newAssetRecord) {
      console.error('TTS Usecase (saveTtsAudioToDam): Asset record creation returned no data/error.');
      return { success: false, error: 'Failed to save asset metadata.' };
    }

    console.log(`TTS Usecase (saveTtsAudioToDam): Created asset record in DB with ID: ${newAssetRecord.id}`);

    return { success: true, assetId: newAssetRecord.id };

  } catch (error: any) {
    console.error(`TTS Usecase (saveTtsAudioToDam): Error saving TTS audio to DAM for prediction ${ttsPredictionId}:`, error);
    return {
      success: false,
      error: error.message || 'Failed to save audio to DAM.',
    };
  }
} 