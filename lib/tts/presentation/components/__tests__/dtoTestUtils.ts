import { TtsPredictionDisplayDto } from '../../../application/dto/TtsPredictionDto';

interface MockTtsPredictionDisplayData {
  id?: string;
  inputText?: string;
  inputTextSnippet?: string;
  status?: string;
  statusDisplayName?: string;
  voiceDisplayName?: string;
  providerDisplayName?: string;
  outputUrl?: string | null;
  outputAssetId?: string | null;
  isOutputUrlProblematic?: boolean;
  outputUrlLastError?: string | null;
  createdAt?: string;
  errorMessage?: string | null;
  externalProviderId?: string;
  
  // Business logic flags
  hasAudioOutput?: boolean;
  isOutputUrlLikelyExpired?: boolean;
  canBeReplayed?: boolean;
  canBeSavedToDam?: boolean;
  isAlreadySavedToDam?: boolean;
  isCompleted?: boolean;
  isFailed?: boolean;
  isProcessing?: boolean;
}

/**
 * Factory function to create TtsPredictionDisplayDto objects for presentation layer testing
 * Following DDD principles - presentation tests should use DTOs, not domain entities
 */
export function createMockTtsPredictionDisplayDto(overrides: MockTtsPredictionDisplayData = {}): TtsPredictionDisplayDto {
  const defaultData = {
    id: 'test-id-1',
    inputText: 'Hello world',
    inputTextSnippet: 'Hello world',
    status: 'succeeded',
    statusDisplayName: 'succeeded',
    voiceDisplayName: 'Alloy',
    providerDisplayName: 'Replicate',
    outputUrl: 'http://example.com/audio.mp3',
    outputAssetId: null,
    isOutputUrlProblematic: false,
    outputUrlLastError: null,
    createdAt: '2025-01-10T12:00:00.000Z',
    errorMessage: null,
    externalProviderId: 'rep-123',
    
    // Business logic flags (computed)
    hasAudioOutput: true,
    isOutputUrlLikelyExpired: false,
    canBeReplayed: true,
    canBeSavedToDam: true,
    isAlreadySavedToDam: false,
    isCompleted: true,
    isFailed: false,
    isProcessing: false,
    ...overrides,
  };

  return {
    id: defaultData.id,
    externalProviderId: defaultData.externalProviderId,
    inputText: defaultData.inputText,
    inputTextSnippet: defaultData.inputTextSnippet,
    status: defaultData.status,
    statusDisplayName: defaultData.statusDisplayName,
    outputUrl: defaultData.outputUrl,
    createdAt: defaultData.createdAt,
    voiceDisplayName: defaultData.voiceDisplayName,
    providerDisplayName: defaultData.providerDisplayName,
    errorMessage: defaultData.errorMessage,
    isOutputUrlProblematic: defaultData.isOutputUrlProblematic,
    outputUrlLastError: defaultData.outputUrlLastError,
    outputAssetId: defaultData.outputAssetId,
    
    // Computed business logic flags
    hasAudioOutput: defaultData.hasAudioOutput,
    isOutputUrlLikelyExpired: defaultData.isOutputUrlLikelyExpired,
    canBeReplayed: defaultData.canBeReplayed,
    canBeSavedToDam: defaultData.canBeSavedToDam,
    isAlreadySavedToDam: defaultData.isAlreadySavedToDam,
    isCompleted: defaultData.isCompleted,
    isFailed: defaultData.isFailed,
    isProcessing: defaultData.isProcessing,
  };
}

/**
 * Create multiple mock TtsPredictionDisplayDto objects
 */
export function createMockTtsPredictionDisplayDtos(count: number): TtsPredictionDisplayDto[] {
  return Array.from({ length: count }, (_, index) =>
    createMockTtsPredictionDisplayDto({
      id: `id${index + 1}`,
      inputText: `Input for id${index + 1}`,
      inputTextSnippet: `Input for id${index + 1}`,
      externalProviderId: `replicate-id${index + 1}`,
    })
  );
}

/**
 * Create a mock TtsPredictionDisplayDto with problematic URL
 */
export function createProblematicTtsPredictionDisplayDto(overrides: MockTtsPredictionDisplayData = {}): TtsPredictionDisplayDto {
  return createMockTtsPredictionDisplayDto({
    isOutputUrlProblematic: true,
    outputUrlLastError: 'Audio link flagged as problematic',
    hasAudioOutput: false,
    canBeSavedToDam: false,
    ...overrides,
  });
}

/**
 * Create a mock TtsPredictionDisplayDto that's linked to DAM
 */
export function createSavedTtsPredictionDisplayDto(overrides: MockTtsPredictionDisplayData = {}): TtsPredictionDisplayDto {
  return createMockTtsPredictionDisplayDto({
    outputAssetId: 'dam-asset-123',
    isAlreadySavedToDam: true,
    canBeSavedToDam: false,
    ...overrides,
  });
}

/**
 * Create a mock TtsPredictionDisplayDto for failed status
 */
export function createFailedTtsPredictionDisplayDto(overrides: MockTtsPredictionDisplayData = {}): TtsPredictionDisplayDto {
  return createMockTtsPredictionDisplayDto({
    status: 'failed',
    statusDisplayName: 'failed',
    isCompleted: false,
    isFailed: true,
    isProcessing: false,
    hasAudioOutput: false,
    canBeSavedToDam: false,
    outputUrl: null,
    errorMessage: 'Processing failed',
    ...overrides,
  });
}

/**
 * Create a mock TtsPredictionDisplayDto for processing status
 */
export function createProcessingTtsPredictionDisplayDto(overrides: MockTtsPredictionDisplayData = {}): TtsPredictionDisplayDto {
  return createMockTtsPredictionDisplayDto({
    status: 'processing',
    statusDisplayName: 'processing',
    isCompleted: false,
    isFailed: false,
    isProcessing: true,
    hasAudioOutput: false,
    canBeSavedToDam: false,
    outputUrl: null,
    ...overrides,
  });
} 