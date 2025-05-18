/// <reference types="vitest/globals" />
'use client';

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAssetItemActions } from './useAssetItemActions';
import { Asset, Tag } from '@/types/dam'; // Assuming Tag might be needed for Asset.tags
import * as assetUrlActions from '@/lib/actions/dam/asset-url.actions';
import * as assetCrudActions from '@/lib/actions/dam/asset-crud.actions';
import { toast as sonnerToast } from 'sonner';

// Mocks
vi.mock('@/lib/actions/dam/asset-url.actions');
vi.mock('@/lib/actions/dam/asset-crud.actions');
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

const mockGetAssetDownloadUrl = vi.mocked(assetUrlActions.getAssetDownloadUrl);
const mockRenameAssetClient = vi.mocked(assetCrudActions.renameAssetClient);
const mockMoveAsset = vi.mocked(assetCrudActions.moveAsset);

const mockAsset: Asset = {
  id: 'asset123',
  name: 'OriginalName.jpg',
  folder_id: 'folderA',
  user_id: 'user1',
  organization_id: 'org1',
  created_at: '2023-01-01T00:00:00Z',
  type: 'asset',
  ownerName: 'Test User',
  storage_path: '/assets/OriginalName.jpg',
  mime_type: 'image/jpeg',
  size: 1024,
  publicUrl: 'http://example.com/OriginalName.jpg',
  parentFolderName: 'Folder A',
  tags: [] as Tag[],
};

const defaultProps = {
  onDataChange: vi.fn().mockResolvedValue(undefined),
  item: mockAsset,
  closeRenameDialog: vi.fn(),
  closeMoveDialog: vi.fn(),
};

