import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { getActiveOrganizationId } from '@/lib/auth/server-action';
import { SupabaseAssetRepository } from '@/lib/dam/infrastructure/persistence/supabase/SupabaseAssetRepository';
import { TtsPredictionSupabaseRepository } from '../../infrastructure/persistence/supabase/TtsPredictionSupabaseRepository';
import { TtsGenerationService } from '../services/TtsGenerationService';
// import { cleanupStorageFile } from '@/lib/services/ttsService'; // For TODO

/**
 * Usecase: Saves generated TTS audio to the Digital Asset Management (DAM) system.
 * This involves downloading from the audio URL (for external providers) or using existing
 * storage details (for providers like ElevenLabs), uploading to Supabase Storage if necessary,
 * and creating an asset record in the database.
 * Now using repository pattern and dependency injection for proper DDD compliance.
 */
export async function saveTtsAudioToDam(
  audioUrl: string, // For Replicate, this is external. For ElevenLabs, this is the publicUrl from our storage.
  desiredAssetName: string,
  ttsPredictionId: string,
  ttsGenerationService: TtsGenerationService
): Promise<{ success: boolean; assetId?: string; error?: string }> {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'Authentication failed.' };
    }
    const userId = user.id;
    const organizationId = await getActiveOrganizationId();
    if (!organizationId) {
      return { success: false, error: 'Active organization context is missing.' };
    }

    // Initialize repositories
    const ttsRepository = new TtsPredictionSupabaseRepository();
    
    // Fetch the TtsPrediction record using repository pattern
    const ttsPrediction = await ttsRepository.findById(ttsPredictionId);
    if (!ttsPrediction) {
      return { success: false, error: 'Failed to retrieve TTS prediction details.' };
    }

    let storagePathValue: string;
    let contentTypeValue: string;
    let blobSizeValue: number;

    if (ttsPrediction.predictionProvider === 'elevenlabs') {
      if (!ttsPrediction.outputStoragePath || !ttsPrediction.outputContentType || ttsPrediction.outputFileSize === null) {
        return { success: false, error: 'ElevenLabs prediction is missing necessary stored asset details (path, type, or size).' };
      }
      storagePathValue = ttsPrediction.outputStoragePath;
      contentTypeValue = ttsPrediction.outputContentType;
      blobSizeValue = ttsPrediction.outputFileSize;
    } else {
      const uploadResult = await ttsGenerationService.downloadAndUploadAudio(audioUrl, organizationId, userId);
      storagePathValue = uploadResult.storagePath;
      contentTypeValue = uploadResult.contentType;
      blobSizeValue = uploadResult.blobSize;
    }

    const { randomUUID } = await import('crypto');
    const newAssetId = randomUUID();
    
    // Initialize the DAM asset repository
    const assetRepository = new SupabaseAssetRepository(supabase);
    
    // Create asset using the repository
    try {
      const newAsset = await assetRepository.save({
        id: newAssetId,
        name: desiredAssetName,
        storagePath: storagePathValue,
        mimeType: contentTypeValue,
        size: blobSizeValue,
        userId: userId,
        organizationId: organizationId,
        folderId: null,
        createdAt: new Date(),
      });

      return { success: true, assetId: newAsset.id };
    } catch (dbError: unknown) {
      const errorMessage = dbError instanceof Error ? dbError.message : 'Database error occurred';
      return { success: false, error: `Database error: ${errorMessage}` };
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to save audio to DAM.';
    return {
      success: false,
      error: errorMessage,
    };
  }
} 