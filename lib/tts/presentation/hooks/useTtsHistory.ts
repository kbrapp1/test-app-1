import { useState, useCallback, useEffect, useRef } from 'react';
import { getTtsHistory, markTtsUrlProblematic } from '../../application/actions/tts';
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
  // Pass through original save handlers to be wrapped
  onSaveToDam: (item: TtsPredictionDisplayDto) => Promise<boolean>; 
  onSaveAsToDam: (item: TtsPredictionDisplayDto) => Promise<boolean>;
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
  const [historyItems, setHistoryItems] = useState<TtsPredictionDisplayDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isActuallyLoadingMore, setIsActuallyLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [allItemsLoaded, setAllItemsLoaded] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [initialFetchAttempted, setInitialFetchAttempted] = useState(false);

  const fetchHistoryInternal = useCallback(async (page: number, currentSearchQuery: string, isInitialFetch: boolean = false) => {
    if (page === 1) {
        setIsLoading(true);
    }
    if (page > 1) {
        setIsActuallyLoadingMore(true);
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
      if (result.success && 'data' in result && result.data) {
        const newItemsSegment = result.data;
        setHistoryItems(prevItems => {
          const updatedHistoryItems = page === 1 ? newItemsSegment : [...prevItems, ...newItemsSegment];
          if (newItemsSegment.length < ITEMS_PER_PAGE || ('count' in result && result.count != null && updatedHistoryItems.length >= result.count)) {
            setAllItemsLoaded(true);
          }
          return updatedHistoryItems;
        });
        setTotalCount('count' in result ? (result.count || 0) : 0);
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
    if (isInitialFetch && page === 1) {
        setInitialFetchAttempted(true);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setInitialFetchAttempted(false);
    }
  }, [isOpen]);
  
  useEffect(() => {
    if (isOpen && !initialFetchAttempted && !isLoading && !isActuallyLoadingMore && !searchQuery && !shouldRefresh) {
        fetchHistoryInternal(1, '', true);
    }
  }, [isOpen, initialFetchAttempted, isLoading, isActuallyLoadingMore, searchQuery, shouldRefresh, fetchHistoryInternal]);

  useEffect(() => {
    if (shouldRefresh && isOpen) {
      setCurrentPage(1);
      setHistoryItems([]);
      setAllItemsLoaded(false);
      setIsActuallyLoadingMore(false);
      setInitialFetchAttempted(false);
      if (onRefreshComplete) {
        onRefreshComplete();
      }
    }
  }, [shouldRefresh, isOpen, onRefreshComplete]);

  useEffect(() => {
    if (headlessPlayerError && headlessPlayerCurrentlyPlayingUrl) {
      const problematicItem = historyItems.find(it => it.outputUrl === headlessPlayerCurrentlyPlayingUrl);
      if (problematicItem && !problematicItem.isOutputUrlProblematic) {
        markTtsUrlProblematic(problematicItem.id, headlessPlayerError).then(result => {
          if (result.success) {
                          setHistoryItems(prevItems =>
                prevItems.map(it => {
                  if (it.id === problematicItem.id) {
                    return { ...it, isOutputUrlProblematic: true, outputUrlLastError: headlessPlayerError };
                  }
                  return it;
                })
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
      setInitialFetchAttempted(false);
    }, DEBOUNCE_DELAY);
  }, []);
  
  useEffect(() => {
    if (isOpen && !initialFetchAttempted && searchQuery && !isLoading && !isActuallyLoadingMore && !shouldRefresh) {
      fetchHistoryInternal(1, searchQuery, true);
    }
  }, [isOpen, initialFetchAttempted, searchQuery, isLoading, isActuallyLoadingMore, shouldRefresh, fetchHistoryInternal]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!isLoading && !isActuallyLoadingMore && !allItemsLoaded) {
      fetchHistoryInternal(currentPage + 1, searchQuery);
    }
  }, [isLoading, isActuallyLoadingMore, allItemsLoaded, currentPage, searchQuery, fetchHistoryInternal]);

  const handleSaveToDamWrapper = useCallback(async (item: TtsPredictionDisplayDto): Promise<boolean> => {
    const success = await onSaveToDam(item);
    if (!success && !item.isOutputUrlProblematic) {
      const errorMessage = "Failed to save audio; link may be invalid.";
      markTtsUrlProblematic(item.id, errorMessage).then(result => {
        if (result.success) {
          setHistoryItems(prevItems =>
            prevItems.map(it => {
              if (it.id === item.id) {
                return { ...it, isOutputUrlProblematic: true, outputUrlLastError: errorMessage };
              }
              return it;
            })
          );
        }
      });
    }
    return success;
  }, [onSaveToDam]);

  const handleSaveAsToDamWrapper = useCallback(async (item: TtsPredictionDisplayDto): Promise<boolean> => {
    const success = await onSaveAsToDam(item);
    if (!success && !item.isOutputUrlProblematic) {
      const errorMessage = "Failed to save audio as new; link may be invalid.";
      markTtsUrlProblematic(item.id, errorMessage).then(result => {
        if (result.success) {
          setHistoryItems(prevItems =>
            prevItems.map(it => {
              if (it.id === item.id) {
                return { ...it, isOutputUrlProblematic: true, outputUrlLastError: errorMessage };
              }
              return it;
            })
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
    setSearchQuery: handleSearchChange,
    clearSearch: () => {
      setSearchQuery('');
      setCurrentPage(1);
      setHistoryItems([]);
      setAllItemsLoaded(false);
      setIsActuallyLoadingMore(false);
      setInitialFetchAttempted(false);
    },
    handleLoadMore,
    allItemsLoaded,
    isLoadingMore: isActuallyLoadingMore,
    handleSaveToDamForItem: handleSaveToDamWrapper,
    handleSaveAsToDamForItem: handleSaveAsToDamWrapper,
  };
} 