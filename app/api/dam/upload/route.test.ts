import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { POST } from './route'; // Import the POST handler
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// --- Mocking Setup ---

vi.mock('@supabase/supabase-js', () => {
    // Define mocks *inside* the factory
    const mockStorageFromUpload = vi.fn();
    const mockStorageFromRemove = vi.fn();
    const storageFrom = vi.fn(() => ({ upload: mockStorageFromUpload, remove: mockStorageFromRemove }));

    const mockDbFromInsert = vi.fn();
    const dbFrom = vi.fn(() => ({ insert: mockDbFromInsert }));

    const mockedCreateClient = vi.fn(() => ({
        storage: { from: storageFrom },
        from: dbFrom,
    }));

    // Return the mocked createClient and, importantly, the nested mock functions
    // so we can access them later if needed, although accessing via the client instance
    // is often cleaner in tests.
    return {
         createClient: mockedCreateClient,
         // Exposing these might be useful for direct manipulation/assertion if needed
         __mocks: {
             mockStorageFromUpload,
             mockStorageFromRemove,
             mockDbFromInsert,
             storageFrom, 
             dbFrom
         }
    };
});

// Helper to create a mock NextRequest with FormData
function createMockRequest(formData: FormData): NextRequest {
    // Casting to any as NextRequest constructor isn't directly exposed for simple mocking
    return {
        formData: async () => formData,
        // Add other properties if needed by the route handler (e.g., headers)
    } as any;
}

// --- Test Suite ---

describe('POST /api/dam/upload', () => {
    const originalEnv = { ...process.env };
    let mockSupabaseFunctions: any; // To hold nested mocks for easier access in tests

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock environment variables
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://mock-supabase.co';
        process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-role-key';

        // Get the mocked client instance to access its internal mocks
        const mockedCreateClient = createClient as Mock;
        // Get the *instance* returned by the mocked createClient
        const clientInstance = mockedCreateClient(); 
        // Now access the mocks via the instance structure defined in the factory
        mockSupabaseFunctions = {
            upload: clientInstance.storage.from().upload,
            remove: clientInstance.storage.from().remove,
            insert: clientInstance.from().insert,
        };

        // Reset mocks to default success states using the accessed references
        mockSupabaseFunctions.upload.mockResolvedValue({ data: { path: 'user-id/mock-uuid-test.png' }, error: null });
        mockSupabaseFunctions.insert.mockResolvedValue({ data: {}, error: null });
        mockSupabaseFunctions.remove.mockResolvedValue({ data: {}, error: null });

         // Clear call history on the main createClient mock itself
         mockedCreateClient.mockClear();
         // Clear call history on the nested mocks obtained above
         mockSupabaseFunctions.upload.mockClear();
         mockSupabaseFunctions.remove.mockClear();
         mockSupabaseFunctions.insert.mockClear();
         // Also clear the intermediate 'from' mocks if necessary, though maybe less critical
         clientInstance.storage.from.mockClear();
         clientInstance.from.mockClear();
    });

    afterEach(() => {
        // Restore original environment variables
        process.env = originalEnv;
        vi.restoreAllMocks();
    });

    it('should return 400 if no files are provided', async () => {
        const formData = new FormData();
        formData.append('userId', 'test-user-id');
        const request = createMockRequest(formData);

        const response = await POST(request);
        const json = await response.json();

        expect(response.status).toBe(400);
        expect(json.error).toBe('No files provided.');
    });

    it('should return 400 if userId is not provided', async () => {
        const formData = new FormData();
        const mockFile = new File(['content'], 'test.png', { type: 'image/png' });
        formData.append('files', mockFile);
        // Missing userId
        const request = createMockRequest(formData);

        const response = await POST(request);
        const json = await response.json();

        expect(response.status).toBe(400);
        expect(json.error).toBe('User ID not provided.');
    });

    // Add more tests here for success, errors, etc.
    it('should upload a single valid image file successfully', async () => {
        const formData = new FormData();
        const mockFile = new File(['image content'], 'test-image.png', { type: 'image/png' });
        const userId = 'user-123';
        formData.append('files', mockFile);
        formData.append('userId', userId);
        const request = createMockRequest(formData);

        const response = await POST(request);
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json.message).toBe('Upload successful');
        expect(json.data).toHaveLength(1);
        expect(json.data[0].name).toBe('test-image.png');

        // Verify mocks using the captured references
        expect(mockSupabaseFunctions.upload).toHaveBeenCalledOnce();
        expect(mockSupabaseFunctions.upload).toHaveBeenCalledWith(expect.stringContaining(`${userId}/`), mockFile);
        expect(mockSupabaseFunctions.insert).toHaveBeenCalledOnce();
        expect(mockSupabaseFunctions.insert).toHaveBeenCalledWith({
            user_id: userId,
            name: mockFile.name,
            storage_path: expect.any(String),
            mime_type: mockFile.type,
            size: mockFile.size,
        });
    });

    it('should skip non-image files', async () => {
        const formData = new FormData();
        const mockImageFile = new File(['image content'], 'image.jpg', { type: 'image/jpeg' });
        const mockTextFile = new File(['text content'], 'document.txt', { type: 'text/plain' });
        const userId = 'user-456';
        formData.append('files', mockImageFile);
        formData.append('files', mockTextFile);
        formData.append('userId', userId);
        const request = createMockRequest(formData);

        const response = await POST(request);
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json.message).toBe('Upload successful');
        expect(json.data).toHaveLength(1); // Only the image file should be processed
        expect(json.data[0].name).toBe('image.jpg');

        // Verify mocks using captured references
        expect(mockSupabaseFunctions.upload).toHaveBeenCalledOnce();
        expect(mockSupabaseFunctions.upload).toHaveBeenCalledWith(expect.stringContaining(`${userId}/`), mockImageFile);
        expect(mockSupabaseFunctions.insert).toHaveBeenCalledOnce();
        expect(mockSupabaseFunctions.insert).toHaveBeenCalledWith(expect.objectContaining({ name: 'image.jpg' }));
    });

     it('should return 500 if storage upload fails', async () => {
        const formData = new FormData();
        const mockFile = new File(['content'], 'fail-upload.png', { type: 'image/png' });
        formData.append('files', mockFile);
        formData.append('userId', 'user-fail-storage');
        const request = createMockRequest(formData);

        // Mock error using captured reference
        mockSupabaseFunctions.upload.mockRejectedValueOnce(new Error('Simulated Storage Error'));

        const response = await POST(request);
        const json = await response.json();

        expect(response.status).toBe(500);
        expect(json.error).toContain('Simulated Storage Error');
     });

    it('should return 500 and attempt cleanup if database insert fails', async () => {
        const formData = new FormData();
        const mockFile = new File(['content'], 'fail-db.png', { type: 'image/png' });
        formData.append('files', mockFile);
        formData.append('userId', 'user-fail-db');
        const request = createMockRequest(formData);

        // Mock error using captured reference
        mockSupabaseFunctions.insert.mockRejectedValueOnce(new Error('Simulated DB Error'));

        const response = await POST(request);
        const json = await response.json();

        expect(response.status).toBe(500);
        expect(json.error).toContain('Simulated DB Error');

        // Verify cleanup using captured reference
        expect(mockSupabaseFunctions.remove).toHaveBeenCalledOnce();
        expect(mockSupabaseFunctions.remove).toHaveBeenCalledWith([expect.stringContaining('user-fail-db/')]);
    });

}); 