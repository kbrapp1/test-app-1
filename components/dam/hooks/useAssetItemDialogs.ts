import { useState } from 'react';
import { Asset } from '@/types/dam';

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

export function useAssetItemDialogs(): UseAssetItemDialogsReturn {
  const [renameDialog, setRenameDialog] = useState<DialogState<Asset>>({ isOpen: false, data: null });
  const [detailsDialog, setDetailsDialog] = useState<DialogState<Asset>>({ isOpen: false, data: null });
  const [moveDialog, setMoveDialog] = useState<DialogState<Asset>>({ isOpen: false, data: null });

  const openRenameDialog = (asset: Asset) => setRenameDialog({ isOpen: true, data: asset });
  const closeRenameDialog = () => setRenameDialog({ isOpen: false, data: null });

  const openDetailsDialog = (asset: Asset) => setDetailsDialog({ isOpen: true, data: asset });
  const closeDetailsDialog = () => setDetailsDialog({ isOpen: false, data: null });

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