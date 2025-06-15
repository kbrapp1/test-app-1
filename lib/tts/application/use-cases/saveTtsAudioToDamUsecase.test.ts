const mockGeneratedAssetId = 'mock-asset-uuid-generated';
const mockRandomUUIDSpy = vi.fn(() => mockGeneratedAssetId);

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveTtsAudioToDam } from './saveTtsAudioToDamUsecase';
import { createClient } from '@/lib/supabase/server';
import { getActiveOrganizationId } from '@/lib/auth/server-action';
import { downloadAndUploadAudio } from '../../infrastructure/providers/ttsService';
import { SupabaseAssetRepository } from '@/lib/dam/infrastructure/persistence/supabase/SupabaseAssetRepository';
import { TtsPredictionSupabaseRepository } from '../../infrastructure/persistence/supabase/TtsPredictionSupabaseRepository';
import { TtsPrediction } from '../../domain/entities/TtsPrediction';
import { TextInput } from '../../domain/value-objects/TextInput';
import { PredictionStatus } from '../../domain/value-objects/PredictionStatus';
import { VoiceId } from '../../domain/value-objects/VoiceId';

// Test factory for creating TtsPrediction entities
function createMockTtsPrediction(overrides: Partial<{
  id: string;
  predictionProvider: string;
  outputStoragePath: string | null;
  outputContentType: string | null;
  outputFileSize: number | null;
}> = {}): TtsPrediction {
  const mockDate = new Date();
  return new TtsPrediction({
    id: overrides.id || 'pred-123',
    replicatePredictionId: 'rep1',
    externalProviderId: 'rep1',
    textInput: new TextInput('Hello world'),
    status: new PredictionStatus('succeeded'),
    outputUrl: 'http://example.com/audio1.mp3',
    createdAt: mockDate,
    updatedAt: mockDate,
    userId: 'user-abc-123',
    organizationId: 'org-xyz-789',
    sourceAssetId: null,
    outputAssetId: null,
    voiceId: new VoiceId('alloy'),
    errorMessage: null,
    predictionProvider: overrides.predictionProvider || 'replicate',
    isOutputUrlProblematic: false,
    outputUrlLastError: null,
    outputStoragePath: overrides.outputStoragePath || null,
    outputContentType: overrides.outputContentType || null,
    outputFileSize: overrides.outputFileSize || null,
  });
}

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/auth/server-action', () => ({
  getActiveOrganizationId: vi.fn(),
}));

// Mock TTS Generation Service
const mockTtsGenerationService = {
  getProviderConfig: vi.fn(),
  generateSpeech: vi.fn(),
  downloadAndUploadAudio: vi.fn(),
};

vi.mock('@/lib/dam/infrastructure/persistence/supabase/SupabaseAssetRepository', () => {
  return {
    SupabaseAssetRepository: vi.fn().mockImplementation(() => ({
      save: vi.fn().mockImplementation(async (asset) => ({ 
        ...asset, 
        id: mockGeneratedAssetId
      }))
    }))
  };
});

vi.mock('../../infrastructure/persistence/supabase/TtsPredictionSupabaseRepository', () => ({
  TtsPredictionSupabaseRepository: vi.fn(),
}));

vi.mock('crypto', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as any),
    randomUUID: mockRandomUUIDSpy,
  };
});

// Mock Supabase client for auth
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
  },
};

