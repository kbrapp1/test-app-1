import Replicate from 'replicate';
import { z } from 'zod';
import { Database } from '@/types/supabase'; // Corrected path
import { Prediction } from 'replicate';
import { createClient } from '@/lib/supabase/server';
import { randomUUID } from 'crypto'; // For generating unique filenames
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';
import { getActiveOrganizationId } from '@/lib/auth/server-action';

// Type for the voice list
interface TtsVoice {
  id: string;
  name: string;
  gender: 'Female' | 'Male';
  accent: 'American' | 'British' | 'Other'; // Add other accents if needed later
}

// Hardcoded list of American English voices from jaaari/kokoro-82m
const AMERICAN_VOICES: TtsVoice[] = [
  { id: 'af_alloy', name: 'Alloy', gender: 'Female', accent: 'American' },
  { id: 'af_aoede', name: 'Aoede', gender: 'Female', accent: 'American' },
  { id: 'af_bella', name: 'Bella', gender: 'Female', accent: 'American' },
  { id: 'af_jessica', name: 'Jessica', gender: 'Female', accent: 'American' },
  { id: 'af_kore', name: 'Kore', gender: 'Female', accent: 'American' },
  { id: 'af_nicole', name: 'Nicole', gender: 'Female', accent: 'American' },
  { id: 'af_nova', name: 'Nova', gender: 'Female', accent: 'American' },
  { id: 'af_river', name: 'River', gender: 'Female', accent: 'American' },
  { id: 'af_sarah', name: 'Sarah', gender: 'Female', accent: 'American' },
  { id: 'af_sky', name: 'Sky', gender: 'Female', accent: 'American' },
  { id: 'am_adam', name: 'Adam', gender: 'Male', accent: 'American' },
  { id: 'am_echo', name: 'Echo', gender: 'Male', accent: 'American' },
  { id: 'am_eric', name: 'Eric', gender: 'Male', accent: 'American' },
  { id: 'am_fenrir', name: 'Fenrir', gender: 'Male', accent: 'American' },
  { id: 'am_liam', name: 'Liam', gender: 'Male', accent: 'American' },
  { id: 'am_michael', name: 'Michael', gender: 'Male', accent: 'American' },
  { id: 'am_onyx', name: 'Onyx', gender: 'Male', accent: 'American' },
  { id: 'am_puck', name: 'Puck', gender: 'Male', accent: 'American' },
];

// ============================================================================
// GET TTS VOICES ACTION
// ============================================================================

/**
 * Fetches the available TTS voices (currently hardcoded).
 * In the future, this could fetch from an API or configuration.
 */
export async function getTtsVoices(): Promise<{
  success: boolean;
  data?: TtsVoice[];
  error?: string;
}> {
  try {
    // TODO: Potentially fetch from a dynamic source in the future
    // For now, just return the hardcoded list
    return { success: true, data: AMERICAN_VOICES };
  } catch (error) {
    console.error('Error fetching TTS voices:', error);
    let errorMessage = 'Failed to fetch available voices.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    // TODO: Integrate lib/errors
    return { success: false, error: errorMessage };
  }
}

// ============================================================================
// START SPEECH GENERATION ACTION
// ============================================================================

// Extend input validation schema to include voiceId
const StartSpeechSchema = z.object({
  inputText: z.string().min(1, 'Input text cannot be empty.').max(5000, 'Input text exceeds maximum length of 5000 characters.'),
  sourceAssetId: z.string().uuid().optional(),
  voiceId: z.string().min(1, 'Voice selection is required.'), // Added voiceId
});

// Initialize Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Replicate model details
const MODEL_IDENTIFIER = 'jaaari/kokoro-82m:f559560eb822dc509045f3921a1921234918b91739db4bf3daab2169b71c7a13';

/**
 * Starts the text-to-speech generation process via Replicate API.
 */
