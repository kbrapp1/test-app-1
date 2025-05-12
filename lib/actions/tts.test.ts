import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cookies } from 'next/headers'; // Mocked below
// Note: Replicate and Supabase Client are mocked dynamically below
import { ZodError } from 'zod';
// import { randomUUID } from 'crypto'; // No longer directly needed for these action tests
import { createClient } from '@/lib/supabase/server'; // Rename for clarity
// Import the actual crypto module
// import * as crypto from 'crypto'; // No longer directly needed for these action tests
import { Prediction } from 'replicate'; // Added import
import { jwtDecode } from 'jwt-decode'; // Import for mocking

// Import service functions to be mocked
import * as ttsService from '@/lib/services/tts';

// Type alias for the module we are testing
type TtsModule = typeof import('./tts');

// --- Mocks --- 

// Mock next/headers (hoisted)
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
  })),
}));

// Mock crypto globally for this test file, BEFORE dynamic imports
// This might still be needed if other tests in this file use it,
// but for saveTtsAudioToDam, direct reliance is removed.
vi.mock('crypto', async (importOriginal) => {
  const actualCrypto = await importOriginal<typeof import('crypto')>();
  return {
    ...actualCrypto,
    randomUUID: vi.fn(), 
  };
});

// Mock the service layer
vi.mock('@/lib/services/tts', () => ({
  getTtsVoices: vi.fn(),
  startSpeechGeneration: vi.fn(),
  getSpeechGenerationResult: vi.fn(),
  saveTtsAudioToDam: vi.fn(),
  saveTtsHistory: vi.fn(),
  getTtsHistory: vi.fn(),
}));

// Declare variables to hold mock functions - will be assigned inside vi.doMock
let mockReplicateCreate: ReturnType<typeof vi.fn>;
let mockReplicateGet: ReturnType<typeof vi.fn>;
let mockSupabaseGetUser: ReturnType<typeof vi.fn>;
// let mockSupabaseFrom: ReturnType<typeof vi.fn>; // Might be removed if no other action uses it directly
// let mockSupabaseInsert: ReturnType<typeof vi.fn>; // Removed for saveTtsAudioToDam, check other actions
// let mockSupabaseSelect: ReturnType<typeof vi.fn>; // Might be removed
// let mockSupabaseUpdate: ReturnType<typeof vi.fn>; // Might be removed
// let mockSupabaseEq: ReturnType<typeof vi.fn>; // Might be removed
// let mockSupabaseSingle: ReturnType<typeof vi.fn>; // Might be removed
// let mockSupabaseStorageFrom: ReturnType<typeof vi.fn>; // Removed for saveTtsAudioToDam
// let mockSupabaseStorageUpload: ReturnType<typeof vi.fn>; // Removed for saveTtsAudioToDam
// let mockSupabaseStorageRemove: ReturnType<typeof vi.fn>; // Might be removed
// let mockSupabaseStorageGetPublicUrl: ReturnType<typeof vi.fn>; // Might be removed
let mockFetch: ReturnType<typeof vi.fn>; // Removed for saveTtsAudioToDam, check other actions
// let mockRandomUUID: ReturnType<typeof vi.fn>; // Now part of service
// let mockSupabaseEqSelectId: ReturnType<typeof vi.fn>; // Might be removed
// let mockSupabaseSelectId: ReturnType<typeof vi.fn>; // Might be removed
// let mockSingleFetch: ReturnType<typeof vi.fn>; // Might be removed
// let mockEqSelectId: ReturnType<typeof vi.fn>; // Might be removed
// let mockSelectId: ReturnType<typeof vi.fn>; // Might be removed
let mockSupabaseGetSession: ReturnType<typeof vi.fn>;
let mockJwtDecode: ReturnType<typeof vi.fn>;

