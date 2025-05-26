import { useTransition, useCallback } from 'react';
import { type Asset as DomainAsset } from '@/lib/dam/domain/entities/Asset';
import { GetAssetDownloadUrlUseCase } from '../../../application/use-cases/assets/GetAssetDownloadUrlUseCase';
import { RenameAssetUseCase } from '../../../application/use-cases/assets/RenameAssetUseCase';
import { MoveAssetUseCase } from '../../../application/use-cases/assets/MoveAssetUseCase';
import { SupabaseAssetRepository } from '../../../infrastructure/persistence/supabase/SupabaseAssetRepository';
import { SupabaseFolderRepository } from '../../../infrastructure/persistence/supabase/SupabaseFolderRepository';
import { SupabaseStorageService } from '../../../infrastructure/storage/SupabaseStorageService';
import { createClient } from '@/lib/supabase/client';
import { jwtDecode } from 'jwt-decode';
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
 * download, rename, and move operations using DDD use cases. Each action 
 * includes proper loading states, error handling, and user feedback through 
 * toast notifications.
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

  // DDD helper function for authentication
  const getAuthContext = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No session found');
    }

    const decodedToken = jwtDecode<any>(session.access_token);
    const activeOrgId = decodedToken.custom_claims?.active_organization_id;
    
    if (!activeOrgId) {
      throw new Error('No active organization found');
    }

    return { supabase, user, activeOrgId };
  }, []);

  /**
   * Handles asset download by fetching download URL and triggering browser download
   * Uses DDD GetAssetDownloadUrlUseCase for business logic
   */
  const handleDownload = async () => {
    startDownloadTransition(async () => {
      try {
        const { supabase, activeOrgId } = await getAuthContext();
        const assetRepository = new SupabaseAssetRepository(supabase);
        const storageService = new SupabaseStorageService(supabase);
        const downloadUseCase = new GetAssetDownloadUrlUseCase(assetRepository, storageService);

        const result = await downloadUseCase.execute({
          assetId: item.id,
          organizationId: activeOrgId,
          forceDownload: true,
        });

        // Create temporary download link and trigger download
        const link = document.createElement('a');
        link.href = result.downloadUrl;
        link.setAttribute('download', item.name || 'download');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        sonnerToast.success(`Downloading ${item.name}...`);
      } catch (error: any) {
        sonnerToast.error(error.message || 'An unexpected error occurred while trying to download.');
      }
    });
  };

  /**
   * Handles asset rename operation with validation and feedback
   * Uses DDD RenameAssetUseCase for business logic
   * 
   * @param newName - The new name for the asset
   */
  const handleRenameSubmit = async (newName: string) => {
    startRenameTransition(async () => {
      try {
        const { supabase, activeOrgId } = await getAuthContext();
        const assetRepository = new SupabaseAssetRepository(supabase);
        const renameUseCase = new RenameAssetUseCase(assetRepository);

        await renameUseCase.execute({
          assetId: item.id,
          newName,
          organizationId: activeOrgId,
        });

        sonnerToast.success(`Asset "${item.name}" renamed to "${newName}".`);
        await onDataChange(); // Refresh the asset list
        closeRenameDialog?.(); // Close the rename dialog
      } catch (error: any) {
        sonnerToast.error(error.message || 'Failed to rename asset.');
      }
    });
  };

  /**
   * Handles asset move operation to a different folder
   * Uses DDD MoveAssetUseCase for business logic
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
      try {
        const { supabase, activeOrgId } = await getAuthContext();
        const assetRepository = new SupabaseAssetRepository(supabase);
        const folderRepository = new SupabaseFolderRepository(supabase);
        const moveUseCase = new MoveAssetUseCase(assetRepository, folderRepository);

        await moveUseCase.execute({
          assetId: item.id,
          targetFolderId,
          organizationId: activeOrgId,
        });

        sonnerToast.success(`Asset "${item.name}" moved successfully.`);
        await onDataChange(); // Refresh the asset list
      } catch (error: any) {
        sonnerToast.error(error.message || 'Failed to move asset.');
      } finally {
        closeMoveDialog?.(); // Always close dialog after move attempt
      }
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
