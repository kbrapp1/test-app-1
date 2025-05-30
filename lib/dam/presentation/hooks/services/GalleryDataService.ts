import { createClient } from '@/lib/supabase/client';
import { GalleryItemDto } from '../../../application/use-cases/folders/ListFolderContentsUseCase';
import { GalleryDataParams, GalleryDataResult } from './GalleryDataTypes';

/**
 * Request deduplication cache
 * Prevents duplicate API calls for the same parameters within a short time window
 */
const requestCache = new Map<string, Promise<GalleryDataResult>>();
const CACHE_DURATION = 1000; // 1 second deduplication window

/**
 * GalleryDataService - Domain Service for DAM Gallery Data
 * 
 * Coordinates data fetching for the DAM gallery using API routes.
 * Updated to work with organization context instead of direct RPC calls.
 * Includes request deduplication to prevent duplicate calls during development.
 */
export class GalleryDataService {
  
  /**
   * Generates a cache key for request deduplication
   * IMPORTANT: Folder ID changes always trigger fresh requests to prevent stale data
   */
  private generateCacheKey(params: GalleryDataParams, forceRefresh: boolean): string {
    // Always include a timestamp when folder ID changes to ensure fresh data
    // This prevents showing stale data when navigating to newly created folders
    const folderChangeKey = params.currentFolderId ? `folder_${params.currentFolderId}` : 'root';
    
    return JSON.stringify({
      ...params,
      forceRefresh,
      folderChangeKey,
      // Add a short-lived timestamp for folder navigation to ensure fresh data
      _folderNav: Math.floor(Date.now() / 500), // 500ms window for folder nav
    });
  }

  /**
   * Fetches gallery data using the DAM API route
   * Relies on the API route to handle organization context internally
   * Includes request deduplication for development mode
   */
  async fetchGalleryData(
    params: GalleryDataParams, 
    forceRefresh: boolean = false
  ): Promise<GalleryDataResult> {
    // Generate cache key for deduplication
    const cacheKey = this.generateCacheKey(params, forceRefresh);
    
    // Always bypass cache for force refresh or use cached promise if available
    if (forceRefresh) {
      // Clear any existing cache for this folder to force fresh data
      const existingKeys = Array.from(requestCache.keys()).filter(key => 
        key.includes(`"currentFolderId":"${params.currentFolderId}"`)
      );
      existingKeys.forEach(key => requestCache.delete(key));
    } else if (requestCache.has(cacheKey)) {
      return requestCache.get(cacheKey)!;
    }

    // Create the actual fetch promise
    const fetchPromise = this.performFetch(params, forceRefresh);
    
    // Cache the promise (not the result) for deduplication
    if (!forceRefresh) {
      requestCache.set(cacheKey, fetchPromise);
      
      // Clear from cache after duration
      setTimeout(() => {
        requestCache.delete(cacheKey);
      }, CACHE_DURATION);
    }

    return fetchPromise;
  }

  /**
   * Performs the actual API fetch
   */
  private async performFetch(
    params: GalleryDataParams,
    forceRefresh: boolean
  ): Promise<GalleryDataResult> {
    try {
      // Build query string from parameters
      const queryParams = new URLSearchParams();
      
      if (params.currentFolderId) {
        queryParams.append('folderId', params.currentFolderId);
      }
      
      if (params.searchTerm?.trim()) {
        queryParams.append('search', params.searchTerm.trim());
      }
      
      if (params.tagIds && params.tagIds.length > 0) {
        queryParams.append('tagIds', params.tagIds.join(','));
      }
      
      if (params.filterType) {
        queryParams.append('type', params.filterType);
      }
      
      if (params.filterCreationDateOption) {
        queryParams.append('creationDateOption', params.filterCreationDateOption);
        if (params.filterDateStart) {
          queryParams.append('dateStart', params.filterDateStart);
        }
        if (params.filterDateEnd) {
          queryParams.append('dateEnd', params.filterDateEnd);
        }
      }
      
      if (params.filterOwnerId) {
        queryParams.append('ownerId', params.filterOwnerId);
      }
      
      if (params.filterSizeOption) {
        queryParams.append('sizeOption', params.filterSizeOption);
        if (params.filterSizeMin !== undefined) {
          queryParams.append('sizeMin', params.filterSizeMin.toString());
        }
        if (params.filterSizeMax !== undefined) {
          queryParams.append('sizeMax', params.filterSizeMax.toString());
        }
      }
      
      if (params.sortBy) {
        queryParams.append('sortBy', params.sortBy);
      }
      
      if (params.sortOrder) {
        queryParams.append('sortOrder', params.sortOrder);
      }
      
      if (forceRefresh) {
        queryParams.append('_t', Date.now().toString());
      }

      // Call the API route (which handles organization context internally)
      const url = `/api/dam?${queryParams.toString()}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      
      return {
        success: true,
        data: {
          items: data.data || []
        }
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
} 
