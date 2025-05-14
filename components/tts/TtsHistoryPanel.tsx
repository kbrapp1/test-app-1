'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { X, RotateCw, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { getTtsHistory } from '@/lib/actions/tts';
import { TtsHistoryItem } from './TtsHistoryItem';
import type { Database } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type TtsPredictionRow = Database['public']['Tables']['TtsPrediction']['Row'];

export interface TtsHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onReplayItem: (item: TtsPredictionRow) => void;
  onReloadInputFromItem: (item: TtsPredictionRow) => void;
  onDeleteItem: (item: TtsPredictionRow) => void;
  onViewInDamItem: (item: TtsPredictionRow) => void;
  onSaveToDam: (item: TtsPredictionRow) => Promise<boolean>;
  onSaveAsToDam: (item: TtsPredictionRow) => Promise<boolean>;
  headlessPlayerCurrentlyPlayingUrl?: string | null;
  isHeadlessPlayerPlaying?: boolean;
  isHeadlessPlayerLoading?: boolean;
  headlessPlayerError?: string | null;
  shouldRefresh?: boolean;
  onRefreshComplete?: () => void;
}

export function TtsHistoryPanel({ 
  isOpen, 
  onClose,
  onReplayItem,
  onReloadInputFromItem,
  onDeleteItem,
  onViewInDamItem,
  onSaveToDam,
  onSaveAsToDam,
  headlessPlayerCurrentlyPlayingUrl,
  isHeadlessPlayerPlaying,
  isHeadlessPlayerLoading,
  headlessPlayerError,
  shouldRefresh = false,
  onRefreshComplete
}: TtsHistoryPanelProps) {
  const [isMounted, setIsMounted] = useState(isOpen);
  const [isPanelVisible, setIsPanelVisible] = useState(false);

  const [historyItems, setHistoryItems] = useState<TtsPredictionRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [allItemsLoaded, setAllItemsLoaded] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const ITEMS_PER_PAGE = 10;
  const DEBOUNCE_DELAY = 300;

  const fetchHistory = useCallback(async (page: number, currentSearchQuery: string) => {
    setIsLoading(true);
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
        searchQuery: currentSearchQuery
      });
      if (result.success && result.data) {
        const newItemsSegment = result.data;
        
        setHistoryItems(prevItems => {
          const updatedHistoryItems = page === 1 ? newItemsSegment : [...prevItems, ...newItemsSegment];
          
          if (newItemsSegment.length < ITEMS_PER_PAGE || (result.count != null && updatedHistoryItems.length >= result.count)) {
            setAllItemsLoaded(true);
          } else {
            setAllItemsLoaded(false);
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
    setIsLoading(false);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1);
      setHistoryItems([]);
      setAllItemsLoaded(false);
      fetchHistory(1, query);
    }, DEBOUNCE_DELAY);
  }, [fetchHistory]);

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      const timer = setTimeout(() => {
        requestAnimationFrame(() => {
          setIsPanelVisible(true);
        });
      }, 50);
      
      if (historyItems.length === 0) { 
         setCurrentPage(1);
         setHistoryItems([]);
         setAllItemsLoaded(false);
         fetchHistory(1, searchQuery);
      }
      
      return () => clearTimeout(timer);
    } else {
      setIsPanelVisible(false);
      const timer = setTimeout(() => setIsMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, fetchHistory, searchQuery, historyItems.length]);
  
  useEffect(() => {
    if (shouldRefresh && isOpen) {
      setCurrentPage(1); 
      setHistoryItems([]); 
      setAllItemsLoaded(false); 
      fetchHistory(1, searchQuery);
      
      if (onRefreshComplete) {
        onRefreshComplete();
      }
    }
  }, [shouldRefresh, isOpen, fetchHistory, searchQuery, onRefreshComplete]);
  
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);
  
  const handleLoadMore = () => {
    if (historyItems.length < totalCount && !allItemsLoaded) {
      fetchHistory(currentPage + 1, searchQuery);
    }
  };

  if (!isMounted) {
    return null;
  }

  const renderContent = () => {
    if (isLoading && historyItems.length === 0) {
      return <p className="text-sm text-gray-500 text-center py-4">Loading history...</p>;
    }
    if (error) {
      return <p className="text-sm text-red-500 text-center py-4">Error: {error}</p>;
    }
    if (historyItems.length === 0 && (searchQuery.trim() || !isLoading)) { 
      return <p className="text-sm text-gray-500 text-center py-4">{searchQuery.trim() ? "No results match your search." : "No history yet."}</p>;
    }
    
    return (
      <>
        {historyItems.map((item) => (
          <TtsHistoryItem 
            key={item.id} 
            item={item} 
            onReplay={onReplayItem}
            onReloadInput={onReloadInputFromItem}
            onDelete={onDeleteItem}
            onViewInDam={onViewInDamItem}
            onSaveToDam={onSaveToDam}
            onSaveAsToDam={onSaveAsToDam}
            headlessPlayerCurrentlyPlayingUrl={headlessPlayerCurrentlyPlayingUrl}
            isHeadlessPlayerPlaying={isHeadlessPlayerPlaying}
            isHeadlessPlayerLoading={isHeadlessPlayerLoading}
            headlessPlayerError={headlessPlayerError}
          />
        ))}
        {historyItems.length > 0 && historyItems.length < totalCount && !allItemsLoaded && (
          <Button 
            variant="outline"
            className="w-full mt-4"
            onClick={handleLoadMore}
            disabled={isLoading}
          >
            {isLoading && currentPage > 1 ? 'Loading more...' : 'Load More'} 
          </Button>
        )}
         {allItemsLoaded && historyItems.length > 0 && (
           <p className="text-sm text-gray-500 text-center py-4 mt-4">You've reached the end of the history.</p>
         )}
      </>
    );
  };

  return (
    <div
      className={cn(
        "fixed inset-y-0 right-0 z-50 w-full max-w-md bg-background border-l shadow-lg transform transition-transform ease-in-out duration-300 flex flex-col",
        isPanelVisible ? "translate-x-0" : "translate-x-full"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Generation History</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search history..."
            className="pl-8 pr-10"
            value={searchQuery}
            onChange={handleSearchChange}
          />
          {searchQuery && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => {
                setSearchQuery('');
                if (searchTimeoutRef.current) { 
                  clearTimeout(searchTimeoutRef.current);
                }
                setCurrentPage(1); 
                setHistoryItems([]); 
                setAllItemsLoaded(false); 
                fetchHistory(1, '');
              }}
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {renderContent()}
      </div>
    </div>
  );
} 