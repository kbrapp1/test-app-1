import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { getActiveOrganizationId } from '@/lib/auth/server-action';
import { createAssetRecordInDb } from '@/lib/repositories/asset.db.repo';
import { downloadAndUploadAudio } from '@/lib/services/ttsService';
// import { cleanupStorageFile } from '@/lib/services/ttsService'; // For TODO

/**
 * Usecase: Saves generated TTS audio to the Digital Asset Management (DAM) system.
 * This involves downloading from the audio URL, uploading to Supabase Storage,
 * and creating an asset record in the database.
 */
export async function saveTtsAudioToDam(
  audioUrl: string,
  desiredAssetName: string,
  ttsPredictionId: string // Kept for future linking, e.g., to a tts_predictions table
): Promise<{ success: boolean; assetId?: string; error?: string }> {
  try {
    console.log(`TTS Usecase (saveTtsAudioToDam): Saving audio from ${audioUrl} to DAM.`);

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

    // downloadAndUploadAudio will throw if there's an issue.
    const uploadResult = await downloadAndUploadAudio(audioUrl, organizationId, userId);

    // If we reach here, downloadAndUploadAudio was successful and returned the expected object.
    // The properties storagePath, contentType, and blobSize are guaranteed to be present
    // due to the return type of downloadAndUploadAudio and the fact that it throws on error.
    console.log(`TTS Usecase (saveTtsAudioToDam): Audio uploaded to ${uploadResult.storagePath}`);

    // Dynamically import randomUUID so that vitest's async mock can override it
    const { randomUUID } = await import('crypto');
    const newAssetId = randomUUID();
    const dbInput = {
      id: newAssetId,
      name: desiredAssetName,
      storagePath: uploadResult.storagePath,
      mimeType: uploadResult.contentType,
      size: uploadResult.blobSize,
      userId: userId,
      organizationId: organizationId,
      folderId: null, 
    };

    const { data: newAssetRecord, error: dbError } = await createAssetRecordInDb(dbInput);

    if (dbError) {
      console.error('TTS Usecase (saveTtsAudioToDam): DB error creating asset record:', dbError);
      // TODO: Consider cleaning up the uploaded storage file if DB insert fails.
      // For example: await cleanupStorageFile(uploadResult.storagePath);
      return { success: false, error: `Database error: ${dbError.message}` };
    }

    if (!newAssetRecord) {
      console.error('TTS Usecase (saveTtsAudioToDam): Asset record creation returned no data/error.');
      // TODO: Consider cleanup
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