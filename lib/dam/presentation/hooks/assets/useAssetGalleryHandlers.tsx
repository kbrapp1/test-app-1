import { useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { toast as sonnerToast } from 'sonner';
import { MoveAssetUseCase } from '../../../application/use-cases/assets/MoveAssetUseCase';
import { RenameAssetUseCase } from '../../../application/use-cases/assets/RenameAssetUseCase';
import { SupabaseAssetRepository } from '../../../infrastructure/persistence/supabase/SupabaseAssetRepository';
import { SupabaseFolderRepository } from '../../../infrastructure/persistence/supabase/SupabaseFolderRepository';
import { createClient } from '@/lib/supabase/client';
import { Asset as DomainAsset } from '../../../domain/entities/Asset';
import { GalleryItemDto } from '../../../application/use-cases/folders/ListFolderContentsUseCase';
import { useFolderNavigation } from '../navigation/useFolderNavigation';
import { useGalleryDialogs } from '../navigation/useGalleryDialogs';
import { useAssetItemDialogs } from './useAssetItemDialogs';
import { useOrganization } from '@/lib/organization/application/providers/OrganizationProvider';
import { useAssetDelete, useAssetUpdate } from '@/lib/dam/hooks/useAssets';

interface UseAssetGalleryHandlersProps {
  activeFolderId: string | null;
  enableNavigation: boolean;
  items: GalleryItemDto[];
  folderNavigation: ReturnType<typeof useFolderNavigation>;
  dialogManager: ReturnType<typeof useGalleryDialogs>;
  moveDialog: ReturnType<typeof useAssetItemDialogs>['moveDialog'];
  closeMoveDialog: ReturnType<typeof useAssetItemDialogs>['closeMoveDialog'];
  openMoveDialog: ReturnType<typeof useAssetItemDialogs>['openMoveDialog'];
  setSelectedAssetId: (id: string | null) => void;
  addOptimisticallyHiddenItem: (id: string) => void;
  refreshGalleryData: (force?: boolean) => Promise<void>;
  onFolderNavigate?: (folderId: string | null) => void;
}

export const useAssetGalleryHandlers = ({
  activeFolderId,
  enableNavigation,
  items: _items,
  folderNavigation,
  dialogManager,
  moveDialog,
  closeMoveDialog,
  openMoveDialog,
  setSelectedAssetId,
  addOptimisticallyHiddenItem,
  refreshGalleryData,
  onFolderNavigate,
}: UseAssetGalleryHandlersProps) => {
  const { toast } = useToast();
  
  // Use organization context to avoid duplicate RPC calls
  const { activeOrganizationId } = useOrganization();
  
  // React Query mutations
  const deleteAssetMutation = useAssetDelete();
  const _updateAssetMutation = useAssetUpdate();

  // Simplified auth function - no more RPC calls
  const getAuthContext = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!activeOrganizationId) {
      throw new Error('No active organization found');
    }

    return { supabase, user, activeOrgId: activeOrganizationId };
  }, [activeOrganizationId]);

  const moveAssetUseCase = useCallback(async (assetId: string, targetFolderId: string | null) => {
    const { supabase, activeOrgId } = await getAuthContext();
    const assetRepository = new SupabaseAssetRepository(supabase);
    const folderRepository = new SupabaseFolderRepository(supabase);
    const moveUseCase = new MoveAssetUseCase(assetRepository, folderRepository);
    
    await moveUseCase.execute({
      assetId,
      targetFolderId,
      organizationId: activeOrgId,
    });
    
    return { success: true };
  }, [getAuthContext]);

  // Removed deleteAssetUseCase - now using React Query mutation

  const renameAssetUseCase = useCallback(async (assetId: string, newName: string) => {
    const { supabase, activeOrgId } = await getAuthContext();
    const assetRepository = new SupabaseAssetRepository(supabase);
    const renameUseCase = new RenameAssetUseCase(assetRepository);
    
    await renameUseCase.execute({
      assetId,
      newName,
      organizationId: activeOrgId,
    });
    
    return { success: true };
  }, [getAuthContext]);

  // Item click handler
  const handleItemClick = useCallback((item: GalleryItemDto) => {
    if (item.type === 'folder') {
      if (enableNavigation) {
        // Use custom navigation handler if provided, otherwise use internal navigation
        if (onFolderNavigate) {
          onFolderNavigate(item.id);
        } else {
          folderNavigation.navigateToFolder(item.id);
        }
      } else {
        toast({
          title: 'Folder Navigation',
          description: `Would navigate to folder: ${item.name}`,
        });
      }
    } else {
      setSelectedAssetId(item.id);
    }
  }, [enableNavigation, folderNavigation, toast, setSelectedAssetId, onFolderNavigate]);

  // Asset lifecycle handlers
  const handleAssetUpdated = useCallback(() => {
    refreshGalleryData(true); // Force refresh to update folder names
  }, [refreshGalleryData]);
  
  const handleAssetDeleted = useCallback((_assetId: string) => {
    refreshGalleryData(true);
  }, [refreshGalleryData]);

  // Create minimal asset for operations
  const createMinimalAssetForMove = useCallback((galleryAsset: GalleryItemDto & { type: 'asset' }): DomainAsset => {
    return new DomainAsset({
      id: galleryAsset.id,
      name: galleryAsset.name,
      userId: 'placeholder',
      storagePath: 'placeholder',
      mimeType: galleryAsset.mimeType || 'application/octet-stream',
      size: 1,
      createdAt: galleryAsset.createdAt,
      updatedAt: galleryAsset.createdAt,
      folderId: activeFolderId,
      organizationId: 'placeholder',
      publicUrl: galleryAsset.publicUrl,
    });
  }, [activeFolderId]);

  // Asset operation handlers
  const handleMoveAssetConfirm = useCallback(async (selectedFolderId: string | null) => {
    if (!moveDialog.data?.id) {
      sonnerToast.error('Error moving asset', { description: 'Asset data is missing.' });
      closeMoveDialog();
      return;
    }

    try {
      await moveAssetUseCase(moveDialog.data.id, selectedFolderId);
      sonnerToast.success('Asset moved', {
        description: `"${moveDialog.data.name}" has been moved successfully.`,
      });
      refreshGalleryData(true); // Force refresh to update folder names
    } catch (error) {
      sonnerToast.error('Failed to move asset', { description: (error as Error).message });
    } finally {
      closeMoveDialog();
    }
  }, [moveDialog.data, closeMoveDialog, refreshGalleryData, moveAssetUseCase]);

  const handleRenameAssetSubmit = useCallback(async (newName: string) => {
    if (!dialogManager.renameAssetDialog.asset) return;
    
    try {
      await renameAssetUseCase(dialogManager.renameAssetDialog.asset.id, newName);
      sonnerToast.success(`Asset renamed to "${newName}"`);
      dialogManager.closeRenameAsset();
      refreshGalleryData(true); // Force refresh to update folder names
    } catch (error) {
      sonnerToast.error((error as Error).message || 'Failed to rename asset');
    }
  }, [dialogManager.renameAssetDialog.asset, refreshGalleryData, dialogManager.closeRenameAsset, renameAssetUseCase, dialogManager]);

  const handleDeleteAssetConfirm = useCallback(async () => {
    if (!dialogManager.deleteAssetDialog.asset) return;

    const assetToDelete = dialogManager.deleteAssetDialog.asset;

    try {
      addOptimisticallyHiddenItem(assetToDelete.id);
      
      // Use React Query mutation for proper cache invalidation
      await deleteAssetMutation.mutateAsync(assetToDelete.id);
      
      sonnerToast.success(`Asset "${assetToDelete.name}" deleted successfully`);
      dialogManager.closeDeleteAsset();
    } catch (error) {
      sonnerToast.error((error as Error).message || 'Failed to delete asset');
      // Note: React Query will handle error states and cache management
    }
  }, [dialogManager.deleteAssetDialog.asset, dialogManager.closeDeleteAsset, addOptimisticallyHiddenItem, deleteAssetMutation, dialogManager]);

  // Asset action creators
  const createAssetActions = useCallback((asset: GalleryItemDto & { type: 'asset' }) => ({
    onViewDetails: () => dialogManager.openAssetDetails(asset.id),
    onRename: () => dialogManager.openRenameAsset(asset),
    onMove: () => openMoveDialog(createMinimalAssetForMove(asset)),
    onDelete: () => dialogManager.openDeleteAsset(asset),
  }), [dialogManager, openMoveDialog, createMinimalAssetForMove]);

  return {
    handleItemClick,
    handleAssetUpdated,
    handleAssetDeleted,
    handleMoveAssetConfirm,
    handleRenameAssetSubmit,
    handleDeleteAssetConfirm,
    createAssetActions,
  };
}; 
