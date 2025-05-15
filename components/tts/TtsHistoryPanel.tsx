'use client';

import React, { useState, useEffect } from 'react';
import type { Database } from '@/types/supabase';
import { cn } from '@/lib/utils';
import { useTtsHistory } from './useTtsHistory';
import { TtsHistoryPanelHeader } from './TtsHistoryPanelHeader';
import { TtsHistoryPanelSearch } from './TtsHistoryPanelSearch';
import { TtsHistoryList } from './TtsHistoryList';

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

  const {
    historyItems,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    clearSearch,
    handleLoadMore,
    allItemsLoaded,
    isLoadingMore,
    handleSaveToDamForItem,
    handleSaveAsToDamForItem,
  } = useTtsHistory({
    isOpen,
    headlessPlayerError,
    headlessPlayerCurrentlyPlayingUrl,
    shouldRefresh,
    onRefreshComplete,
    onSaveToDam,
    onSaveAsToDam,
  });

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      const timer = setTimeout(() => {
        requestAnimationFrame(() => {
          setIsPanelVisible(true);
        });
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setIsPanelVisible(false);
      const timer = setTimeout(() => setIsMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isMounted) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed inset-y-0 right-0 z-50 w-full max-w-md bg-background border-l shadow-lg transform transition-transform ease-in-out duration-300 flex flex-col",
        isPanelVisible ? "translate-x-0" : "translate-x-full"
      )}
    >
      <TtsHistoryPanelHeader onClose={onClose} />
      
      <TtsHistoryPanelSearch 
        searchQuery={searchQuery} 
        onSearchQueryChange={setSearchQuery} 
        onClearSearch={clearSearch} 
      />
      
      <div className="flex-1 overflow-hidden"> 
        <div className="h-full overflow-y-auto p-4">
          <TtsHistoryList 
            historyItems={historyItems}
            isLoading={isLoading}
            error={error}
            searchQuery={searchQuery}
            allItemsLoaded={allItemsLoaded}
            isLoadingMore={isLoadingMore}
            handleLoadMore={handleLoadMore}
            headlessPlayerCurrentlyPlayingUrl={headlessPlayerCurrentlyPlayingUrl}
            isHeadlessPlayerPlaying={isHeadlessPlayerPlaying}
            isHeadlessPlayerLoading={isHeadlessPlayerLoading}
            headlessPlayerError={headlessPlayerError}
            onReplayItem={onReplayItem}
            onReloadInputFromItem={onReloadInputFromItem}
            onDeleteItem={onDeleteItem}
            onViewInDamItem={onViewInDamItem}
            onSaveToDamItem={handleSaveToDamForItem}
            onSaveAsToDamItem={handleSaveAsToDamForItem}
          />
        </div>
      </div>
    </div>
  );
} 