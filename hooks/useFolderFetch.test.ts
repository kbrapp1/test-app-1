import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react'; // Using @testing-library/react for renderHook
import { useFolderFetch } from './useFolderFetch';
import { Folder, CombinedItem } from '@/types/dam'; // Assuming these types are needed for mocks

// Mock useToast
const mockToast = vi.fn();
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock global fetch
global.fetch = vi.fn();

describe('useFolderFetch', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    // Reset fetch mock to a default behavior if needed, or per-test
    (global.fetch as vi.Mock).mockReset();
  });

  it('should have correct initial state', () => {
    const { result } = renderHook(() => useFolderFetch());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.fetchFolderChildren).toBe('function');
  });

  it('should fetch folder children successfully', async () => {
    const mockFolderId = 'folder123';
    const mockApiResponse: CombinedItem[] = [
      { id: 'f1', name: 'Child Folder 1', type: 'folder', path_tokens: [], updated_at: '', items: null, parent_id: mockFolderId, file_type: null, file_extension: null, file_size: null, url: null, tags: [] },
      { id: 'a1', name: 'Asset 1', type: 'asset', path_tokens: [], updated_at: '', items: null, parent_id: mockFolderId, file_type: 'image', file_extension: 'jpg', file_size: 1024, url: 'http://example.com/asset1.jpg', tags: [] },
      { id: 'f2', name: 'Child Folder 2', type: 'folder', path_tokens: [], updated_at: '', items: null, parent_id: mockFolderId, file_type: null, file_extension: null, file_size: null, url: null, tags: [] },
    ];
    const expectedFolders: Folder[] = [
      { id: 'f1', name: 'Child Folder 1', type: 'folder', path_tokens: [], updated_at: '', items: null, parent_id: mockFolderId, file_type: null, file_extension: null, file_size: null, url: null, tags: [] },
      { id: 'f2', name: 'Child Folder 2', type: 'folder', path_tokens: [], updated_at: '', items: null, parent_id: mockFolderId, file_type: null, file_extension: null, file_size: null, url: null, tags: [] },
    ];

    (global.fetch as vi.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    });

    const { result } = renderHook(() => useFolderFetch());
    
    let returnedFolders: Folder[] = [];

    // Start loading
    expect(result.current.isLoading).toBe(false);
    
    await act(async () => {
      const promise = result.current.fetchFolderChildren(mockFolderId);
      // Check loading state immediately after call if possible, though act might batch updates
      // Depending on exact timing, this might be true inside act or after the first await
      expect(result.current.isLoading).toBe(true); 
      returnedFolders = await promise;
    });

    // After fetch completes
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(returnedFolders).toEqual(expectedFolders);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining(`/api/dam?folderId=${mockFolderId}&_=`));
    expect(mockToast).not.toHaveBeenCalled();
  });

  it('should handle API request failure (res.ok is false)', async () => {
    const mockFolderId = 'folderError123';
    const apiErrorStatus = 500;
    (global.fetch as vi.Mock).mockResolvedValueOnce({
      ok: false,
      status: apiErrorStatus,
      json: async () => ({ message: 'Internal Server Error' }), // Optional: if the hook tries to parse error body
    });

    const { result } = renderHook(() => useFolderFetch());

    await act(async () => {
      try {
        await result.current.fetchFolderChildren(mockFolderId);
      } catch (e: any) {
        expect(e.message).toBe(`API request failed with status ${apiErrorStatus}`);
      }
    });
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(`API request failed with status ${apiErrorStatus}`);
    expect(mockToast).toHaveBeenCalledTimes(1);
    expect(mockToast).toHaveBeenCalledWith({
      variant: "destructive",
      title: "Failed to load folders",
      description: `API request failed with status ${apiErrorStatus}`,
    });
  });

  it('should handle fetch throwing an error (network error)', async () => {
    const mockFolderId = 'folderNetError456';
    const networkErrorMessage = 'Network request failed';
    (global.fetch as vi.Mock).mockRejectedValueOnce(new Error(networkErrorMessage));

    const { result } = renderHook(() => useFolderFetch());

    await act(async () => {
      try {
        await result.current.fetchFolderChildren(mockFolderId);
      } catch (e: any) {
        expect(e.message).toBe(networkErrorMessage);
      }
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(networkErrorMessage);
    expect(mockToast).toHaveBeenCalledTimes(1);
    expect(mockToast).toHaveBeenCalledWith({
      variant: "destructive",
      title: "Failed to load folders",
      description: networkErrorMessage,
    });
  });

  // More tests will be added in subsequent steps for success, error, etc.
});
