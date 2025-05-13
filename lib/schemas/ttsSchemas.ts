import { z } from 'zod';

/**
 * Schema for validating input to start speech generation.
 */
export const StartSpeechSchema = z.object({
  inputText: z.string().min(1, 'Input text cannot be empty.').max(5000, 'Input text exceeds maximum length of 5000 characters.'),
  sourceAssetId: z.string().uuid().optional(),
  voiceId: z.string().min(1, 'Voice selection is required.'),
});

/**
 * Schema for validating input to get speech generation results.
 */
export const GetSpeechResultSchema = z.object({
  replicatePredictionId: z.string().min(1, 'Replicate Prediction ID is required.'),
});

/**
 * Schema for validating input to save generated audio to the DAM.
 */
export const SaveAudioToDamSchema = z.object({
  audioUrl: z.string().url('Invalid audio URL'),
  desiredAssetName: z.string().min(1, 'Desired asset name cannot be empty.'),
  ttsPredictionId: z.string().min(1, 'Invalid TTS Prediction ID'),
});

/**
 * Schema for validating input to the (potentially redundant) save history action.
 */
export const SaveHistorySchema = z.object({
  replicatePredictionId: z.string().min(1, 'Replicate Prediction ID is required.'),
  sourceAssetId: z.string().uuid().optional().nullable(),
  outputAssetId: z.string().uuid().optional().nullable(),
  // Add other fields if needed
});

// Export inferred types if needed elsewhere
export type StartSpeechInput = z.infer<typeof StartSpeechSchema>;
export type GetSpeechResultInput = z.infer<typeof GetSpeechResultSchema>;
export type SaveAudioToDamInput = z.infer<typeof SaveAudioToDamSchema>;
export type SaveHistoryInput = z.infer<typeof SaveHistorySchema>; 