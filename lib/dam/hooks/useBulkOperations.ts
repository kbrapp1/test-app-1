import { useApiMutation, useCacheInvalidation } from '@/lib/infrastructure/query';
import { Asset } from '../domain/entities/Asset';

/**
 * Bulk Operations Hooks
 * 
 * Domain: DAM Asset Management  
 * Responsibility: Bulk asset and folder operations
 * 
 * Following DDD principles:
 * - Single responsibility: Bulk operations coordination only
 * - Domain-focused: Multi-asset lifecycle operations
 * - State coordination: Folder store integration for tree view consistency
 */

/**
 * Hook for bulk move operations
 * Handles both assets and folders with optimized UI updates
 */
export function useBulkMove() {
  const { invalidateByPattern } = useCacheInvalidation();

  return useApiMutation<void, { assetIds: string[]; folderIds: string[]; targetFolderId: string | null }>(
    async ({ assetIds, folderIds, targetFolderId }) => {
      const formData = new FormData();
      formData.append('assetIds', JSON.stringify(assetIds));
      formData.append('folderIds', JSON.stringify(folderIds)); 
      formData.append('targetFolderId', targetFolderId === null ? 'null' : targetFolderId || '');
      
      // Import the bulk move action
      const { bulkMoveItems } = await import('../application/actions/selection.actions');
      const result = await bulkMoveItems(formData);
      
      if (!result.success) {
        throw new Error(result.error || 'Bulk move failed');
      }
    },
    {
      onSuccess: async (_, variables) => {
        // Invalidate all relevant queries to refresh the UI immediately
        invalidateByPattern('assets');
        invalidateByPattern('dam-gallery');
        invalidateByPattern('dam-search');
        invalidateByPattern('folders');
        
        // If folders were moved, use a more targeted refresh to prevent visual flashing
        if (variables.folderIds && variables.folderIds.length > 0) {
          try {
            // Use forceRefresh instead of full refetch to prevent "[No Name]" flash
            const { useFolderStore } = await import('@/lib/store/folderStore');
            const { forceRefresh } = useFolderStore.getState();
            forceRefresh();
            
            // Delay the full refetch slightly to allow React Query cache invalidation to complete
            setTimeout(async () => {
              try {
                const { refetchFolderData } = useFolderStore.getState();
                await refetchFolderData();
              } catch {
                // Silently handle folder tree refresh failure
              }
            }, 100);
          } catch {
            // Silently handle folder tree refresh failure
          }
        }
        
        // Dispatch custom event to trigger additional cache invalidation in gallery
        // This ensures proper coordination with the AssetGalleryClient event listeners
        window.dispatchEvent(new CustomEvent('reactQueryInvalidateCache', {
          detail: { 
            patterns: ['dam-gallery', 'dam-search', 'assets', 'folders'], 
            queries: [] 
          }
        }));
      },
    }
  );
}

/**
 * Hook for bulk asset operations
 * Provides both delete and move operations with optimistic updates
 */
export function useBulkAssetOperations() {
  const { invalidateByPattern } = useCacheInvalidation();

  return {
    bulkDelete: useApiMutation<void, string[]>(
      async (assetIds: string[]) => {
        const response = await fetch('/api/dam/bulk/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assetIds }),
        });
        if (!response.ok) throw new Error('Bulk delete failed');
      },
      {
        onSuccess: () => {
          invalidateByPattern('assets');
          invalidateByPattern('dam-gallery');
          invalidateByPattern('dam-search');
        },
        optimisticUpdate: {
          queryKey: ['assets'],
          updater: (oldAssets: Asset[], deletedAssetIds: string[]) =>
            oldAssets?.filter(asset => !deletedAssetIds.includes(asset.id)) || []
        }
      }
    ),

    bulkMove: useApiMutation<void, { assetIds: string[]; folderIds: string[]; targetFolderId: string | null }>(
      async ({ assetIds, folderIds, targetFolderId }) => {
        const formData = new FormData();
        formData.append('assetIds', JSON.stringify(assetIds));
        formData.append('folderIds', JSON.stringify(folderIds)); 
        formData.append('targetFolderId', targetFolderId === null ? 'null' : targetFolderId || '');
        
        // Import the bulk move action
        const { bulkMoveItems } = await import('../application/actions/selection.actions');
        const result = await bulkMoveItems(formData);
        
        if (!result.success) {
          throw new Error(result.error || 'Bulk move failed');
        }
      },
      {
        onSuccess: async (_, variables) => {
          invalidateByPattern('assets');
          invalidateByPattern('dam-gallery');
          invalidateByPattern('dam-search');
          invalidateByPattern('folders');
          
          // If folders were moved, use a more targeted refresh to prevent visual flashing
          if (variables.folderIds && variables.folderIds.length > 0) {
            try {
              // Use forceRefresh instead of full refetch to prevent "[No Name]" flash
              const { useFolderStore } = await import('@/lib/store/folderStore');
              const { forceRefresh } = useFolderStore.getState();
              forceRefresh();
              
              // Delay the full refetch slightly to allow React Query cache invalidation to complete
              setTimeout(async () => {
                try {
                  const { refetchFolderData } = useFolderStore.getState();
                  await refetchFolderData();
                } catch {
                  // Silently handle folder tree refresh failure
                }
              }, 100);
            } catch {
              // Silently handle folder tree refresh failure
            }
          }
          
          // Dispatch custom event to trigger additional cache invalidation in gallery
          window.dispatchEvent(new CustomEvent('reactQueryInvalidateCache', {
            detail: { 
              patterns: ['dam-gallery', 'dam-search', 'assets', 'folders'], 
              queries: [] 
            }
          }));
        },
      }
    ),
  };
} 