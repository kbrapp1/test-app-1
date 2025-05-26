'use client';

import { useState } from 'react';
import { GalleryItemDto } from '../../../application/use-cases/folders/ListFolderContentsUseCase';

interface GalleryDialogState {
  // Asset dialogs
  assetDetailsDialog: {
    isOpen: boolean;
    assetId: string | null;
  };
  renameAssetDialog: {
    isOpen: boolean;
    asset: (GalleryItemDto & { type: 'asset' }) | null;
  };
  deleteAssetDialog: {
    isOpen: boolean;
    asset: (GalleryItemDto & { type: 'asset' }) | null;
  };
  // Folder dialogs
  folderActionDialog: {
    type: 'rename' | 'delete' | null;
    folderId: string | null;
    folderName: string | null;
  };
}

export function useGalleryDialogs() {
  const [dialogState, setDialogState] = useState<GalleryDialogState>({
    assetDetailsDialog: { isOpen: false, assetId: null },
    renameAssetDialog: { isOpen: false, asset: null },
    deleteAssetDialog: { isOpen: false, asset: null },
    folderActionDialog: { type: null, folderId: null, folderName: null },
  });

  // Asset dialog actions
  const openAssetDetails = (assetId: string) => {
    setDialogState(prev => ({
      ...prev,
      assetDetailsDialog: { isOpen: true, assetId },
    }));
  };

  const closeAssetDetails = () => {
    setDialogState(prev => ({
      ...prev,
      assetDetailsDialog: { isOpen: false, assetId: null },
    }));
  };

  const openRenameAsset = (asset: GalleryItemDto & { type: 'asset' }) => {
    setDialogState(prev => ({
      ...prev,
      renameAssetDialog: { isOpen: true, asset },
    }));
  };

  const closeRenameAsset = () => {
    setDialogState(prev => ({
      ...prev,
      renameAssetDialog: { isOpen: false, asset: null },
    }));
  };

  const openDeleteAsset = (asset: GalleryItemDto & { type: 'asset' }) => {
    setDialogState(prev => ({
      ...prev,
      deleteAssetDialog: { isOpen: true, asset },
    }));
  };

  const closeDeleteAsset = () => {
    setDialogState(prev => ({
      ...prev,
      deleteAssetDialog: { isOpen: false, asset: null },
    }));
  };

  // Folder dialog actions
  const openFolderAction = (action: 'rename' | 'delete', folderId: string, folderName: string) => {
    setDialogState(prev => ({
      ...prev,
      folderActionDialog: { type: action, folderId, folderName },
    }));
  };

  const closeFolderAction = () => {
    setDialogState(prev => ({
      ...prev,
      folderActionDialog: { type: null, folderId: null, folderName: null },
    }));
  };

  return {
    // State
    ...dialogState,
    
    // Asset actions
    openAssetDetails,
    closeAssetDetails,
    openRenameAsset,
    closeRenameAsset,
    openDeleteAsset,
    closeDeleteAsset,
    
    // Folder actions
    openFolderAction,
    closeFolderAction,
  };
} 
