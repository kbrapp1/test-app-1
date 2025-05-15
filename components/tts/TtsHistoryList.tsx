'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { TtsHistoryItem, TtsHistoryItemProps } from './TtsHistoryItem'; // Assuming TtsHistoryItemProps is exported or defined here
import type { Database } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { isPredictionLinkLikelyExpired } from './ttsHistoryUtils';

type TtsPredictionRow = Database['public']['Tables']['TtsPrediction']['Row'];

interface TtsHistoryListProps {
  historyItems: TtsPredictionRow[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  allItemsLoaded: boolean;
  isLoadingMore: boolean;
  handleLoadMore: () => void;
  // Props needed by TtsHistoryItem
  headlessPlayerCurrentlyPlayingUrl?: string | null;
  isHeadlessPlayerPlaying?: boolean;
  isHeadlessPlayerLoading?: boolean;
  headlessPlayerError?: string | null;
  onReplayItem: (item: TtsPredictionRow) => void;
  onReloadInputFromItem: (item: TtsPredictionRow) => void;
  onDeleteItem: (item: TtsPredictionRow) => void;
  onViewInDamItem: (item: TtsPredictionRow) => void;
  onSaveToDamItem: (item: TtsPredictionRow) => Promise<boolean>; // Renamed to match usage if it's item-specific
  onSaveAsToDamItem: (item: TtsPredictionRow) => Promise<boolean>; // Renamed to match usage
}

export function TtsHistoryList({
  historyItems,
  isLoading,
  error,
  searchQuery,
  allItemsLoaded,
  isLoadingMore,
  handleLoadMore,
  // TtsHistoryItem props
  headlessPlayerCurrentlyPlayingUrl,
  isHeadlessPlayerPlaying,
  isHeadlessPlayerLoading,
  headlessPlayerError,
  onReplayItem,
  onReloadInputFromItem,
  onDeleteItem,
  onViewInDamItem,
  onSaveToDamItem,
  onSaveAsToDamItem,
}: TtsHistoryListProps) {
  if (isLoading && historyItems.length === 0 && !isLoadingMore) {
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
      {historyItems.map((item) => {
        const itemIsLikelyExpired = isPredictionLinkLikelyExpired(item);
        const itemHasPlaybackError = headlessPlayerCurrentlyPlayingUrl === item.outputUrl && !!headlessPlayerError;
        
        return (
          <TtsHistoryItem 
            key={item.id} 
            item={item} 
            isLikelyExpired={itemIsLikelyExpired}
            hasActualPlaybackError={itemHasPlaybackError}
            actualPlaybackErrorMessage={itemHasPlaybackError ? headlessPlayerError : null}
            isProblematicFromDb={item.is_output_url_problematic}
            dbProblematicMessage={item.output_url_last_error}
            onReplay={onReplayItem}
            onReloadInput={onReloadInputFromItem}
            onDelete={onDeleteItem}
            onViewInDam={onViewInDamItem}
            onSaveToDam={onSaveToDamItem} // Ensure this matches the prop name
            onSaveAsToDam={onSaveAsToDamItem} // Ensure this matches the prop name
            headlessPlayerCurrentlyPlayingUrl={headlessPlayerCurrentlyPlayingUrl}
            isHeadlessPlayerPlaying={isHeadlessPlayerPlaying}
            isHeadlessPlayerLoading={isHeadlessPlayerLoading}
            headlessPlayerError={headlessPlayerError} // This was missing in the original map, but likely needed
          />
        );
      })}
      {historyItems.length > 0 && !allItemsLoaded && (
        <Button 
          variant="outline"
          className="w-full mt-4"
          onClick={handleLoadMore}
          disabled={isLoadingMore}
        >
          {isLoadingMore ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" data-testid="loading-more-icon" />
              Loading more...
            </>
          ) : (
            'Load More'
          )} 
        </Button>
      )}
       {allItemsLoaded && historyItems.length > 0 && (
         <p className="text-sm text-gray-500 text-center py-4 mt-4">You've reached the end of the history.</p>
       )}
    </>
  );
} 