import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { cookies } from 'next/headers'; // Mocked below
// Note: Replicate and Supabase Client are mocked dynamically below
import { ZodError } from 'zod';
// import { randomUUID } from 'crypto'; // No longer directly needed for these action tests
import { createClient } from '@/lib/supabase/server'; // Rename for clarity
// Import the actual crypto module
// import * as crypto from 'crypto'; // No longer directly needed for these action tests
import { Prediction } from 'replicate'; // Added import
import { jwtDecode } from 'jwt-decode'; // Import for mocking

// Import service functions to be mocked - REPLACED with usecase imports
// import * as ttsService from '@/lib/services/tts';

// Import usecase functions individually for mocking
// These are the actual paths, vi.mock below will replace them with mocks for this test file
import { getTtsVoices as getTtsVoicesUsecase } from '@/lib/usecases/tts/getTtsVoicesUsecase';
import { startSpeechGeneration as startSpeechGenerationUsecase } from '@/lib/usecases/tts/startSpeechGenerationUsecase';
import { getSpeechGenerationResult as getSpeechGenerationResultUsecase } from '@/lib/usecases/tts/getSpeechGenerationResultUsecase';
import { saveTtsAudioToDam as saveTtsAudioToDamUsecase } from '@/lib/usecases/tts/saveTtsAudioToDamUsecase';
import { saveTtsHistory as saveTtsHistoryUsecase } from '@/lib/usecases/tts/saveTtsHistoryUsecase';
import { getTtsHistory as getTtsHistoryUsecase } from '@/lib/usecases/tts/getTtsHistoryUsecase';

// Type alias for the module we are testing
type TtsModule = typeof import('./tts');

// Variable to hold the dynamically imported module - moved to higher scope
let ttsActions: TtsModule;

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

