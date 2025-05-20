/// <reference types="vitest/globals" />
import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AssetGalleryClientWrapper } from './AssetGalleryClientWrapper';
import * as galleryActions from '@/lib/actions/dam/gallery.actions';
import { useToast } from '@/components/ui/use-toast';
import type { CombinedItem, Asset, Folder } from '@/types/dam';

// Mock child components
vi.mock('./AssetGrid', () => ({
  AssetGrid: vi.fn(({ assets, onDataChange, optimisticallyHiddenItemId }) => (
    <div data-testid="mock-asset-grid">
      <span>{assets.length} items</span>
      {optimisticallyHiddenItemId && <span data-testid="optimistic-hide">{optimisticallyHiddenItemId}</span>}
      <button onClick={onDataChange} data-testid="trigger-data-change">Refresh</button>
    </div>
  )),
}));

// Mock server actions
vi.mock('@/lib/actions/dam/gallery.actions', () => ({
  getAssetsAndFoldersForGallery: vi.fn(),
}));

// Mock ui components
const mockToastFn = vi.fn();
vi.mock('@/components/ui/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: mockToastFn,
    dismiss: vi.fn(),
    toasts: [],
  })),
}));

const mockGetAssetsAndFoldersForGallery = vi.mocked(galleryActions.getAssetsAndFoldersForGallery);
const mockUseToast = vi.mocked(useToast);

const mockAsset1: Asset = {
  id: 'asset1', name: 'Asset 1', type: 'asset', folder_id: 'f1', user_id: 'u1', organization_id: 'o1', created_at: 't1', storage_path: '', mime_type: '', size: 100, publicUrl: '', tags: [], ownerName: '', parentFolderName: ''
};
const mockFolder1: Folder = {
  id: 'folder1', name: 'Folder 1', type: 'folder', user_id: 'u1', organization_id: 'o1', created_at: 't1', parent_folder_id: null, ownerName: ''
};
const mockCombinedItems: CombinedItem[] = [mockAsset1, mockFolder1];

describe('AssetGalleryClientWrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseToast.mockReturnValue({ toast: mockToastFn, dismiss: vi.fn(), toasts: [] });
  });

  it('renders AssetGrid with initialCombinedItems', () => {
    render(
      <AssetGalleryClientWrapper
        initialCombinedItems={mockCombinedItems}
        currentFolderId="folder123"
      />
    );
    expect(screen.getByTestId('mock-asset-grid')).toBeInTheDocument();
    const expectedAssetCount = mockCombinedItems.filter(item => item.type === 'asset').length;
    expect(screen.getByText(`${expectedAssetCount} items`)).toBeInTheDocument();
  });

  it('renders empty state message if initialCombinedItems is empty', () => {
    render(
      <AssetGalleryClientWrapper
        initialCombinedItems={[]}
        currentFolderId="folder123"
      />
    );
    expect(screen.getByText('This folder is empty.')).toBeInTheDocument();
  });

  it('calls getAssetsAndFoldersForGallery and updates items on handleDataChange', async () => {
    const newMockAsset: Asset = { ...mockAsset1, id: 'asset2', name: 'New Asset' };
    const newCombinedItems: CombinedItem[] = [newMockAsset];
    mockGetAssetsAndFoldersForGallery.mockResolvedValue({ success: true, data: { combinedItems: newCombinedItems } });

    render(
      <AssetGalleryClientWrapper
        initialCombinedItems={mockCombinedItems}
        currentFolderId="folder123"
      />
    );

    const initialAssetCount = mockCombinedItems.filter(item => item.type === 'asset').length;
    expect(screen.getByText(`${initialAssetCount} items`)).toBeInTheDocument();

    const refreshButton = screen.getByTestId('trigger-data-change');
    await act(async () => {
        fireEvent.click(refreshButton);
    });
    
    await waitFor(() => {
      expect(mockGetAssetsAndFoldersForGallery).toHaveBeenCalledWith('folder123');
      const updatedAssetCount = newCombinedItems.filter(item => item.type === 'asset').length;
      expect(screen.getByText(`${updatedAssetCount} items`)).toBeInTheDocument();
    });
  });

  it('shows error toast if getAssetsAndFoldersForGallery fails on handleDataChange', async () => {
    mockGetAssetsAndFoldersForGallery.mockResolvedValue({ success: false, error: 'Failed to fetch' });
    render(
      <AssetGalleryClientWrapper
        initialCombinedItems={mockCombinedItems}
        currentFolderId="folder123"
      />
    );
    const refreshButton = screen.getByTestId('trigger-data-change');
    await act(async () => {
        fireEvent.click(refreshButton);
    });

    await waitFor(() => {
      expect(mockToastFn).toHaveBeenCalledWith({
        title: 'Error refreshing gallery',
        description: 'Failed to fetch',
        variant: 'destructive',
      });
    });
  });

  it('shows error toast if getAssetsAndFoldersForGallery throws an error on handleDataChange', async () => {
    mockGetAssetsAndFoldersForGallery.mockRejectedValue(new Error('Network error'));
    render(
      <AssetGalleryClientWrapper
        initialCombinedItems={mockCombinedItems}
        currentFolderId="folder123"
      />
    );
    const refreshButton = screen.getByTestId('trigger-data-change');
     await act(async () => {
        fireEvent.click(refreshButton);
    });

    await waitFor(() => {
      expect(mockToastFn).toHaveBeenCalledWith({
        title: 'Error',
        description: 'An unexpected error occurred while refreshing the gallery.',
        variant: 'destructive',
      });
    });
  });

  it('updates items when initialCombinedItems prop changes', () => {
    const { rerender } = render(
      <AssetGalleryClientWrapper
        initialCombinedItems={mockCombinedItems}
        currentFolderId="folder123"
      />
    );
    const initialAssetCount = mockCombinedItems.filter(item => item.type === 'asset').length;
    expect(screen.getByText(`${initialAssetCount} items`)).toBeInTheDocument();

    const newInitialItems: CombinedItem[] = [mockAsset1, mockAsset1];
    rerender(
      <AssetGalleryClientWrapper
        initialCombinedItems={newInitialItems}
        currentFolderId="folder123"
      />
    );
    const updatedAssetCount = newInitialItems.filter(item => item.type === 'asset').length;
    expect(screen.getByText(`${updatedAssetCount} items`)).toBeInTheDocument();
  });
}); 