export async function startSpeechGeneration(formData: FormData): Promise<{
  success: boolean;
  predictionId?: string;
  error?: string;
  errors?: Record<string, string[]>; // Added for consistency with mock types
}> {
  const rawFormData = Object.fromEntries(formData.entries());

  // Validate input
  const validatedFields = StartSpeechSchema.safeParse(rawFormData);
  if (!validatedFields.success) {
    const fieldErrors = validatedFields.error.flatten().fieldErrors;
    const errorMessage = fieldErrors.voiceId?.[0]  
                       || fieldErrors.inputText?.[0]
                       || 'Invalid input.';
    console.error('Validation failed:', fieldErrors);
    return {
      success: false,
      error: errorMessage,
      errors: fieldErrors, // Return validation errors
    };
  }

  const { inputText, sourceAssetId, voiceId } = validatedFields.data;

  if (!process.env.REPLICATE_API_TOKEN) {
    console.error('REPLICATE_API_TOKEN is not set.');
    return { success: false, error: 'Server configuration error: Missing API token.' };
  }

  try {
    // 1. Get Supabase client for server actions
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    const activeOrgId = await getActiveOrganizationId();
    if (!activeOrgId) {
      console.error('startSpeechGeneration: Active Organization ID not found.');
      return { success: false, error: 'Active organization not found. Cannot start speech generation.' };
    }

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return { success: false, error: 'Authentication failed. Please log in again.' };
    }

    // 2. Start prediction with Replicate
    console.log(`Starting prediction for voice: ${voiceId}`);
    const prediction = await replicate.predictions.create({
      version: MODEL_IDENTIFIER,
      input: {
        text: inputText,
        voice: voiceId,
      },
    });

    if (!prediction || !prediction.id) {
      console.error('Replicate prediction creation failed:', prediction?.error);
      const replicateErrorString = typeof prediction?.error === 'string'  
        ? prediction.error  
        : (prediction?.error ? JSON.stringify(prediction.error) : 'Unknown Replicate error');
      return { success: false, error: replicateErrorString };
    }

    // 3. Store initial prediction record in DB
    const { data: dbRecord, error: dbError } = await supabase
      .from('TtsPrediction') // Typo corrected from tts_prediction
      .insert({
        replicatePredictionId: prediction.id,
        status: prediction.status ?? 'starting',
        inputText: inputText,
        userId: user.id,
        sourceAssetId: sourceAssetId ?? null,
        voiceId: voiceId,
        organization_id: activeOrgId,
      })
      .select('id')
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      return { success: false, error: 'Failed to save prediction record.' };
    }

    console.log(`Started prediction ${prediction.id}, DB record ID: ${dbRecord?.id}`);

    return { success: true, predictionId: prediction.id };

  } catch (error) {
    console.error('Error starting speech generation:', error);
    let errorMessage = 'Failed to start speech generation.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return { success: false, error: errorMessage };
  }
}

// ============================================================================
// GET SPEECH GENERATION RESULT ACTION
// ============================================================================

// Input validation schema
const GetSpeechResultSchema = z.object({
  replicatePredictionId: z.string().min(1, 'Replicate Prediction ID is required.'),
});

// Define a more specific return type for clarity and type safety
interface GetSpeechResultReturn {
  success: boolean;
  status: Prediction['status'] | 'unknown'; // Replicate status or 'unknown'
  audioUrl: string | null; // URL if succeeded, otherwise null
  error: string | null; // Error message if failed or error occurred
  ttsPredictionDbId?: string | null; // Add DB ID for linking
}