describe('useAssetItemActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    defaultProps.onDataChange.mockClear();
    defaultProps.closeRenameDialog.mockClear();
    defaultProps.closeMoveDialog.mockClear();
  });

  it('initial pending states should be false', () => {
    const { result } = renderHook(() => useAssetItemActions(defaultProps));
    expect(result.current.isDownloading).toBe(false);
    expect(result.current.isPendingRename).toBe(false);
    expect(result.current.isPendingMove).toBe(false);
  });

  // --- Download Tests ---
  describe('handleDownload', () => {
    let linkMock: HTMLAnchorElement;
    let appendChildSpy: any;
    let removeChildSpy: any;
    let clickSpy: any;
    let documentCreateElementSpy: any;

    beforeEach(() => {
      linkMock = document.createElement('a') as HTMLAnchorElement;
      clickSpy = vi.spyOn(linkMock, 'click');
      appendChildSpy = vi.spyOn(document.body, 'appendChild');
      removeChildSpy = vi.spyOn(document.body, 'removeChild');
      documentCreateElementSpy = vi.spyOn(document, 'createElement');
      documentCreateElementSpy.mockReturnValue(linkMock);
      
      appendChildSpy.mockImplementation(() => linkMock as any);
      removeChildSpy.mockImplementation(() => linkMock as any);
    });

    afterEach(() => {
      clickSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
      documentCreateElementSpy.mockRestore();
    });

    it('should successfully download asset', async () => {
      mockGetAssetDownloadUrl.mockResolvedValueOnce({ success: true, url: 'http://download.url/file.jpg' });
      const { result } = renderHook(() => useAssetItemActions(defaultProps));

      await act(async () => {
        result.current.handleDownload();
      });
      await waitFor(() => expect(result.current.isDownloading).toBe(false));

      expect(mockGetAssetDownloadUrl).toHaveBeenCalledWith('asset123');
      expect(linkMock.href).toBe('http://download.url/file.jpg');
      expect(linkMock.getAttribute('download')).toBe('OriginalName.jpg');
      expect(appendChildSpy).toHaveBeenCalledWith(linkMock);
      expect(clickSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalledWith(linkMock);
      expect(sonnerToast.success).toHaveBeenCalledWith('Downloading OriginalName.jpg...');
    });

    it('should show error if getAssetDownloadUrl fails', async () => {
      mockGetAssetDownloadUrl.mockResolvedValueOnce({ success: false, error: 'Download failed' });
      const { result } = renderHook(() => useAssetItemActions(defaultProps));

      await act(async () => {
        result.current.handleDownload();
      });
      await waitFor(() => expect(result.current.isDownloading).toBe(false));
      expect(sonnerToast.error).toHaveBeenCalledWith('Download failed');
    });

    it('should show error if getAssetDownloadUrl throws', async () => {
      mockGetAssetDownloadUrl.mockRejectedValueOnce(new Error('Network error'));
      const { result } = renderHook(() => useAssetItemActions(defaultProps));

      await act(async () => {
        result.current.handleDownload();
      });
      await waitFor(() => expect(result.current.isDownloading).toBe(false));
      expect(sonnerToast.error).toHaveBeenCalledWith('An unexpected error occurred while trying to download.');
    });
  });

  // --- Rename Tests ---
  describe('handleRenameSubmit', () => {
    it('should successfully rename asset', async () => {
      mockRenameAssetClient.mockResolvedValueOnce({ success: true, data: undefined });
      const { result } = renderHook(() => useAssetItemActions(defaultProps));
      const newName = 'NewName.jpg';

      await act(async () => {
        result.current.handleRenameSubmit(newName);
      });
      await waitFor(() => expect(result.current.isPendingRename).toBe(false));

      expect(mockRenameAssetClient).toHaveBeenCalledWith('asset123', newName);
      expect(sonnerToast.success).toHaveBeenCalledWith('Asset "OriginalName.jpg" renamed to "NewName.jpg".');
      expect(defaultProps.onDataChange).toHaveBeenCalled();
      expect(defaultProps.closeRenameDialog).toHaveBeenCalled();
    });

    it('should show error if renameAssetClient fails', async () => {
      mockRenameAssetClient.mockResolvedValueOnce({ success: false, error: 'Rename failed' });
      const { result } = renderHook(() => useAssetItemActions(defaultProps));

      await act(async () => {
        result.current.handleRenameSubmit('NewName.jpg');
      });
      await waitFor(() => expect(result.current.isPendingRename).toBe(false));
      expect(sonnerToast.error).toHaveBeenCalledWith('Rename failed');
      expect(defaultProps.onDataChange).not.toHaveBeenCalled();
      expect(defaultProps.closeRenameDialog).not.toHaveBeenCalled();
    });
  });

  // --- Move Tests ---
  describe('handleMoveConfirm', () => {
    it('should successfully move asset', async () => {
      mockMoveAsset.mockResolvedValueOnce({ success: true, data: undefined });
      const { result } = renderHook(() => useAssetItemActions(defaultProps));
      const targetFolderId = 'folderB';

      await act(async () => {
        result.current.handleMoveConfirm(targetFolderId);
      });
      await waitFor(() => expect(result.current.isPendingMove).toBe(false));

      expect(mockMoveAsset).toHaveBeenCalledWith('asset123', targetFolderId);
      expect(sonnerToast.success).toHaveBeenCalledWith('Asset "OriginalName.jpg" moved successfully.');
      expect(defaultProps.onDataChange).toHaveBeenCalled();
      expect(defaultProps.closeMoveDialog).toHaveBeenCalled();
    });

    it('should show error if moveAsset fails', async () => {
      mockMoveAsset.mockResolvedValueOnce({ success: false, error: 'Move failed' });
      const { result } = renderHook(() => useAssetItemActions(defaultProps));

      await act(async () => {
        result.current.handleMoveConfirm('folderB');
      });
      await waitFor(() => expect(result.current.isPendingMove).toBe(false));
      expect(sonnerToast.error).toHaveBeenCalledWith('Move failed');
      expect(defaultProps.onDataChange).not.toHaveBeenCalled();
      expect(defaultProps.closeMoveDialog).toHaveBeenCalled();
    });

    it('should show info and not call moveAsset if target folder is the same', async () => {
      const { result } = renderHook(() => useAssetItemActions(defaultProps));
      const targetFolderId = 'folderA'; // Same as mockAsset.folder_id

      await act(async () => {
        result.current.handleMoveConfirm(targetFolderId);
      });
      // No transition, so isPendingMove should remain false
      expect(result.current.isPendingMove).toBe(false);
      expect(mockMoveAsset).not.toHaveBeenCalled();
      expect(sonnerToast.info).toHaveBeenCalledWith('Asset is already in this folder.');
      expect(defaultProps.onDataChange).not.toHaveBeenCalled();
      expect(defaultProps.closeMoveDialog).toHaveBeenCalled();
    });
  });
}); 