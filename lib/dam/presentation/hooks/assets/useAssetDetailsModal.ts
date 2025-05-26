import { useState, useEffect, useCallback } from 'react';
import type { PlainTag } from '../../../application/dto/DamApiRequestDto';
import { AssetDetailsDto } from '../../../application/use-cases/assets/GetAssetDetailsUseCase';
import { AssetTagService } from '../../../application/services/AssetTagService';
import { AssetOperationsService } from '../../../application/services/AssetOperationsService';

interface AssetModalState {
  asset: AssetDetailsDto | null;
  loading: boolean;
  error: string | null;
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

  const [state, setState] = useState<AssetModalState>({
    asset: null,
    loading: false,
    error: null,
    editMode: false,
    editName: '',
    deleteConfirmOpen: false,
    updating: false,
    isUpdatingTag: false,
    copiedUrl: false,
  });

  const loadAssetDetails = useCallback(async () => {
    if (!assetId) return;
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const assetData = await AssetOperationsService.loadAssetDetails(assetId);
      setState(prev => ({ ...prev, asset: assetData, editName: assetData.name, loading: false }));
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : 'Unknown error occurred',
        loading: false 
      }));
    }
  }, [assetId]);

  const handleTagAdded = useCallback((newTag: PlainTag) => {
    setState(prev => {
      if (!prev.asset || prev.asset.tags.some(tag => tag.id === newTag.id)) return prev;
      return {
        ...prev,
        asset: { ...prev.asset, tags: [...prev.asset.tags, newTag] },
      };
    });
    AssetTagService.showTagAddedSuccess(newTag.name);
    onAssetUpdated?.();
  }, [onAssetUpdated]);

  const handleTagRemoved = useCallback(async (tagToRemove: PlainTag) => {
    if (!state.asset?.id) return;
    setState(prev => ({ ...prev, isUpdatingTag: true }));

    try {
      await AssetTagService.removeTagFromAsset(state.asset.id, tagToRemove);
      setState(prev => {
        if (!prev.asset) return { ...prev, isUpdatingTag: false };
        return {
          ...prev,
          asset: { ...prev.asset, tags: prev.asset.tags.filter(tag => tag.id !== tagToRemove.id) },
          isUpdatingTag: false,
        };
      });
      AssetTagService.showTagRemovedSuccess(tagToRemove.name);
      onAssetUpdated?.();
    } catch (error) {
      setState(prev => ({ ...prev, isUpdatingTag: false }));
      AssetTagService.showTagRemoveError(error as Error);
    }
  }, [state.asset?.id, onAssetUpdated]);

  const handleSaveEdit = useCallback(async () => {
    if (!state.asset || !state.editName.trim()) return;
    setState(prev => ({ ...prev, updating: true }));
    
    try {
      await AssetOperationsService.updateAssetName(state.asset.id, state.editName);
      await loadAssetDetails();
      setState(prev => ({ ...prev, editMode: false, updating: false }));
      onAssetUpdated?.();
      AssetOperationsService.showRenameSuccess(state.editName.trim());
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : 'Failed to update asset',
        updating: false 
      }));
      AssetOperationsService.showError('rename asset');
    }
  }, [state.asset, state.editName, loadAssetDetails, onAssetUpdated]);

  const handleDelete = useCallback(async () => {
    if (!state.asset) return;

    try {
      await AssetOperationsService.deleteAsset(state.asset.id);
      onAssetDeleted?.(state.asset.id);
      onOpenChange(false);
      AssetOperationsService.showDeleteSuccess();
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : 'Failed to delete asset' 
      }));
      AssetOperationsService.showError('delete asset');
    }
  }, [state.asset, onAssetDeleted, onOpenChange]);

  const handleDownload = useCallback(async () => {
    if (!state.asset?.downloadUrl) return;

    try {
      AssetOperationsService.downloadAsset(state.asset.downloadUrl, state.asset.name);
      AssetOperationsService.showDownloadSuccess(state.asset.name);
    } catch (err) {
      setState(prev => ({ ...prev, error: 'Failed to download asset' }));
      AssetOperationsService.showError('download');
    }
  }, [state.asset]);

  const handleCopyUrl = useCallback(async () => {
    if (!state.asset?.publicUrl) return;

    try {
      await AssetOperationsService.copyAssetUrl(state.asset.publicUrl);
      setState(prev => ({ ...prev, copiedUrl: true }));
      setTimeout(() => setState(prev => ({ ...prev, copiedUrl: false })), 2000);
      AssetOperationsService.showCopyUrlSuccess();
    } catch (err) {
      AssetOperationsService.showError('copy URL');
    }
  }, [state.asset]);

  useEffect(() => {
    if (open && assetId) {
      loadAssetDetails();
    } else {
      setState(prev => ({ ...prev, asset: null, editMode: false, error: null }));
    }
  }, [open, assetId, loadAssetDetails]);

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
    ...state,
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
