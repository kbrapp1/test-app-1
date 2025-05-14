'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { X, RotateCw } from 'lucide-react';
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
  headlessPlayerCurrentlyPlayingUrl?: string | null;
  isHeadlessPlayerPlaying?: boolean;
  isHeadlessPlayerLoading?: boolean;
  headlessPlayerError?: string | null;
}

export function TtsHistoryPanel({ 
  isOpen, 
  onClose,
  onReplayItem,
  onReloadInputFromItem,
  onDeleteItem,
  onViewInDamItem,
  headlessPlayerCurrentlyPlayingUrl,
  isHeadlessPlayerPlaying,
  isHeadlessPlayerLoading,
  headlessPlayerError
}: TtsHistoryPanelProps) {
  const [isMounted, setIsMounted] = useState(isOpen);
  const [isPanelVisible, setIsPanelVisible] = useState(false);

  const [historyItems, setHistoryItems] = useState<TtsPredictionRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const ITEMS_PER_PAGE = 10;

  const fetchHistory = useCallback(async (page: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getTtsHistory({ page, limit: ITEMS_PER_PAGE, sortBy: 'createdAt', sortOrder: 'desc' });
      if (result.success && result.data) {
        setHistoryItems(prevItems => page === 1 ? result.data! : [...prevItems, ...result.data!]);
        setTotalCount(result.count || 0);
        setCurrentPage(page);
      } else {
        setError(result.error || 'Failed to fetch history.');
      }
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred while fetching history.');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      const timer = setTimeout(() => {
        requestAnimationFrame(() => {
          setIsPanelVisible(true);
        });
      }, 50);
      fetchHistory(1);
      return () => clearTimeout(timer);
    } else {
      setIsPanelVisible(false);
      const timer = setTimeout(() => setIsMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, fetchHistory]);
  
  const handleLoadMore = () => {
    if (historyItems.length < totalCount) {
      fetchHistory(currentPage + 1);
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
    if (historyItems.length === 0) {
      return <p className="text-sm text-gray-500 text-center py-4">No history yet.</p>;
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
            headlessPlayerCurrentlyPlayingUrl={headlessPlayerCurrentlyPlayingUrl}
            isHeadlessPlayerPlaying={isHeadlessPlayerPlaying}
            isHeadlessPlayerLoading={isHeadlessPlayerLoading}
            headlessPlayerError={headlessPlayerError}
          />
        ))}
        {historyItems.length < totalCount && (
          <Button 
            variant="outline"
            className="w-full mt-4"
            onClick={handleLoadMore}
            disabled={isLoading}
          >
            {isLoading ? 'Loading more...' : 'Load More'}
          </Button>
        )}
      </>
    );
  };

  return (
    <div
      className={cn(
        "fixed inset-y-0 right-0 z-50 w-full max-w-md bg-background border-l shadow-lg transform transition-transform ease-in-out duration-300",
        isPanelVisible ? "translate-x-0" : "translate-x-full"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Generation History</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
} 