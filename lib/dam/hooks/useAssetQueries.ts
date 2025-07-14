import { useApiQuery, useSearchQuery } from '@/lib/infrastructure/query';
import { Asset } from '../domain/entities/Asset';
import { Folder } from '../domain/entities/Folder';
import { AssetDetailsDto } from '../application/use-cases/assets/GetAssetDetailsUseCase';

/**
 * Asset Query Hooks
 * 
 * Domain: DAM Asset Management
 * Responsibility: Asset read operations and search
 * 
 * Following DDD principles:
 * - Single responsibility: Asset data fetching only
 * - Domain-focused: Asset entity operations
 * - Infrastructure abstraction: Uses query infrastructure
 */

/**
 * Hook for fetching assets in a folder
 * Replaces damApiDeduplication.fetch
 */
export function useAssets(folderId?: string, enabled: boolean = true) {
  return useApiQuery<Asset[]>(
    ['assets', folderId ?? 'root'],
    `/api/dam/assets${folderId ? `?folderId=${folderId}` : ''}`,
    {},
    {
      enabled,
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );
}

/**
 * Hook for asset search with debouncing
 * Replaces searchApiDeduplication.debouncedFetch
 * 
 * @deprecated This hook is not currently used. The main search functionality
 * is handled by useDamGalleryData. Keeping for potential future use.
 */
export function useAssetSearch(searchTerm: string, enabled: boolean = true) {
  return useSearchQuery<Asset[]>(
    searchTerm,
    '/api/dam',
    500, // 500ms debounce
    enabled
  );
}

/**
 * Hook for fetching a single asset
 */
export function useAsset(assetId: string, enabled: boolean = true) {
  return useApiQuery<Asset>(
    ['asset', assetId],
    `/api/dam/asset/${assetId}`,
    {},
    { enabled: enabled && !!assetId }
  );
}

/**
 * Hook for fetching asset details with extended information
 * Used by useAssetDetails React Query hook instead of deprecated AssetOperationsService.loadAssetDetails
 */
export function useAssetDetails(assetId: string, enabled: boolean = true) {
  return useApiQuery<AssetDetailsDto>(
    ['asset-details', assetId],
    `/api/dam/asset/${assetId}?details=true`,
    {},
    { enabled: enabled && !!assetId }
  );
}

/**
 * Hook for fetching folders
 */
export function useFolders(parentFolderId?: string, enabled: boolean = true) {
  return useApiQuery<Folder[]>(
    ['folders', parentFolderId ?? 'root'],
    `/api/dam/folders${parentFolderId ? `?parentId=${parentFolderId}` : ''}`,
    {},
    { enabled }
  );
} 