import { useState, useEffect, useCallback } from 'react';
import type { PlainTag } from '../../../application/dto/DamApiRequestDto';
import { AssetDetailsDto } from '../../../application/use-cases/assets/GetAssetDetailsUseCase';
import { AssetTagService } from '../../../application/services/AssetTagService';
import { AssetOperationsService } from '../../../application/services/AssetOperationsService';
import { useAssetDetails, useAssetDelete, useAssetUpdate } from '../../../hooks/useAssets';

interface AssetModalState {
  editMode: boolean;
  editName: string;
  deleteConfirmOpen: boolean;
  updating: boolean;
  isUpdatingTag: boolean;
  copiedUrl: boolean;
}

interface UseAssetDetailsModalParams {
  open: boolean;
  assetId: string | null;
  onAssetUpdated?: () => void;
  onAssetDeleted?: (assetId: string) => void;
  onOpenChange: (open: boolean) => void;
}

/**
 * Domain-driven hook for asset details modal management
 * 
 * Migrated to React Query for proper cache management and state coordination
 * 
 * Follows DDD principles:
 * - Clear domain modeling with state objects
 * - Separation of data fetching, business logic, and UI state
 * - Use case orchestration for domain operations
 * - Clean error handling and user feedback
 */
export const useAssetDetailsModal = ({
  open,
  assetId,
  onAssetUpdated,
  onAssetDeleted,
  onOpenChange,
}: UseAssetDetailsModalParams) => {

  // Use React Query hooks for asset details and deletion
  const { 
    data: asset, 
    isLoading: loading, 
    error: queryError 
  } = useAssetDetails(assetId || '', open && !!assetId);
  
  const deleteAssetMutation = useAssetDelete();
  const updateAssetMutation = useAssetUpdate();

  const [state, setState] = useState<AssetModalState>({
    editMode: false,
    editName: '',
    deleteConfirmOpen: false,
    updating: false,
    isUpdatingTag: false,
    copiedUrl: false,
  });

  // Update edit name when asset data changes
  useEffect(() => {
    if (asset?.name) {
      setState(prev => ({ ...prev, editName: asset.name }));
    }
  }, [asset?.name]);

  const error = queryError ? 
    (queryError instanceof Error ? queryError.message : 'Unknown error occurred') : 
    null;

  const handleTagAdded = useCallback((newTag: PlainTag) => {
    AssetTagService.showTagAddedSuccess(newTag.name);
    onAssetUpdated?.();
  }, [onAssetUpdated]);

  const handleTagRemoved = useCallback(async (tagToRemove: PlainTag) => {
    if (!asset?.id) return;
    setState(prev => ({ ...prev, isUpdatingTag: true }));

    try {
      await AssetTagService.removeTagFromAsset(asset.id, tagToRemove);
      setState(prev => ({ ...prev, isUpdatingTag: false }));
      AssetTagService.showTagRemovedSuccess(tagToRemove.name);
      onAssetUpdated?.();
    } catch (error) {
      setState(prev => ({ ...prev, isUpdatingTag: false }));
      AssetTagService.showTagRemoveError(error as Error);
    }
  }, [asset?.id, onAssetUpdated]);

  const handleSaveEdit = useCallback(async () => {
    if (!asset || !state.editName.trim()) return;
    setState(prev => ({ ...prev, updating: true }));
    
    try {
      await updateAssetMutation.mutateAsync({
        assetId: asset.id,
        updates: { name: state.editName.trim() }
      });
      setState(prev => ({ ...prev, editMode: false, updating: false }));
      onAssetUpdated?.();
      AssetOperationsService.showRenameSuccess(state.editName.trim());
    } catch (err) {
      setState(prev => ({ ...prev, updating: false }));
      AssetOperationsService.showError('rename asset');
    }
  }, [asset, state.editName, updateAssetMutation, onAssetUpdated]);

  const handleDelete = useCallback(async () => {
    if (!asset) return;

    try {
      await deleteAssetMutation.mutateAsync(asset.id);
      onAssetDeleted?.(asset.id);
      onOpenChange(false);
      AssetOperationsService.showDeleteSuccess();
    } catch (err) {
      AssetOperationsService.showError('delete asset');
    }
  }, [asset, deleteAssetMutation, onAssetDeleted, onOpenChange]);

  const handleDownload = useCallback(async () => {
    if (!asset?.downloadUrl) return;

    try {
      AssetOperationsService.downloadAsset(asset.downloadUrl, asset.name);
      AssetOperationsService.showDownloadSuccess(asset.name);
    } catch (err) {
      AssetOperationsService.showError('download');
    }
  }, [asset]);

  const handleCopyUrl = useCallback(async () => {
    if (!asset?.publicUrl) return;

    try {
      await AssetOperationsService.copyAssetUrl(asset.publicUrl);
      setState(prev => ({ ...prev, copiedUrl: true }));
      setTimeout(() => setState(prev => ({ ...prev, copiedUrl: false })), 2000);
      AssetOperationsService.showCopyUrlSuccess();
    } catch (err) {
      AssetOperationsService.showError('copy URL');
    }
  }, [asset]);

  // Reset edit mode when modal closes
  useEffect(() => {
    if (!open) {
      setState(prev => ({ ...prev, editMode: false }));
    }
  }, [open]);

  const setEditMode = useCallback((editMode: boolean) => {
    setState(prev => ({ ...prev, editMode }));
  }, []);

  const setEditName = useCallback((editName: string) => {
    setState(prev => ({ ...prev, editName }));
  }, []);

  const setDeleteConfirmOpen = useCallback((deleteConfirmOpen: boolean) => {
    setState(prev => ({ ...prev, deleteConfirmOpen }));
  }, []);

  return {
    // React Query managed state
    asset,
    loading,
    error,
    // Local component state
    ...state,
    // Actions
    setEditMode,
    setEditName,
    setDeleteConfirmOpen,
    handleSaveEdit,
    handleDelete,
    handleDownload,
    handleCopyUrl,
    handleLocalTagAdded: handleTagAdded,
    handleLocalRemoveTag: handleTagRemoved,
  };
}; 
