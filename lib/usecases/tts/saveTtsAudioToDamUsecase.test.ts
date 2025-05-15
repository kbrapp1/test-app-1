var mockGeneratedAssetId = 'mock-asset-uuid-generated';
var mockRandomUUIDSpy = vi.fn(() => mockGeneratedAssetId);

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveTtsAudioToDam } from './saveTtsAudioToDamUsecase';
import { createClient } from '@/lib/supabase/server';
import { getActiveOrganizationId } from '@/lib/auth/server-action';
import { downloadAndUploadAudio } from '@/lib/services/ttsService';
import { createAssetRecordInDb } from '@/lib/repositories/asset-repo';

// Mock dependencies (these are the correct ones for the usecase)
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/auth/server-action', () => ({
  getActiveOrganizationId: vi.fn(),
}));

vi.mock('@/lib/services/ttsService', () => ({
  downloadAndUploadAudio: vi.fn(),
}));

vi.mock('@/lib/repositories/asset-repo', () => ({
  createAssetRecordInDb: vi.fn(),
}));

// Correct crypto mock using the pattern suggested by Vitest for built-ins
vi.mock('crypto', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as any),
    randomUUID: mockRandomUUIDSpy,
  };
});

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
  // mockGeneratedAssetId is defined globally for the mock factory
  
  const mockDownloadUploadResponse = {
    storagePath: `${testOrgId}/tts-audio/service-generated-uuid.mp3`,
    contentType: 'audio/mpeg',
    blobSize: 12345,
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockRandomUUIDSpy.mockClear(); // Clear the spy, its return value is set at definition

    (createClient as any).mockReturnValue(mockSupabaseClient);
    (mockSupabaseClient.auth.getUser as any).mockResolvedValue({
      data: { user: { id: testUserId } },
      error: null,
    });
    (getActiveOrganizationId as any).mockResolvedValue(testOrgId);
    (downloadAndUploadAudio as any).mockResolvedValue(mockDownloadUploadResponse);
    (createAssetRecordInDb as any).mockResolvedValue({ data: { id: mockGeneratedAssetId }, error: null }); 
  });

  it('should successfully call services and create asset record', async () => {
    const result = await saveTtsAudioToDam(testAudioUrl, testDesiredAssetName, testSourcePredictionId);

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

  it('should return auth error if user is not authenticated', async () => {
    (mockSupabaseClient.auth.getUser as any).mockResolvedValueOnce({ data: { user: null }, error: { message: 'Auth error'} });
    const result = await saveTtsAudioToDam(testAudioUrl, testDesiredAssetName, testSourcePredictionId);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Authentication failed.');
    expect(downloadAndUploadAudio).not.toHaveBeenCalled();
    expect(createAssetRecordInDb).not.toHaveBeenCalled();
  });

  it('should return error if active organization is not found', async () => {
    (getActiveOrganizationId as any).mockResolvedValueOnce(null);
    const result = await saveTtsAudioToDam(testAudioUrl, testDesiredAssetName, testSourcePredictionId);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Active organization context is missing.');
    expect(downloadAndUploadAudio).not.toHaveBeenCalled();
    expect(createAssetRecordInDb).not.toHaveBeenCalled();
  });

  it('should return error if downloadAndUploadAudio service fails', async () => {
    const serviceErrorMessage = 'Failed to download or upload audio';
    (downloadAndUploadAudio as any).mockRejectedValueOnce(new Error(serviceErrorMessage));
    const result = await saveTtsAudioToDam(testAudioUrl, testDesiredAssetName, testSourcePredictionId);
    expect(result.success).toBe(false);
    expect(result.error).toBe(serviceErrorMessage);
    expect(createAssetRecordInDb).not.toHaveBeenCalled();
  });

  it('should return error if createAssetRecordInDb fails', async () => {
    const dbErrorMessage = 'DB insert failed';
    (createAssetRecordInDb as any).mockResolvedValueOnce({ data: null, error: { message: dbErrorMessage } });
    const result = await saveTtsAudioToDam(testAudioUrl, testDesiredAssetName, testSourcePredictionId);
    expect(result.success).toBe(false);
    expect(result.error).toBe(`Database error: ${dbErrorMessage}`);
  });

  it('should return error if createAssetRecordInDb returns no data/error', async () => {
    (createAssetRecordInDb as any).mockResolvedValueOnce({ data: null, error: null }); // Simulate no data, no error
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