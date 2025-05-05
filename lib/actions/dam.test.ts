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
            mockActionAuthGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
            const result = await damActions.listTextAssets();
            expect(result.success).toBe(false);
            expect(result.error).toBe('User not authenticated');
            expect(mockActionFrom).not.toHaveBeenCalled();
        });

        it('should query assets table with correct filters and return data', async () => {
            // Arrange: Setup mock chain for this specific test
            const mockOrder = vi.fn().mockResolvedValue({ data: mockTextAssets, error: null });
            const mockIn = vi.fn(() => ({ order: mockOrder }));
            const mockEq = vi.fn(() => ({ in: mockIn }));
            const mockSelect = vi.fn(() => ({ eq: mockEq }));
            // Mock the implementation of the *instance* returned by createServerActionClient().from
            mockActionFrom.mockImplementation((tableName) => {
              if (tableName === 'assets') return { select: mockSelect };
              return {}; 
            });
            
            // Act
            const result = await damActions.listTextAssets();

            // Assert
            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockTextAssets);
            expect(result.error).toBeUndefined();
            expect(mockActionFrom).toHaveBeenCalledWith('assets');
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
            mockActionFrom.mockImplementation(() => ({ select: mockSelect }));
            
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
            mockActionFrom.mockImplementation(() => ({ select: mockSelect }));
            
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
            mockActionAuthGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
            const result = await damActions.getAssetContent(testAssetId);
            expect(result.success).toBe(false);
            expect(result.error).toBe('User not authenticated');
            expect(mockActionFrom).not.toHaveBeenCalled();
            expect(mockStorageFrom).not.toHaveBeenCalled();
        });

        it('should return error if asset metadata fetch fails', async () => {
            // Arrange
            const dbError = new Error('DB Metadata Error');
            const mockSingle = vi.fn().mockResolvedValue({ data: null, error: dbError });
            const mockEq = vi.fn(() => ({ single: mockSingle }));
            const mockSelect = vi.fn(() => ({ eq: mockEq }));
            mockActionFrom.mockImplementation(() => ({ select: mockSelect }));
            
            // Act
            const result = await damActions.getAssetContent(testAssetId);

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toContain('Error fetching asset metadata');
            expect(mockStorageFrom).not.toHaveBeenCalled();
        });

        it('should return error if asset not found', async () => {
            // Arrange
            const mockSingle = vi.fn().mockResolvedValue({ data: null, error: null }); // Simulate not found
            const mockEq = vi.fn(() => ({ single: mockSingle }));
            const mockSelect = vi.fn(() => ({ eq: mockEq }));
            mockActionFrom.mockImplementation(() => ({ select: mockSelect }));
            
            // Act
            const result = await damActions.getAssetContent(testAssetId);

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toBe('Asset not found.');
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
            mockActionFrom.mockImplementation(() => ({ select: mockSelect }));
            
            // Act
            const result = await damActions.getAssetContent(testAssetId);
            
            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toBe('Permission denied.');
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
            mockActionFrom.mockImplementation(() => ({ select: mockSelect }));
            
            // Act
            const result = await damActions.getAssetContent(testAssetId);

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toBe('Cannot fetch content for this file type.');
            expect(mockStorageFrom).not.toHaveBeenCalled();
        });

        it('should return error if storage download fails', async () => {
            // Arrange
            const storageError = new Error('Storage Download Failed');
            mockStorageDownload.mockResolvedValueOnce({ data: null, error: storageError });
            // Mock the DB part successfully
            const mockSingle = vi.fn().mockResolvedValue({ data: mockTextAssetMetadata, error: null });
            const mockEq = vi.fn(() => ({ single: mockSingle }));
            const mockSelect = vi.fn(() => ({ eq: mockEq }));
            mockActionFrom.mockImplementation(() => ({ select: mockSelect }));

            // Act
            const result = await damActions.getAssetContent(testAssetId);

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toContain('Failed to download asset content');
        });
        
        it('should return error if downloaded blob is null/empty', async () => {
             // Arrange
            mockStorageDownload.mockResolvedValueOnce({ data: null, error: null }); 
            // Mock the DB part successfully
            const mockSingle = vi.fn().mockResolvedValue({ data: mockTextAssetMetadata, error: null });
            const mockEq = vi.fn(() => ({ single: mockSingle }));
            const mockSelect = vi.fn(() => ({ eq: mockEq }));
            mockActionFrom.mockImplementation(() => ({ select: mockSelect }));

            // Act
            const result = await damActions.getAssetContent(testAssetId);

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toBe('Downloaded asset content is empty.');
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
            // Mock the DB part successfully
            const mockSingle = vi.fn().mockResolvedValue({ data: mockTextAssetMetadata, error: null });
            const mockEq = vi.fn(() => ({ single: mockSingle }));
            const mockSelect = vi.fn(() => ({ eq: mockEq }));
            mockActionFrom.mockImplementation(() => ({ select: mockSelect }));
            
            // Act
            const result = await damActions.getAssetContent(testAssetId);
            
            // Assert
            expect(result.success).toBe(true);
            expect(result.content).toBe(fileContent);
            expect(result.error).toBeUndefined();
            expect(mockActionFrom).toHaveBeenCalledWith('assets');
            expect(mockSelect).toHaveBeenCalledWith('id, storage_path, user_id, mime_type');
            expect(mockEq).toHaveBeenCalledWith('id', testAssetId);
            expect(mockStorageFrom).toHaveBeenCalledWith('assets');
            expect(mockStorageDownload).toHaveBeenCalledWith(testStoragePath);
        });
    });

    // TODO: Add tests for moveAsset and deleteAsset if they don't exist

}); // End describe DAM Server Actions 