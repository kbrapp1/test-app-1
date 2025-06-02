import { useApiMutation, useCacheInvalidation } from '@/lib/infrastructure/query';

/**
 * Folder Operations Hooks
 * 
 * Domain: DAM Folder Management
 * Responsibility: Folder lifecycle operations (CRUD)
 * 
 * Following DDD principles:
 * - Single responsibility: Folder entity operations only
 * - Domain-focused: Folder hierarchy management
 * - Cache coordination: Gallery and search invalidation
 */

/**
 * Hook for folder creation
 */
export function useFolderCreate() {
  const { invalidateByPattern } = useCacheInvalidation();

  return useApiMutation<void, { name: string; parentFolderId: string | null }>(
    async ({ name, parentFolderId }) => {
      const { createFolderAction } = await import('../application/actions/folder.actions');
      const result = await createFolderAction(name, parentFolderId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create folder');
      }
    },
    {
      onSuccess: () => {
        invalidateByPattern('folders');
        invalidateByPattern('dam-gallery');
      },
    }
  );
}

/**
 * Hook for folder deletion
 */
export function useFolderDelete() {
  const { invalidateByPattern } = useCacheInvalidation();

  return useApiMutation<void, string>(
    async (folderId: string) => {
      const { deleteFolderAction } = await import('../application/actions/folder.actions');
      const result = await deleteFolderAction(folderId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete folder');
      }
    },
    {
      onSuccess: () => {
        invalidateByPattern('folders');
        invalidateByPattern('dam-gallery');
        invalidateByPattern('dam-search');
      },
    }
  );
}

/**
 * Hook for folder renaming
 */
export function useFolderRename() {
  const { invalidateByPattern } = useCacheInvalidation();

  return useApiMutation<void, { folderId: string; newName: string }>(
    async ({ folderId, newName }) => {
      const { renameFolderAction } = await import('../application/actions/folder.actions');
      const result = await renameFolderAction(folderId, newName);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to rename folder');
      }
    },
    {
      onSuccess: () => {
        // Invalidate folder queries
        invalidateByPattern('folders');
        
        // Invalidate gallery queries - both search and folder browsing
        // Gallery uses patterns like ['dam-gallery', currentFolderId || '', queryParams]
        invalidateByPattern('dam-gallery');
        // Search uses patterns like ['dam-search', searchTerm || '', queryParams]  
        invalidateByPattern('dam-search');
        
        // Also invalidate basic asset queries that might show folder names
        invalidateByPattern('assets');
      },
    }
  );
} 