var mockGeneratedAssetId = 'mock-asset-uuid-generated';
var mockRandomUUIDSpy = vi.fn(() => mockGeneratedAssetId);

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveTtsAudioToDam } from './saveTtsAudioToDamUsecase';
import { createClient } from '@/lib/supabase/server';
import { getActiveOrganizationId } from '@/lib/auth/server-action';
import { downloadAndUploadAudio } from '@/lib/services/ttsService';
import { createAssetRecordInDb } from '@/lib/repositories/asset.db.repo';
import type { Database } from '@/types/supabase'; // Import Database type

type TtsPredictionRow = Database['public']['Tables']['TtsPrediction']['Row'];

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/auth/server-action', () => ({
  getActiveOrganizationId: vi.fn(),
}));

vi.mock('@/lib/services/ttsService', () => ({
  downloadAndUploadAudio: vi.fn(),
}));

vi.mock('@/lib/repositories/asset.db.repo', () => ({
  createAssetRecordInDb: vi.fn(),
}));

vi.mock('crypto', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as any),
    randomUUID: mockRandomUUIDSpy,
  };
});

// Enhanced mock Supabase client
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn().mockReturnThis(), // Allow chaining
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(), // This will be specifically mocked in tests
};


describe('saveTtsAudioToDamUsecase', () => {
  const testAudioUrl = 'http://example.com/audio.mp3';
  const testDesiredAssetName = 'My Test Audio.mp3';
  const testSourcePredictionId = 'pred-123';
  const testUserId = 'user-abc-123';
  const testOrgId = 'org-xyz-789';
  
  const mockReplicatePrediction: Partial<TtsPredictionRow> = {
    id: testSourcePredictionId,
    outputUrl: testAudioUrl,
    prediction_provider: 'replicate',
  };

  const mockElevenlabsPrediction: any = { // Cast to any for now
    id: testSourcePredictionId,
    prediction_provider: 'elevenlabs',
    output_storage_path: 'org/elevenlabs/audio.mp3',
    output_content_type: 'audio/mpeg',
    output_file_size: 54321,
    outputUrl: 'http://supabase-storage.com/org/elevenlabs/audio.mp3' 
  };

  const mockDownloadUploadResponse = {
    storagePath: `${testOrgId}/tts-audio/service-generated-uuid.mp3`,
    contentType: 'audio/mpeg',
    blobSize: 12345,
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockRandomUUIDSpy.mockClear();

    (createClient as any).mockReturnValue(mockSupabaseClient);
    (mockSupabaseClient.auth.getUser as any).mockResolvedValue({
      data: { user: { id: testUserId } },
      error: null,
    });
    (getActiveOrganizationId as any).mockResolvedValue(testOrgId);
    (downloadAndUploadAudio as any).mockResolvedValue(mockDownloadUploadResponse);
    (createAssetRecordInDb as any).mockResolvedValue({ data: { id: mockGeneratedAssetId }, error: null }); 
    
    (mockSupabaseClient.single as any).mockResolvedValue({ data: mockReplicatePrediction, error: null });
  });

  it('should successfully call services and create asset record for replicate provider', async () => {
    (mockSupabaseClient.single as any).mockResolvedValueOnce({ data: mockReplicatePrediction, error: null });

    const result = await saveTtsAudioToDam(testAudioUrl, testDesiredAssetName, testSourcePredictionId);

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('TtsPrediction');
    expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
    expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', testSourcePredictionId);
    expect(mockSupabaseClient.single).toHaveBeenCalledTimes(1);

    expect(getActiveOrganizationId).toHaveBeenCalledTimes(1);
    expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledTimes(1);
    expect(downloadAndUploadAudio).toHaveBeenCalledWith(testAudioUrl, testOrgId, testUserId);
    
    expect(createAssetRecordInDb).toHaveBeenCalledWith({
      id: mockGeneratedAssetId,
      name: testDesiredAssetName,
      storagePath: mockDownloadUploadResponse.storagePath,
      mimeType: mockDownloadUploadResponse.contentType,
      size: mockDownloadUploadResponse.blobSize,
      userId: testUserId,
      organizationId: testOrgId,
      folderId: null,
    });

    expect(result.success).toBe(true);
    expect(result.assetId).toBe(mockGeneratedAssetId);
    expect(result.error).toBeUndefined();
  });

  it('should use stored metadata and not call download/upload for elevenlabs provider', async () => {
    (mockSupabaseClient.single as any).mockResolvedValueOnce({ data: mockElevenlabsPrediction, error: null });

    const result = await saveTtsAudioToDam(
      mockElevenlabsPrediction.outputUrl!, 
      testDesiredAssetName, 
      testSourcePredictionId
    );

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('TtsPrediction');
    expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
    expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', testSourcePredictionId);
    expect(mockSupabaseClient.single).toHaveBeenCalledTimes(1);

    expect(downloadAndUploadAudio).not.toHaveBeenCalled(); 
    
    expect(createAssetRecordInDb).toHaveBeenCalledWith({
      id: mockGeneratedAssetId,
      name: testDesiredAssetName,
      storagePath: mockElevenlabsPrediction.output_storage_path,
      mimeType: mockElevenlabsPrediction.output_content_type,
      size: mockElevenlabsPrediction.output_file_size,
      userId: testUserId,
      organizationId: testOrgId,
      folderId: null,
    });

    expect(result.success).toBe(true);
    expect(result.assetId).toBe(mockGeneratedAssetId);
    expect(result.error).toBeUndefined();
  });

  it('should return error if TtsPrediction record not found', async () => {
    (mockSupabaseClient.single as any).mockResolvedValueOnce({ data: null, error: null });
    const result = await saveTtsAudioToDam(testAudioUrl, testDesiredAssetName, testSourcePredictionId);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to retrieve TTS prediction details.');
  });

  it('should return auth error if user is not authenticated', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (mockSupabaseClient.auth.getUser as any).mockResolvedValueOnce({ data: { user: null }, error: { message: 'Auth error'} });
    const result = await saveTtsAudioToDam(testAudioUrl, testDesiredAssetName, testSourcePredictionId);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Authentication failed.');
    expect(downloadAndUploadAudio).not.toHaveBeenCalled();
    expect(createAssetRecordInDb).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('should return error if active organization is not found', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (getActiveOrganizationId as any).mockResolvedValueOnce(null);
    const result = await saveTtsAudioToDam(testAudioUrl, testDesiredAssetName, testSourcePredictionId);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Active organization context is missing.');
    expect(downloadAndUploadAudio).not.toHaveBeenCalled();
    expect(createAssetRecordInDb).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('should return error if downloadAndUploadAudio service fails for replicate provider', async () => {
    (mockSupabaseClient.single as any).mockResolvedValueOnce({ data: mockReplicatePrediction, error: null });
    const serviceErrorMessage = 'Failed to download or upload audio';
    (downloadAndUploadAudio as any).mockRejectedValueOnce(new Error(serviceErrorMessage));
    const result = await saveTtsAudioToDam(testAudioUrl, testDesiredAssetName, testSourcePredictionId);
    expect(result.success).toBe(false);
    expect(result.error).toBe(serviceErrorMessage);
    expect(createAssetRecordInDb).not.toHaveBeenCalled();
  });

  it('should return error if createAssetRecordInDb fails (for replicate)', async () => {
    (mockSupabaseClient.single as any).mockResolvedValueOnce({ data: mockReplicatePrediction, error: null });
    const dbErrorMessage = 'DB insert failed';
    (createAssetRecordInDb as any).mockResolvedValueOnce({ data: null, error: { message: dbErrorMessage } });
    const result = await saveTtsAudioToDam(testAudioUrl, testDesiredAssetName, testSourcePredictionId);
    expect(result.success).toBe(false);
    expect(result.error).toBe(`Database error: ${dbErrorMessage}`);
  });

  it('should return error if createAssetRecordInDb returns no data/error (for replicate)', async () => {
    (mockSupabaseClient.single as any).mockResolvedValueOnce({ data: mockReplicatePrediction, error: null });
    (createAssetRecordInDb as any).mockResolvedValueOnce({ data: null, error: null });
    const result = await saveTtsAudioToDam(testAudioUrl, testDesiredAssetName, testSourcePredictionId);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to save asset metadata.');
  });

  it('should return a generic error for unexpected issues', async () => {
    (getActiveOrganizationId as any).mockRejectedValueOnce(new Error('Very unexpected problem'));
    const result = await saveTtsAudioToDam(testAudioUrl, testDesiredAssetName, testSourcePredictionId);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Very unexpected problem');
  });

}); 