export async function getSpeechGenerationResult(replicatePredictionId: string): Promise<GetSpeechResultReturn> {
  const supabase = createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser(); // Use the new client instance
  const activeOrgId = await getActiveOrganizationId();
  if (!activeOrgId) {
    console.error('getSpeechGenerationResult: Active Organization ID not found.');
    return { success: false, status: 'unknown', audioUrl: null, error: 'Active organization not found.', ttsPredictionDbId: null };
  }
  if (authError || !user) {
    console.error('Authentication error:', authError);
    // Return explicit type match
    return { success: false, status: 'unknown', audioUrl: null, error: 'User not authenticated', ttsPredictionDbId: null };
  }

  // Validate input (moved validation earlier)
  const validatedFields = GetSpeechResultSchema.safeParse({ replicatePredictionId });
  if (!validatedFields.success) {
    console.error('Validation failed:', validatedFields.error.flatten().fieldErrors);
    // Return explicit type match
    return {
      success: false,
      status: 'unknown',
      audioUrl: null,
      error: 'Invalid prediction ID provided.',
      ttsPredictionDbId: null, // Add null ID
    };
  }

  if (!process.env.REPLICATE_API_TOKEN) {
    console.error('REPLICATE_API_TOKEN is not set.');
    // Return explicit type match
    return { success: false, status: 'unknown', audioUrl: null, error: 'Server configuration error: Missing API token.', ttsPredictionDbId: null };
  }

  try {
    // 1. Check the prediction status with Replicate
    const prediction = await replicate.predictions.get(replicatePredictionId);

    if (!prediction) {
      console.error(`Prediction ${replicatePredictionId} not found on Replicate.`);
      // Return explicit type match
      return { success: false, status: 'unknown', audioUrl: null, error: 'Prediction not found.', ttsPredictionDbId: null };
    }

    // Explicitly handle processing statuses
    if (prediction.status === 'starting' || prediction.status === 'processing') {
      return { success: true, status: prediction.status, audioUrl: null, error: null, ttsPredictionDbId: null };
    }

    // 2. If succeeded, use the Replicate output URL directly
    if (prediction.status === 'succeeded' && prediction.output) {
      const temporaryAudioUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;

      if (typeof temporaryAudioUrl === 'string' && temporaryAudioUrl.startsWith('http')) {
          // Update DB with final status and the TEMPORARY Replicate URL
          const { data: updateResult, error: updateError } = await supabase
            .from('TtsPrediction')
            .update({ status: 'succeeded', outputUrl: temporaryAudioUrl })
            .eq('replicatePredictionId', replicatePredictionId);
          
          let dbPredictionId: string | null = null;
          if (!updateError) {
             const { data: fetchRecord, error: fetchError } = await supabase
                .from('TtsPrediction')
                .select('id')
                .eq('replicatePredictionId', replicatePredictionId)
                .single();
             if (fetchError) {
                console.error('Failed to fetch DB ID after successful update:', fetchError);
             } else {
                dbPredictionId = fetchRecord?.id ?? null;
             }
          } else {
             console.error('Database update error after success:', updateError);
          }
          
          // Return success with the temporary Replicate URL and the DB ID (fetched separately)
          return {
            success: true,
            status: 'succeeded',
            audioUrl: temporaryAudioUrl,
            error: null,
            ttsPredictionDbId: dbPredictionId,
          };
      } else {
        console.error(`Replicate prediction ${replicatePredictionId} succeeded but output URL is invalid:`, prediction.output);
        // Update DB status to failed if output is unusable
        await supabase.from('TtsPrediction').update({ status: 'failed', outputUrl: null, error: 'Invalid output URL received' }).eq('replicatePredictionId', replicatePredictionId);
        // Return explicit type match
        return { success: false, status: 'failed', audioUrl: null, error: 'Prediction succeeded but output was invalid.', ttsPredictionDbId: null };
      }
    }

    // 3. Handle failed or canceled status from Replicate
    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      const errorDetails = prediction.error ? JSON.stringify(prediction.error) : 'Prediction failed or was canceled.';
      console.error(`Replicate prediction ${replicatePredictionId} failed or was canceled. Status: ${prediction.status}, Error: ${errorDetails}`);

      // Update DB with final status and error
      const { error: updateError } = await supabase
        .from('TtsPrediction')
        .update({ status: prediction.status, outputUrl: null, error: errorDetails })
        .eq('replicatePredictionId', replicatePredictionId);

      if (updateError) {
        console.error('Database update error after failure/cancel:', updateError);
      }
      // Return explicit type match
      return { success: false, status: prediction.status, audioUrl: null, error: errorDetails, ttsPredictionDbId: null };
    }

    // 4. Handle unexpected status (Should ideally not be reached if all statuses covered)
    return { success: false, status: prediction.status ?? 'unknown', audioUrl: null, error: 'Unexpected prediction status from Replicate.', ttsPredictionDbId: null };

  } catch (error) {
    console.error(`Error getting speech generation result for ${replicatePredictionId}:`, error);
    let errorMessage = 'Failed to get speech generation result.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    // Optionally attempt to update DB status to failed here
    // Return explicit type match
    return { success: false, status: 'failed', audioUrl: null, error: errorMessage, ttsPredictionDbId: null }; // Assume null ID on general catch
  }
}

// ============================================================================
// SAVE TTS AUDIO TO DAM ACTION
// ============================================================================

// Updated Input validation schema
const SaveAudioToDamSchema = z.object({
  audioUrl: z.string().url('Invalid audio URL'),
  desiredAssetName: z.string().min(1, 'Desired asset name cannot be empty.'),
  ttsPredictionId: z.string().min(1, 'Invalid TTS Prediction ID'), // Restore original validation
});

/**
 * Downloads audio from a URL, uploads it to Supabase Storage,
 * creates a corresponding record in the assets table, and links it
 * back to the TtsPrediction record.
 */
