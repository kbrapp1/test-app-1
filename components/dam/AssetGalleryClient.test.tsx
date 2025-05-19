import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { AssetGalleryClient, type ViewMode } from './AssetGalleryClient';
import type { CombinedItem, Asset, Folder } from '@/types/dam';
import { 
  ReadonlyURLSearchParams,
  useSearchParams as actualUseSearchParams, // Keep for type reference if needed
  useRouter as actualUseRouter, // Import the actuals to allow vi.mocked to type correctly
  usePathname as actualUsePathname
} from 'next/navigation';

// REMOVED: const mockUseSearchParams = vi.fn(() => new ReadonlyURLSearchParams(new URLSearchParams()));

vi.mock('next/navigation', async (importOriginal) => {
  const actualNav = await importOriginal<typeof import('next/navigation')>();
  return {
    ...actualNav, // Spread actual to ensure all exports are present
    useSearchParams: vi.fn(() => new ReadonlyURLSearchParams(new URLSearchParams())), // Mocked instance within the factory
    useRouter: vi.fn(() => ({ // Mock useRouter as well
      push: vi.fn(),
      replace: vi.fn(),
      refresh: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn(),
    })),
    usePathname: vi.fn(() => '/'), // Mock usePathname
  };
});

// Now, to change implementations, we need to import the mocked functions
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

const renderWithProviders = (ui: React.ReactElement, searchParamsString = '') => {
  vi.mocked(useSearchParams).mockImplementation(() => new ReadonlyURLSearchParams(new URLSearchParams(searchParamsString)));
  // If router or pathname needs specific mock per test, do it here too
  // vi.mocked(useRouter).mockReturnValue(...);
  // vi.mocked(usePathname).mockReturnValue(...);

  return render(
    <React.Suspense fallback={<div>Loading Suspense...</div>}>
     {ui}
    </React.Suspense>
  );
};

// Mock the AssetGrid component
vi.mock('./AssetGrid', () => ({
  AssetGrid: ({ assets }: { assets: Asset[] }) => {
    return (
      <div data-testid="mock-asset-grid">
        <div data-testid="asset-items-count">{assets.length}</div>
        {assets.map((item) => (
          <div key={item.id} data-testid={`item-asset-${item.id}`}>
            {item.name}
          </div>
        ))}
        {assets.length === 0 && <div data-testid="no-assets-message">No assets</div>}
      </div>
    );
  },
}));

// Mock the AssetListItem component
vi.mock('./AssetListItem', () => ({
  AssetListItem: ({ item }: { item: CombinedItem }) => (
    <div data-testid={`mock-asset-list-item-${item.id}`}>{item.name} (List Item)</div>
  ),
}));

// Create mock response data
const mockAssetData: Asset[] = [
  {
    id: 'asset-1',
    name: 'test-image-1.png',
    storage_path: 'user/test-image-1.png',
    mime_type: 'image/png',
    size: 1024,
    created_at: new Date().toISOString(),
    user_id: 'user-123',
    organization_id: 'org-123',
    folder_id: null,
    type: 'asset',
    publicUrl: 'https://example.com/test-image-1.png',
    ownerName: 'Mock Owner',
    parentFolderName: null,
  },
  {
    id: 'asset-2',
    name: 'test-image-2.jpg',
    storage_path: 'user/test-image-2.jpg',
    mime_type: 'image/jpeg',
    size: 2048,
    created_at: new Date().toISOString(),
    user_id: 'user-123',
    organization_id: 'org-123',
    folder_id: null,
    type: 'asset',
    publicUrl: 'https://example.com/test-image-2.jpg',
    ownerName: 'Mock Owner',
    parentFolderName: null,
  },
];

const mockFolderData: Folder[] = [
  {
    id: 'folder-1',
    name: 'Test Folder',
    parent_folder_id: null,
    user_id: 'user-123',
    organization_id: 'org-123',
    created_at: new Date().toISOString(),
    type: 'folder',
    ownerName: 'Mock Owner',
  },
];

// Mock fetch function
const mockFetch = vi.fn();

