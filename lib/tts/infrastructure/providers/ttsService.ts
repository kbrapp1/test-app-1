import { randomUUID } from 'crypto';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';
import { TtsProviderManager } from './TtsProviderManager';
import { SpeechRequest } from '../../domain';
import type { StartSpeechInput } from '../../application/schemas/ttsSchemas';

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
 * Creates a prediction request with Replicate using the new adapter.
 */
export async function createReplicatePrediction(input: StartSpeechInput, modelId: string): Promise<{ predictionId: string; outputUrl?: string }> {
  if (!modelId) {
    throw new Error('Replicate modelId (version) is required to create a prediction.');
  }
  
  const adapter = await TtsProviderManager.getReplicateAdapter();
  const speechRequest = SpeechRequest.forProvider(
    input.inputText,
    input.voiceId,
    'replicate',
    { model: modelId }
  );
  
  const result = await adapter.generateSpeech(speechRequest);
  return { 
    predictionId: result.predictionId,
    outputUrl: result.outputUrl
  };
}

/**
 * Generate speech with ElevenLabs using the new adapter.
 */
export async function createElevenLabsSpeech(input: StartSpeechInput): Promise<{ audioBuffer: ArrayBuffer }> {
  const adapter = await TtsProviderManager.getElevenLabsAdapter();
  const speechRequest = SpeechRequest.forProvider(
    input.inputText,
    input.voiceId,
    'elevenlabs'
  );
  
  const result = await adapter.generateSpeech(speechRequest);
  
  if (!result.isSuccessful) {
    throw new Error(result.error || 'ElevenLabs speech generation failed');
  }
  
  const audioBuffer = result.audioBuffer;
  if (!audioBuffer) {
    throw new Error('ElevenLabs speech generation succeeded but no audio buffer returned');
  }
  
  return { audioBuffer };
}

/**
 * Fetches the status and result of a prediction from Replicate using the new adapter.
 */
export async function getReplicatePrediction(replicatePredictionId: string): Promise<{ status: string; output?: string; error?: string }> {
  const adapter = await TtsProviderManager.getReplicateAdapter();
  const result = await adapter.getSpeechResult(replicatePredictionId);
  
  return {
    status: result.status, // Use the actual status from SpeechResult
    output: result.audioUrl || undefined,
    error: result.error || undefined,
  };
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