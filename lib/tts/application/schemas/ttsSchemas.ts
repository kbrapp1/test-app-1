import { z } from 'zod';
import { TextInput, VoiceId } from '../../domain';

/**
 * Schema for validating input to start speech generation.
 * Uses domain objects for validation.
 */
export const StartSpeechSchema = z.object({
  inputText: z.string().refine(
    (text) => TextInput.isValid(text),
    (text) => ({ message: TextInput.getValidationError(text) || 'Invalid text input' })
  ),
  sourceAssetId: z.string().uuid().optional(),
  voiceId: z.string().refine(
    (voiceId) => VoiceId.isValid(voiceId),
    (voiceId) => ({ message: VoiceId.getValidationError(voiceId) || 'Invalid voice selection' })
  ),
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