import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApiMutation, useCacheInvalidation } from '@/lib/infrastructure/query';
import { SavedSearch, SavedSearchProps } from '../../../domain/entities/SavedSearch';
import { listSavedSearches, saveDamSearch, executeSavedSearch } from '../../../application/actions/savedSearches.actions';
import { useToast } from '@/components/ui/use-toast';
import { Asset } from '../../../domain/entities/Asset';
import { Folder } from '../../../domain/entities/Folder';

// Type for the simplified result returned by the server action
interface ExecuteSavedSearchActionResult {
  savedSearch: {
    id: string;
    name: string;
    description?: string;
    searchCriteria: {
      searchTerm?: string;
      folderId?: string | null;
      tagIds?: string[];
      filters?: {
        type?: string;
        creationDateOption?: string;
        dateStart?: string;
        dateEnd?: string;
        ownerId?: string;
        sizeOption?: string;
        sizeMin?: string;
        sizeMax?: string;
      };
      sortParams?: {
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
      };
    };
  };
  searchResults: {
    assets: Asset[];
    folders: Folder[];
    totalCount: number;
  };
}

// Legacy interface types for compatibility with existing components
export interface SavedSearchFormData {
  name: string;
  description?: string;
  isGlobal?: boolean;
}

export interface CurrentSearchCriteria {
  searchTerm?: string;
  folderId?: string | null;
  tagIds?: string[];
  filters?: {
    type?: string;
    creationDateOption?: string;
    dateStart?: string;
    dateEnd?: string;
    ownerId?: string;
    sizeOption?: string;
    sizeMin?: string;
    sizeMax?: string;
  };
  sortParams?: {
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
}

export interface UseSavedSearchesReturn {
  // State
  savedSearches: SavedSearch[];
  popularSearches: SavedSearch[];
  isLoading: boolean;
  isExecuting: boolean;
  error: string | null;
  
  // Actions
  refreshSavedSearches: () => Promise<void>;
  saveCurrentSearch: (formData: SavedSearchFormData, currentCriteria: CurrentSearchCriteria) => Promise<SavedSearch | null>;
  executeSearch: (savedSearchId: string, currentFolderId?: string | null) => Promise<ExecuteSavedSearchActionResult | null>;
  canSaveCurrentSearch: (currentCriteria: CurrentSearchCriteria) => boolean;
}

/**
 * Domain presentation hook for managing saved searches
 * 
 * MIGRATED TO REACT QUERY:
 * - Replaced global singleton state with React Query
 * - Automatic caching, deduplication, and refetching
 * - Proper error handling and loading states
 * - No more manual state synchronization across components
 */

export function useSavedSearches(): UseSavedSearchesReturn {
  const { toast } = useToast();
  const { invalidateByPattern } = useCacheInvalidation();

  // Fetch saved searches using React Query with custom fetcher
  const {
    data: searchData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['saved-searches'],
    queryFn: async () => {
      const result = await listSavedSearches({ includePopular: true });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Transform to SavedSearch instances
  const savedSearches = (searchData?.userSavedSearches || []).map((s: SavedSearchProps) => new SavedSearch(s));
  const popularSearches = (searchData?.popularSavedSearches || []).map((s: SavedSearchProps) => new SavedSearch(s));

  // Save search mutation
  const saveSearchMutation = useApiMutation<SavedSearchProps, SavedSearchProps>(
    async (searchProps) => {
      const result = await saveDamSearch(searchProps);
      if (!result.success) throw new Error(result.error);
      return result.data!;
    },
    {
      onSuccess: () => {
        invalidateByPattern('saved-searches');
        toast({
          title: 'Search saved successfully',
          description: 'Your search has been added to saved searches.',
        });
      },
      onError: (error) => {
        toast({
          title: 'Failed to save search',
          description: error instanceof Error ? error.message : 'Unknown error occurred',
          variant: 'destructive',
        });
      },
    }
  );

  // Execute saved search mutation
  const executeSearchMutation = useApiMutation<ExecuteSavedSearchActionResult, string>(
    async (searchId) => {
      const result = await executeSavedSearch({ 
        savedSearchId: searchId,
        currentFolderIdForContext: undefined 
      });
      if (!result.success) throw new Error(result.error);
      return result.data!;
    },
    {
      onSuccess: () => {
        invalidateByPattern('saved-searches'); // Refresh to update usage counts
      },
      onError: (error) => {
        toast({
          title: 'Failed to execute search',
          description: error instanceof Error ? error.message : 'Unknown error occurred',
          variant: 'destructive',
        });
      },
    }
  );

  // Legacy compatibility functions
  const canSaveCurrentSearch = useCallback((currentCriteria: CurrentSearchCriteria): boolean => {
    // Check if there are any meaningful search criteria
    return !!(
      currentCriteria.searchTerm ||
      currentCriteria.tagIds?.length ||
      (currentCriteria.filters && Object.values(currentCriteria.filters).some(v => v && v !== 'any')) ||
      currentCriteria.sortParams?.sortBy
    );
  }, []);

  const saveCurrentSearch = useCallback(async (
    formData: SavedSearchFormData, 
    currentCriteria: CurrentSearchCriteria
  ): Promise<SavedSearch | null> => {
    if (!canSaveCurrentSearch(currentCriteria)) {
      toast({
        title: 'Cannot Save Search',
        description: 'Please add search criteria before saving',
        variant: 'destructive',
      });
      return null;
    }

    try {
      const result = await saveSearchMutation.mutateAsync({
        name: formData.name,
        description: formData.description,
        searchCriteria: currentCriteria,
        isGlobal: formData.isGlobal ?? true,
      } as SavedSearchProps);
      
      return new SavedSearch(result);
    } catch {
      // Error is already handled by mutation's onError
      return null;
    }
  }, [canSaveCurrentSearch, toast, saveSearchMutation]);

  const executeSearch = useCallback(async (
    savedSearchId: string, 
    _currentFolderId?: string | null
  ) => {
    try {
      return await executeSearchMutation.mutateAsync(savedSearchId);
    } catch {
      // Error is already handled by mutation's onError
      return null;
    }
  }, [executeSearchMutation]);

  const refreshSavedSearches = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    savedSearches,
    popularSearches,
    isLoading,
    isExecuting: executeSearchMutation.isPending,
    error: error instanceof Error ? error.message : null,
    refreshSavedSearches,
    saveCurrentSearch,
    executeSearch,
    canSaveCurrentSearch,
  };
}

// Legacy reset function for testing (now no-op since we use React Query)
export const resetGlobalSavedSearchState = () => {
  // No-op - React Query handles state cleanup automatically
}; 
