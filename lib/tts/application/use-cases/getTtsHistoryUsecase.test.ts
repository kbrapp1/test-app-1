import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTtsHistoryUsecase } from './getTtsHistoryUsecase';
import { TtsPrediction } from '../../domain/entities/TtsPrediction';
import { TtsPredictionSupabaseRepository } from '../../infrastructure/persistence/supabase/TtsPredictionSupabaseRepository';
import { TextInput } from '../../domain/value-objects/TextInput';
import { PredictionStatus } from '../../domain/value-objects/PredictionStatus';
import { VoiceId } from '../../domain/value-objects/VoiceId';

// Test factory for creating TtsPrediction entities
function createMockTtsPrediction(overrides: Partial<{
  id: string;
  inputText: string;
  status: string;
  voiceId: string;
}> = {}): TtsPrediction {
  const mockDate = new Date();
  return new TtsPrediction({
    id: overrides.id || '1',
    replicatePredictionId: 'rep1',
    externalProviderId: 'rep1',
    textInput: new TextInput(overrides.inputText || 'Hello'),
    status: new PredictionStatus(overrides.status || 'succeeded'),
    outputUrl: 'http://example.com/audio1.mp3',
    createdAt: mockDate,
    updatedAt: mockDate,
    userId: 'test-user-id',
    organizationId: 'test-org-id',
    sourceAssetId: null,
    outputAssetId: null,
    voiceId: overrides.voiceId ? new VoiceId(overrides.voiceId) : new VoiceId('alloy'),
    errorMessage: null,
    predictionProvider: 'replicate',
    isOutputUrlProblematic: false,
    outputUrlLastError: null,
    outputStoragePath: null,
    outputContentType: null,
    outputFileSize: null,
  });
}

// Mock dependencies
vi.mock('../../infrastructure/persistence/supabase/TtsPredictionSupabaseRepository', () => ({
  TtsPredictionSupabaseRepository: vi.fn(),
}));

// Mock repository interface
interface MockRepository {
  findByUserId: ReturnType<typeof vi.fn>;
  countByUserId: ReturnType<typeof vi.fn>;
}

describe('getTtsHistoryUsecase', () => {
  let mockRepository: MockRepository;
  const TEST_USER_ID = 'test-user-id';
  const TEST_ORG_ID = 'test-org-id';

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock repository
    mockRepository = {
      findByUserId: vi.fn(),
      countByUserId: vi.fn(),
    };
    (TtsPredictionSupabaseRepository as any).mockImplementation(() => mockRepository);
    
    // Default repository responses
    mockRepository.findByUserId.mockResolvedValue([]);
    mockRepository.countByUserId.mockResolvedValue(0);
  });

  it('should return success: false if userId is not provided', async () => {
    const result = await getTtsHistoryUsecase(undefined, undefined, TEST_ORG_ID);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Pre-validated context required for optimized TTS operations');
  });

  it('should return success: false if organizationId is not provided', async () => {
    const result = await getTtsHistoryUsecase(undefined, TEST_USER_ID, undefined);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Pre-validated context required for optimized TTS operations');
  });

  it('should call repository with correct options for default parameters', async () => {
    await getTtsHistoryUsecase(undefined, TEST_USER_ID, TEST_ORG_ID);

    expect(mockRepository.findByUserId).toHaveBeenCalledWith(TEST_USER_ID, {
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      searchQuery: undefined
    });
    expect(mockRepository.countByUserId).toHaveBeenCalledWith(TEST_USER_ID, {
      searchQuery: undefined
    });
  });

  it('should use provided pagination parameters', async () => {
    const params = { page: 2, limit: 5 };
    await getTtsHistoryUsecase(params, TEST_USER_ID, TEST_ORG_ID);
    
    expect(mockRepository.findByUserId).toHaveBeenCalledWith(TEST_USER_ID, {
      page: 2,
      limit: 5,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      searchQuery: undefined
    });
  });

  it('should use provided sorting parameters', async () => {
    const params = { sortBy: 'inputText' as const, sortOrder: 'asc' as const };
    await getTtsHistoryUsecase(params, TEST_USER_ID, TEST_ORG_ID);
    
    expect(mockRepository.findByUserId).toHaveBeenCalledWith(TEST_USER_ID, {
      page: 1,
      limit: 10,
      sortBy: 'inputText',
      sortOrder: 'asc',
      searchQuery: undefined
    });
  });

  it('should use provided search query', async () => {
    const params = { searchQuery: 'hello world' };
    await getTtsHistoryUsecase(params, TEST_USER_ID, TEST_ORG_ID);
    
    expect(mockRepository.findByUserId).toHaveBeenCalledWith(TEST_USER_ID, {
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      searchQuery: 'hello world'
    });
    expect(mockRepository.countByUserId).toHaveBeenCalledWith(TEST_USER_ID, {
      searchQuery: 'hello world'
    });
  });

  it('should return TtsPrediction entities and count on successful fetch', async () => {
    // Create mock TtsPrediction entities
    const mockPredictions = [
      createMockTtsPrediction({ id: '1', inputText: 'Hello' }),
      createMockTtsPrediction({ id: '2', inputText: 'World' }),
    ];
    
    mockRepository.findByUserId.mockResolvedValueOnce(mockPredictions);
    mockRepository.countByUserId.mockResolvedValueOnce(2);

    const result = await getTtsHistoryUsecase(undefined, TEST_USER_ID, TEST_ORG_ID);

    expect(result.success).toBe(true);
    expect(result.count).toBe(2);
    
    // Verify that the result contains TtsPrediction entities
    expect(result.data).toHaveLength(2);
    expect(result.data![0]).toBeInstanceOf(TtsPrediction);
    expect(result.data![1]).toBeInstanceOf(TtsPrediction);
    
    // Verify entity properties
    expect(result.data![0].id).toBe('1');
    expect(result.data![0].textInput.value).toBe('Hello');
    expect(result.data![1].id).toBe('2');
    expect(result.data![1].textInput.value).toBe('World');
  });

  it('should return success: false and error message on repository error', async () => {
    const repositoryError = new Error('Repository query failed');
    mockRepository.findByUserId.mockRejectedValueOnce(repositoryError);

    const result = await getTtsHistoryUsecase(undefined, TEST_USER_ID, TEST_ORG_ID);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Repository query failed');
    expect(result.data).toBeUndefined();
  });

  it('should return success: false on unexpected error', async () => {
    const repositoryError = new Error('Unexpected problem');
    mockRepository.countByUserId.mockRejectedValueOnce(repositoryError);
    
    const result = await getTtsHistoryUsecase(undefined, TEST_USER_ID, TEST_ORG_ID);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unexpected problem');
  });
}); 