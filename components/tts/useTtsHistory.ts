import { useState, useCallback, useEffect, useRef } from 'react';
import { getTtsHistory, markTtsUrlProblematic } from '@/lib/actions/tts';
import type { Database } from '@/types/supabase';

type TtsPredictionRow = Database['public']['Tables']['TtsPrediction']['Row'];

const ITEMS_PER_PAGE = 10;
const DEBOUNCE_DELAY = 300;

interface UseTtsHistoryProps {
  isOpen: boolean;
  initialSearchQuery?: string;
  headlessPlayerError?: string | null;
  headlessPlayerCurrentlyPlayingUrl?: string | null;
  shouldRefresh?: boolean;
  onRefreshComplete?: () => void;
  // Pass through original save handlers to be wrapped
  onSaveToDam: (item: TtsPredictionRow) => Promise<boolean>; 
  onSaveAsToDam: (item: TtsPredictionRow) => Promise<boolean>;
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
  const [historyItems, setHistoryItems] = useState<TtsPredictionRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isActuallyLoadingMore, setIsActuallyLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [allItemsLoaded, setAllItemsLoaded] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchHistoryInternal = useCallback(async (page: number, currentSearchQuery: string) => {
    if (page === 1) {
        setIsLoading(true);
    }
    
    setError(null);
    if (page === 1) {
      setAllItemsLoaded(false);
    }
    try {
      const result = await getTtsHistory({
        page,
        limit: ITEMS_PER_PAGE,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        searchQuery: currentSearchQuery,
      });
      if (result.success && result.data) {
        const newItemsSegment = result.data;
        setHistoryItems(prevItems => {
          const updatedHistoryItems = page === 1 ? newItemsSegment : [...prevItems, ...newItemsSegment];
          if (newItemsSegment.length < ITEMS_PER_PAGE || (result.count != null && updatedHistoryItems.length >= result.count)) {
            setAllItemsLoaded(true);
          }
          return updatedHistoryItems;
        });
        setTotalCount(result.count || 0);
        setCurrentPage(page);
      } else {
        setError(result.error || 'Failed to fetch history.');
        if (page === 1) {
          setHistoryItems([]);
          setTotalCount(0);
        }
      }
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred while fetching history.');
      if (page === 1) {
        setHistoryItems([]);
        setTotalCount(0);
      }
    }
    if (page === 1) setIsLoading(false);
    if (page > 1) setIsActuallyLoadingMore(false);

  }, []);

  useEffect(() => {
    if (isOpen && historyItems.length === 0 && !isLoading && !searchQuery && !shouldRefresh && !isActuallyLoadingMore) {
        fetchHistoryInternal(1, '');
    }
  }, [isOpen, historyItems.length, isLoading, searchQuery, shouldRefresh, fetchHistoryInternal, isActuallyLoadingMore]);

  useEffect(() => {
    if (shouldRefresh && isOpen) {
      setCurrentPage(1);
      setHistoryItems([]);
      setAllItemsLoaded(false);
      setIsActuallyLoadingMore(false);
      fetchHistoryInternal(1, searchQuery);
      if (onRefreshComplete) {
        onRefreshComplete();
      }
    }
  }, [shouldRefresh, isOpen, fetchHistoryInternal, searchQuery, onRefreshComplete]);

  useEffect(() => {
    if (headlessPlayerError && headlessPlayerCurrentlyPlayingUrl) {
      const problematicItem = historyItems.find(it => it.outputUrl === headlessPlayerCurrentlyPlayingUrl);
      if (problematicItem && !problematicItem.is_output_url_problematic) {
        markTtsUrlProblematic(problematicItem.id, headlessPlayerError).then(result => {
          if (result.success) {
            setHistoryItems(prevItems =>
              prevItems.map(it =>
                it.id === problematicItem.id
                  ? { ...it, is_output_url_problematic: true, output_url_last_error: headlessPlayerError }
                  : it
              )
            );
          }
        });
      }
    }
  }, [headlessPlayerError, headlessPlayerCurrentlyPlayingUrl, historyItems]);

  const handleSearchChange = useCallback((newQuery: string) => {
    setSearchQuery(newQuery);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1);
      setHistoryItems([]); 
      setAllItemsLoaded(false);
      setIsActuallyLoadingMore(false);
      fetchHistoryInternal(1, newQuery);
    }, DEBOUNCE_DELAY);
  }, [fetchHistoryInternal]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!isLoading && !isActuallyLoadingMore && historyItems.length < totalCount && !allItemsLoaded) {
      setIsActuallyLoadingMore(true);
      fetchHistoryInternal(currentPage + 1, searchQuery);
    }
  }, [isLoading, isActuallyLoadingMore, historyItems.length, totalCount, currentPage, searchQuery, fetchHistoryInternal, allItemsLoaded]);

  const handleSaveToDamWrapper = useCallback(async (item: TtsPredictionRow): Promise<boolean> => {
    const success = await onSaveToDam(item);
    if (!success && !item.is_output_url_problematic) {
      const errorMessage = "Failed to save audio; link may be invalid.";
      markTtsUrlProblematic(item.id, errorMessage).then(result => {
        if (result.success) {
          setHistoryItems(prevItems =>
            prevItems.map(it =>
              it.id === item.id
                ? { ...it, is_output_url_problematic: true, output_url_last_error: errorMessage }
                : it
            )
          );
        }
      });
    }
    return success;
  }, [onSaveToDam]);

  const handleSaveAsToDamWrapper = useCallback(async (item: TtsPredictionRow): Promise<boolean> => {
    const success = await onSaveAsToDam(item);
    if (!success && !item.is_output_url_problematic) {
      const errorMessage = "Failed to save audio as new; link may be invalid.";
      markTtsUrlProblematic(item.id, errorMessage).then(result => {
        if (result.success) {
          setHistoryItems(prevItems =>
            prevItems.map(it =>
              it.id === item.id
                ? { ...it, is_output_url_problematic: true, output_url_last_error: errorMessage }
                : it
            )
          );
        }
      });
    }
    return success;
  }, [onSaveAsToDam]);

  return {
    historyItems,
    isLoading,
    error,
    searchQuery,
    setSearchQuery: handleSearchChange, // Expose a function to update search query
    clearSearch: () => {
        setSearchQuery('');
        if (searchTimeoutRef.current) { clearTimeout(searchTimeoutRef.current); }
        setCurrentPage(1);
        setHistoryItems([]);
        setAllItemsLoaded(false);
        setIsActuallyLoadingMore(false);
        fetchHistoryInternal(1, '');
    },
    handleLoadMore,
    allItemsLoaded,
    totalCount,
    isLoadingMore: isActuallyLoadingMore,
    handleSaveToDamForItem: handleSaveToDamWrapper,
    handleSaveAsToDamForItem: handleSaveAsToDamWrapper,
  };
} 