// Keep these if other describe blocks use them directly
let mockSupabaseFrom: ReturnType<typeof vi.fn>;
let mockSupabaseInsert: ReturnType<typeof vi.fn>;
let mockSupabaseSelect: ReturnType<typeof vi.fn>;
let mockSupabaseUpdate: ReturnType<typeof vi.fn>;
let mockSupabaseEq: ReturnType<typeof vi.fn>;
let mockSupabaseSingle: ReturnType<typeof vi.fn>;
let mockSupabaseStorageFrom: ReturnType<typeof vi.fn>;
let mockSupabaseStorageUpload: ReturnType<typeof vi.fn>;
let mockSupabaseStorageRemove: ReturnType<typeof vi.fn>;
let mockSupabaseStorageGetPublicUrl: ReturnType<typeof vi.fn>;
let mockSupabaseEqSelectId: ReturnType<typeof vi.fn>;
let mockSupabaseSelectId: ReturnType<typeof vi.fn>;
let mockSingleFetch: ReturnType<typeof vi.fn>;
let mockEqSelectId: ReturnType<typeof vi.fn>;
let mockSelectId: ReturnType<typeof vi.fn>;

// Helper to create FormData
function createFormData(data: Record<string, string>): FormData {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value);
  });
  return formData;
}

// --- Helpers for supabase.from mocks ---
// These helpers might need to be adjusted or removed if they are too specific
// to implementations now in the service layer.
const historyLimitStub = vi.fn().mockResolvedValue({ data: [], error: null });
const historyOrderStub = vi.fn(() => ({ limit: historyLimitStub }));
const historyEqStub = vi.fn(() => ({ order: historyOrderStub }));
const historySelectStub = vi.fn(() => ({ eq: historyEqStub }));
const historyFromStub = { select: historySelectStub } as any;

function applyDefaultSupabaseFromMock() {
  if (mockSupabaseFrom) { // Check if mockSupabaseFrom is initialized
    mockSupabaseFrom.mockImplementation((tableName: string) => {
      const eqUpdateChain = { eq: mockSupabaseEq };
      const eqSelectSingleChain = { eq: mockEqSelectId };
      const selectSingleChain = { select: vi.fn(() => eqSelectSingleChain) };
      if (tableName === 'TtsPrediction') {
        return {
          insert: vi.fn(() => selectSingleChain),
          select: mockSelectId,
          update: mockSupabaseUpdate?.mockReturnValue({ eq: mockSupabaseEq }),
        } as any;
      } else if (tableName === 'assets') { // This will be tested in service tests
        return { insert: vi.fn(() => selectSingleChain) } as any;
      }
      return { insert: vi.fn(), select: vi.fn(), update: vi.fn() } as any;
    });
  }
}

function applyHistorySupabaseFromMock() {
  if (mockSupabaseFrom) { // Check if mockSupabaseFrom is initialized
    mockSupabaseFrom.mockImplementation((tableName: string) => {
      if (tableName === 'TtsPrediction') {
        return historyFromStub as any;
      }
      return {} as any;
    });
  }
}

// --- Tests --- 