// Mock individual usecase modules. These mocks will be used when ttsActions calls them.
vi.mock('@/lib/usecases/tts/getTtsVoicesUsecase', () => ({ getTtsVoices: vi.fn() }));
vi.mock('@/lib/usecases/tts/startSpeechGenerationUsecase', () => ({ startSpeechGeneration: vi.fn() }));
vi.mock('@/lib/usecases/tts/getSpeechGenerationResultUsecase', () => ({ getSpeechGenerationResult: vi.fn() }));
vi.mock('@/lib/usecases/tts/saveTtsAudioToDamUsecase', () => ({ saveTtsAudioToDam: vi.fn() }));
vi.mock('@/lib/usecases/tts/saveTtsHistoryUsecase', () => ({ saveTtsHistory: vi.fn() }));
vi.mock('@/lib/usecases/tts/getTtsHistoryUsecase', () => ({ getTtsHistory: vi.fn() }));

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
  const testProviderId = 'replicate'; // Added for the test
  // const mockUuid = 'mock-uuid-1234-5678-90ab-cdef12345678'; // Handled by service
  // const testGeneratedFilename = `${mockUuid}.mp3`; // Handled by service
  // const testStoragePath = `${testUserId}/audio/${testGeneratedFilename}`; // Handled by service
  const MODEL_IDENTIFIER = 'jaaari/kokoro-82m:f559560eb822dc509045f3921a1921234918b91739db4bf3daab2169b71c7a13';
  
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
    
    // Reset all mocks (including the auto-mocked usecases) before each test.
    // Specific mock implementations for usecases will be set in each test block.
    vi.resetAllMocks();


    // Dynamically import the module to get the actual implementations or their auto-mocks
    ttsActions = await import('./tts'); 

    // Now, import the mocked usecases *after* dynamic import of actions 
    // so we can reference the mocks correctly in tests
    const { getTtsVoices } = await import('@/lib/usecases/tts/getTtsVoicesUsecase');
    const { startSpeechGeneration } = await import('@/lib/usecases/tts/startSpeechGenerationUsecase');
    const { getSpeechGenerationResult } = await import('@/lib/usecases/tts/getSpeechGenerationResultUsecase');
    const { saveTtsAudioToDam } = await import('@/lib/usecases/tts/saveTtsAudioToDamUsecase');
    const { saveTtsHistory } = await import('@/lib/usecases/tts/saveTtsHistoryUsecase');
    const { getTtsHistory } = await import('@/lib/usecases/tts/getTtsHistoryUsecase');

    // Assign to module-level variables ONLY if needed across multiple tests,
    // otherwise, just use the imported consts directly in each `it` block.
    // mockGetTtsVoices = getTtsVoices;
    // mockStartSpeechGeneration = startSpeechGeneration; 
    // ... etc
  });

  afterEach(() => {
    process.env = OLD_ENV;
    vi.restoreAllMocks(); // This will restore the original implementations
  });

  describe('startSpeechGeneration', () => {
    // const formData = createFormData({ inputText: testInputText, voiceId: testVoiceId, provider: testProviderId }); // No longer needed for these tests
    const mockUsecaseSuccessResponse = { success: true, predictionId: testPredictionId };
    const mockUsecaseValidationError = { success: false, errors: { inputText: ['Required'] } };
    const mockUsecaseAuthError = { success: false, error: 'Auth failed' };

    it('should call startSpeechGeneration usecase with inputText, voiceId, and provider and return its successful result', async () => {
      // Import the mock for this test
      const { startSpeechGeneration } = await import('@/lib/usecases/tts/startSpeechGenerationUsecase');
      (startSpeechGeneration as Mock).mockResolvedValue(mockUsecaseSuccessResponse);
      
      const result = await ttsActions.startSpeechGeneration(testInputText, testVoiceId, testProviderId); // Call with individual args

      expect(startSpeechGeneration).toHaveBeenCalledTimes(1);
      expect(startSpeechGeneration).toHaveBeenCalledWith(testInputText, testVoiceId, testProviderId);
      expect(result).toEqual(mockUsecaseSuccessResponse);
    });

    it('should return validation error result from usecase if usecase call returns validation error', async () => {
      const { startSpeechGeneration } = await import('@/lib/usecases/tts/startSpeechGenerationUsecase');
      (startSpeechGeneration as Mock).mockResolvedValue(mockUsecaseValidationError);

      const result = await ttsActions.startSpeechGeneration(testInputText, testVoiceId, testProviderId); // Call with individual args

      expect(startSpeechGeneration).toHaveBeenCalledTimes(1);
      expect(startSpeechGeneration).toHaveBeenCalledWith(testInputText, testVoiceId, testProviderId);
      expect(result).toEqual(mockUsecaseValidationError);
    });

    it('should return auth error result from usecase if usecase call returns auth error', async () => {
      const { startSpeechGeneration } = await import('@/lib/usecases/tts/startSpeechGenerationUsecase');
      (startSpeechGeneration as Mock).mockResolvedValue(mockUsecaseAuthError);

      const result = await ttsActions.startSpeechGeneration(testInputText, testVoiceId, testProviderId); // Call with individual args

      expect(startSpeechGeneration).toHaveBeenCalledTimes(1);
      expect(startSpeechGeneration).toHaveBeenCalledWith(testInputText, testVoiceId, testProviderId);
      expect(result).toEqual(mockUsecaseAuthError);
    });

    it('should propagate thrown errors from the usecase', async () => {
      const usecaseError = new Error('Critical usecase failure during start');
      const { startSpeechGeneration } = await import('@/lib/usecases/tts/startSpeechGenerationUsecase');
      (startSpeechGeneration as Mock).mockRejectedValue(usecaseError);

      await expect(
        ttsActions.startSpeechGeneration(testInputText, testVoiceId, testProviderId) // Call with individual args
      ).rejects.toThrow(usecaseError);
      expect(startSpeechGeneration).toHaveBeenCalledTimes(1);
      expect(startSpeechGeneration).toHaveBeenCalledWith(testInputText, testVoiceId, testProviderId);
    });
  });

  describe('saveTtsAudioToDam', () => {
    const predictionId = 'pred-123';
    const assetId = 'asset-456';
    const ttsPredictionId = 'tts-pred-uuid-001';

    // Specific beforeEach for saveTtsAudioToDam to set up its mocks correctly
    beforeEach(() => {
      (saveTtsAudioToDamUsecase as Mock).mockReset();
      
      const mockEqUpdate = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn(() => ({ eq: mockEqUpdate })); 
      
      mockSupabaseFrom.mockImplementation((tableName: string) => {
        if (tableName === 'TtsPrediction') {
          return { update: mockUpdate } as any;
        }
        return { 
          insert: vi.fn().mockReturnThis(), 
          select: vi.fn().mockReturnThis(), 
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: {}, error: null }),
        } as any;
      });
    });

    it('should call saveTtsAudioToDam usecase with correct parameters and return its result (linking enabled)', async () => {
      const mockUsecaseResponse = { success: true, assetId: assetId };
      (saveTtsAudioToDamUsecase as Mock).mockResolvedValue(mockUsecaseResponse);
      
      const mockEqUpdateFn = vi.fn().mockResolvedValue({ error: null });
      const mockUpdateFn = vi.fn(() => ({ eq: mockEqUpdateFn }));
      mockSupabaseFrom.mockImplementation((tableName: string) => {
        if (tableName === 'TtsPrediction') {
          return { update: mockUpdateFn };
        }
        return {}; 
      });

      // Call with 4 args (linkToPrediction = true by default, but explicit here for clarity)
      const result = await ttsActions.saveTtsAudioToDam(testAudioUrl, 'test_audio.mp3', ttsPredictionId, true);

      expect(saveTtsAudioToDamUsecase).toHaveBeenCalledWith(
        testAudioUrl,
        'test_audio.mp3',
        ttsPredictionId
        // No userId here, usecase handles it
      );
      expect(result).toEqual({ success: true, assetId: assetId });
      
      expect(mockUpdateFn).toHaveBeenCalledWith({ outputAssetId: assetId });
      expect(mockEqUpdateFn).toHaveBeenCalledWith('id', ttsPredictionId);
    });

    it('should call saveTtsAudioToDam usecase and not link if linkToPrediction is false', async () => {
      const mockUsecaseResponse = { success: true, assetId: assetId };
      (saveTtsAudioToDamUsecase as Mock).mockResolvedValue(mockUsecaseResponse);

      const mockUpdateFn = vi.fn(); // Should not be called
      mockSupabaseFrom.mockImplementation((tableName: string) => {
        if (tableName === 'TtsPrediction') {
          return { update: mockUpdateFn };
        }
        return {};
      });

      // Call with 4 args (linkToPrediction = false)
      const result = await ttsActions.saveTtsAudioToDam(testAudioUrl, 'test_audio_no_link.mp3', ttsPredictionId, false);

      expect(saveTtsAudioToDamUsecase).toHaveBeenCalledWith(
        testAudioUrl,
        'test_audio_no_link.mp3',
        ttsPredictionId
      );
      expect(result).toEqual({ success: true, assetId: assetId });
      expect(mockUpdateFn).not.toHaveBeenCalled();
    });


    it('should return error result from usecase if usecase call fails', async () => {
      const usecaseError = { success: false, error: 'Usecase failed' };
      (saveTtsAudioToDamUsecase as Mock).mockResolvedValue(usecaseError);

      // Call with 3 args (linkToPrediction defaults to true)
      const result = await ttsActions.saveTtsAudioToDam(testAudioUrl, 'test_audio.mp3', ttsPredictionId);
      expect(result).toEqual(usecaseError);
      expect(saveTtsAudioToDamUsecase).toHaveBeenCalledWith(testAudioUrl, 'test_audio.mp3', ttsPredictionId);
    });

    it('should propagate thrown errors from the usecase', async () => {
      const usecaseError = new Error('Usecase threw an error');
      (saveTtsAudioToDamUsecase as Mock).mockRejectedValue(usecaseError);

      await expect(
        // Call with 3 args
        ttsActions.saveTtsAudioToDam(testAudioUrl, 'test_audio.mp3', ttsPredictionId)
      ).rejects.toThrow(usecaseError);
      expect(saveTtsAudioToDamUsecase).toHaveBeenCalledWith(testAudioUrl, 'test_audio.mp3', ttsPredictionId);
    });

    it('should return asset created but linking failed if Supabase update fails', async () => {
      const mockUsecaseResponse = { success: true, assetId: assetId };
      (saveTtsAudioToDamUsecase as Mock).mockResolvedValue(mockUsecaseResponse);

      const linkErrorMessage = 'Supabase link error';
      const mockEqUpdateFn = vi.fn().mockResolvedValue({ error: { message: linkErrorMessage } });
      const mockUpdateFn = vi.fn(() => ({ eq: mockEqUpdateFn }));
      mockSupabaseFrom.mockImplementation((tableName: string) => {
        if (tableName === 'TtsPrediction') {
          return { update: mockUpdateFn };
        }
        return {};
      });

      // Call with linking enabled (default)
      const result = await ttsActions.saveTtsAudioToDam(testAudioUrl, 'test_audio.mp3', ttsPredictionId);

      expect(saveTtsAudioToDamUsecase).toHaveBeenCalledWith(testAudioUrl, 'test_audio.mp3', ttsPredictionId);
      expect(mockUpdateFn).toHaveBeenCalledWith({ outputAssetId: assetId });
      expect(mockEqUpdateFn).toHaveBeenCalledWith('id', ttsPredictionId);
      expect(result.success).toBe(true);
      expect(result.assetId).toBe(assetId);
      expect(result.error).toContain(linkErrorMessage);
    });

  });

  describe('getTtsHistory', () => {
     const mockUsecaseResponse = { success: true, data: [{ id: 'hist-1', text: 'test' }] };
     
    it('should call getTtsHistory usecase and return its result when no params are provided', async () => {
      const { getTtsHistory } = await import('@/lib/usecases/tts/getTtsHistoryUsecase');
      (getTtsHistory as Mock).mockResolvedValue(mockUsecaseResponse);

      const result = await ttsActions.getTtsHistory(); // No params

      expect(getTtsHistory).toHaveBeenCalledTimes(1);
      expect(getTtsHistory).toHaveBeenCalledWith(undefined); // Or expect.anything() if default object is passed by action
      expect(result).toEqual(mockUsecaseResponse);
    });

    it('should call getTtsHistory usecase with provided params and return its result', async () => {
      const { getTtsHistory } = await import('@/lib/usecases/tts/getTtsHistoryUsecase');
      (getTtsHistory as Mock).mockResolvedValue(mockUsecaseResponse);
      const testParams = {
        page: 2,
        limit: 20,
        sortBy: 'inputText' as const, // Cast to const if sortBy is a literal union
        sortOrder: 'asc' as const,   // Cast to const if sortOrder is a literal union
        searchQuery: 'specific search'
      };

      const result = await ttsActions.getTtsHistory(testParams);

      expect(getTtsHistory).toHaveBeenCalledTimes(1);
      expect(getTtsHistory).toHaveBeenCalledWith(testParams);
      expect(result).toEqual(mockUsecaseResponse);
    });

    it('should return error from usecase if usecase call fails', async () => {
      const mockError = { success: false, error: 'Usecase error retrieving history' };
      const { getTtsHistory } = await import('@/lib/usecases/tts/getTtsHistoryUsecase');
      (getTtsHistory as Mock).mockResolvedValue(mockError);

      const result = await ttsActions.getTtsHistory();

      expect(getTtsHistory).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockError);
    });

    it('should propagate errors thrown from the usecase', async () => {
      const usecaseError = new Error('Critical usecase failure fetching history');
      const { getTtsHistory } = await import('@/lib/usecases/tts/getTtsHistoryUsecase');
      (getTtsHistory as Mock).mockRejectedValue(usecaseError);

      await expect(ttsActions.getTtsHistory()).rejects.toThrow(usecaseError);
      expect(getTtsHistory).toHaveBeenCalledTimes(1);
    });
  });

  describe('saveTtsHistory', () => {
    const mockInput = { /* ... history data ... */ };
    const mockUsecaseResponse = { success: true };
    
    it('should call saveTtsHistory usecase with correct params and return its result', async () => {
      const { saveTtsHistory } = await import('@/lib/usecases/tts/saveTtsHistoryUsecase');
      (saveTtsHistory as Mock).mockResolvedValue(mockUsecaseResponse);
      
      const result = await ttsActions.saveTtsHistory(mockInput);

      expect(saveTtsHistory).toHaveBeenCalledTimes(1);
      expect(saveTtsHistory).toHaveBeenCalledWith(mockInput);
      expect(result).toEqual(mockUsecaseResponse);
    });

    it('should return error from usecase if usecase call fails for saveTtsHistory', async () => {
        const mockErrorResponse = { success: false, error: 'Usecase error saving history' };
      const { saveTtsHistory } = await import('@/lib/usecases/tts/saveTtsHistoryUsecase');
      (saveTtsHistory as Mock).mockResolvedValue(mockErrorResponse);

      const result = await ttsActions.saveTtsHistory(mockInput);

      expect(saveTtsHistory).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockErrorResponse);
    });

    it('should propagate errors thrown from the usecase', async () => {
      const usecaseError = new Error('Critical usecase failure saving history');
      const { saveTtsHistory } = await import('@/lib/usecases/tts/saveTtsHistoryUsecase');
      (saveTtsHistory as Mock).mockRejectedValue(usecaseError);

      await expect(ttsActions.saveTtsHistory(mockInput)).rejects.toThrow(usecaseError);
      expect(saveTtsHistory).toHaveBeenCalledTimes(1);
    });
  });

  describe('getSpeechGenerationResult', () => {
    const testReplicateId = 'replicate-get-id';
    const mockUsecaseProcessingResponse = { success: true, status: 'processing', audioUrl: null, error: null, ttsPredictionDbId: testReplicateId };
    const mockUsecaseSucceededResponse = { success: true, status: 'succeeded', audioUrl: 'url', error: null, ttsPredictionDbId: testReplicateId };
    const mockUsecaseFailedResponse = { success: true, status: 'failed', audioUrl: null, error: 'Some error', ttsPredictionDbId: testReplicateId };
    const mockUsecaseAuthError = { success: false, error: 'Auth Error' }; // Example service-level error
    
    it('should call getSpeechGenerationResult usecase and return its processing result', async () => {
      const { getSpeechGenerationResult } = await import('@/lib/usecases/tts/getSpeechGenerationResultUsecase');
      (getSpeechGenerationResult as Mock).mockResolvedValue(mockUsecaseProcessingResponse);

      const result = await ttsActions.getSpeechGenerationResult(testReplicateId);

      expect(getSpeechGenerationResult).toHaveBeenCalledTimes(1);
      expect(getSpeechGenerationResult).toHaveBeenCalledWith(testReplicateId);
      expect(result).toEqual(mockUsecaseProcessingResponse);
    });

    it('should call getSpeechGenerationResult usecase and return its succeeded result', async () => {
      const { getSpeechGenerationResult } = await import('@/lib/usecases/tts/getSpeechGenerationResultUsecase');
      (getSpeechGenerationResult as Mock).mockResolvedValue(mockUsecaseSucceededResponse);

      const result = await ttsActions.getSpeechGenerationResult(testReplicateId);

      expect(getSpeechGenerationResult).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUsecaseSucceededResponse);
    });

    it('should call getSpeechGenerationResult usecase and return its failed result', async () => {
      const { getSpeechGenerationResult } = await import('@/lib/usecases/tts/getSpeechGenerationResultUsecase');
      (getSpeechGenerationResult as Mock).mockResolvedValue(mockUsecaseFailedResponse);

      const result = await ttsActions.getSpeechGenerationResult(testReplicateId);

      expect(getSpeechGenerationResult).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUsecaseFailedResponse);
    });

    it('should return auth error from usecase if usecase call returns auth error', async () => {
      const { getSpeechGenerationResult } = await import('@/lib/usecases/tts/getSpeechGenerationResultUsecase');
      (getSpeechGenerationResult as Mock).mockResolvedValue(mockUsecaseAuthError);

      const result = await ttsActions.getSpeechGenerationResult(testReplicateId);

      expect(getSpeechGenerationResult).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUsecaseAuthError);
    });

    it('should propagate thrown errors from the usecase', async () => {
      const usecaseError = new Error('Critical usecase failure during getResult');
      const { getSpeechGenerationResult } = await import('@/lib/usecases/tts/getSpeechGenerationResultUsecase');
      (getSpeechGenerationResult as Mock).mockRejectedValue(usecaseError);

      await expect(
        ttsActions.getSpeechGenerationResult(testReplicateId)
      ).rejects.toThrow(usecaseError);
      expect(getSpeechGenerationResult).toHaveBeenCalledTimes(1);
    });
  });

  describe('getTtsVoices', () => {
    it('should call the getTtsVoices usecase', async () => {
      const mockResult = { success: true, data: [{ id: 'v1', name: 'Voice 1' }] };
      const { getTtsVoices } = await import('@/lib/usecases/tts/getTtsVoicesUsecase');
       (getTtsVoices as Mock).mockResolvedValue(mockResult);

      const result = await ttsActions.getTtsVoices();

      expect(getTtsVoices).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResult);
    });

    it('should return error if getTtsVoices usecase fails', async () => {
       const mockError = { success: false, error: 'Voices fetch failed' };
       const { getTtsVoices } = await import('@/lib/usecases/tts/getTtsVoicesUsecase');
       (getTtsVoices as Mock).mockResolvedValue(mockError);

      const result = await ttsActions.getTtsVoices();

      expect(getTtsVoices).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockError);
    });
  });

});

