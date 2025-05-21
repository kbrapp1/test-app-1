import { renderHook, act } from '@testing-library/react';
import { useFolderFetch } from './useFolderFetch';
import { Folder, CombinedItem, Asset } from '@/types/dam';
import { useToast } from '@/components/ui/use-toast';
import { vi } from 'vitest';

// Mock the useToast hook
const mockToastFn = vi.fn();
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: mockToastFn }),
}));

// Mock fetch
global.fetch = vi.fn();

describe('useFolderFetch', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockToastFn.mockClear();
    (global.fetch as any).mockClear();
  });

  it('should fetch folder children successfully', async () => {
    const mockFolderData: Folder[] = [
      { id: 'folder2', name: 'Folder 2', parent_folder_id: 'folder1', type: 'folder', user_id: 'user1', organization_id: 'org1', created_at: 'date', ownerName: 'test' },
    ];
    const mockAssetData: Asset = {
      id: 'asset1', 
      name: 'Asset 1', 
      folder_id: 'folder1', 
      type: 'asset', 
      storage_path: 'path/to/asset',
      mime_type: 'image/jpeg',
      size: 12345, 
      publicUrl: 'url', 
      parentFolderName: 'folder1', 
      user_id: 'user1', 
      organization_id: 'org1', 
      created_at: 'date', 
      ownerName: 'test' 
    };
    const mockCombinedData: CombinedItem[] = [
      ...mockFolderData,
      mockAssetData,
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCombinedData,
    } as Response);

    const { result } = renderHook(() => useFolderFetch());

    let fetchedFolders: Folder[] = [];
    await act(async () => {
      fetchedFolders = await result.current.fetchFolderChildren('folder1');
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(fetchedFolders).toEqual(mockFolderData);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/dam?folderId=folder1&_'));
    expect(mockToastFn).not.toHaveBeenCalled();
  });

  it('should handle API request failure', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    const { result } = renderHook(() => useFolderFetch());

    await act(async () => {
      try {
        await result.current.fetchFolderChildren('folder1');
      } catch (e) {
        // Expected error
      }
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('API request failed with status 500');
    expect(mockToastFn).toHaveBeenCalledWith({
      variant: "destructive",
      title: "Failed to load folders",
      description: "API request failed with status 500"
    });
  });

  it('should handle network error or other fetch exceptions', async () => {
    const networkError = new Error('Network error');
    (global.fetch as any).mockRejectedValueOnce(networkError);

    const { result } = renderHook(() => useFolderFetch());

    await act(async () => {
      try {
        await result.current.fetchFolderChildren('folder1');
      } catch (e) {
        // Expected error
      }
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('Network error');
    expect(mockToastFn).toHaveBeenCalledWith({
      variant: "destructive",
      title: "Failed to load folders",
      description: "Network error"
    });
  });

  it('should have isLoading false after fetch completes', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    } as Response);

    const { result } = renderHook(() => useFolderFetch());

    await act(async () => {
      await result.current.fetchFolderChildren('folder1');
    });

    expect(result.current.isLoading).toBe(false);
  });
}); 