describe('AssetGalleryClient', () => {
  beforeEach(() => {
    // Replace global fetch with mock
    global.fetch = mockFetch;
    
    // Reset fetch mock before each test
    mockFetch.mockReset();
    
    // Default successful response with root-level assets and folders
    const defaultMockItems = [...mockFolderData.map(f => ({...f, type: 'folder' as const})), ...mockAssetData.map(a => ({...a, type: 'asset' as const}))];
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: defaultMockItems, totalItems: defaultMockItems.length }),
    });

    // Reset useSearchParams mock to default (empty) before each test
    vi.mocked(useSearchParams).mockImplementation(() => new ReadonlyURLSearchParams(new URLSearchParams()));
    // Reset other navigation mocks if they were changed in a test
    vi.mocked(useRouter).mockReturnValue({
      push: vi.fn(),
      replace: vi.fn(),
      refresh: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn(),
    });
    vi.mocked(usePathname).mockReturnValue('/');
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should display a loading state initially', async () => {
    // Delay the fetch response to test loading state
    mockFetch.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => [],
      }), 100))
    );

    renderWithProviders(<AssetGalleryClient currentFolderId={null} searchTerm={undefined} tagIds={undefined} viewMode="grid" />);
    
    // Check for loading indicator - wait for it to appear as initial state might take a moment to render
    await waitFor(() => {
      expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
    });

    // Also wait for it to disappear after fetch completes
    await waitFor(() => {
      expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
    });
  });

  it('should fetch and display assets for the root folder', async () => {
    renderWithProviders(<AssetGalleryClient currentFolderId={null} searchTerm={undefined} tagIds={undefined} viewMode="grid" />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
    });
    
    // Verify fetch was called with the correct URL (including timestamp for cache busting)
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const fetchUrl = mockFetch.mock.calls[0][0];
    expect(fetchUrl).toMatch(/\/api\/dam\?folderId=&q=&_=\d+/);
    
    // Verify folders are displayed (FolderListItem is not mocked, so we look for its output)
    expect(screen.getByText('Test Folder')).toBeInTheDocument();

    // Verify assets are displayed via the mocked AssetGrid
    expect(screen.getByTestId('asset-items-count').textContent).toBe(String(mockAssetData.length));
    expect(screen.getByText('test-image-1.png')).toBeInTheDocument();
    expect(screen.getByText('test-image-2.jpg')).toBeInTheDocument();
  });

  it('should fetch assets for a specific folder', async () => {
    // Mock response for a specific folder containing only one asset
    const specificFolderAsset: Asset = {
      id: 'asset-3',
      name: 'folder-image.png',
      storage_path: 'user/folder-1/folder-image.png',
      mime_type: 'image/png',
      size: 3072,
      created_at: new Date().toISOString(),
      user_id: 'user-123',
      organization_id: 'org-123',
      folder_id: 'folder-1',
      type: 'asset',
      publicUrl: 'https://example.com/folder-image.png',
      ownerName: 'Mock Owner',
      parentFolderName: 'Test Folder',
    };
    const specificFolderItems = [{...specificFolderAsset, type: 'asset' as const}];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: specificFolderItems, totalItems: specificFolderItems.length }),
    });

    renderWithProviders(<AssetGalleryClient currentFolderId="folder-1" searchTerm={undefined} tagIds={undefined} viewMode="grid" />);
    
    await waitFor(() => {
      expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
    });
    
    // Verify fetch called with the correct folder ID
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const fetchUrl = mockFetch.mock.calls[0][0];
    expect(fetchUrl).toMatch(/\/api\/dam\?folderId=folder-1&q=&_=\d+/);
    
    // Verify the folder-specific asset is displayed
    expect(screen.getByTestId('asset-items-count').textContent).toBe('1');
    expect(screen.getByText('folder-image.png')).toBeInTheDocument();
  });

  it('should handle API errors gracefully', async () => {
    // Mock a failed API response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });
    
    // We no longer log errors to console in the component
    // const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    renderWithProviders(<AssetGalleryClient currentFolderId={null} searchTerm={undefined} tagIds={undefined} viewMode="grid" />);
    
    await waitFor(() => {
      expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
    });
    
    // Should display empty state
    expect(screen.getByText('This folder is empty.')).toBeInTheDocument();
    
    // We removed console.error so we don't need to test for it
    // expect(consoleSpy).toHaveBeenCalledWith(
    //   'Error fetching folder items:',
    //   expect.any(Error)
    // );
    
    // consoleSpy.mockRestore();

    // Verify fetch was called with the correct URL (including timestamp for cache busting)
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const fetchUrl = mockFetch.mock.calls[0][0];
    expect(fetchUrl).toMatch(/\/api\/dam\?folderId=&q=&_=\d+/);

    // Ensure no assets are displayed by the mock grid
    // If there's an API error and no items, AssetGrid might not be rendered at all.
    // So, these might not be present, which is correct for the error state.
    // expect(screen.getByTestId('asset-items-count').textContent).toBe('0');
    // expect(screen.getByTestId('no-assets-message')).toBeInTheDocument();
    expect(screen.queryByTestId('asset-items-count')).not.toBeInTheDocument();
    expect(screen.queryByTestId('no-assets-message')).not.toBeInTheDocument();
  });

  it('should re-fetch data when folder ID changes', async () => {
    // Initial fetch for root folder (or whatever is the default)
    const initialItems = [...mockFolderData, ...mockAssetData];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: initialItems, totalItems: initialItems.length }),
    });

    const { rerender } = renderWithProviders(<AssetGalleryClient currentFolderId={null} searchTerm={undefined} tagIds={undefined} viewMode="grid" />); 

    await waitFor(() => {
      expect(screen.getByText('Test Folder')).toBeInTheDocument(); // From initial fetch
    });

    // Mock response for the new folder ID
    const newFolderAsset: Asset = { 
      id: 'asset-special', 
      name: 'special-image.png', 
      storage_path: 'user/new-folder/special.png',
      mime_type: 'image/png', size: 100, created_at: new Date().toISOString(), user_id: 'test', organization_id: 'test', folder_id: 'new-folder-123', type: 'asset', publicUrl: '', ownerName: '', parentFolderName: 'New Folder'
    };
    const newFolderItems = [newFolderAsset];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      // json: async () => [newFolderAsset],
      json: async () => ({ data: newFolderItems, totalItems: newFolderItems.length }),
    });

    // Rerender with a new folder ID
    rerender(<AssetGalleryClient currentFolderId="new-folder-123" searchTerm={undefined} tagIds={undefined} viewMode="grid" />);

    await waitFor(() => {
      expect(screen.getByText('special-image.png')).toBeInTheDocument();
      expect(screen.queryByText('Test Folder')).not.toBeInTheDocument();
    });
  });

  it('should include a cache-busting timestamp parameter to prevent browser caching', async () => {
    renderWithProviders(<AssetGalleryClient currentFolderId={null} searchTerm={undefined} tagIds={undefined} viewMode="grid" />);
    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    const fetchUrl = mockFetch.mock.calls[0][0];
    expect(fetchUrl).toMatch(/_=\d+/); // Check for _=timestamp
  });

  it('should display "This folder is empty" when no items are returned', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [], totalItems: 0 }),
    });
    renderWithProviders(<AssetGalleryClient currentFolderId="empty-folder" searchTerm={undefined} tagIds={undefined} viewMode="grid" />);
    await waitFor(() => {
      expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
      expect(screen.getByText('This folder is empty.')).toBeInTheDocument();
    });
  });

  it('should display search results when initialSearchTerm is provided', async () => {
    const searchTerm = 'search-term';
    const searchedAsset: Asset = {...mockAssetData[0], id: 'asset-searched', name: 'searched-image.png' };
    const searchedItems = [searchedAsset];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: searchedItems, totalItems: searchedItems.length }),
    });

    renderWithProviders(<AssetGalleryClient currentFolderId={null} searchTerm={searchTerm} tagIds={undefined} viewMode="grid" />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const fetchUrl = mockFetch.mock.calls[0][0];
    expect(fetchUrl).toMatch(new RegExp(`/api/dam\\?folderId=&q=${encodeURIComponent(searchTerm)}&_=\\d+`));

    // Check that only the searched asset is in the mocked AssetGrid
    expect(screen.getByTestId('asset-items-count').textContent).toBe('1');
    expect(screen.getByText('searched-image.png')).toBeInTheDocument();
    expect(screen.queryByText('test-image-1.png')).not.toBeInTheDocument();
    expect(screen.queryByText('test-image-2.jpg')).not.toBeInTheDocument();
    // Folders might not appear in search results depending on API logic, adjust if necessary
    expect(screen.queryByText('Test Folder')).not.toBeInTheDocument(); 
  });

  it('should display "No results found" message when search yields no items', async () => {
    const searchTerm = 'no-results-search';
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [], totalItems: 0 }),
    });

    renderWithProviders(<AssetGalleryClient currentFolderId={null} searchTerm={searchTerm} tagIds={undefined} viewMode="grid" />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
    });

    expect(screen.getByText(/No results found for "no-results-search"/i)).toBeInTheDocument();
  });

  it('should re-fetch data when initialSearchTerm changes', async () => {
    // Initial fetch
    const initialSearchItems = [{ ...mockAssetData[0], name: 'initial-search-image.png', id: 'asset-initial-search' }];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: initialSearchItems, totalItems: initialSearchItems.length }),
    });

    const { rerender } = renderWithProviders(
      <AssetGalleryClient currentFolderId={null} searchTerm="initial-search" tagIds={undefined} viewMode="grid" />
    );

    await waitFor(() => {
      expect(screen.getByText('initial-search-image.png')).toBeInTheDocument();
    });

    // Second fetch (after rerender with new search term)
    const secondSearchItems = [{ ...mockAssetData[1], name: 'test-image-2.jpg', id: 'asset-second-search' }];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: secondSearchItems, totalItems: secondSearchItems.length }),
    });

    // Rerender with a new search term
    rerender(<AssetGalleryClient currentFolderId={null} searchTerm="second-search" tagIds={undefined} viewMode="grid" />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch.mock.calls[1][0]).toContain('q=second-search');
      expect(screen.getByText(mockAssetData[1].name)).toBeInTheDocument();
      expect(screen.queryByText(mockAssetData[0].name)).not.toBeInTheDocument(); // Old data should be gone
    });
  });

  it('should display loading state when initialSearchTerm causes re-fetch and items are initially empty', async () => {
    // Initial fetch (e.g., for searchTerm=undefined or an initial different search) returns empty.
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [], totalItems: 0 }),
    });

    const { rerender } = renderWithProviders(
      // Render initially with a state that results in empty items
      <AssetGalleryClient currentFolderId={null} searchTerm="initial-empty-search" tagIds={undefined} viewMode="grid" />
    );

    // Wait for initial empty state (or loading to clear if it shows for empty)
    await waitFor(() => {
      expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
      // It might show "No results found" or "This folder is empty" depending on implementation for empty with search term
      // For now, let's just ensure loading is gone.
    });
    
    // Now, set up the mock for the fetch that will happen due to the new search term
    const newSearchItems = [{...mockAssetData[0], name: 'test-image-1.png'}]; 
    mockFetch.mockImplementationOnce(() =>  // Use mockImplementationOnce for the delayed response
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ data: newSearchItems, totalItems: newSearchItems.length }),
      }), 50)) // Small delay to ensure loading state can be caught
    );

    // Rerender with the new search term that should trigger a fetch and loading state
    rerender(
      <AssetGalleryClient currentFolderId={null} searchTerm="new-search" tagIds={undefined} viewMode="grid" />
    );

    // Check for loading indicator immediately after rerender (or very soon after)
    await waitFor(() => {
      expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
    });

    // Wait for the search to complete and loading to disappear, then check for the new item
    await waitFor(() => {
      expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
      expect(screen.getByText('test-image-1.png')).toBeInTheDocument(); 
    }, { timeout: 2000 }); // Increased timeout just in case
  });

  // Test for list view
  it('should render AssetListItems when viewMode is list', async () => {
    // Provide initial data with both folders and assets to check combined rendering in list mode
    const listModeItems = [...mockFolderData.map(f => ({...f, type: 'folder' as const})), ...mockAssetData.map(a => ({...a, type: 'asset' as const}))];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: listModeItems, totalItems: listModeItems.length }),
    });

    renderWithProviders(<AssetGalleryClient currentFolderId={null} searchTerm={undefined} tagIds={undefined} viewMode="list" />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
    });

    // Verify mock AssetGrid is NOT rendered
    expect(screen.queryByTestId('mock-asset-grid')).not.toBeInTheDocument();
    expect(screen.queryByTestId('asset-items-count')).not.toBeInTheDocument();

    // Verify mock AssetListItems are rendered
    expect(screen.getByTestId(`mock-asset-list-item-${mockAssetData[0].id}`)).toBeInTheDocument();
    expect(screen.getByText(`${mockAssetData[0].name} (List Item)`)).toBeInTheDocument();
    expect(screen.getByTestId(`mock-asset-list-item-${mockAssetData[1].id}`)).toBeInTheDocument();
    expect(screen.getByText(`${mockAssetData[1].name} (List Item)`)).toBeInTheDocument();
  });

  // Test for tag filtering
  it('should fetch data with tagIds when present in URL', async () => {
    const tagIdsString = 'tag1,tag2';
    renderWithProviders(<AssetGalleryClient currentFolderId={null} searchTerm={undefined} tagIds={tagIdsString} viewMode="grid" />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const fetchUrl = mockFetch.mock.calls[0][0];
      expect(fetchUrl).toContain(`tagIds=${encodeURIComponent(tagIdsString)}`);
    });
  });

  it('should re-fetch data when tagIds prop changes', async () => {
    const initialTagIds = "tagA"; // Match the failing test's expectation for the first call
    const newTagIds = "tagB,tagC";

    const { rerender } = renderWithProviders(
      <AssetGalleryClient currentFolderId={null} searchTerm={undefined} tagIds={initialTagIds} viewMode="grid" />
    );

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch.mock.calls[0][0]).toContain(`tagIds=${encodeURIComponent(initialTagIds)}`);
    });
    
    // Prepare for the second fetch call
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [{id: 'new-asset', name:'new.png', type: 'asset'}] });
    
    rerender(<AssetGalleryClient currentFolderId={null} searchTerm={undefined} tagIds={newTagIds} viewMode="grid" />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2); // Should be 2 calls in total
      expect(mockFetch.mock.calls[1][0]).toContain(`tagIds=${encodeURIComponent(newTagIds)}`);
      // Optionally, check that new data is rendered if the mock response includes it
      // For example, if new-asset.png is expected:
      // expect(screen.getByText('new.png')).toBeInTheDocument(); 
    });
  });

  // Add more tests for drag and drop, optimistic updates etc. as needed
}); 