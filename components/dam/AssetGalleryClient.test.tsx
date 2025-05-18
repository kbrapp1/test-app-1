import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { AssetGalleryClient, type ViewMode } from './AssetGalleryClient';
import type { CombinedItem, Asset, Folder } from '@/types/dam';

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
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [...mockFolderData.map(f => ({...f, type: 'folder' as const})), ...mockAssetData.map(a => ({...a, type: 'asset' as const}))],
    });
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

    render(<AssetGalleryClient currentFolderId={null} viewMode="grid" />);
    
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
    render(<AssetGalleryClient currentFolderId={null} viewMode="grid" />);
    
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
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{...specificFolderAsset, type: 'asset' as const}], // API returns CombinedItem[]
    });

    render(<AssetGalleryClient currentFolderId="folder-1" viewMode="grid" />);
    
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
    
    render(<AssetGalleryClient currentFolderId={null} viewMode="grid" />);
    
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
    const { rerender } = render(<AssetGalleryClient currentFolderId={null} viewMode="grid" />);
    
    // Initial fetch for root folder (which populates allItems)
    // MockFetch by default returns mockFolderData and mockAssetData
    await waitFor(() => {
      expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch.mock.calls[0][0]).toMatch(/\/api\/dam\?folderId=&q=&_=\d+/);
      // Ensure some initial items are rendered
      expect(screen.getByText('Test Folder')).toBeInTheDocument();
      expect(screen.getByText('test-image-1.png')).toBeInTheDocument();
    });
        
    const newFolderAsset = {
      id: 'asset-special',
      name: 'special-image.png',
      storage_path: 'user/folder-special/special-image.png',
      mime_type: 'image/png',
      size: 4096,
      created_at: new Date().toISOString(),
      user_id: 'user-123',
      organization_id: 'org-123', 
      folder_id: 'folder-special',
      type: 'asset' as const,
      publicUrl: 'https://example.com/special-image.png',
      ownerName: 'Mock Owner',
      parentFolderName: null,
    };

    // Mock a different response for the new folder
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [newFolderAsset],
    });
    
    // Change the folder ID
    rerender(<AssetGalleryClient currentFolderId="folder-special" viewMode="grid" />);
    
    // The global "Loading..." spinner should NOT appear if allItems already had content.
    expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
    
    // Wait for the new data to be fetched and displayed
    await waitFor(() => {
      // Second fetch for the specific folder
      expect(mockFetch).toHaveBeenCalledTimes(2); 
      expect(mockFetch.mock.calls[1][0]).toMatch(/\/api\/dam\?folderId=folder-special&q=&_=\d+/);
      expect(screen.getByText('special-image.png')).toBeInTheDocument();
      // Ensure old items are gone (if the new folder doesn't include them)
      expect(screen.queryByText('Test Folder')).not.toBeInTheDocument();
      expect(screen.queryByText('test-image-1.png')).not.toBeInTheDocument();
    });
  });

  it('should include a cache-busting timestamp parameter to prevent browser caching', async () => {
    render(<AssetGalleryClient currentFolderId={null} viewMode="grid" />);
    
    await waitFor(() => {
      expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
    });
    
    // Verify the timestamp is included in the URL
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const fetchUrl = mockFetch.mock.calls[0][0];
    expect(fetchUrl).toMatch(/\/api\/dam\?folderId=&q=&_=\d+/);
    expect(fetchUrl).toContain('_=');
  });

  it('should display "This folder is empty" when no items are returned', async () => {
    // Mock an empty response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<AssetGalleryClient currentFolderId={null} viewMode="grid" />);
    
    await waitFor(() => {
      expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
    });
    
    // Verify empty state is displayed
    expect(screen.getByText('This folder is empty.')).toBeInTheDocument();
  });

  it('should display search results when initialSearchTerm is provided', async () => {
    const searchTerm = 'test-image-1';
    // Mock response for search results (e.g., only the matching asset)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [mockAssetData[0]].map(a => ({...a, type: 'asset' as const})), // API returns CombinedItem[]
    });

    render(<AssetGalleryClient currentFolderId={null} initialSearchTerm={searchTerm} viewMode="grid" />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const fetchUrl = mockFetch.mock.calls[0][0];
    expect(fetchUrl).toMatch(new RegExp(`/api/dam\\?folderId=&q=${encodeURIComponent(searchTerm)}&_=\\d+`));

    // Check that only the searched asset is in the mocked AssetGrid
    expect(screen.getByTestId('asset-items-count').textContent).toBe('1');
    expect(screen.getByText('test-image-1.png')).toBeInTheDocument();
    expect(screen.queryByText('test-image-2.jpg')).not.toBeInTheDocument();
    // Folders might not appear in search results depending on API logic, adjust if necessary
    expect(screen.queryByText('Test Folder')).not.toBeInTheDocument(); 
  });

  it('should display "No results found" message when search yields no items', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [], // No items match search
    });

    render(<AssetGalleryClient currentFolderId={null} initialSearchTerm="nonexistent" viewMode="grid" />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
    });

    expect(screen.getByText(/No results found for "nonexistent"/i)).toBeInTheDocument();
  });

  it('should re-fetch data when initialSearchTerm changes', async () => {
    // Start with an empty response for the initial currentFolderId=null
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const { rerender } = render(
      <AssetGalleryClient currentFolderId={null} initialSearchTerm="" viewMode="grid" />
    );

    // Initially, it might load and then show empty state
    await waitFor(() => {
      expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
      expect(screen.getByText('This folder is empty.')).toBeInTheDocument();
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);


    const searchResults: Asset[] = [
      { 
        id: 'search-asset-1', name: 'Searched Asset 1', type: 'asset', folder_id: null,
        storage_path: 's1', mime_type: 'image/png', size: 1024, created_at: new Date().toISOString(), 
        user_id: 'user-123', organization_id: 'org-123', publicUrl: 'http://example.com/searched.png',
        ownerName: 'Mock Owner', parentFolderName: null,
      }
    ];
    // Mock fetch for the search term
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => searchResults,
    });

    // Rerender with a new initialSearchTerm, currentFolderId is the same (null)
    // Since allItems became empty from the first fetch, the loading spinner should appear now
    rerender(
      <AssetGalleryClient currentFolderId={null} initialSearchTerm="searchterm" viewMode="grid" />
    );

    // Expect loading spinner because allItems was [] and now we are fetching again.
    await waitFor(() => {
      expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
      expect(screen.getByText('Searched Asset 1')).toBeInTheDocument();
    });
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch.mock.calls[1][0]).toMatch(/&q=searchterm&/);
  });

  it('should display loading state when initialSearchTerm causes re-fetch and items are initially empty', async () => {
    // Start with an empty response for the initial currentFolderId=null
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const { rerender } = render(
      <AssetGalleryClient currentFolderId={null} initialSearchTerm="" viewMode="grid" />
    );

    // Initially, it might load and then show empty state
    await waitFor(() => {
      expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
      expect(screen.getByText('This folder is empty.')).toBeInTheDocument();
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);


    const searchResults: Asset[] = [
      { 
        id: 'search-asset-1', name: 'Searched Asset 1', type: 'asset', folder_id: null,
        storage_path: 's1', mime_type: 'image/png', size: 1024, created_at: new Date().toISOString(), 
        user_id: 'user-123', organization_id: 'org-123', publicUrl: 'http://example.com/searched.png',
        ownerName: 'Mock Owner', parentFolderName: null,
      }
    ];
    // Mock fetch for the search term
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => searchResults,
    });

    // Rerender with a new initialSearchTerm, currentFolderId is the same (null)
    // Since allItems became empty from the first fetch, the loading spinner should appear now
    rerender(
      <AssetGalleryClient currentFolderId={null} initialSearchTerm="searchterm" viewMode="grid" />
    );

    // Expect loading spinner because allItems was [] and now we are fetching again.
    await waitFor(() => {
      expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
      expect(screen.getByText('Searched Asset 1')).toBeInTheDocument();
    });
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch.mock.calls[1][0]).toMatch(/&q=searchterm&/);
  });

  // Test for list view
  it('should render AssetListItems when viewMode is list', async () => {
    render(<AssetGalleryClient currentFolderId={null} viewMode="list" />);

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

  // Add more tests for drag and drop, optimistic updates etc. as needed
}); 