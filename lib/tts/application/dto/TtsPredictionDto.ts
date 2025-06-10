/**
 * Data Transfer Object for TtsPrediction
 * Used for crossing server/client boundaries in Next.js
 * Contains only serializable data, no class methods
 */

export interface TtsPredictionDto {
  id: string;
  replicatePredictionId: string | null;
  externalProviderId: string;
  textInput: {
    value: string;
    isValid: boolean;
    validationErrors?: string[];
  };
  status: {
    value: string;
    displayName: string;
    isCompleted: boolean;
    isFailed: boolean;
    isProcessing: boolean;
  };
  outputUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  organizationId: string;
  sourceAssetId: string | null;
  outputAssetId: string | null;
  voiceId: {
    value: string;
    displayName: string;
    provider: string;
  } | null;
  errorMessage: string | null;
  predictionProvider: string | null;
  isOutputUrlProblematic: boolean;
  outputUrlLastError: string | null;
  outputStoragePath: string | null;
  outputContentType: string | null;
  outputFileSize: number | null;
}

/**
 * Simplified DTO with computed properties for UI display
 */
export interface TtsPredictionDisplayDto {
  id: string;
  externalProviderId: string;
  inputText: string;
  inputTextSnippet: string;
  status: string;
  statusDisplayName: string;
  outputUrl: string | null;
  createdAt: string; // ISO string for serialization
  voiceDisplayName: string;
  providerDisplayName: string;
  errorMessage: string | null;
  isOutputUrlProblematic: boolean;
  outputUrlLastError: string | null;
  outputAssetId: string | null;
  
  // Computed business logic flags
  hasAudioOutput: boolean;
  isOutputUrlLikelyExpired: boolean;
  canBeReplayed: boolean;
  canBeSavedToDam: boolean;
  isAlreadySavedToDam: boolean;
  isCompleted: boolean;
  isFailed: boolean;
  isProcessing: boolean;
}

/**
 * Response DTO for getTtsHistory action
 */
export interface GetTtsHistoryResponseDto {
  success: boolean;
  data?: TtsPredictionDisplayDto[];
  error?: string;
  count?: number | null;
} 