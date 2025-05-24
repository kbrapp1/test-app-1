import { useState } from 'react';
import type { Asset } from '../../domain/entities/Asset';

interface DialogState<T> {
  isOpen: boolean;
  data?: T | null;
}

export interface UseAssetItemDialogsReturn {
  renameDialog: DialogState<Asset>;
  openRenameDialog: (asset: Asset) => void;
  closeRenameDialog: () => void;
  detailsDialog: DialogState<Asset>;
  openDetailsDialog: (asset: Asset) => void;
  closeDetailsDialog: () => void;
  moveDialog: DialogState<Asset>;
  openMoveDialog: (asset: Asset) => void;
  closeMoveDialog: () => void;
}

/**
 * Domain presentation hook for managing asset item dialog states
 * 
 * Provides centralized state management for:
 * - Asset rename dialog
 * - Asset details dialog  
 * - Asset move/folder picker dialog
 * 
 * Each dialog has open/close methods and maintains the associated asset data.
 * 
 * @returns Dialog state management functions and current states
 */
export function useAssetItemDialogs(): UseAssetItemDialogsReturn {
  const [renameDialog, setRenameDialog] = useState<DialogState<Asset>>({ isOpen: false, data: null });
  const [detailsDialog, setDetailsDialog] = useState<DialogState<Asset>>({ isOpen: false, data: null });
  const [moveDialog, setMoveDialog] = useState<DialogState<Asset>>({ isOpen: false, data: null });

  const openRenameDialog = (asset: Asset) => setRenameDialog({ isOpen: true, data: asset });
  const closeRenameDialog = () => setRenameDialog({ isOpen: false, data: null });

  const openDetailsDialog = (asset: Asset) => setDetailsDialog({ isOpen: true, data: asset });
  const closeDetailsDialog = () => {
    setDetailsDialog({ isOpen: false, data: null });
  };

  const openMoveDialog = (asset: Asset) => setMoveDialog({ isOpen: true, data: asset });
  const closeMoveDialog = () => setMoveDialog({ isOpen: false, data: null });

  return {
    renameDialog,
    openRenameDialog,
    closeRenameDialog,
    detailsDialog,
    openDetailsDialog,
    closeDetailsDialog,
    moveDialog,
    openMoveDialog,
    closeMoveDialog,
  };
} 