export async function saveTtsAudioToDam(
  audioUrl: string, 
  desiredAssetName: string, 
  ttsPredictionId: string 
): Promise<{ 
  success: boolean;
  assetId?: string;
  error?: string;
}> {
  // User-context client for initial auth checks
  const supabaseUserClient = createClient(); 
  const { data: { user }, error: authError } = await supabaseUserClient.auth.getUser();
  const activeOrgId = await getActiveOrganizationId(); // Uses user-context client internally

  if (!activeOrgId) {
    console.error('saveTtsAudioToDam: Active Organization ID not found.');
    return { success: false, error: 'Active organization not found. Cannot save TTS audio.' };
  }

  if (authError || !user) {
    console.error('Auth error in saveTtsAudioToDam:', authError);
    return { success: false, error: 'User not authenticated to save asset.' };
  }

  const validatedFields = SaveAudioToDamSchema.safeParse({ 
    audioUrl, 
    desiredAssetName, 
    ttsPredictionId 
  });

  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten().fieldErrors;
    const errorMessage = errors.audioUrl?.[0] 
                      || errors.desiredAssetName?.[0] 
                      || errors.ttsPredictionId?.[0] 
                      || 'Invalid input.';
    console.error('saveTtsAudioToDam validation failed:', errors);
    return {
      success: false,
      error: errorMessage,
    };
  }

  // Admin client for storage and database writes
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Supabase admin configuration missing for saveTtsAudioToDam');
    return { success: false, error: 'Server configuration error for saving audio.' };
  }

  const supabaseAdmin = createSupabaseAdminClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false }
  });

  let uploadedStoragePath: string | null = null; // To track for potential cleanup

  try {
    let audioBlob: Blob;
    let contentType: string;
    try {
      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error(`Failed to download audio from URL: ${response.statusText}`);
      }
      audioBlob = await response.blob();
      contentType = response.headers.get('content-type') || 'audio/mpeg'; 
      console.log('Fetched audio from Replicate. Content-Type:', contentType);
    } catch (fetchError) {
      console.error('Error fetching audio from Replicate URL:', fetchError);
      return { success: false, error: 'Failed to download generated audio.' };
    }

    // Helper to map MIME type to file extension
    const getExtensionFromMimeType = (mimeType: string): string => {
      switch (mimeType.toLowerCase()) {
        case 'audio/mpeg':
          return '.mp3';
        case 'audio/wav':
        case 'audio/x-wav':
          return '.wav';
        case 'audio/ogg':
          return '.ogg';
        case 'audio/aac':
          return '.aac';
        // Add more mappings as needed
        default:
          console.warn(`Unknown MIME type: ${mimeType}, defaulting to .audio`);
          return '.audio'; // A generic fallback
      }
    };

    const fileExtension = getExtensionFromMimeType(contentType);
    const uniqueFilename = `${randomUUID()}${fileExtension}`;
    uploadedStoragePath = `${activeOrgId}/${user.id}/audio/${uniqueFilename}`;

    // Clean the desiredAssetName for database entry
    // From "Generated Speech - 2025-05-12T01:18:49.246Z"
    // To   "Generated Speech - 2025-05-12_01-18-49.wav" (if .wav is the extension)
    const cleanedBaseName = desiredAssetName
      .replace(/\.\d{3}Z$/, '') // Remove .123Z
      .replace(/T/g, '_')        // Replace T with _
      .replace(/:/g, '-');       // Replace : with -
    const finalAssetNameForDb = `${cleanedBaseName}${fileExtension}`;

    const { data: uploadData, error: storageError } = await supabaseAdmin.storage
      .from('assets')
      .upload(uploadedStoragePath, audioBlob, {
        contentType: contentType,
        upsert: false,
      });

    if (storageError) {
      console.error('Supabase Storage upload error:', storageError);
      throw new Error(`Storage Error: ${storageError.message}`);
    }

    if (!uploadData || !uploadData.path) {
      console.error('Supabase Storage upload failed silently.');
      throw new Error('Storage Error: Upload failed silently.');
    }

    const newAsset = {
      user_id: user.id,
      organization_id: activeOrgId,
      name: finalAssetNameForDb, // Use the cleaned and extensioned name
      storage_path: uploadData.path,
      mime_type: contentType,
      size: audioBlob.size,
      folder_id: null, // Or determine folder_id if applicable for TTS assets
    };

    const { data: assetRecord, error: dbError } = await supabaseAdmin
      .from('assets')
      .insert(newAsset)
      .select('id')
      .single();

    if (dbError) {
      console.error('Database insert error for asset:', dbError);
      // Attempt to remove the orphaned file from storage if DB insert fails
      if (uploadedStoragePath) {
        await supabaseAdmin.storage.from('assets').remove([uploadedStoragePath]);
      }
      throw new Error(`Database Error: ${dbError.message}`);
    }

    if (!assetRecord || !assetRecord.id) {
      console.error('Asset creation failed silently after insert.');
      if (uploadedStoragePath) {
        await supabaseAdmin.storage.from('assets').remove([uploadedStoragePath]);
      }
      throw new Error('Database Error: Asset creation failed silently.');
    }

    // Link the new asset ID back to the TtsPrediction record
    const { error: updateTtsError } = await supabaseAdmin 
      .from('TtsPrediction')
      .update({ outputAssetId: assetRecord.id, status: 'completed', outputUrl: null, errorMessage: null })
      .eq('replicatePredictionId', ttsPredictionId); 

    if (updateTtsError) {
      console.error('Failed to link asset to TtsPrediction:', updateTtsError);
      // This is a bit tricky. The asset is created, but linking failed.
      // Depending on desired behavior, you might leave it, or try to roll back the asset.
      // For now, we'll report success for asset creation but log the linking error.
      // The user will have the asset, but it won't be directly associated in TtsPrediction table.
    }

    console.log(`TTS Audio successfully saved to DAM. Asset ID: ${assetRecord.id}`);
    return { success: true, assetId: assetRecord.id };

  } catch (error) {
    console.error('Error in saveTtsAudioToDam:', error);
    // General catch block, attempt cleanup if storagePath was set
    if (uploadedStoragePath) {
      try {
        await supabaseAdmin.storage.from('assets').remove([uploadedStoragePath]);
        console.log('Cleaned up orphaned storage file:', uploadedStoragePath);
      } catch (cleanupError) {
        console.error('Failed to cleanup orphaned storage file:', cleanupError);
      }
    }
    return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred.' };
  }
}

