/**
 * TTS History Hook - Optimized for Single Validation Point
 * 
 * AI INSTRUCTIONS:
 * - Consolidates all TTS history state management to prevent cascade refreshes
 * - Uses single validation point through server actions (no additional validation)
 * - Implements proper error boundaries and debouncing
 * - Eliminates redundant validation calls through intelligent caching
 * - Follows @golden-rule patterns exactly
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { getTtsHistory, markTtsUrlProblematic } from '../actions/tts';
import { TtsPredictionDisplayDto } from '../../application/dto/TtsPredictionDto';

const ITEMS_PER_PAGE = 10;
const DEBOUNCE_DELAY = 300;

interface UseTtsHistoryProps {
  isOpen: boolean;
  initialSearchQuery?: string;
  headlessPlayerError?: string | null;
  headlessPlayerCurrentlyPlayingUrl?: string | null;
  shouldRefresh?: boolean;
  onRefreshComplete?: () => void;
  onSaveToDam: (item: TtsPredictionDisplayDto) => Promise<boolean>; 
  onSaveAsToDam: (item: TtsPredictionDisplayDto) => Promise<boolean>;
}

interface TtsHistoryState {
  searchQuery: string;
  currentPage: number;
  allPages: TtsPredictionDisplayDto[];
  isSearching: boolean;
  error: string | null;
}

export function useTtsHistory({
  isOpen,
  initialSearchQuery = '',
  headlessPlayerError,
  headlessPlayerCurrentlyPlayingUrl,
  shouldRefresh = false,
  onRefreshComplete,
  onSaveToDam, 
  onSaveAsToDam,
}: UseTtsHistoryProps) {
  const queryClient = useQueryClient();
  
  // Consolidated state management to prevent cascade refreshes
  const [state, setState] = useState<TtsHistoryState>({
    searchQuery: initialSearchQuery,
    currentPage: 1,
    allPages: [],
    isSearching: false,
    error: null,
  });

  // Memoized query key to prevent unnecessary re-renders
  const queryKey = useMemo(() => 
    ['tts-history', state.searchQuery, state.currentPage], 
    [state.searchQuery, state.currentPage]
  );

  // Single React Query for TTS history - server actions handle all validation
  const {
    data: historyData,
    isLoading,
    error: queryError,
    refetch
  } = useQuery({
    queryKey,
    queryFn: async () => {
      // Server action handles all validation with security-aware caching
      const result = await getTtsHistory({
        page: state.currentPage,
        limit: ITEMS_PER_PAGE,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        searchQuery: state.searchQuery || undefined,
      });
      
      if (!result.success) {
        const errorMessage = typeof result.error === 'string' 
          ? result.error 
          : result.error?.message || 'Failed to fetch history';
        
        // Update consolidated error state
        setState(prev => ({ ...prev, error: errorMessage }));
        throw new Error(errorMessage);
      }
      
      // Clear error on successful fetch
      setState(prev => ({ ...prev, error: null }));
      return result;
    },
    enabled: isOpen, // Only fetch when panel is open
    staleTime: 30000, // 30 seconds - matches server-side caching
    retry: (failureCount, error) => {
      // Intelligent retry logic with error boundaries
      if (error?.message?.includes('Authentication') || 
          error?.message?.includes('Organization')) {
        return false; // Don't retry auth/org errors
      }
      return failureCount < 3;
    },
    refetchOnWindowFocus: false,
  });

  // Handle query errors separately
  useEffect(() => {
    if (queryError) {
      setState(prev => ({ ...prev, error: queryError.message }));
    }
  }, [queryError]);

  // Consolidated page management to prevent cascade refreshes
  useEffect(() => {
    if (historyData?.success && historyData.data) {
      setState(prev => ({
        ...prev,
        allPages: prev.currentPage === 1 
          ? historyData.data || []
          : [...prev.allPages, ...(historyData.data || [])],
        isSearching: false,
      }));
    }
  }, [historyData]);

  // Debounced search handler to prevent excessive validation calls
  const handleSearchChange = useCallback((newQuery: string) => {
    setState(prev => ({
      ...prev,
      searchQuery: newQuery,
      currentPage: 1,
      allPages: [],
      isSearching: true,
    }));
    
    // Debounce the query invalidation to prevent excessive calls
    const timeoutId = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['tts-history'] });
    }, DEBOUNCE_DELAY);
    
    return () => clearTimeout(timeoutId);
  }, [queryClient]);

  // Optimized load more handler
  const handleLoadMore = useCallback(() => {
    if (!isLoading && historyData?.success && historyData.data && historyData.data.length === ITEMS_PER_PAGE) {
      setState(prev => ({
        ...prev,
        currentPage: prev.currentPage + 1,
      }));
    }
  }, [isLoading, historyData]);

  // Consolidated refresh handler
  useEffect(() => {
    if (shouldRefresh && isOpen) {
      setState(prev => ({
        ...prev,
        currentPage: 1,
        allPages: [],
        error: null,
      }));
      queryClient.invalidateQueries({ queryKey: ['tts-history'] });
      onRefreshComplete?.();
    }
  }, [shouldRefresh, isOpen, queryClient, onRefreshComplete]);

  // Optimized audio player error handling
  useEffect(() => {
    if (headlessPlayerError && headlessPlayerCurrentlyPlayingUrl) {
      const problematicItem = state.allPages.find(
        item => item.outputUrl === headlessPlayerCurrentlyPlayingUrl
      );
      
      if (problematicItem && !problematicItem.isOutputUrlProblematic) {
        // Server action handles validation - no additional validation needed
        markTtsUrlProblematic(problematicItem.id, headlessPlayerError)
          .then(result => {
            if (result.success) {
              // Optimistic cache update for immediate UI feedback
              queryClient.setQueryData(queryKey, (old: any) => {
                if (old?.success && old.data) {
                  return {
                    ...old,
                    data: old.data.map((item: TtsPredictionDisplayDto) => 
                      item.id === problematicItem.id 
                        ? { 
                            ...item, 
                            isOutputUrlProblematic: true, 
                            outputUrlLastError: headlessPlayerError 
                          }
                        : item
                    )
                  };
                }
                return old;
              });
            }
          })
          .catch(error => {
            setState(prev => ({ 
              ...prev, 
              error: `Failed to mark URL as problematic: ${error.message}` 
            }));
          });
      }
    }
  }, [headlessPlayerError, headlessPlayerCurrentlyPlayingUrl, state.allPages, queryClient, queryKey]);

  // Enhanced save handlers with consolidated error handling
  const handleSaveToDamWrapper = useCallback(async (item: TtsPredictionDisplayDto): Promise<boolean> => {
    try {
      const success = await onSaveToDam(item);
      if (success) {
        // Optimistic cache invalidation
        queryClient.invalidateQueries({ queryKey: ['tts-history'] });
        return true;
      } else if (!item.isOutputUrlProblematic) {
        const errorMessage = "Failed to save audio; link may be invalid.";
        await markTtsUrlProblematic(item.id, errorMessage);
        queryClient.invalidateQueries({ queryKey: ['tts-history'] });
        return false;
      }
      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ 
        ...prev, 
        error: `Save to DAM failed: ${errorMessage}` 
      }));
      return false;
    }
  }, [onSaveToDam, queryClient]);

  const handleSaveAsToDamWrapper = useCallback(async (item: TtsPredictionDisplayDto): Promise<boolean> => {
    try {
      const success = await onSaveAsToDam(item);
      if (success) {
        // Optimistic cache invalidation
        queryClient.invalidateQueries({ queryKey: ['tts-history'] });
        return true;
      } else if (!item.isOutputUrlProblematic) {
        const errorMessage = "Failed to save audio as new; link may be invalid.";
        await markTtsUrlProblematic(item.id, errorMessage);
        queryClient.invalidateQueries({ queryKey: ['tts-history'] });
        return false;
      }
      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ 
        ...prev, 
        error: `Save as DAM failed: ${errorMessage}` 
      }));
      return false;
    }
  }, [onSaveAsToDam, queryClient]);

  // Consolidated clear search handler
  const clearSearch = useCallback(() => {
    setState(prev => ({
      ...prev,
      searchQuery: '',
      currentPage: 1,
      allPages: [],
      error: null,
    }));
    queryClient.invalidateQueries({ queryKey: ['tts-history'] });
  }, [queryClient]);

  // Derived state calculations
  const allItemsLoaded = historyData?.success && historyData.data ? historyData.data.length < ITEMS_PER_PAGE : false;
  const isLoadingMore = isLoading && state.currentPage > 1;
  const consolidatedError = state.error || queryError?.message || null;

  return {
    historyItems: state.allPages,
    isLoading: isLoading && state.currentPage === 1, // Only show loading for initial load
    error: consolidatedError,
    searchQuery: state.searchQuery,
    setSearchQuery: handleSearchChange,
    clearSearch,
    handleLoadMore,
    allItemsLoaded,
    isLoadingMore,
    isSearching: state.isSearching,
    handleSaveToDamForItem: handleSaveToDamWrapper,
    handleSaveAsToDamForItem: handleSaveAsToDamWrapper,
  };
} 