import { TtsPrediction } from '../../../domain/entities/TtsPrediction';
import { PredictionStatus } from '../../../domain/value-objects/PredictionStatus';
import { TextInput } from '../../../domain/value-objects/TextInput';
import { VoiceId } from '../../../domain/value-objects/VoiceId';

interface MockTtsPredictionData {
  id?: string;
  inputText?: string;
  status?: string;
  voiceId?: string;
  outputUrl?: string | null;
  outputAssetId?: string | null;
  isOutputUrlProblematic?: boolean;
  outputUrlLastError?: string | null;
  predictionProvider?: string;
  createdAt?: Date;
  updatedAt?: Date;
  userId?: string;
  organizationId?: string;
  replicatePredictionId?: string;
  errorMessage?: string | null;
  sourceAssetId?: string | null;
  externalProviderId?: string;
}

/**
 * Factory function to create TtsPrediction entities for testing
 */
export function createMockTtsPrediction(overrides: MockTtsPredictionData = {}): TtsPrediction {
  const defaultData = {
    id: 'test-id-1',
    inputText: 'Hello world',
    status: 'succeeded',
    voiceId: 'alloy',
    outputUrl: 'http://example.com/audio.mp3',
    outputAssetId: null,
    isOutputUrlProblematic: false,
    outputUrlLastError: null,
    predictionProvider: 'replicate',
    createdAt: new Date('2025-01-10T12:00:00Z'),
    updatedAt: new Date('2025-01-10T12:00:00Z'),
    userId: 'test-user',
    organizationId: 'test-org',
    replicatePredictionId: 'rep-123',
    errorMessage: null,
    sourceAssetId: null,
    externalProviderId: 'rep-123',
    ...overrides,
  };

  return new TtsPrediction({
    id: defaultData.id,
    replicatePredictionId: defaultData.replicatePredictionId,
    externalProviderId: defaultData.externalProviderId,
    textInput: new TextInput(defaultData.inputText),
    status: new PredictionStatus(defaultData.status),
    voiceId: new VoiceId(defaultData.voiceId),
    outputUrl: defaultData.outputUrl,
    errorMessage: defaultData.errorMessage,
    createdAt: defaultData.createdAt,
    updatedAt: defaultData.updatedAt,
    userId: defaultData.userId,
    organizationId: defaultData.organizationId,
    predictionProvider: defaultData.predictionProvider,
    sourceAssetId: defaultData.sourceAssetId,
    outputAssetId: defaultData.outputAssetId,
    isOutputUrlProblematic: defaultData.isOutputUrlProblematic,
    outputUrlLastError: defaultData.outputUrlLastError,
  });
}

/**
 * Create multiple mock TtsPrediction entities
 */
export function createMockTtsPredictions(count: number): TtsPrediction[] {
  return Array.from({ length: count }, (_, index) =>
    createMockTtsPrediction({
      id: `test-id-${index + 1}`,
      inputText: `Test input ${index + 1}`,
      replicatePredictionId: `rep-${index + 1}`,
      externalProviderId: `rep-${index + 1}`,
    })
  );
}

/**
 * Create a mock TtsPrediction entity with problematic URL
 */
export function createProblematicTtsPrediction(overrides: MockTtsPredictionData = {}): TtsPrediction {
  return createMockTtsPrediction({
    isOutputUrlProblematic: true,
    outputUrlLastError: 'Audio link flagged as problematic',
    ...overrides,
  });
}

/**
 * Create a mock TtsPrediction entity that's linked to DAM
 */
export function createSavedTtsPrediction(overrides: MockTtsPredictionData = {}): TtsPrediction {
  return createMockTtsPrediction({
    outputAssetId: 'dam-asset-123',
    ...overrides,
  });
} 