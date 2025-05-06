import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cookies } from 'next/headers'; // Mocked

// --- Mock Modules --- 

// Mock next/headers (Keep this as it's simple)
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({ get: vi.fn() })),
}));

// Declare mock functions at a higher scope
const mockActionAuthGetUser = vi.fn();
const mockActionFrom = vi.fn(); 
const mockStorageDownload = vi.fn();
const mockStorageFrom = vi.fn(() => ({ download: mockStorageDownload }));
const mockServerAuthGetUser = vi.fn();
const mockServerFrom = vi.fn(); // Mock for server client DB access if needed

// Mock the entire Supabase Action Client module
vi.mock('@supabase/auth-helpers-nextjs', () => ({
  createServerActionClient: vi.fn(() => ({
    auth: { getUser: mockActionAuthGetUser },
    from: mockActionFrom, 
  })),
}));

// Mock the entire Supabase Server Client module (for Storage)
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({ 
      auth: { getUser: mockServerAuthGetUser }, // Keep auth mock
      storage: { from: mockStorageFrom },
      from: mockServerFrom, // Use the dedicated mock here
  })),
}));

// --- Dynamic Import --- 
// NOTE: Dynamic import might not be strictly necessary with top-level vi.mock,
// but keep it for now to ensure module mocks are applied before import.
let damActions: typeof import('./dam');

// --- Test Constants ---
const testUserId = 'user-uuid-123';
const testAssetId = 'asset-uuid-456';
const testStoragePath = `user/${testUserId}/file.txt`;

