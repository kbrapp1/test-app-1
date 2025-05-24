import { useTransition } from 'react';
import { type Asset as DomainAsset } from '@/lib/dam/domain/entities/Asset';
import { getAssetDownloadUrl } from '@/lib/actions/dam/asset-url.actions';
import { renameAssetClient, moveAsset } from '@/lib/actions/dam/asset-crud.actions';
import { toast as sonnerToast } from 'sonner';

/**
 * Props for the asset item actions hook
 * Defines required callbacks and asset context for action handling
 */
export interface UseAssetItemActionsProps {
  /** Callback to refresh data after successful actions */
  onDataChange: () => Promise<void>;
  /** The asset item these actions apply to */
  item: DomainAsset;
  /** Optional callback to close rename dialog after successful rename */
  closeRenameDialog?: () => void;
  /** Optional callback to close move dialog after successful move */
  closeMoveDialog?: () => void;
}

/**
 * Return interface for asset item actions hook
 * Provides action handlers and loading states for asset operations
 */
export interface UseAssetItemActionsReturn {
  /** Initiates asset download */
  handleDownload: () => Promise<void>;
  /** Whether download is currently in progress */
  isDownloading: boolean;
  /** Submits asset rename with new name */
  handleRenameSubmit: (newName: string) => Promise<void>;
  /** Whether rename operation is in progress */
  isPendingRename: boolean;
  /** Confirms asset move to target folder */
  handleMoveConfirm: (targetFolderId: string | null) => Promise<void>;
  /** Whether move operation is in progress */
  isPendingMove: boolean;
}

/**
 * Domain hook for managing asset item actions
 * 
 * Provides comprehensive action handling for individual assets including
 * download, rename, and move operations. Each action includes proper
 * loading states, error handling, and user feedback through toast notifications.
 * 
 * @param props - Configuration object with callbacks and asset context
 * @returns Complete action handlers and loading states
 * 
 * @example
 * ```tsx
 * function AssetItem({ asset, onRefresh }: { asset: Asset; onRefresh: () => Promise<void> }) {
 *   const {
 *     handleDownload,
 *     isDownloading,
 *     handleRenameSubmit,
 *     isPendingRename,
 *     handleMoveConfirm,
 *     isPendingMove
 *   } = useAssetItemActions({
 *     onDataChange: onRefresh,
 *     item: asset,
 *     closeRenameDialog: () => setRenameDialogOpen(false),
 *     closeMoveDialog: () => setMoveDialogOpen(false)
 *   });
 *   
 *   return (
 *     <div>
 *       <Button 
 *         onClick={handleDownload} 
 *         disabled={isDownloading}
 *       >
 *         {isDownloading ? 'Downloading...' : 'Download'}
 *       </Button>
 *       <Button 
 *         onClick={() => handleRenameSubmit('new-name')} 
 *         disabled={isPendingRename}
 *       >
 *         Rename
 *       </Button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAssetItemActions({
  onDataChange,
  item,
  closeRenameDialog,
  closeMoveDialog,
}: UseAssetItemActionsProps): UseAssetItemActionsReturn {
  // React transitions for managing loading states without blocking UI
  const [isDownloading, startDownloadTransition] = useTransition();
  const [isPendingRename, startRenameTransition] = useTransition();
  const [isPendingMove, startMoveTransition] = useTransition();

  /**
   * Handles asset download by fetching download URL and triggering browser download
   * Provides user feedback through toast notifications
   */
  const handleDownload = async () => {
    startDownloadTransition(async () => {
      try {
        const result = await getAssetDownloadUrl(item.id);
        if (result.success && result.downloadUrl) {
          // Create temporary download link and trigger download
          const link = document.createElement('a');
          link.href = result.downloadUrl;
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

  /**
   * Handles asset rename operation with validation and feedback
   * Automatically refreshes data and closes dialog on success
   * 
   * @param newName - The new name for the asset
   */
  const handleRenameSubmit = async (newName: string) => {
    startRenameTransition(async () => {
      const result = await renameAssetClient(item.id, newName);
      if (result.success) {
        sonnerToast.success(`Asset "${item.name}" renamed to "${newName}".`);
        await onDataChange(); // Refresh the asset list
        closeRenameDialog?.(); // Close the rename dialog
      } else {
        sonnerToast.error(result.error || 'Failed to rename asset.');
      }
    });
  };

  /**
   * Handles asset move operation to a different folder
   * Includes validation to prevent moving to same folder
   * 
   * @param targetFolderId - The ID of the target folder (null for root)
   */
  const handleMoveConfirm = async (targetFolderId: string | null) => {
    // Prevent unnecessary move to same folder
    if (item.folderId === targetFolderId) {
      sonnerToast.info('Asset is already in this folder.');
      closeMoveDialog?.();
      return;
    }

    startMoveTransition(async () => {
      const result = await moveAsset(item.id, targetFolderId);
      if (result.success) {
        sonnerToast.success(`Asset "${item.name}" moved successfully.`);
        await onDataChange(); // Refresh the asset list
      } else {
        sonnerToast.error(result.error || 'Failed to move asset.');
      }
      closeMoveDialog?.(); // Always close dialog after move attempt
    });
  };

  return {
    // Download functionality
    handleDownload,
    isDownloading,
    // Rename functionality
    handleRenameSubmit,
    isPendingRename,
    // Move functionality
    handleMoveConfirm,
    isPendingMove,
  };
} 