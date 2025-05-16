import { useTransition } from 'react';
import { Asset } from '@/types/dam';
import { getAssetDownloadUrl } from '@/lib/actions/dam/asset-url.actions';
import { renameAssetClient, moveAsset } from '@/lib/actions/dam/asset-crud.actions';
import { toast as sonnerToast } from 'sonner';

export interface UseAssetItemActionsProps {
  onDataChange: () => Promise<void>;
  item: Asset; // The specific asset this instance of the hook will operate on
  closeRenameDialog?: () => void; // Optional callbacks to close dialogs upon completion
  closeMoveDialog?: () => void;
}

export interface UseAssetItemActionsReturn {
  handleDownload: () => Promise<void>;
  isDownloading: boolean;
  handleRenameSubmit: (newName: string) => Promise<void>;
  isPendingRename: boolean;
  handleMoveConfirm: (targetFolderId: string | null) => Promise<void>;
  isPendingMove: boolean;
}

export function useAssetItemActions({
  onDataChange,
  item,
  closeRenameDialog,
  closeMoveDialog,
}: UseAssetItemActionsProps): UseAssetItemActionsReturn {
  const [isDownloading, startDownloadTransition] = useTransition();
  const [isPendingRename, startRenameTransition] = useTransition();
  const [isPendingMove, startMoveTransition] = useTransition();

  const handleDownload = async () => {
    startDownloadTransition(async () => {
      try {
        const result = await getAssetDownloadUrl(item.id);
        if (result.success && result.url) {
          const link = document.createElement('a');
          link.href = result.url;
          link.setAttribute('download', item.name || 'download');
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          sonnerToast.success(`Downloading ${item.name}...`);
        } else {
          sonnerToast.error(result.error || 'Could not prepare download.');
        }
      } catch (error) {
        sonnerToast.error('An unexpected error occurred while trying to download.');
      }
    });
  };

  const handleRenameSubmit = async (newName: string) => {
    startRenameTransition(async () => {
      const result = await renameAssetClient(item.id, newName);
      if (result.success) {
        sonnerToast.success(`Asset "${item.name}" renamed to "${newName}".`);
        await onDataChange();
        closeRenameDialog?.();
      } else {
        sonnerToast.error(result.error || 'Failed to rename asset.');
      }
    });
  };

  const handleMoveConfirm = async (targetFolderId: string | null) => {
    if (item.folder_id === targetFolderId) {
      sonnerToast.info('Asset is already in this folder.');
      closeMoveDialog?.();
      return;
    }
    startMoveTransition(async () => {
      const result = await moveAsset(item.id, targetFolderId);
      if (result.success) {
        sonnerToast.success(`Asset "${item.name}" moved successfully.`);
        await onDataChange();
      } else {
        sonnerToast.error(result.error || 'Failed to move asset.');
      }
      closeMoveDialog?.();
    });
  };

  return {
    handleDownload,
    isDownloading,
    handleRenameSubmit,
    isPendingRename,
    handleMoveConfirm,
    isPendingMove,
  };
} 