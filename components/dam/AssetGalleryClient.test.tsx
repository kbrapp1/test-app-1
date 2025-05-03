import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { AssetGalleryClient } from './AssetGalleryClient';
import type { CombinedItem } from './AssetGrid';

// Mock the AssetGrid component
vi.mock('./AssetGrid', () => ({
  AssetGrid: ({ combinedItems }: { combinedItems: CombinedItem[] }) => (
    <div data-testid="mock-asset-grid">
      <div data-testid="items-count">{combinedItems.length}</div>
      {combinedItems.map((item) => (
        <div key={item.id} data-testid={`item-${item.type}-${item.id}`}>
          {item.name}
        </div>
      ))}
      {combinedItems.length === 0 && <div>No items</div>}
    </div>
  ),
}));

// Create mock response data
const mockAssets: CombinedItem[] = [
  {
    id: 'asset-1',
    name: 'test-image-1.png',
    storage_path: 'user/test-image-1.png',
    mime_type: 'image/png',
    size: 1024,
    created_at: new Date().toISOString(),
    user_id: 'user-123',
    folder_id: null,
    type: 'asset',
    publicUrl: 'https://example.com/test-image-1.png',
  },
  {
    id: 'asset-2',
    name: 'test-image-2.jpg',
    storage_path: 'user/test-image-2.jpg',
    mime_type: 'image/jpeg',
    size: 2048,
    created_at: new Date().toISOString(),
    user_id: 'user-123',
    folder_id: null,
    type: 'asset',
    publicUrl: 'https://example.com/test-image-2.jpg',
  },
];

const mockFolders: CombinedItem[] = [
  {
    id: 'folder-1',
    name: 'Test Folder',
    parent_folder_id: null,
    type: 'folder',
    user_id: 'user-123',
    created_at: new Date().toISOString(),
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
      json: async () => [...mockFolders, ...mockAssets],
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

    render(<AssetGalleryClient currentFolderId={null} />);
    
    // Check for loading indicator
    expect(screen.getByText(/loading assets/i)).toBeInTheDocument();
  });

  it('should fetch and display assets for the root folder', async () => {
    render(<AssetGalleryClient currentFolderId={null} />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText(/loading assets/i)).not.toBeInTheDocument();
    });
    
    // Verify fetch was called with the correct URL (including timestamp for cache busting)
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const fetchUrl = mockFetch.mock.calls[0][0];
    expect(fetchUrl).toMatch(/\/api\/dam\?folderId=&_=\d+/);
    
    // Verify assets are displayed
    expect(screen.getByTestId('items-count').textContent).toBe('3'); // 1 folder + 2 assets
    expect(screen.getByText('test-image-1.png')).toBeInTheDocument();
    expect(screen.getByText('test-image-2.jpg')).toBeInTheDocument();
    expect(screen.getByText('Test Folder')).toBeInTheDocument();
  });

  it('should fetch assets for a specific folder', async () => {
    // Mock response for a specific folder
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: 'asset-3',
          name: 'folder-image.png',
          storage_path: 'user/folder-1/folder-image.png',
          mime_type: 'image/png',
          size: 3072,
          created_at: new Date().toISOString(),
          user_id: 'user-123',
          folder_id: 'folder-1',
          type: 'asset',
          publicUrl: 'https://example.com/folder-image.png',
        }
      ],
    });

    render(<AssetGalleryClient currentFolderId="folder-1" />);
    
    await waitFor(() => {
      expect(screen.queryByText(/loading assets/i)).not.toBeInTheDocument();
    });
    
    // Verify fetch called with the correct folder ID
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const fetchUrl = mockFetch.mock.calls[0][0];
    expect(fetchUrl).toMatch(/\/api\/dam\?folderId=folder-1&_=\d+/);
    
    // Verify the folder-specific asset is displayed
    expect(screen.getByTestId('items-count').textContent).toBe('1');
    expect(screen.getByText('folder-image.png')).toBeInTheDocument();
  });

  it('should handle API errors gracefully', async () => {
    // Mock a failed API response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });
    
    // Spy on console.error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(<AssetGalleryClient currentFolderId={null} />);
    
    await waitFor(() => {
      expect(screen.queryByText(/loading assets/i)).not.toBeInTheDocument();
    });
    
    // Should display empty state
    expect(screen.getByText('This folder is empty.')).toBeInTheDocument();
    
    // Should have logged the error
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error fetching folder items:',
      expect.any(Error)
    );
    
    consoleSpy.mockRestore();
  });

  it('should re-fetch data when folder ID changes', async () => {
    const { rerender } = render(<AssetGalleryClient currentFolderId={null} />);
    
    await waitFor(() => {
      expect(screen.queryByText(/loading assets/i)).not.toBeInTheDocument();
    });
    
    // First fetch for root folder
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toMatch(/\/api\/dam\?folderId=&_=\d+/);
    
    // Mock a different response for the new folder
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: 'asset-special',
          name: 'special-image.png',
          storage_path: 'user/folder-special/special-image.png',
          mime_type: 'image/png',
          size: 4096,
          created_at: new Date().toISOString(),
          user_id: 'user-123',
          folder_id: 'folder-special',
          type: 'asset',
          publicUrl: 'https://example.com/special-image.png',
        }
      ],
    });
    
    // Change the folder ID
    rerender(<AssetGalleryClient currentFolderId="folder-special" />);
    
    // Should display loading again
    expect(screen.getByText(/loading assets/i)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByText(/loading assets/i)).not.toBeInTheDocument();
    });
    
    // Second fetch for the specific folder
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch.mock.calls[1][0]).toMatch(/\/api\/dam\?folderId=folder-special&_=\d+/);
    
    // New asset should be displayed
    expect(screen.getByText('special-image.png')).toBeInTheDocument();
  });

  it('should include a cache-busting timestamp parameter to prevent browser caching', async () => {
    render(<AssetGalleryClient currentFolderId={null} />);
    
    await waitFor(() => {
      expect(screen.queryByText(/loading assets/i)).not.toBeInTheDocument();
    });
    
    // Verify the timestamp is included in the URL
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const fetchUrl = mockFetch.mock.calls[0][0];
    expect(fetchUrl).toMatch(/\/api\/dam\?folderId=&_=\d+/);
    expect(fetchUrl).toContain('_=');
  });

  it('should display "This folder is empty" when no items are returned', async () => {
    // Mock an empty response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });
    
    render(<AssetGalleryClient currentFolderId={null} />);
    
    await waitFor(() => {
      expect(screen.queryByText(/loading assets/i)).not.toBeInTheDocument();
    });
    
    expect(screen.getByText('This folder is empty.')).toBeInTheDocument();
  });
}); 