// ============================================================================
// SAVE TTS HISTORY ACTION (Placeholder)
// ============================================================================

// TODO: Define schema and implement fully with DAM integration
interface SaveHistoryInput {
  replicatePredictionId: string;
  sourceAssetId?: string | null;
  outputAssetId?: string | null;
  // Add other relevant fields like voiceId if needed for history display
}

export async function saveTtsHistory(input: SaveHistoryInput): Promise<{
  success: boolean;
  error?: string;
}> {
  console.warn('saveTtsHistory action called, but might be redundant. Check if TtsPrediction suffices.');
  // Use server action client
  const supabase = createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error('Authentication error:', authError);
    return { success: false, error: 'User not authenticated' };
  }

  try {
    // TODO: Implement logic to update the TtsPrediction record
    // with sourceAssetId and outputAssetId based on replicatePredictionId
    // This might be redundant if getSpeechGenerationResult already updates status/outputUrl
    // and the main use case is linking assets AFTER they are saved to DAM.
    // Consider if this action is needed or if the logic belongs elsewhere.
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate async op
    return { success: true }; // Placeholder success
  } catch (error) {
    console.error('Error saving TTS history:', error);
    let errorMessage = 'Failed to save TTS history.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return { success: false, error: errorMessage };
  }
}

// ============================================================================
// GET TTS HISTORY ACTION (Placeholder)
// ============================================================================

// Define a type for the history entries for better type safety
// Adjust fields based on what you actually store and need to display
interface TtsHistoryEntry {
  id: string; // DB ID of the TtsPrediction record
  replicatePredictionId: string;
  status: string;
  inputText: string | null;
  outputUrl: string | null; // URL to the final audio (Supabase Storage)
  createdAt: string; // Or Date object
  sourceAssetId?: string | null;
  voiceId?: string | null;
  outputAssetId?: string | null; // ID of the saved DAM asset, if linked
  // Potentially join with DamAsset to get source text name?
  // Potentially add voice details?
}

export async function getTtsHistory(): Promise<{
  success: boolean;
  data?: TtsHistoryEntry[]; // Use the defined type
  error?: string;
}> {
  // Use server action client
  const supabase = createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'User not authenticated' };
  }
  const activeOrgId = await getActiveOrganizationId();
  if (!activeOrgId) {
    return { success: false, error: 'Active organization not found.' };
  }

  try {
    console.log('Placeholder getTtsHistory called for user:', user.id);
    // TODO: Implement logic to fetch TtsPrediction records for the user
    // Select necessary fields: id, inputText, status, createdAt, outputUrl, sourceAssetId, outputAssetId, etc.
    // Order by createdAt descending
    const { data, error } = await supabase
      .from('TtsPrediction')
      .select('*') // Select specific fields needed for history display
      .eq('userId', user.id)
      .order('createdAt', { ascending: false })
      .limit(50); // Add pagination later

    if (error) throw error;

    return { success: true, data: data || [] }; // Placeholder data
  } catch (error) {
    console.error('Error fetching TTS history:', error);
    let errorMessage = 'Failed to fetch history.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return { success: false, error: errorMessage };
  }
} 
