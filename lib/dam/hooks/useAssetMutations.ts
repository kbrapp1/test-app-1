import { useApiMutation, useCacheInvalidation } from '@/lib/infrastructure/query';
import { Asset } from '../domain/entities/Asset';
import { UpdateAssetData } from '../domain/repositories/IAssetRepository';

/**
 * Asset Mutation Hooks
 * 
 * Domain: DAM Asset Management
 * Responsibility: Asset write operations (create, update, delete)
 * 
 * Following DDD principles:
 * - Single responsibility: Asset state modifications only
 * - Domain-focused: Asset entity lifecycle operations
 * - Cache coordination: Ensures UI consistency after mutations
 */

/**
 * Hook for asset upload mutation
 */
export function useAssetUpload() {
  const { invalidateByPattern } = useCacheInvalidation();

  return useApiMutation<Asset, FormData>(
    async (formData: FormData) => {
      const response = await fetch('/api/dam/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    {
      onSuccess: () => {
        // Invalidate all asset and gallery queries to match the new React Query patterns
        invalidateByPattern('assets');
        invalidateByPattern('folders');
        invalidateByPattern('dam-gallery'); // Gallery browsing cache
        invalidateByPattern('dam-search');  // Search results cache
      },
      invalidateQueries: ['assets', 'folders', 'dam-gallery', 'dam-search'],
    }
  );
}

/**
 * Hook for asset move mutation
 */
export function useAssetMove() {
  const { invalidateByPattern } = useCacheInvalidation();

  return useApiMutation<void, { assetId: string; targetFolderId: string | null }>(
    async ({ assetId, targetFolderId }) => {
      const response = await fetch(`/api/dam/asset/${assetId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetFolderId }),
      });
      if (!response.ok) throw new Error('Move failed');
    },
    {
      onSuccess: () => {
        // Invalidate all gallery and asset queries since assets moved between folders
        invalidateByPattern('assets');
        invalidateByPattern('dam-gallery');
        invalidateByPattern('dam-search');
        invalidateByPattern('folders');
      },
    }
  );
}

/**
 * Hook for asset deletion
 */
export function useAssetDelete() {
  const { invalidateByPattern } = useCacheInvalidation();

  return useApiMutation<{ success: boolean; message: string }, string>(
    async (assetId: string) => {
      const response = await fetch(`/api/dam/asset/${assetId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Failed to delete asset (${response.status})`);
      }
      
      // Parse and return the success response
      const result = await response.json();
      return result;
    },
    {
      onSuccess: (_, assetId) => {
        // Remove the specific asset from cache
        invalidateByPattern('assets');
        invalidateByPattern('dam-gallery');
        invalidateByPattern('dam-search');
        invalidateByPattern(`asset-${assetId}`);
      },
      optimisticUpdate: {
        queryKey: ['assets'],
        updater: (oldAssets: unknown, deletedAssetId: string) => 
          (oldAssets as Asset[])?.filter(asset => asset.id !== deletedAssetId) || []
      }
    }
  );
}

/**
 * Hook for asset update mutation
 */
export function useAssetUpdate() {
  const { invalidateByPattern } = useCacheInvalidation();

  return useApiMutation<void, { assetId: string; updates: UpdateAssetData }>(
    async ({ assetId, updates }) => {
      const response = await fetch(`/api/dam/asset/${assetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update asset');
    },
    {
      onSuccess: (_, { assetId }) => {
        // Invalidate asset-specific queries and gallery data
        invalidateByPattern('assets');
        invalidateByPattern('dam-gallery');
        invalidateByPattern('dam-search');
        invalidateByPattern(`asset-${assetId}`);
        invalidateByPattern(`asset-details-${assetId}`);
      },
    }
  );
} 