'use client';

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useAssetItemDialogs } from './useAssetItemDialogs';
import { Asset, Tag } from '@/types/dam';

const mockAsset: Asset = {
  id: 'asset1',
  name: 'Test Asset',
  user_id: 'user1',
  organization_id: 'org1',
  created_at: '2023-01-01T00:00:00Z',
  type: 'asset',
  ownerName: 'Test User',
  storage_path: '/assets/asset1.jpg',
  mime_type: 'image/jpeg',
  size: 1024,
  folder_id: null,
  publicUrl: 'http://example.com/asset1.jpg',
  parentFolderName: null,
  tags: [] as Tag[],
};

describe('useAssetItemDialogs', () => {
  it('should initialize with all dialogs closed', () => {
    const { result } = renderHook(() => useAssetItemDialogs());

    expect(result.current.renameDialog.isOpen).toBe(false);
    expect(result.current.renameDialog.data).toBeNull();

    expect(result.current.detailsDialog.isOpen).toBe(false);
    expect(result.current.detailsDialog.data).toBeNull();

    expect(result.current.moveDialog.isOpen).toBe(false);
    expect(result.current.moveDialog.data).toBeNull();
  });

  // Rename Dialog Tests
  it('should open and close the rename dialog', () => {
    const { result } = renderHook(() => useAssetItemDialogs());

    act(() => {
      result.current.openRenameDialog(mockAsset);
    });
    expect(result.current.renameDialog.isOpen).toBe(true);
    expect(result.current.renameDialog.data).toEqual(mockAsset);

    act(() => {
      result.current.closeRenameDialog();
    });
    expect(result.current.renameDialog.isOpen).toBe(false);
    expect(result.current.renameDialog.data).toBeNull();
  });

  // Details Dialog Tests
  it('should open and close the details dialog', () => {
    const { result } = renderHook(() => useAssetItemDialogs());

    act(() => {
      result.current.openDetailsDialog(mockAsset);
    });
    expect(result.current.detailsDialog.isOpen).toBe(true);
    expect(result.current.detailsDialog.data).toEqual(mockAsset);

    act(() => {
      result.current.closeDetailsDialog();
    });
    expect(result.current.detailsDialog.isOpen).toBe(false);
    expect(result.current.detailsDialog.data).toBeNull();
  });

  // Move Dialog Tests
  it('should open and close the move dialog', () => {
    const { result } = renderHook(() => useAssetItemDialogs());

    act(() => {
      result.current.openMoveDialog(mockAsset);
    });
    expect(result.current.moveDialog.isOpen).toBe(true);
    expect(result.current.moveDialog.data).toEqual(mockAsset);

    act(() => {
      result.current.closeMoveDialog();
    });
    expect(result.current.moveDialog.isOpen).toBe(false);
    expect(result.current.moveDialog.data).toBeNull();
  });
}); 