describe('markTtsUrlProblematic', () => {
  const testTtsPredictionId = 'tts-pred-uuid-for-marking';
  const testErrorMessage = 'Test error message for problematic link';

  let mockUpdateFn: Mock;
  let mockEqFn: Mock;

  beforeEach(async () => {
    // Reset specific mocks for Supabase client related to this action
    mockSupabaseGetUser.mockReset();
    mockSupabaseFrom.mockReset();
    // cookies().get.mockReset(); // Already reset in global beforeEach

    mockEqFn = vi.fn().mockResolvedValue({ error: null }); // Default successful update
    mockUpdateFn = vi.fn(() => ({ eq: mockEqFn }));
    
    mockSupabaseFrom.mockImplementation((tableName: string) => {
      if (tableName === 'TtsPrediction') {
        return { update: mockUpdateFn };
      }
      return {}; // Default empty object for other tables
    });

    // Default successful auth
    mockSupabaseGetUser.mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null });
  });

  it('should update TtsPrediction with problematic status and error message', async () => {
    const result = await ttsActions.markTtsUrlProblematic(testTtsPredictionId, testErrorMessage);

    expect(mockSupabaseGetUser).toHaveBeenCalledTimes(1);
    expect(mockSupabaseFrom).toHaveBeenCalledWith('TtsPrediction');
    expect(mockUpdateFn).toHaveBeenCalledWith(expect.objectContaining({
      is_output_url_problematic: true,
      output_url_last_error: testErrorMessage,
      updatedAt: expect.any(String), // Or Date, depending on actual implementation
    }));
    expect(mockEqFn).toHaveBeenCalledWith('id', testTtsPredictionId);
    expect(result).toEqual({ success: true });
  });

  it('should update TtsPrediction with problematic status (no error message)', async () => {
    const result = await ttsActions.markTtsUrlProblematic(testTtsPredictionId);

    expect(mockSupabaseGetUser).toHaveBeenCalledTimes(1);
    expect(mockSupabaseFrom).toHaveBeenCalledWith('TtsPrediction');
    expect(mockUpdateFn).toHaveBeenCalledWith(expect.objectContaining({
      is_output_url_problematic: true,
      updatedAt: expect.any(String), // Or Date
    }));
    expect(mockUpdateFn.mock.calls[0][0].output_url_last_error).toBeUndefined();
    expect(mockEqFn).toHaveBeenCalledWith('id', testTtsPredictionId);
    expect(result).toEqual({ success: true });
  });

  it('should return auth error if user is not authenticated', async () => {
    mockSupabaseGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'Auth error'} });
    
    const result = await ttsActions.markTtsUrlProblematic(testTtsPredictionId, testErrorMessage);

    expect(mockSupabaseGetUser).toHaveBeenCalledTimes(1);
    expect(mockSupabaseFrom).not.toHaveBeenCalled();
    expect(mockUpdateFn).not.toHaveBeenCalled();
    expect(result).toEqual({ success: false, error: 'Authentication failed.' });
  });

  it('should return error if Supabase update fails', async () => {
    const dbErrorMessage = 'DB update failed';
    mockEqFn.mockResolvedValue({ error: { message: dbErrorMessage } });

    const result = await ttsActions.markTtsUrlProblematic(testTtsPredictionId, testErrorMessage);

    expect(mockSupabaseGetUser).toHaveBeenCalledTimes(1);
    expect(mockSupabaseFrom).toHaveBeenCalledWith('TtsPrediction');
    expect(mockUpdateFn).toHaveBeenCalledTimes(1);
    expect(mockEqFn).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ success: false, error: dbErrorMessage });
  });

  it('should return generic error for unexpected Supabase client failures', async () => {
    const unexpectedErrorMessage = 'Unexpected client error';
    mockSupabaseFrom.mockImplementation(() => { 
      throw new Error(unexpectedErrorMessage); 
    });

    const result = await ttsActions.markTtsUrlProblematic(testTtsPredictionId, testErrorMessage);

    expect(mockSupabaseGetUser).toHaveBeenCalledTimes(1); // Auth is checked first
    expect(result).toEqual({ success: false, error: unexpectedErrorMessage });
  });

  it('should return generic error if getUser throws unexpectedly', async () => {
    const unexpectedAuthErrorMessage = 'Unexpected auth error';
    mockSupabaseGetUser.mockImplementation(async () => { 
      throw new Error(unexpectedAuthErrorMessage); 
    });
    
    const result = await ttsActions.markTtsUrlProblematic(testTtsPredictionId, testErrorMessage);

    expect(result).toEqual({ success: false, error: unexpectedAuthErrorMessage });
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