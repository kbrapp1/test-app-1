import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cookies } from 'next/headers'; // Mocked below
// Note: Replicate and Supabase Client are mocked dynamically below
import { ZodError } from 'zod';
import { randomUUID } from 'crypto'; // Needed for saveTtsAudioToDam tests
import { createClient } from '@/lib/supabase/server'; // Rename for clarity
// Import the actual crypto module
import * as crypto from 'crypto'; 

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
vi.mock('crypto', async (importOriginal) => {
  const actualCrypto = await importOriginal<typeof import('crypto')>();
  return {
    ...actualCrypto,
    randomUUID: vi.fn(), // Define the mock function here
  };
});

// Declare variables to hold mock functions - will be assigned inside vi.doMock
let mockReplicateCreate: ReturnType<typeof vi.fn>;
let mockReplicateGet: ReturnType<typeof vi.fn>;
let mockSupabaseGetUser: ReturnType<typeof vi.fn>;
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
let mockFetch: ReturnType<typeof vi.fn>;
let mockRandomUUID: ReturnType<typeof vi.fn>;

// Helper to create FormData
function createFormData(data: Record<string, string>): FormData {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value);
  });
  return formData;
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
  const mockUuid = 'mock-uuid-1234-5678-90ab-cdef12345678'; 
  const testGeneratedFilename = `${mockUuid}.mp3`;
  const testStoragePath = `${testUserId}/audio/${testGeneratedFilename}`;
  const MODEL_IDENTIFIER = 'jaaari/kokoro-82m:f559560eb822dc509045f3921a1921234918b91739db4bf3daab2169b71c7a13';
  
  // Variable to hold the dynamically imported module
  let ttsActions: TtsModule;

  beforeEach(async () => {
    vi.resetAllMocks();
    process.env = { ...OLD_ENV, REPLICATE_API_TOKEN: 'test-token' }; 
    mockFetch = vi.fn();
    global.fetch = mockFetch;

    // --- Define Mocks --- 
    // Replicate Mocks
    mockReplicateCreate = vi.fn();
    mockReplicateGet = vi.fn();
    // Supabase Mocks (shared structure)
    mockSupabaseGetUser = vi.fn();
    mockSupabaseFrom = vi.fn();
    mockSupabaseInsert = vi.fn();
    mockSupabaseSelect = vi.fn();
    mockSupabaseUpdate = vi.fn();
    mockSupabaseEq = vi.fn();
    mockSupabaseSingle = vi.fn();
    mockSupabaseStorageUpload = vi.fn();
    mockSupabaseStorageRemove = vi.fn();
    mockSupabaseStorageFrom = vi.fn();
    mockSupabaseStorageGetPublicUrl = vi.fn();

    // --- Dynamic Mocks --- 
    vi.doMock('replicate', () => ({
      default: vi.fn(() => ({
        predictions: {
          create: mockReplicateCreate,
          get: mockReplicateGet,
        },
      })),
    }));

    // Mock the ACTUAL client creator used by the actions
    vi.doMock('@/lib/supabase/server', () => ({
      createClient: vi.fn(() => ({
        // Mock the methods used by the actions
        auth: { getUser: mockSupabaseGetUser },
        from: mockSupabaseFrom, // Top-level from for DB
        // Correctly mock the storage chain
        storage: { 
          from: mockSupabaseStorageFrom.mockImplementation(() => ({
            upload: mockSupabaseStorageUpload,
            remove: mockSupabaseStorageRemove,
            getPublicUrl: mockSupabaseStorageGetPublicUrl,
          }))
        }, 
      })),
    }));

    // --- Setup Chainable Mocks --- 
    // (Important: Do this AFTER defining mocks and BEFORE importing the module)
    // DB Chain
    mockSupabaseFrom.mockImplementation(() => ({
      insert: mockSupabaseInsert.mockImplementation(() => ({
        select: mockSupabaseSelect.mockImplementation(() => ({
          single: mockSupabaseSingle,
        })),
      })),
      select: mockSupabaseSelect.mockImplementation(() => ({
        eq: mockSupabaseEq.mockImplementation(() => ({
          single: mockSupabaseSingle,
          maybeSingle: mockSupabaseSingle,
        })),
      })),
      update: mockSupabaseUpdate.mockImplementation(() => ({
        eq: mockSupabaseEq,
      })),
    }));
    // Storage Chain
    mockSupabaseStorageFrom.mockImplementation(() => ({
      upload: mockSupabaseStorageUpload,
      remove: mockSupabaseStorageRemove,
      getPublicUrl: mockSupabaseStorageGetPublicUrl,
    }));

    // --- Setup Default Mock Return Values --- 
    mockSupabaseGetUser.mockResolvedValue({ data: { user: { id: testUserId } }, error: null });
    // Default DB mocks: Successful lookup/update
    mockSupabaseSingle.mockResolvedValue({ data: { id: 'db-id', status: 'processing', userId: testUserId, outputUrl: null }, error: null }); 
    mockSupabaseEq.mockResolvedValue({ error: null });
    mockSupabaseStorageUpload.mockResolvedValue({ data: { path: testStoragePath }, error: null });
    mockSupabaseStorageRemove.mockResolvedValue({ data: null, error: null });
    mockSupabaseStorageGetPublicUrl.mockResolvedValue({ data: { publicUrl: testAudioUrl }, error: null });
    mockReplicateCreate.mockResolvedValue({ id: testPredictionId, status: 'starting' });
    // Mock crypto's randomUUID
    vi.mocked(crypto.randomUUID).mockReturnValue(mockUuid);

    // Ensure fetch is mocked correctly for general use
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'audio/mpeg' }),
      blob: vi.fn().mockResolvedValue(new Blob(['audio data'], { type: 'audio/mpeg' })),
    });

    // --- Dynamic Import --- 
    const modulePath = './tts'; 
    ttsActions = await import(modulePath);
  });

  afterEach(() => {
    process.env = OLD_ENV;
    vi.resetModules(); 
  });

  // ====================================
  // Test Suite: startSpeechGeneration
  // ====================================
  describe('startSpeechGeneration', () => {
    beforeEach(() => {
      // Reset mocks relevant to startSpeechGeneration specifically
      mockSupabaseGetUser.mockReset();
      mockSupabaseFrom.mockReset();
      mockSupabaseInsert.mockReset();
      mockSupabaseSelect.mockReset();
      mockSupabaseSingle.mockReset();
      mockReplicateCreate.mockReset();

      // Re-establish default return values for this suite's common cases
      mockSupabaseGetUser.mockResolvedValue({ data: { user: { id: testUserId } }, error: null });
      mockReplicateCreate.mockResolvedValue({ id: testPredictionId, status: 'starting' });
      // Default successful DB insert chain
      mockSupabaseInsert.mockImplementation(() => ({
        select: mockSupabaseSelect.mockImplementation(() => ({
          single: mockSupabaseSingle.mockResolvedValue({ data: { id: 'db-id' }, error: null })
        }))
      }));
      // Mock the top-level .from() -> .insert() chain part
      mockSupabaseFrom.mockImplementation((tableName) => {
        if (tableName === 'TtsPrediction') {
          return { insert: mockSupabaseInsert };
        }
        return { insert: vi.fn() }; // Default mock for other tables
      });

      process.env.REPLICATE_API_TOKEN = 'test-token';
    });

    afterEach(() => {
      delete process.env.REPLICATE_API_TOKEN;
    });

    // --- Test Cases --- 

    it('should successfully start prediction and save to DB', async () => {
       // Arrange: Mocks are set in beforeEach for the success case
       const formData = createFormData({ 
         inputText: testInputText, 
         voiceId: testVoiceId
       }); 
       
       // Act
       const result = await ttsActions.startSpeechGeneration(formData);
       
       // Assert (Keep assertions from previous successful attempt)
       expect(result.success).toBe(true);
       expect(result.error).toBeUndefined();
       expect(result.predictionId).toBe(testPredictionId); 
       expect(mockReplicateCreate).toHaveBeenCalledWith(expect.objectContaining({
         input: { text: testInputText, voice: testVoiceId },
         version: MODEL_IDENTIFIER,
       }));
       expect(mockSupabaseFrom).toHaveBeenCalledWith('TtsPrediction');
       expect(mockSupabaseInsert).toHaveBeenCalledWith(expect.objectContaining({
         replicatePredictionId: testPredictionId,
         inputText: testInputText,
         userId: testUserId,
         status: 'starting',
         sourceAssetId: null 
       }));
       expect(mockSupabaseSelect).toHaveBeenCalledWith('id');
       expect(mockSupabaseSingle).toHaveBeenCalledTimes(1);
    });

    it('should return error if user is not authenticated', async () => {
      // Arrange
      mockSupabaseGetUser.mockResolvedValueOnce({ data: { user: null }, error: null }); // Override default
      const formData = createFormData({ 
        inputText: testInputText, 
        voiceId: testVoiceId
      });

      // Act
      const result = await ttsActions.startSpeechGeneration(formData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication failed. Please log in again.'); 
      expect(mockReplicateCreate).not.toHaveBeenCalled();
      expect(mockSupabaseFrom).not.toHaveBeenCalled(); // Should not attempt DB ops
    });
    
    it('should return error if REPLICATE_API_TOKEN is not set', async () => {
       // Arrange
       delete process.env.REPLICATE_API_TOKEN; // Override default
       const formData = createFormData({ 
         inputText: testInputText, 
         voiceId: testVoiceId
       });

       // Act
       const result = await ttsActions.startSpeechGeneration(formData);

       // Assert
       expect(result.success).toBe(false);
       expect(result.error).toBe('Server configuration error: Missing API token.'); 
       expect(mockSupabaseGetUser).not.toHaveBeenCalled(); // Should fail before auth check
       expect(mockReplicateCreate).not.toHaveBeenCalled();
       expect(mockSupabaseFrom).not.toHaveBeenCalled();
    });

    it('should return validation error for empty input text', async () => {
      // Arrange
      const formData = createFormData({ 
        inputText: '', 
        voiceId: testVoiceId 
      }); 

      // Act
      const result = await ttsActions.startSpeechGeneration(formData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Input text cannot be empty.'); 
      expect(mockReplicateCreate).not.toHaveBeenCalled();
      expect(mockSupabaseFrom).not.toHaveBeenCalled();
    });

    it('should return validation error for missing voiceId', async () => {
      // Arrange
      const formData = createFormData({ 
        inputText: testInputText,
        // voiceId: MISSING
      }); 

      // Act
      const result = await ttsActions.startSpeechGeneration(formData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Required'); // Match the actual Zod error
      expect(mockReplicateCreate).not.toHaveBeenCalled();
      expect(mockSupabaseFrom).not.toHaveBeenCalled();
    });

    it('should return error if Replicate API fails', async () => {
      // Arrange
      const apiError = new Error('Replicate API Error');
      mockReplicateCreate.mockRejectedValueOnce(apiError); // Override default
      const formData = createFormData({ 
        inputText: testInputText, 
        voiceId: testVoiceId
      });

      // Act
      const result = await ttsActions.startSpeechGeneration(formData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe(apiError.message); 
      expect(mockSupabaseFrom).not.toHaveBeenCalled(); // Should fail before DB insert
    });

    it('should return error if Supabase insert fails', async () => {
      // Arrange
      const dbError = { message: 'DB Insert Error', code: '23505' }; // More realistic Supabase error obj
      // Override the mock for the insert().select().single() chain to return the error
      mockSupabaseInsert.mockImplementationOnce(() => ({
        select: mockSupabaseSelect.mockImplementationOnce(() => ({
          single: mockSupabaseSingle.mockResolvedValueOnce({ data: null, error: dbError })
        }))
      }));
      const formData = createFormData({ 
        inputText: testInputText, 
        voiceId: testVoiceId 
      });

      // Act
      const result = await ttsActions.startSpeechGeneration(formData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to save prediction record.');
      // Verify Replicate was called but insert failed
      expect(mockReplicateCreate).toHaveBeenCalledTimes(1);
      expect(mockSupabaseFrom).toHaveBeenCalledWith('TtsPrediction');
      expect(mockSupabaseInsert).toHaveBeenCalledTimes(1);
    });
  });

  // == getSpeechGenerationResult Tests ==

  describe('getSpeechGenerationResult', () => {
    it('should return processing status correctly', async () => {
      // Arrange
      // Explicitly set Replicate mock for this test case
      mockReplicateGet.mockResolvedValue({ id: testPredictionId, status: 'processing', output: null, error: null });

      // Act
      const result = await ttsActions.getSpeechGenerationResult(testPredictionId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.status).toBe('processing');
      // Explicitly cast to bypass potential type mismatch during assertion
      expect((result as any).audioUrl).toBeNull(); 
      expect(mockReplicateGet).toHaveBeenCalledWith(testPredictionId);
      expect(mockSupabaseUpdate).not.toHaveBeenCalled(); 
    });

    it('should return succeeded status and URL, and update DB', async () => {
      // Arrange
      const audioUrlFromReplicate = 'http://replicate.com/audio.mp3'; // Use a distinct URL
       // Override default Replicate mock for THIS test
      mockReplicateGet.mockResolvedValue({ id: testPredictionId, status: 'succeeded', output: audioUrlFromReplicate, error: null });
      // Ensure fetch mock is correct for this specific download
      mockFetch.mockResolvedValueOnce({ 
          ok: true, 
          status: 200, 
          blob: vi.fn().mockResolvedValue(new Blob(['audio data'], { type: 'audio/mpeg' })) 
      });
      // Ensure getPublicUrl mock returns the expected final URL for this specific test
      // Use the correctly defined nested mock
      mockSupabaseStorageGetPublicUrl.mockReturnValueOnce({ data: { publicUrl: testAudioUrl }, error: null });

      // Act
      const result = await ttsActions.getSpeechGenerationResult(testPredictionId);
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.status).toBe('succeeded');
      // Explicitly cast to bypass potential type mismatch during assertion
      expect((result as any).audioUrl).toBe(testAudioUrl); // Should be the public URL from storage
      expect(mockSupabaseUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'succeeded', outputUrl: testAudioUrl }));
      expect(mockSupabaseEq).toHaveBeenCalledWith('id', 'db-id'); // Check update uses DB ID 
    });
    
    it('should return failed status and error, and update DB', async () => {
        // Arrange
        const replicateError = { detail: 'Model failed' };
        // Set specific mock return values needed for THIS test
        mockSupabaseEq.mockImplementationOnce((col, val) => { // Specific mock for the .eq() call
          if (col === 'replicatePredictionId' && val === testPredictionId) {
            return { 
              maybeSingle: mockSupabaseSingle.mockResolvedValueOnce({ 
                data: { id: 'db-id', status: 'processing', userId: testUserId }, error: null 
              })
            }; 
          }
          return { maybeSingle: vi.fn() }; // Default for other eq calls
        });
        mockReplicateGet.mockResolvedValue({ id: testPredictionId, status: 'failed', output: null, error: replicateError });

        // Act
        const result = await ttsActions.getSpeechGenerationResult(testPredictionId);

        // Assert
        expect(result.success).toBe(false); 
        expect(result.status).toBe('failed');
        expect(result.error).toEqual(JSON.stringify(replicateError)); // error is stringified JSON
        expect(mockSupabaseUpdate).toHaveBeenCalledWith(expect.objectContaining({ 
            status: 'failed', 
            errorMessage: JSON.stringify(replicateError)
        }));
        expect(mockSupabaseEq).toHaveBeenCalledWith('replicatePredictionId', testPredictionId); 
    });

    it('should return error if user is not authenticated', async () => {
        // Arrange
        mockSupabaseGetUser.mockResolvedValue({ data: { user: null }, error: null });

        // Act
        const result = await ttsActions.getSpeechGenerationResult(testPredictionId);

        // Assert
        expect(result.success).toBe(false);
        expect(result.error).toBe('User not authenticated');
        expect(mockReplicateGet).not.toHaveBeenCalled();
    });
    
    it('should return error if REPLICATE_API_TOKEN is not set', async () => {
        // Arrange
        delete process.env.REPLICATE_API_TOKEN;
        ttsActions = await import(`./tts?t=${Date.now()}`); // Re-import maybe needed

        // Act
        const result = await ttsActions.getSpeechGenerationResult(testPredictionId);

        // Assert
        expect(result.success).toBe(false);
        expect(result.error).toContain('Missing API token');
        expect(mockReplicateGet).not.toHaveBeenCalled();
    });

    it('should return error if Replicate API fails', async () => {
        // Arrange
        const apiError = new Error('Replicate Get Error');
        mockReplicateGet.mockRejectedValue(apiError);

        // Act
        const result = await ttsActions.getSpeechGenerationResult(testPredictionId);

        // Assert
        expect(result.success).toBe(false);
        expect(result.error).toBe('Replicate Get Error');
    });

    it('should return error if prediction record not found in DB', async () => {
        // Arrange
        // Simulate Replicate success but DB failure to find record
        mockReplicateGet.mockResolvedValue({ id: testPredictionId, status: 'succeeded', output: testAudioUrl });
        // Override the default single mock for this test
        mockSupabaseSingle.mockResolvedValueOnce({ data: null, error: { message: 'Not found'} });
        
        // Act
        const result = await ttsActions.getSpeechGenerationResult(testPredictionId);

        // Assert
        expect(result.success).toBe(false);
        expect(result.error).toBe('Failed to retrieve prediction details.');
        // Verify mocks were called as expected (optional but good)
        // Note: Verification might be less reliable without test-specific mocks
    });

    it('should return error if user ID does not match DB record', async () => {
        // Arrange
        // Simulate Replicate success but permission error on DB check
        mockReplicateGet.mockResolvedValue({ id: testPredictionId, status: 'succeeded', output: testAudioUrl });
        // Override the default single mock for this test

        // Use the main beforeEach mock setup, but ensure the DB single call returns the wrong user
        mockSupabaseSingle.mockResolvedValueOnce({ data: { userId: 'different-user' }, error: null });

        // Act
        const result = await ttsActions.getSpeechGenerationResult(testPredictionId);

        // Assert
        expect(result.success).toBe(false);
        expect(result.error).toBe('Permission denied.');
        // Verify mocks
        // Note: Verification might be less reliable without test-specific mocks
    });

  });

  // ====================================
  // Test Suite: getTtsVoices
  // ====================================
  describe('getTtsVoices', () => {
    it('should return success and a list of voices', async () => {
      const result = await ttsActions.getTtsVoices();

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.data).toBeInstanceOf(Array);
      expect(result.data?.length).toBeGreaterThan(0); // Check it's not empty
      // Check structure of the first item as a sample
      expect(result.data?.[0]).toHaveProperty('id');
      expect(result.data?.[0]).toHaveProperty('name');
      expect(result.data?.[0]).toHaveProperty('gender');
    });

    // Optional: Add a test for potential failure (though unlikely with hardcoded data)
    // it('should return failure if an error occurs', async () => {
    //   // How to force an error here? Maybe mock Promise.resolve to reject?
    //   vi.spyOn(Promise, 'resolve').mockRejectedValueOnce(new Error('Forced failure'));
    //   const result = await ttsActions.getTtsVoices();
    //   expect(result.success).toBe(false);
    //   expect(result.error).toBeDefined();
    //   expect(result.data).toBeUndefined();
    //   vi.restoreAllMocks(); // Clean up spy
    // });
  });

  // ====================================
  // Test Suite: getTtsHistory
  // ====================================
  describe('getTtsHistory', () => {

    // Note: The main beforeEach already sets up mocks for getUser and from
    // We might need to refine the 'from' mock chain further for select().eq().order().limit()

    beforeEach(() => {
      // Ensure the default mocks are set for this suite as well
      vi.resetAllMocks(); // Reset first
      // Re-establish default mocks for Supabase needed for getTtsHistory
      mockSupabaseGetUser.mockResolvedValue({ data: { user: { id: testUserId } }, error: null });
      
      // Setup default mock chain for select -> eq -> order -> limit
      const mockLimit = vi.fn();
      const mockOrder = vi.fn(() => ({ limit: mockLimit }));
      const mockEq = vi.fn(() => ({ order: mockOrder }));
      const mockSelect = vi.fn(() => ({ eq: mockEq }));

      mockSupabaseFrom.mockImplementation((tableName) => {
        if (tableName === 'TtsPrediction') {
          return { select: mockSelect };
        }
        // Return a default mock structure for other tables if necessary
        return { select: vi.fn(() => ({ eq: vi.fn(() => ({ order: vi.fn(() => ({ limit: vi.fn() })) })) })) };
      });

      // Default successful query result
      mockLimit.mockResolvedValue({ data: [{ id: 'history-1' }, { id: 'history-2' }], error: null });
    });

    it('should return error if user is not authenticated', async () => {
      // Arrange
      mockSupabaseGetUser.mockResolvedValueOnce({ data: { user: null }, error: null }); // Override auth

      // Act
      const result = await ttsActions.getTtsHistory();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('User not authenticated');
      expect(mockSupabaseFrom).not.toHaveBeenCalled();
    });

    it('should call Supabase select with correct parameters', async () => {
      // Arrange (default mocks handle success)

      // Act
      await ttsActions.getTtsHistory();

      // Assert
      expect(mockSupabaseFrom).toHaveBeenCalledWith('TtsPrediction');
      expect(mockSupabaseFrom('TtsPrediction').select).toHaveBeenCalledWith('*'); // Check select fields
      expect(mockSupabaseFrom('TtsPrediction').select().eq).toHaveBeenCalledWith('userId', testUserId);
      expect(mockSupabaseFrom('TtsPrediction').select().eq().order).toHaveBeenCalledWith('createdAt', { ascending: false });
      expect(mockSupabaseFrom('TtsPrediction').select().eq().order().limit).toHaveBeenCalledWith(50);
    });

    it('should return history data on successful fetch', async () => {
      // Arrange
      const mockHistoryData = [{ id: 'h1', status: 'succeeded' }, { id: 'h2', status: 'failed' }];
      // Override default successful result
      mockSupabaseFrom('TtsPrediction').select().eq().order().limit.mockResolvedValueOnce({ data: mockHistoryData, error: null });

      // Act
      const result = await ttsActions.getTtsHistory();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockHistoryData);
      expect(result.error).toBeUndefined();
    });

    it('should return error if Supabase query fails', async () => {
      // Arrange
      const dbError = new Error('DB Select Error');
       // Override default successful result
      mockSupabaseFrom('TtsPrediction').select().eq().order().limit.mockResolvedValueOnce({ data: null, error: dbError });

      // Act
      const result = await ttsActions.getTtsHistory();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('DB Select Error');
      expect(result.data).toBeUndefined();
    });
  }); // End describe getTtsHistory

  // ====================================
  // Test Suite: saveTtsAudioToDam
  // ====================================
  describe('saveTtsAudioToDam', () => {
    beforeEach(() => { 
      // Reset specific mocks for this suite
      vi.resetAllMocks();
      
      // Re-establish default mocks needed for most tests in this suite
      mockSupabaseGetUser.mockResolvedValue({ data: { user: { id: testUserId } }, error: null });

      // Default successful fetch
      const mockAudioBlob = new Blob(['audio data'], { type: 'audio/mpeg' });
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'audio/mpeg' }),
        blob: vi.fn().mockResolvedValue(mockAudioBlob),
      });

      // Default successful storage upload
      mockSupabaseStorageUpload.mockResolvedValue({ data: { path: testStoragePath }, error: null });
      // Default successful DB insert
      mockSupabaseInsert.mockImplementation(() => ({
        select: mockSupabaseSelect.mockImplementation(() => ({
          single: mockSupabaseSingle.mockResolvedValue({ data: { id: testNewAssetId }, error: null })
        }))
      }));
      mockSupabaseFrom.mockImplementation((tableName) => {
          if (tableName === 'assets') {
            return { insert: mockSupabaseInsert };
          } else if (tableName === 'TtsPrediction') {
            // Return the structure needed for .update().eq()
            return { 
              update: mockSupabaseUpdate.mockImplementation(() => ({ 
                eq: mockSupabaseEq.mockResolvedValue({ error: null }) // Assume success for update link
              }))
            };
          }
          return {}; // Default empty for any other table
      });
      // Default successful storage remove (for cleanup tests)
      mockSupabaseStorageRemove.mockResolvedValue({ data: null, error: null });
    });

    it('should successfully download, upload, insert record, and return asset ID', async () => {
      // Act
      const result = await ttsActions.saveTtsAudioToDam(testAudioUrl, testGeneratedFilename, testPredictionId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.assetId).toBe(testNewAssetId);
      expect(result.error).toBeUndefined();
      
      expect(mockFetch).toHaveBeenCalledWith(testAudioUrl);
      expect(mockSupabaseStorageFrom).toHaveBeenCalledWith('assets');
      // Use stringMatching for the path
      expect(mockSupabaseStorageUpload).toHaveBeenCalledWith(
        expect.stringMatching(new RegExp(`^${testUserId}/audio/.+\.mpeg$`)), // Check start and end
        expect.any(Blob),
        expect.objectContaining({ contentType: 'audio/mpeg', upsert: false })
      );
      expect(mockSupabaseFrom).toHaveBeenCalledWith('assets');
      expect(mockSupabaseInsert).toHaveBeenCalledWith(expect.objectContaining({
        user_id: testUserId,
        // Name should match the desiredAssetName passed to the function
        name: testGeneratedFilename, 
        // Storage path should match the path returned by the upload mock
        storage_path: testStoragePath, // Use the constant defined for the upload mock result
        mime_type: 'audio/mpeg',
        size: expect.any(Number),
      }));
      expect(mockSupabaseSelect).toHaveBeenCalledWith('id');
      expect(mockSupabaseSingle).toHaveBeenCalledTimes(1);
      expect(mockSupabaseStorageRemove).not.toHaveBeenCalled(); // No cleanup needed
    });

    it('should return error for invalid URL', async () => {
      const result = await ttsActions.saveTtsAudioToDam('invalid-url', testGeneratedFilename, testPredictionId);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid audio URL');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return error if user is not authenticated', async () => {
      mockSupabaseGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
      const result = await ttsActions.saveTtsAudioToDam(testAudioUrl, testGeneratedFilename, testPredictionId);
      expect(result.success).toBe(false);
      expect(result.error).toBe('User not authenticated to save asset.');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return error if fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network Error'));
      const result = await ttsActions.saveTtsAudioToDam(testAudioUrl, testGeneratedFilename, testPredictionId);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to download audio: Network Error');
      expect(mockSupabaseStorageUpload).not.toHaveBeenCalled();
    });

    it('should return error if fetch response is not ok', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });
      const result = await ttsActions.saveTtsAudioToDam(testAudioUrl, testGeneratedFilename, testPredictionId);
      expect(result.success).toBe(false);
      // Adjust assertion to match the actual error message format
      expect(result.error).toContain('Failed to fetch audio: 404 Not Found');
    });

    it('should return error if downloaded blob is empty', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'audio/mpeg' }),
        blob: vi.fn().mockResolvedValue(new Blob([], { type: 'audio/mpeg' })), // Empty blob
      });
      const result = await ttsActions.saveTtsAudioToDam(testAudioUrl, testGeneratedFilename, testPredictionId);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to download audio: Downloaded audio content is empty.');
    });

    it('should return error if storage upload fails', async () => {
      const storageError = new Error('Storage permission denied');
      mockSupabaseStorageUpload.mockResolvedValueOnce({ data: null, error: storageError });
      const result = await ttsActions.saveTtsAudioToDam(testAudioUrl, testGeneratedFilename, testPredictionId);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Storage upload failed: Storage permission denied');
      expect(mockSupabaseFrom).not.toHaveBeenCalledWith('assets'); // Should not attempt DB insert
    });

    it('should return error and attempt cleanup if DB insert fails', async () => {
      const dbError = { message: 'DB Constraint Violation', code: '23505' };
      mockSupabaseInsert.mockImplementationOnce(() => ({
        select: mockSupabaseSelect.mockImplementationOnce(() => ({
          single: mockSupabaseSingle.mockResolvedValueOnce({ data: null, error: dbError })
        }))
      }));
      const result = await ttsActions.saveTtsAudioToDam(testAudioUrl, testGeneratedFilename, testPredictionId);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to save asset metadata: DB Constraint Violation');
      // Use stringMatching for the path array
      expect(mockSupabaseStorageRemove).toHaveBeenCalledWith([expect.stringMatching(new RegExp(`^${testUserId}/audio/.+\.mpeg$`))]);
    });
     
    it('should return error and attempt cleanup if DB insert returns no record', async () => {
      // Simulate insert succeeding but returning no data
      mockSupabaseInsert.mockImplementationOnce(() => ({
        select: mockSupabaseSelect.mockImplementationOnce(() => ({
          single: mockSupabaseSingle.mockResolvedValueOnce({ data: null, error: null })
        }))
      }));
      const result = await ttsActions.saveTtsAudioToDam(testAudioUrl, testGeneratedFilename, testPredictionId);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to save asset metadata (no record returned)');
      // Use stringMatching for the path array
      expect(mockSupabaseStorageRemove).toHaveBeenCalledWith([expect.stringMatching(new RegExp(`^${testUserId}/audio/.+\.mpeg$`))]);
    });
  });

  // ====================================
  // Test Suite: saveTtsHistory (Placeholder Tests)
  // ====================================
  describe('saveTtsHistory', () => {
    it('should return success (placeholder)', async () => {
        const input = { replicatePredictionId: testPredictionId };
        const result = await ttsActions.saveTtsHistory(input);
        expect(result.success).toBe(true);
        // Add more specific tests when implemented
    });
  });

  // ====================================
  // Test Suite: getTtsHistory
  // ====================================
  describe('getTtsHistory', () => {

    beforeEach(() => {
      // Ensure the default mocks are set for this suite as well
      vi.resetAllMocks();
      mockSupabaseGetUser.mockResolvedValue({ data: { user: { id: testUserId } }, error: null });
      
      // Setup default mock chain for select -> eq -> order -> limit
      const mockLimit = vi.fn();
      const mockOrder = vi.fn(() => ({ limit: mockLimit }));
      const mockEq = vi.fn(() => ({ order: mockOrder }));
      const mockSelect = vi.fn(() => ({ eq: mockEq }));

      mockSupabaseFrom.mockImplementation((tableName) => {
        if (tableName === 'TtsPrediction') {
          return { select: mockSelect };
        }
        return { select: vi.fn(() => ({ eq: vi.fn(() => ({ order: vi.fn(() => ({ limit: vi.fn() })) })) })) };
      });

      // Default successful query result
      mockLimit.mockResolvedValue({ data: [{ id: 'history-1' }, { id: 'history-2' }], error: null });
    });

    it('should return error if user is not authenticated', async () => {
      mockSupabaseGetUser.mockResolvedValueOnce({ data: { user: null }, error: null }); 
      const result = await ttsActions.getTtsHistory();
      expect(result.success).toBe(false);
      expect(result.error).toBe('User not authenticated');
      expect(mockSupabaseFrom).not.toHaveBeenCalled();
    });

    it('should call Supabase select with correct parameters', async () => {
      // Arrange
      const mockLimit = vi.fn().mockResolvedValue({ data: [], error: null });
      const mockOrder = vi.fn(() => ({ limit: mockLimit }));
      const mockEq = vi.fn(() => ({ order: mockOrder }));
      const mockSelect = vi.fn(() => ({ eq: mockEq }));
      mockSupabaseFrom.mockImplementation(() => ({ select: mockSelect }));

      // Act
      await ttsActions.getTtsHistory();

      // Assert
      expect(mockSupabaseFrom).toHaveBeenCalledWith('TtsPrediction');
      expect(mockSelect).toHaveBeenCalledWith('*'); // Adjust if specific columns are selected later
      expect(mockEq).toHaveBeenCalledWith('userId', testUserId);
      expect(mockOrder).toHaveBeenCalledWith('createdAt', { ascending: false });
      expect(mockLimit).toHaveBeenCalledWith(50);
    });

    it('should return history data on successful fetch', async () => {
      // Arrange
      const historyData = [{ id: 'h1', status: 'succeeded' }, { id: 'h2', status: 'failed' }];
      const mockLimit = vi.fn().mockResolvedValue({ data: historyData, error: null });
      const mockOrder = vi.fn(() => ({ limit: mockLimit }));
      const mockEq = vi.fn(() => ({ order: mockOrder }));
      const mockSelect = vi.fn(() => ({ eq: mockEq }));
      mockSupabaseFrom.mockImplementation(() => ({ select: mockSelect }));

      // Act
      const result = await ttsActions.getTtsHistory();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(historyData);
      expect(result.error).toBeUndefined();
    });

    it('should return error if Supabase query fails', async () => {
      // Arrange
      const dbError = new Error('DB Select Error');
      const mockLimit = vi.fn().mockResolvedValue({ data: null, error: dbError });
      const mockOrder = vi.fn(() => ({ limit: mockLimit }));
      const mockEq = vi.fn(() => ({ order: mockOrder }));
      const mockSelect = vi.fn(() => ({ eq: mockEq }));
      mockSupabaseFrom.mockImplementation(() => ({ select: mockSelect }));
      
      // Act
      const result = await ttsActions.getTtsHistory();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('DB Select Error'); // Match the specific error message
      expect(result.data).toBeUndefined();
    });
  });

}); 