describe('saveTtsAudioToDamUsecase', () => {
  const testAudioUrl = 'http://example.com/audio.mp3';
  const testDesiredAssetName = 'My Test Audio.mp3';
  const testSourcePredictionId = 'pred-123';
  const testUserId = 'user-abc-123';
  const testOrgId = 'org-xyz-789';
  
  const mockDownloadUploadResponse = {
    storagePath: `${testOrgId}/tts-audio/service-generated-uuid.mp3`,
    contentType: 'audio/mpeg',
    blobSize: 12345,
  };

  let mockAssetRepositoryInstance: any;
  let mockTtsRepositoryInstance: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockRandomUUIDSpy.mockClear();

    (createClient as any).mockReturnValue(mockSupabaseClient);
    (mockSupabaseClient.auth.getUser as any).mockResolvedValue({
      data: { user: { id: testUserId } },
      error: null,
    });
    (getActiveOrganizationId as any).mockResolvedValue(testOrgId);
    mockTtsGenerationService.downloadAndUploadAudio.mockResolvedValue(mockDownloadUploadResponse);
    
    // Set up the asset repository mock
    mockAssetRepositoryInstance = {
      save: vi.fn().mockResolvedValue({ id: mockGeneratedAssetId })
    };
    (SupabaseAssetRepository as any).mockImplementation(() => mockAssetRepositoryInstance);
    
    // Set up the TTS repository mock
    mockTtsRepositoryInstance = {
      findById: vi.fn()
    };
    (TtsPredictionSupabaseRepository as any).mockImplementation(() => mockTtsRepositoryInstance);
  });

  it('should successfully call services and create asset record for replicate provider', async () => {
    const mockReplicatePrediction = createMockTtsPrediction({
      id: testSourcePredictionId,
      predictionProvider: 'replicate'
    });
    mockTtsRepositoryInstance.findById.mockResolvedValueOnce(mockReplicatePrediction);

    const result = await saveTtsAudioToDam(testAudioUrl, testDesiredAssetName, testSourcePredictionId, mockTtsGenerationService);

    expect(mockTtsRepositoryInstance.findById).toHaveBeenCalledWith(testSourcePredictionId);
    expect(getActiveOrganizationId).toHaveBeenCalledTimes(1);
    expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledTimes(1);
    expect(mockTtsGenerationService.downloadAndUploadAudio).toHaveBeenCalledWith(testAudioUrl, testOrgId, testUserId);
    
    expect(SupabaseAssetRepository).toHaveBeenCalledWith(mockSupabaseClient);
    expect(mockAssetRepositoryInstance.save).toHaveBeenCalledWith({
      id: mockGeneratedAssetId,
      name: testDesiredAssetName,
      storagePath: mockDownloadUploadResponse.storagePath,
      mimeType: mockDownloadUploadResponse.contentType,
      size: mockDownloadUploadResponse.blobSize,
      userId: testUserId,
      organizationId: testOrgId,
      folderId: null,
      createdAt: expect.any(Date)
    });

    expect(result.success).toBe(true);
    expect(result.assetId).toBe(mockGeneratedAssetId);
    expect(result.error).toBeUndefined();
  });

  it('should use stored metadata and not call download/upload for elevenlabs provider', async () => {
    const mockElevenlabsPrediction = createMockTtsPrediction({
      id: testSourcePredictionId,
      predictionProvider: 'elevenlabs',
      outputStoragePath: 'org/elevenlabs/audio.mp3',
      outputContentType: 'audio/mpeg',
      outputFileSize: 54321
    });
    mockTtsRepositoryInstance.findById.mockResolvedValueOnce(mockElevenlabsPrediction);

    const result = await saveTtsAudioToDam(testAudioUrl, testDesiredAssetName, testSourcePredictionId, mockTtsGenerationService);

    expect(mockTtsRepositoryInstance.findById).toHaveBeenCalledWith(testSourcePredictionId);
    expect(mockTtsGenerationService.downloadAndUploadAudio).not.toHaveBeenCalled(); 
    
    expect(SupabaseAssetRepository).toHaveBeenCalledWith(mockSupabaseClient);
    expect(mockAssetRepositoryInstance.save).toHaveBeenCalledWith({
      id: mockGeneratedAssetId,
      name: testDesiredAssetName,
      storagePath: 'org/elevenlabs/audio.mp3',
      mimeType: 'audio/mpeg',
      size: 54321,
      userId: testUserId,
      organizationId: testOrgId,
      folderId: null,
      createdAt: expect.any(Date)
    });

    expect(result.success).toBe(true);
    expect(result.assetId).toBe(mockGeneratedAssetId);
    expect(result.error).toBeUndefined();
  });

  it('should return error if elevenlabs prediction is missing storage metadata', async () => {
    const mockElevenlabsPrediction = createMockTtsPrediction({
      id: testSourcePredictionId,
      predictionProvider: 'elevenlabs',
      outputStoragePath: null, // Missing required metadata
      outputContentType: null,
      outputFileSize: null
    });
    mockTtsRepositoryInstance.findById.mockResolvedValueOnce(mockElevenlabsPrediction);

    const result = await saveTtsAudioToDam(testAudioUrl, testDesiredAssetName, testSourcePredictionId, mockTtsGenerationService);

    expect(result.success).toBe(false);
    expect(result.error).toBe('ElevenLabs prediction is missing necessary stored asset details (path, type, or size).');
    expect(mockTtsGenerationService.downloadAndUploadAudio).not.toHaveBeenCalled();
    expect(mockAssetRepositoryInstance.save).not.toHaveBeenCalled();
  });

  it('should return error if TtsPrediction record not found', async () => {
    mockTtsRepositoryInstance.findById.mockResolvedValueOnce(null);
    const result = await saveTtsAudioToDam(testAudioUrl, testDesiredAssetName, testSourcePredictionId, mockTtsGenerationService);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to retrieve TTS prediction details.');
  });

  it('should return auth error if user is not authenticated', async () => {
    (mockSupabaseClient.auth.getUser as any).mockResolvedValueOnce({ data: { user: null }, error: { message: 'Auth error'} });
    const result = await saveTtsAudioToDam(testAudioUrl, testDesiredAssetName, testSourcePredictionId, mockTtsGenerationService);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Authentication failed.');
    expect(mockTtsGenerationService.downloadAndUploadAudio).not.toHaveBeenCalled();
    expect(mockAssetRepositoryInstance.save).not.toHaveBeenCalled();
  });

  it('should return error if active organization is not found', async () => {
    (getActiveOrganizationId as any).mockResolvedValueOnce(null);
    const result = await saveTtsAudioToDam(testAudioUrl, testDesiredAssetName, testSourcePredictionId, mockTtsGenerationService);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Active organization context is missing.');
    expect(mockTtsGenerationService.downloadAndUploadAudio).not.toHaveBeenCalled();
    expect(mockAssetRepositoryInstance.save).not.toHaveBeenCalled();
  });

  it('should return error if downloadAndUploadAudio service fails for replicate provider', async () => {
    const mockReplicatePrediction = createMockTtsPrediction({
      id: testSourcePredictionId,
      predictionProvider: 'replicate'
    });
    mockTtsRepositoryInstance.findById.mockResolvedValueOnce(mockReplicatePrediction);
    const serviceErrorMessage = 'Failed to download or upload audio';
    mockTtsGenerationService.downloadAndUploadAudio.mockRejectedValueOnce(new Error(serviceErrorMessage));
    const result = await saveTtsAudioToDam(testAudioUrl, testDesiredAssetName, testSourcePredictionId, mockTtsGenerationService);
    expect(result.success).toBe(false);
    expect(result.error).toBe(serviceErrorMessage);
    expect(mockAssetRepositoryInstance.save).not.toHaveBeenCalled();
  });

  it('should return error if asset repository save fails', async () => {
    const mockReplicatePrediction = createMockTtsPrediction({
      id: testSourcePredictionId,
      predictionProvider: 'replicate'
    });
    mockTtsRepositoryInstance.findById.mockResolvedValueOnce(mockReplicatePrediction);
    const dbErrorMessage = 'DB insert failed';
    mockAssetRepositoryInstance.save.mockRejectedValueOnce(new Error(dbErrorMessage));
    const result = await saveTtsAudioToDam(testAudioUrl, testDesiredAssetName, testSourcePredictionId, mockTtsGenerationService);
    expect(result.success).toBe(false);
    expect(result.error).toBe(`Database error: ${dbErrorMessage}`);
  });

  it('should return a generic error for unexpected issues', async () => {
    const mockReplicatePrediction = createMockTtsPrediction({
      id: testSourcePredictionId,
      predictionProvider: 'replicate'
    });
    mockTtsRepositoryInstance.findById.mockResolvedValueOnce(mockReplicatePrediction);
    (getActiveOrganizationId as any).mockRejectedValueOnce(new Error('Very unexpected problem'));
    const result = await saveTtsAudioToDam(testAudioUrl, testDesiredAssetName, testSourcePredictionId, mockTtsGenerationService);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Very unexpected problem');
  });
}); 