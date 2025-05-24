import { useState, useEffect, useCallback } from 'react';
import { SavedSearch, SavedSearchProps } from '../../domain/entities/SavedSearch';
import { listSavedSearches, saveDamSearch, executeSavedSearch } from '@/lib/actions/dam/saved-searches';
import { useToast } from '@/components/ui/use-toast';

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
  executeSearch: (savedSearchId: string, currentFolderId?: string | null) => Promise<any>;
  canSaveCurrentSearch: (currentCriteria: CurrentSearchCriteria) => boolean;
}

export function useSavedSearches(): UseSavedSearchesReturn {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [popularSearches, setPopularSearches] = useState<SavedSearch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const refreshSavedSearches = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await listSavedSearches({ includePopular: true });
      
      if (result.success && result.data) {
        setSavedSearches(result.data.userSavedSearches.map((s: SavedSearchProps) => new SavedSearch(s)));
        setPopularSearches(result.data.popularSavedSearches?.map((s: SavedSearchProps) => new SavedSearch(s)) || []);
      } else {
        setError(result.error || 'Failed to load saved searches');
        toast({
          title: 'Error',
          description: result.error || 'Failed to load saved searches',
          variant: 'destructive',
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

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

    setIsLoading(true);
    setError(null);

    try {
      const result = await saveDamSearch({
        name: formData.name,
        description: formData.description,
        searchCriteria: currentCriteria,
        isGlobal: formData.isGlobal ?? true,
      });

      if (result.success && result.data) {
        const newSavedSearch = new SavedSearch(result.data);
        setSavedSearches(prev => [newSavedSearch, ...prev]);
        
        toast({
          title: 'Search Saved',
          description: `"${formData.name}" has been saved successfully`,
        });
        
        return newSavedSearch;
      } else {
        setError(result.error || 'Failed to save search');
        toast({
          title: 'Error',
          description: result.error || 'Failed to save search',
          variant: 'destructive',
        });
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [canSaveCurrentSearch, toast]);

  const executeSearch = useCallback(async (
    savedSearchId: string, 
    currentFolderId?: string | null
  ) => {
    setIsExecuting(true);
    setError(null);

    try {
      const result = await executeSavedSearch({
        savedSearchId,
        currentFolderIdForContext: currentFolderId,
      });

      if (result.success) {
        // Update the saved search usage in our local state
        setSavedSearches(prev => 
          prev.map(search => 
            search.id === savedSearchId 
              ? search.withUpdatedUsage()
              : search
          )
        );
        
        return result.data;
      } else {
        setError(result.error || 'Failed to execute search');
        toast({
          title: 'Error',
          description: result.error || 'Failed to execute search',
          variant: 'destructive',
        });
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsExecuting(false);
    }
  }, [toast]);

  // Load saved searches on mount
  useEffect(() => {
    refreshSavedSearches();
  }, [refreshSavedSearches]);

  return {
    savedSearches,
    popularSearches,
    isLoading,
    isExecuting,
    error,
    refreshSavedSearches,
    saveCurrentSearch,
    executeSearch,
    canSaveCurrentSearch,
  };
} 