describe('TTS Server Actions', () => {
  const OLD_ENV = process.env;
  const testUserId = 'test-user-uuid';
  const testPredictionId = 'replicate-pred-id';
  const testInputText = 'Hello world';
  const testVoiceId = 'af_bella';
  const testAudioUrl = 'https://example.com/audio.mp3';
  const testNewAssetId = 'new-asset-uuid-789';
  // const mockUuid = 'mock-uuid-1234-5678-90ab-cdef12345678'; // Handled by service
  // const testGeneratedFilename = `${mockUuid}.mp3`; // Handled by service
  // const testStoragePath = `${testUserId}/audio/${testGeneratedFilename}`; // Handled by service
  const MODEL_IDENTIFIER = 'jaaari/kokoro-82m:f559560eb822dc509045f3921a1921234918b91739db4bf3daab2169b71c7a13';
  
  // Variable to hold the dynamically imported module
  let ttsActions: TtsModule;

  beforeEach(async () => {
    vi.resetAllMocks(); // Resets all mocks, including service mocks
    process.env = { ...OLD_ENV, REPLICATE_API_TOKEN: 'test-token' }; 
    
    // mockFetch = vi.fn(); // Not directly used by saveTtsAudioToDam action anymore
    // global.fetch = mockFetch; // Not directly used by saveTtsAudioToDam action anymore

    // --- Define Mocks --- 
    // Replicate Mocks (still needed if startSpeechGeneration etc. are tested here)
    mockReplicateCreate = vi.fn();
    mockReplicateGet = vi.fn();
    
    // Supabase Mocks (general ones, specific interactions for saveToDam are removed)
    mockSupabaseGetUser = vi.fn();
    mockSupabaseGetSession = vi.fn();
    mockJwtDecode = vi.fn();

    // Initialize mocks that might still be used by other actions in this file
    // For saveTtsAudioToDam, these are not directly tested at the action level anymore
    mockSupabaseFrom = vi.fn();
    mockSupabaseInsert = vi.fn();
    mockSupabaseSelect = vi.fn();
    mockSupabaseUpdate = vi.fn();
    mockSupabaseEq = vi.fn();
    mockSupabaseSingle = vi.fn();
    mockSupabaseStorageFrom = vi.fn();
    mockSupabaseStorageUpload = vi.fn();
    mockSupabaseStorageRemove = vi.fn();
    mockSupabaseStorageGetPublicUrl = vi.fn();
    mockSingleFetch = vi.fn();
    mockEqSelectId = vi.fn(() => ({ single: mockSingleFetch }));
    mockSelectId = vi.fn(() => ({ eq: mockEqSelectId }));
    

    // --- Dynamic Mocks --- 
    // Replicate mock (if other actions use it)
    vi.doMock('replicate', () => ({
      default: vi.fn(() => ({
        predictions: {
          create: mockReplicateCreate,
          get: mockReplicateGet,
        },
      })),
    }));

    // Mock the Supabase client creator (still needed for auth typically)
    // The detailed 'from' and 'storage' mocks for asset creation are less relevant here now.
    vi.doMock('@/lib/supabase/server', () => ({
      createClient: vi.fn(() => ({ 
        auth: { 
          getUser: mockSupabaseGetUser,
          getSession: mockSupabaseGetSession 
        },
        from: mockSupabaseFrom, // Keep for now, might be needed by other action tests
        storage: {             // Keep for now, might be needed by other action tests
          from: mockSupabaseStorageFrom.mockImplementation(() => ({
            upload: mockSupabaseStorageUpload,
            remove: mockSupabaseStorageRemove,
            getPublicUrl: mockSupabaseStorageGetPublicUrl,
          }))
        }, 
      })),
    }));

    // This mock might still be relevant for actions needing org ID
    vi.mock('@/lib/auth/server-action', () => ({
      getActiveOrganizationId: vi.fn(async () => 'test-org-id'),
    }));

    // Mock jwt-decode (if other actions use it)
    vi.doMock('jwt-decode', () => ({
      jwtDecode: mockJwtDecode,
    }));
    
    // --- Setup Default Mock Return Values --- 
    mockSupabaseGetUser.mockResolvedValue({ data: { user: { id: testUserId } }, error: null });
    mockSupabaseGetSession.mockResolvedValue({ 
      data: { 
        session: { 
          access_token: 'mock_mock_access_token', 
          user: { id: testUserId } 
        } 
      }, 
      error: null 
    });
    mockJwtDecode.mockReturnValue({ active_org_id: 'test-org-id', user_id: testUserId });

    // Dynamically import the module to test AFTER all mocks are set up
    ttsActions = await import('./tts'); 
  });

  afterEach(() => {
    process.env = OLD_ENV; // Restore original environment variables
    vi.restoreAllMocks(); // Ensures mocks are clean for other test files
  });

  describe('startSpeechGeneration', () => {
    const formData = createFormData({ 
      inputText: testInputText, 
      voiceId: testVoiceId
    });
    const mockServiceSuccessResponse = {
      success: true,
      predictionId: testPredictionId,
      dbRecordId: 'db-id-from-service',
      status: 'starting'
    };
    const mockServiceValidationError = {
      success: false,
      error: 'Input text cannot be empty.',
      issues: [{ path: ['inputText'], message: 'Input text cannot be empty.' }]
    };
    const mockServiceAuthError = {
      success: false,
      error: 'Authentication failed. Please log in again.'
    };

    it('should call startSpeechGenerationService with formData and return its successful result', async () => {
      vi.mocked(ttsService.startSpeechGeneration).mockResolvedValue(mockServiceSuccessResponse);

      const result = await ttsActions.startSpeechGeneration(formData);

      expect(ttsService.startSpeechGeneration).toHaveBeenCalledTimes(1);
      expect(ttsService.startSpeechGeneration).toHaveBeenCalledWith(formData);
      expect(result).toEqual(mockServiceSuccessResponse);
      // Old detailed assertions (Replicate calls, Supabase inserts) are removed
    });

    it('should return validation error result from service if service call returns validation error', async () => {
      vi.mocked(ttsService.startSpeechGeneration).mockResolvedValue(mockServiceValidationError);

      const result = await ttsActions.startSpeechGeneration(formData); // formData might be invalid for this test

      expect(ttsService.startSpeechGeneration).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockServiceValidationError);
    });

    it('should return auth error result from service if service call returns auth error', async () => {
      vi.mocked(ttsService.startSpeechGeneration).mockResolvedValue(mockServiceAuthError);

      const result = await ttsActions.startSpeechGeneration(formData);

      expect(ttsService.startSpeechGeneration).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockServiceAuthError);
    });

    it('should propagate thrown errors from the service', async () => {
      const serviceError = new Error('Critical service failure during start');
      vi.mocked(ttsService.startSpeechGeneration).mockRejectedValue(serviceError);

      await expect(
        ttsActions.startSpeechGeneration(formData)
      ).rejects.toThrow(serviceError);
      expect(ttsService.startSpeechGeneration).toHaveBeenCalledTimes(1);
    });

    // Old tests to be removed or moved to service layer tests:
    // - it('should return error if user is not authenticated') // Covered by service returning auth error
    // - it('should return error if REPLICATE_API_TOKEN is not set') // Service layer concern
    // - it('should return validation error for empty input text') // Covered by service returning validation error
    // - it('should return validation error for missing voiceId') // Covered by service returning validation error
    // - it('should return error if Replicate API fails') // Service layer concern
    // - it('should return error if Supabase insert fails') // Service layer concern
  });

  describe('saveTtsAudioToDam', () => {
    const testAudioUrl = 'https://example.com/audio.wav';
    const testDesiredAssetName = 'My Test Speech';
    const testTtsPredictionId = 'tts-pred-123';
    const mockServiceResponse = {
      success: true,
      message: 'File saved successfully',
      assetId: 'new-asset-uuid-from-service',
      assetUrl: 'https://supabase.com/storage/v1/object/public/dam-assets/test-user-uuid/audio/service-generated.wav'
    };

    it('should call saveTtsAudioToDamService with correct parameters and return its result', async () => {
      vi.mocked(ttsService.saveTtsAudioToDam).mockResolvedValue(mockServiceResponse);

      const result = await ttsActions.saveTtsAudioToDam(
        testAudioUrl,
        testDesiredAssetName,
        testTtsPredictionId
      );

      expect(ttsService.saveTtsAudioToDam).toHaveBeenCalledTimes(1);
      expect(ttsService.saveTtsAudioToDam).toHaveBeenCalledWith(
        testAudioUrl,
        testDesiredAssetName,
        testTtsPredictionId
      );
      expect(result).toEqual(mockServiceResponse);
    });

    it('should return error result from service if service call fails', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'Service failed to save audio',
        error: 'Service error details'
      };
      vi.mocked(ttsService.saveTtsAudioToDam).mockResolvedValue(mockErrorResponse);

      const result = await ttsActions.saveTtsAudioToDam(
        testAudioUrl,
        testDesiredAssetName,
        testTtsPredictionId
      );

      expect(ttsService.saveTtsAudioToDam).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockErrorResponse);
    });

    it('should propagate thrown errors from the service', async () => {
      const serviceError = new Error('Critical service failure');
      vi.mocked(ttsService.saveTtsAudioToDam).mockRejectedValue(serviceError);

      await expect(
        ttsActions.saveTtsAudioToDam(
          testAudioUrl,
          testDesiredAssetName,
          testTtsPredictionId
        )
      ).rejects.toThrow(serviceError);
      expect(ttsService.saveTtsAudioToDam).toHaveBeenCalledTimes(1);
    });

    // Remove old tests that go into implementation details now covered by service tests
    // For example, tests checking:
    // - successful file download and upload to Supabase storage
    // - correct asset record creation in database
    // - filename generation logic (randomUUID)
    // - specific error handling for fetch, storage upload, or db insert failures
    // These are now tested in lib/services/tts.test.ts
  });

  describe('getTtsHistory', () => {
    const mockHistoryEntry = {
      id: 'hist-entry-123',
      inputText: 'Hello, this is a test entry.',
      replicatePredictionId: 'replicate-pred-id-xyz',
      status: 'succeeded' as const,
      outputUrl: 'https://example.com/audio/history_output.mp3',
      createdAt: new Date().toISOString(),
      // Adding other likely fields for completeness, though not explicitly in this error message
      voiceId: 'voice_id_abc',
      userId: testUserId, // Reuse existing testUserId
      organizationId: 'test-org-id', // Reuse existing mock orgId
      updatedAt: new Date().toISOString(),
      errorMessage: null,
    };
    const mockServiceResponse = { success: true, data: [mockHistoryEntry] };

    it('should call getTtsHistoryService and return its result', async () => {
      vi.mocked(ttsService.getTtsHistory).mockResolvedValue(mockServiceResponse);

      const result = await ttsActions.getTtsHistory();

      expect(ttsService.getTtsHistory).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockServiceResponse);
    });

    it('should return error from service if service call fails', async () => {
      const mockError = { success: false, error: 'Service error retrieving history' }; 
      vi.mocked(ttsService.getTtsHistory).mockResolvedValue(mockError);

      const result = await ttsActions.getTtsHistory();
      expect(ttsService.getTtsHistory).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockError);
    });
  });

  // describe('deleteTtsPrediction', () => { ... }); // TODO: Refactor similarly

  describe('saveTtsHistory', () => {
    const mockInput = {
      userId: testUserId,
      organizationId: 'test-org-id',
      inputText: 'test input',
      voiceId: 'test-voice',
      replicatePredictionId: 'pred-123',
      status: 'succeeded' as const,
      audioUrl: 'http://example.com/audio.mp3'
    };
    const mockServiceResponse = { success: true, data: { id: 'hist-1', ...mockInput } };

    it('should call saveTtsHistoryService with correct params and return its result', async () => {
      vi.mocked(ttsService.saveTtsHistory).mockResolvedValue(mockServiceResponse);
      // applyDefaultSupabaseFromMock(); // Detail for service layer

      const result = await ttsActions.saveTtsHistory(mockInput);

      expect(ttsService.saveTtsHistory).toHaveBeenCalledTimes(1);
      expect(ttsService.saveTtsHistory).toHaveBeenCalledWith(mockInput);
      expect(result).toEqual(mockServiceResponse);
      // Old assertions for Supabase 'from' and 'insert' would be removed
    });

    it('should return error from service if service call fails for saveTtsHistory', async () => {
        const mockErrorResponse = { success: false, error: 'Service error saving history' };
      vi.mocked(ttsService.saveTtsHistory).mockResolvedValue(mockErrorResponse);

      const result = await ttsActions.saveTtsHistory(mockInput);
      expect(ttsService.saveTtsHistory).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockErrorResponse);
    });
  });

  describe('getSpeechGenerationResult', () => {
    const testReplicateId = 'replicate-pred-for-get';
    const mockServiceProcessingResponse = {
      success: true,
      status: 'processing' as const,
      audioUrl: null,
      error: null,
      ttsPredictionDbId: 'db-id-123'
    };
    const mockServiceSucceededResponse = {
      success: true,
      status: 'succeeded' as const,
      audioUrl: 'https://example.com/audio_from_replicate.mp3',
      error: null,
      ttsPredictionDbId: 'db-id-123'
    };
    const mockServiceFailedResponse = {
      success: false,
      status: 'failed' as const,
      audioUrl: null,
      error: 'Replicate model failed internally',
      ttsPredictionDbId: 'db-id-123' 
    };
    const mockServiceAuthError = {
      success: false,
      error: 'User not authenticated for getResult',
      status: 'unknown' as const, // Added status for type compatibility
      audioUrl: null,           // Added audioUrl for type compatibility
      ttsPredictionDbId: null   // Added ttsPredictionDbId for type compatibility
    };

    it('should call getSpeechGenerationResultService and return its processing result', async () => {
      vi.mocked(ttsService.getSpeechGenerationResult).mockResolvedValue(mockServiceProcessingResponse);

      const result = await ttsActions.getSpeechGenerationResult(testReplicateId);

      expect(ttsService.getSpeechGenerationResult).toHaveBeenCalledTimes(1);
      expect(ttsService.getSpeechGenerationResult).toHaveBeenCalledWith(testReplicateId);
      expect(result).toEqual(mockServiceProcessingResponse);
      // Old detailed Replicate/Supabase checks are removed
    });

    it('should call getSpeechGenerationResultService and return its succeeded result', async () => {
      vi.mocked(ttsService.getSpeechGenerationResult).mockResolvedValue(mockServiceSucceededResponse);

      const result = await ttsActions.getSpeechGenerationResult(testReplicateId);

      expect(ttsService.getSpeechGenerationResult).toHaveBeenCalledTimes(1);
      expect(ttsService.getSpeechGenerationResult).toHaveBeenCalledWith(testReplicateId);
      expect(result).toEqual(mockServiceSucceededResponse);
    });

    it('should call getSpeechGenerationResultService and return its failed result', async () => {
      vi.mocked(ttsService.getSpeechGenerationResult).mockResolvedValue(mockServiceFailedResponse);

      const result = await ttsActions.getSpeechGenerationResult(testReplicateId);

      expect(ttsService.getSpeechGenerationResult).toHaveBeenCalledTimes(1);
      expect(ttsService.getSpeechGenerationResult).toHaveBeenCalledWith(testReplicateId);
      expect(result).toEqual(mockServiceFailedResponse);
    });

    it('should return auth error from service if service call returns auth error', async () => {
      vi.mocked(ttsService.getSpeechGenerationResult).mockResolvedValue(mockServiceAuthError);

      const result = await ttsActions.getSpeechGenerationResult(testReplicateId);
      expect(ttsService.getSpeechGenerationResult).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockServiceAuthError);
    });

    it('should propagate thrown errors from the service', async () => {
      const serviceError = new Error('Critical service failure during getResult');
      vi.mocked(ttsService.getSpeechGenerationResult).mockRejectedValue(serviceError);

      await expect(
        ttsActions.getSpeechGenerationResult(testReplicateId)
      ).rejects.toThrow(serviceError);
      expect(ttsService.getSpeechGenerationResult).toHaveBeenCalledTimes(1);
    });
    
    // Old tests to be removed/moved to service tests:
    // - it('should return error if user is not authenticated')
    // - it('should return error if REPLICATE_API_TOKEN is not set')
    // - it('should return error if Replicate API fails')
    // - DB update logic tests
  });
});

// Utility function to create FormData - keep if used by other actions
// function createFormData(data: Record<string, string>): FormData {
//   const formData = new FormData();
//   Object.entries(data).forEach(([key, value]) => {
//     formData.append(key, value);
//   });
//   return formData;
// }

// Helper function to create FormData if not already present from previous diffs
// Ensure createFormData is defined if it was missed in earlier steps.
if (typeof createFormData === 'undefined') {
  function createFormData(data: Record<string, string>): FormData {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });
    return formData;
  }
} 