import { Prediction } from 'replicate';
import { randomUUID } from 'crypto';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';
import { replicateClient } from '@/lib/replicate/client';
import { MODEL_IDENTIFIER } from '@/lib/config/ttsConstants';
import type { StartSpeechInput } from '@/lib/schemas/ttsSchemas';

// Helper to get Supabase Admin Client (ensure env vars are set)
function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Supabase admin configuration missing for ttsService');
    throw new Error('Server configuration error for TTS service.');
  }

  return createSupabaseAdminClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false }
  });
}

/**
 * Creates a prediction request with Replicate.
 */
export async function createReplicatePrediction(input: StartSpeechInput): Promise<Prediction> {
  if (!replicateClient) {
    throw new Error('Replicate client is not initialized. Check API token.');
  }
  console.log(`Service: Starting prediction for voice: ${input.voiceId}`);
  const prediction = await replicateClient.predictions.create({
    version: MODEL_IDENTIFIER,
    input: {
      text: input.inputText,
      voice: input.voiceId,
    },
  });
  return prediction;
}

/**
 * Fetches the status and result of a prediction from Replicate.
 */
export async function getReplicatePrediction(replicatePredictionId: string): Promise<Prediction> {
  if (!replicateClient) {
    throw new Error('Replicate client is not initialized. Check API token.');
  }
  const prediction = await replicateClient.predictions.get(replicatePredictionId);
  return prediction;
}

// Helper to map MIME type to file extension
const getExtensionFromMimeType = (mimeType: string): string => {
  switch (mimeType.toLowerCase()) {
    case 'audio/mpeg': return '.mp3';
    case 'audio/wav':
    case 'audio/x-wav': return '.wav';
    case 'audio/ogg': return '.ogg';
    case 'audio/aac': return '.aac';
    default:
      console.warn(`Unknown MIME type: ${mimeType}, defaulting to .audio`);
      return '.audio';
  }
};

/**
 * Downloads audio from a URL and uploads it to Supabase Storage.
 * Returns the storage path, content type, and blob size.
 */
export async function downloadAndUploadAudio(
  audioUrl: string,
  organizationId: string,
  userId: string
): Promise<{ storagePath: string; contentType: string; blobSize: number; audioBlob: Blob }> {
  let audioBlob: Blob;
  let contentType: string;

  try {
    const response = await fetch(audioUrl);
    if (!response.ok) {
      if (response.status === 403 || response.status === 404) {
        console.warn(`Service: Failed to download audio from ${audioUrl}. Status: ${response.status}. Link likely expired or invalid.`);
        throw new Error('Failed to download audio: The source link may have expired or is invalid.');
      }
      throw new Error(`Failed to download audio from URL: Server responded with ${response.status} ${response.statusText}`);
    }
    audioBlob = await response.blob();
    contentType = response.headers.get('content-type') || 'audio/mpeg';
    console.log('Service: Fetched audio from Replicate. Content-Type:', contentType);
  } catch (fetchError: any) {
    console.error('Service: Error fetching audio from Replicate URL:', fetchError);
    const errorMessage = fetchError.message || 'Failed to download generated audio. Unknown fetch error.';
    throw new Error(errorMessage);
  }

  const fileExtension = getExtensionFromMimeType(contentType);
  const uniqueFilename = `${randomUUID()}${fileExtension}`;
  const storagePath = `${organizationId}/${userId}/audio/${uniqueFilename}`;

  const supabaseAdmin = getSupabaseAdminClient();

  const { data: uploadData, error: storageError } = await supabaseAdmin.storage
    .from('assets')
    .upload(storagePath, audioBlob, {
      contentType: contentType,
      upsert: false,
    });

  if (storageError) {
    console.error('Service: Supabase Storage upload error:', storageError);
    throw new Error(`Storage Error: ${storageError.message}`);
  }

  if (!uploadData || !uploadData.path) {
    console.error('Service: Supabase Storage upload failed silently.');
    throw new Error('Storage Error: Upload failed silently.');
  }

  return { storagePath: uploadData.path, contentType, blobSize: audioBlob.size, audioBlob };
}

/**
 * Cleans up an uploaded file from Supabase Storage.
 */
export async function cleanupStorageFile(storagePath: string): Promise<void> {
  try {
    const supabaseAdmin = getSupabaseAdminClient();
    const { error } = await supabaseAdmin.storage.from('assets').remove([storagePath]);
    if (error) {
      console.error('Service: Failed to cleanup orphaned storage file:', storagePath, error);
    } else {
      console.log('Service: Cleaned up orphaned storage file:', storagePath);
    }
  } catch (cleanupError) {
    console.error('Service: Exception during storage cleanup:', cleanupError);
  }
} 