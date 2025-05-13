/// <reference types="vitest/globals" />

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { AssetGallery } from './AssetGallery'; // Updated import
import { getAssetsAndFoldersForGallery } from '@/lib/actions/dam/gallery.actions'; // Updated path
import { AssetGalleryClientWrapper } from './AssetGalleryClientWrapper'; // Updated import
import { Asset, Folder, CombinedItem } from '@/types/dam';

// Mock the server action
vi.mock('@/lib/actions/dam/gallery.actions', () => ({
  getAssetsAndFoldersForGallery: vi.fn(),
}));

// Mock the client wrapper component
// Note: Adjust mock path if AssetGalleryClientWrapper is not in the same dir
vi.mock('./AssetGalleryClientWrapper', () => ({ // Updated mock path
  AssetGalleryClientWrapper: vi.fn(({ initialCombinedItems, initialAssets, initialFolders, currentFolderId }) => (
    <div data-testid="asset-gallery-client-wrapper">
      <span data-testid="current-folder-id">{currentFolderId}</span>
      <span data-testid="combined-items-count">{initialCombinedItems.length}</span>
      <span data-testid="assets-count">{initialAssets.length}</span>
      <span data-testid="folders-count">{initialFolders.length}</span>
    </div>
  )),
}));

const mockAssets: Asset[] = [
  {
    id: 'asset1',
    name: 'Image1.jpg',
    type: 'asset',
    storage_path: 'path1/Image1.jpg',
    publicUrl: 'url1',
    mime_type: 'image/jpeg',
    size: 1024,
    folder_id: 'folder1',
    user_id: 'user1',
    organization_id: 'org1',
    created_at: new Date().toISOString(),
  },
  {
    id: 'asset2',
    name: 'Video1.mp4',
    type: 'asset',
    storage_path: 'path2/Video1.mp4',
    publicUrl: 'url2',
    mime_type: 'video/mp4',
    size: 2048,
    folder_id: 'folder1',
    user_id: 'user1',
    organization_id: 'org1',
    created_at: new Date().toISOString(),
  },
];

const mockFolders: Folder[] = [
  {
    id: 'folder1',
    name: 'Folder 1',
    type: 'folder',
    parent_folder_id: null,
    user_id: 'user1',
    organization_id: 'org1',
    created_at: new Date().toISOString(),
  },
];

const mockCombinedItems: CombinedItem[] = [...mockAssets, ...mockFolders];

describe('AssetGallery Server Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render AssetGalleryClientWrapper with fetched data on success', async () => {
    (getAssetsAndFoldersForGallery as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: {
        combinedItems: mockCombinedItems,
      },
    });

    const currentFolderId = 'test-folder-id';
    const { getByTestId } = render(await AssetGallery({ currentFolderId }));

    expect(getAssetsAndFoldersForGallery).toHaveBeenCalledWith(currentFolderId);
    expect(AssetGalleryClientWrapper).toHaveBeenCalledTimes(1);

    expect(getByTestId('asset-gallery-client-wrapper')).toBeInTheDocument();
    expect(getByTestId('current-folder-id').textContent).toBe(currentFolderId);
    expect(getByTestId('combined-items-count').textContent).toBe(String(mockCombinedItems.length));
    expect(getByTestId('assets-count').textContent).toBe(String(mockAssets.length)); 
    expect(getByTestId('folders-count').textContent).toBe(String(mockFolders.length));
  });

  it('should display an error message when data fetching fails', async () => {
    const errorMessage = 'Failed to fetch data';
    (getAssetsAndFoldersForGallery as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: false,
      error: errorMessage,
    });

    const currentFolderId = 'test-folder-id-error';
    const { getByText, queryByTestId } = render(await AssetGallery({ currentFolderId }));

    expect(getAssetsAndFoldersForGallery).toHaveBeenCalledWith(currentFolderId);
    expect(getByText(errorMessage)).toBeInTheDocument();
    expect(queryByTestId('asset-gallery-client-wrapper')).not.toBeInTheDocument();
    expect(AssetGalleryClientWrapper).not.toHaveBeenCalled();
  });

  it('should display a default error message if no specific error is provided on failure', async () => {
    (getAssetsAndFoldersForGallery as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: false,
      data: null, 
    });

    const currentFolderId = 'test-folder-id-default-error';
    const { getByText, queryByTestId } = render(await AssetGallery({ currentFolderId }));

    expect(getAssetsAndFoldersForGallery).toHaveBeenCalledWith(currentFolderId);
    expect(getByText('Failed to load gallery data.')).toBeInTheDocument();
    expect(queryByTestId('asset-gallery-client-wrapper')).not.toBeInTheDocument();
    expect(AssetGalleryClientWrapper).not.toHaveBeenCalled();
  });
}); 