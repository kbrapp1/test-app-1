'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function useDamUrlManager() {
  const router = useRouter();
  const currentSearchParams = useSearchParams();

  const updateUrl = useCallback((paramManipulation: (params: URLSearchParams) => void) => {
    const newParams = new URLSearchParams(currentSearchParams.toString());
    paramManipulation(newParams);
    const qs = newParams.toString();
    router.push(qs ? `/dam?${qs}` : '/dam');
  }, [router, currentSearchParams]);

  const setSearchAndFolder = useCallback((searchTerm: string | null, folderId: string | null) => {
    updateUrl(params => {
      if (searchTerm && searchTerm.trim() !== '') {
        params.set('q', searchTerm.trim());
      } else {
        params.delete('q');
      }
      if (folderId) {
        params.set('folderId', folderId);
      } else {
        params.delete('folderId');
      }
      // Note: Existing tagIds will be preserved by default as we start from currentSearchParams
    });
  }, [updateUrl]);

  const clearSearchPreserveContext = useCallback((currentFolderIdForContext: string | null) => {
    updateUrl(params => {
      params.delete('q');
      // Ensure folderId is correctly set based on context, tagIds are preserved.
      if (currentFolderIdForContext) {
        params.set('folderId', currentFolderIdForContext);
      } else {
        params.delete('folderId');
      }
    });
  }, [updateUrl]);

  const navigateToFolder = useCallback((folderId: string, options?: { preserveTagFilters?: boolean, preserveSearchQuery?: boolean }) => {
    updateUrl(params => {
      // Clear all params first, then add folderId, then conditionally add others
      const preservedTags = options?.preserveTagFilters && params.has('tagIds') ? params.get('tagIds') : null;
      const preservedQuery = options?.preserveSearchQuery && params.has('q') ? params.get('q') : null;
      
      params.forEach((_, key) => params.delete(key)); // Clear all existing params

      params.set('folderId', folderId);
      if (preservedTags) {
        params.set('tagIds', preservedTags);
      }
      if (preservedQuery) {
        params.set('q', preservedQuery);
      }
    });
  }, [updateUrl]);

  const setTagsPreserveContext = useCallback((tagIds: Set<string>, currentQueryFromContext: string | null, currentFolderIdFromContext: string | null) => {
    updateUrl(params => {
      if (tagIds.size > 0) {
        params.set('tagIds', Array.from(tagIds).join(','));
      } else {
        params.delete('tagIds');
      }
      // Preserve q and folderId based on passed context
      if (currentQueryFromContext) {
        params.set('q', currentQueryFromContext);
      } else {
        params.delete('q');
      }
      if (currentFolderIdFromContext) {
        params.set('folderId', currentFolderIdFromContext);
      } else {
        params.delete('folderId');
      }
    });
  }, [updateUrl]);

  return {
    setSearchAndFolder,
    navigateToFolder,
    setTagsPreserveContext,
    clearSearchPreserveContext,
  };
} 