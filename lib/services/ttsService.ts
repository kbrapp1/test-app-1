import { Prediction } from 'replicate';
import { randomUUID } from 'crypto';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';
import { replicateClient } from '@/lib/replicate/client';
// import { MODEL_IDENTIFIER } from '@/lib/config/ttsConstants'; // Removed old import
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
export async function createReplicatePrediction(input: StartSpeechInput, modelId: string): Promise<Prediction> {
  if (!replicateClient) {
    throw new Error('Replicate client is not initialized. Check API token.');
  }
  if (!modelId) {
    throw new Error('Replicate modelId (version) is required to create a prediction.');
  }
  console.log(`Service: Starting prediction for voice: ${input.voiceId} using model: ${modelId}`);
  const prediction = await replicateClient.predictions.create({
    version: modelId, // Use the passed modelId
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
        throw new Error(
          `Failed to download audio. The link may have expired or is invalid (Status: ${response.status} ${response.statusText}).`
        );
      }
      throw new Error(
        `Failed to download audio from URL: ${response.statusText} (Status: ${response.status})`
      );
    }
    audioBlob = await response.blob();
    contentType = response.headers.get('content-type') || 'audio/mpeg';

    // Additional check for content type
    if (!contentType.startsWith('audio/')) {
      console.warn(
        `Service: Downloaded content from ${audioUrl} is not audio. Content-Type: ${contentType}. Treating as download failure.`
      );
      throw new Error(
        `Downloaded file is not audio (type: ${contentType}). The link might be for an error page or invalid content.`
      );
    }

    console.log('Service: Fetched audio from Replicate. Content-Type:', contentType);
  } catch (fetchError) {
    console.error('Service: Error fetching audio from Replicate URL:', fetchError);
    throw new Error('Failed to download generated audio.');
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

/**
 * Uploads an ArrayBuffer of audio to Supabase Storage and returns its public URL.
 */
export async function uploadAudioBuffer(
  buffer: ArrayBuffer,
  organizationId: string,
  userId: string
): Promise<{ storagePath: string; publicUrl: string; contentType: string; blobSize: number }> {
  const supabaseAdmin = getSupabaseAdminClient();
  const audioBuffer = Buffer.from(buffer);
  const contentType = 'audio/mpeg';
  const fileExtension = '.mp3';
  const uniqueFilename = `${randomUUID()}${fileExtension}`;
  const storagePath = `${organizationId}/${userId}/audio/${uniqueFilename}`;

  const { data: uploadData, error: storageError } = await supabaseAdmin.storage
    .from('assets')
    .upload(storagePath, audioBuffer, {
      contentType,
      upsert: false,
    });
  if (storageError) {
    throw new Error(`Storage upload failed: ${storageError.message}`);
  }
  // Get a public URL
  const { data: urlData } = supabaseAdmin.storage.from('assets').getPublicUrl(uploadData.path);
  const publicUrl = urlData.publicUrl;
  return { storagePath: uploadData.path, publicUrl, contentType, blobSize: audioBuffer.byteLength };
} 