// --- Main Describe Block ---
describe('DAM Server Actions', () => {

    beforeEach(async () => {
      vi.resetAllMocks(); // Reset all mocks before each test

      // Setup default authenticated user for most tests
      mockActionAuthGetUser.mockResolvedValue({ data: { user: { id: testUserId } }, error: null });
      mockServerAuthGetUser.mockResolvedValue({ data: { user: { id: testUserId } }, error: null });
      
      // Default successful storage download
      mockStorageDownload.mockResolvedValue({ data: new Blob(['file content']), error: null });

      // Import the module
      damActions = await import('./dam'); 
    });

    // ====================================
    // Test Suite: listTextAssets
    // ====================================
    describe('listTextAssets', () => {
        const mockTextAssets = [
            { id: 'txt-1', name: 'report.txt', created_at: new Date().toISOString() },
            { id: 'md-1', name: 'notes.md', created_at: new Date().toISOString() },
        ];

        it('should return error if user is not authenticated', async () => {
            mockServerAuthGetUser.mockResolvedValueOnce({ data: { user: null }, error: null }); // Use server mock
            const result = await damActions.listTextAssets();
            expect(result.success).toBe(false);
            expect(result.error).toBe('User not authenticated');
            expect(mockServerFrom).not.toHaveBeenCalled(); // Check server mock
        });

        it('should query assets table with correct filters and return data', async () => {
            // Arrange: Setup mock chain for the server client
            const mockOrder = vi.fn().mockResolvedValue({ data: mockTextAssets, error: null });
            const mockIn = vi.fn(() => ({ order: mockOrder }));
            const mockEq = vi.fn(() => ({ in: mockIn }));
            const mockSelect = vi.fn(() => ({ eq: mockEq }));
            // Mock the implementation of the *instance* returned by createClient().from
            mockServerFrom.mockImplementation((tableName) => { // Use server mock
              if (tableName === 'assets') return { select: mockSelect };
              return {}; 
            });
            
            // Act
            const result = await damActions.listTextAssets();

            // Assert
            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockTextAssets);
            expect(result.error).toBeUndefined();
            expect(mockServerFrom).toHaveBeenCalledWith('assets'); // Check server mock
            expect(mockSelect).toHaveBeenCalledWith('id, name, created_at');
            expect(mockEq).toHaveBeenCalledWith('user_id', testUserId);
            expect(mockIn).toHaveBeenCalledWith('mime_type', expect.any(Array)); 
            expect(mockOrder).toHaveBeenCalledWith('name', { ascending: true });
        });

        it('should return empty list if no text assets found', async () => {
            // Arrange
            const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null }); // Empty data
            const mockIn = vi.fn(() => ({ order: mockOrder }));
            const mockEq = vi.fn(() => ({ in: mockIn }));
            const mockSelect = vi.fn(() => ({ eq: mockEq }));
            mockServerFrom.mockImplementation(() => ({ select: mockSelect })); // Use server mock
            
            // Act
            const result = await damActions.listTextAssets();

            // Assert
            expect(result.success).toBe(true);
            expect(result.data).toEqual([]);
        });

        it('should return error if database query fails', async () => {
            // Arrange
            const dbError = new Error('DB List Error');
            const mockOrder = vi.fn().mockResolvedValue({ data: null, error: dbError });
            const mockIn = vi.fn(() => ({ order: mockOrder }));
            const mockEq = vi.fn(() => ({ in: mockIn }));
            const mockSelect = vi.fn(() => ({ eq: mockEq }));
            mockServerFrom.mockImplementation(() => ({ select: mockSelect })); // Use server mock
            
            // Act
            const result = await damActions.listTextAssets();

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toContain('Failed to fetch text assets');
            expect(result.data).toBeUndefined();
        });
    });

    // ====================================
    // Test Suite: getAssetContent
    // ====================================
    describe('getAssetContent', () => {
        const mockTextAssetMetadata = {
            id: testAssetId,
            storage_path: testStoragePath,
            user_id: testUserId,
            mime_type: 'text/plain',
        };

        it('should return error if assetId is missing', async () => {
            const result = await damActions.getAssetContent(''); 
            expect(result.success).toBe(false);
            expect(result.error).toBe('Asset ID is required.');
            expect(mockActionAuthGetUser).not.toHaveBeenCalled();
        });

        it('should return error if user is not authenticated', async () => {
            // Mock the SERVER client's getUser method
            mockServerAuthGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
            
            const result = await damActions.getAssetContent(testAssetId);
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('User not authenticated');
            // Verify that neither DB nor Storage were called
            expect(mockServerFrom).not.toHaveBeenCalled(); // Check server DB mock
            expect(mockStorageFrom).not.toHaveBeenCalled(); // Check storage mock
        });

        it('should return error if asset metadata fetch fails', async () => {
            // Arrange
            const dbError = new Error('DB Metadata Error');
            const mockSingle = vi.fn().mockResolvedValue({ data: null, error: dbError });
            const mockEq = vi.fn(() => ({ single: mockSingle }));
            const mockSelect = vi.fn(() => ({ eq: mockEq }));
            // Use the SERVER client mock here
            mockServerFrom.mockImplementation(() => ({ select: mockSelect })); 
            
            // Act
            const result = await damActions.getAssetContent(testAssetId);

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toContain('Error fetching asset metadata');
            // We expect the server client's 'from' to have been called
            expect(mockServerFrom).toHaveBeenCalledWith('assets'); 
            expect(mockSelect).toHaveBeenCalledWith('id, storage_path, user_id, mime_type');
            expect(mockEq).toHaveBeenCalledWith('id', testAssetId);
            expect(mockStorageFrom).not.toHaveBeenCalled(); // Storage should not be called if DB fails
        });

        it('should return error if asset not found', async () => {
            // Arrange
            const mockSingle = vi.fn().mockResolvedValue({ data: null, error: null }); // Simulate not found
            const mockEq = vi.fn(() => ({ single: mockSingle }));
            const mockSelect = vi.fn(() => ({ eq: mockEq }));
             // Use the SERVER client mock here
            mockServerFrom.mockImplementation(() => ({ select: mockSelect }));
            
            // Act
            const result = await damActions.getAssetContent(testAssetId);

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toBe('Asset not found.');
             // We expect the server client's 'from' to have been called
            expect(mockServerFrom).toHaveBeenCalledWith('assets');
            expect(mockSelect).toHaveBeenCalledWith('id, storage_path, user_id, mime_type');
            expect(mockEq).toHaveBeenCalledWith('id', testAssetId);
            expect(mockStorageFrom).not.toHaveBeenCalled();
        });

        it('should return error if user does not own the asset', async () => {
            // Arrange
            const mockSingle = vi.fn().mockResolvedValue({ 
                data: { ...mockTextAssetMetadata, user_id: 'another-user-id' }, 
                error: null 
            });
            const mockEq = vi.fn(() => ({ single: mockSingle }));
            const mockSelect = vi.fn(() => ({ eq: mockEq }));
            // Use the SERVER client mock here
            mockServerFrom.mockImplementation(() => ({ select: mockSelect }));
            
            // Act
            const result = await damActions.getAssetContent(testAssetId);
            
            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toBe('Permission denied.');
            // We expect the server client's 'from' to have been called
            expect(mockServerFrom).toHaveBeenCalledWith('assets');
            expect(mockSelect).toHaveBeenCalledWith('id, storage_path, user_id, mime_type');
            expect(mockEq).toHaveBeenCalledWith('id', testAssetId);
            expect(mockStorageFrom).not.toHaveBeenCalled();
        });

        it('should return error if asset is not a text type', async () => {
            // Arrange
            const mockSingle = vi.fn().mockResolvedValue({ 
                data: { ...mockTextAssetMetadata, mime_type: 'image/jpeg' }, 
                error: null 
            });
             const mockEq = vi.fn(() => ({ single: mockSingle }));
            const mockSelect = vi.fn(() => ({ eq: mockEq }));
             // Use the SERVER client mock here
            mockServerFrom.mockImplementation(() => ({ select: mockSelect }));
            
            // Act
            const result = await damActions.getAssetContent(testAssetId);

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toBe('Cannot fetch content for this file type.');
             // We expect the server client's 'from' to have been called
            expect(mockServerFrom).toHaveBeenCalledWith('assets');
            expect(mockSelect).toHaveBeenCalledWith('id, storage_path, user_id, mime_type');
            expect(mockEq).toHaveBeenCalledWith('id', testAssetId);
            expect(mockStorageFrom).not.toHaveBeenCalled();
        });

        it('should return error if storage download fails', async () => {
            // Arrange
            const storageError = new Error('Storage Download Failed');
            mockStorageDownload.mockResolvedValueOnce({ data: null, error: storageError });
            // Mock the DB part successfully using the SERVER mock
            const mockSingle = vi.fn().mockResolvedValue({ data: mockTextAssetMetadata, error: null });
            const mockEq = vi.fn(() => ({ single: mockSingle }));
            const mockSelect = vi.fn(() => ({ eq: mockEq }));
            mockServerFrom.mockImplementation(() => ({ select: mockSelect }));

            // Act
            const result = await damActions.getAssetContent(testAssetId);

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toContain('Failed to download asset content');
            // Verify DB and Storage calls
            expect(mockServerFrom).toHaveBeenCalledWith('assets');
            expect(mockSelect).toHaveBeenCalledWith('id, storage_path, user_id, mime_type');
            expect(mockEq).toHaveBeenCalledWith('id', testAssetId);
            expect(mockStorageFrom).toHaveBeenCalledWith('assets');
            expect(mockStorageDownload).toHaveBeenCalledWith(testStoragePath);
        });
        
        it('should return error if downloaded blob is null/empty', async () => {
             // Arrange
            mockStorageDownload.mockResolvedValueOnce({ data: null, error: null }); 
            // Mock the DB part successfully using the SERVER mock
            const mockSingle = vi.fn().mockResolvedValue({ data: mockTextAssetMetadata, error: null });
            const mockEq = vi.fn(() => ({ single: mockSingle }));
            const mockSelect = vi.fn(() => ({ eq: mockEq }));
            mockServerFrom.mockImplementation(() => ({ select: mockSelect }));

            // Act
            const result = await damActions.getAssetContent(testAssetId);

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toBe('Downloaded asset content is empty.');
             // Verify DB and Storage calls
            expect(mockServerFrom).toHaveBeenCalledWith('assets');
            expect(mockSelect).toHaveBeenCalledWith('id, storage_path, user_id, mime_type');
            expect(mockEq).toHaveBeenCalledWith('id', testAssetId);
            expect(mockStorageFrom).toHaveBeenCalledWith('assets');
            expect(mockStorageDownload).toHaveBeenCalledWith(testStoragePath);
        });

        it('should return text content on success', async () => {
            // Arrange
            const fileContent = 'This is the test file content.';
            // Mock the download result to return an object with a .text() method
            const mockBlob = {
                text: vi.fn().mockResolvedValue(fileContent) // Simulate async .text() call
                // Add other Blob properties if needed by the code under test, e.g., size, type
            };
            mockStorageDownload.mockResolvedValueOnce({ data: mockBlob, error: null });
            // Mock the DB part successfully using the SERVER mock
            const mockSingle = vi.fn().mockResolvedValue({ data: mockTextAssetMetadata, error: null });
            const mockEq = vi.fn(() => ({ single: mockSingle }));
            const mockSelect = vi.fn(() => ({ eq: mockEq }));
            mockServerFrom.mockImplementation(() => ({ select: mockSelect }));
            
            // Act
            const result = await damActions.getAssetContent(testAssetId);
            
            // Assert
            expect(result.success).toBe(true);
            expect(result.content).toBe(fileContent);
            expect(result.error).toBeUndefined();
            // Verify DB and Storage calls
            expect(mockServerFrom).toHaveBeenCalledWith('assets');
            expect(mockSelect).toHaveBeenCalledWith('id, storage_path, user_id, mime_type');
            expect(mockEq).toHaveBeenCalledWith('id', testAssetId);
            expect(mockStorageFrom).toHaveBeenCalledWith('assets');
            expect(mockStorageDownload).toHaveBeenCalledWith(testStoragePath);
            expect(mockBlob.text).toHaveBeenCalled(); // Verify blob.text() was called
        });
    });

    // TODO: Add tests for moveAsset and deleteAsset if they don't exist

}); // End describe DAM Server Actions 