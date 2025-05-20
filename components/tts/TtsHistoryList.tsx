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
  // 1. Handle Error State First
  if (error) {
    return <p className="text-sm text-red-500 text-center py-4">Error: {error}</p>;
  }

  // 2. Handle Initial Loading State
  // Only show "Loading history..." if we are truly in the initial loading phase for an empty list
  if (isLoading && historyItems.length === 0 && !isLoadingMore) {
    return <p className="text-sm text-gray-500 text-center py-4">Loading history...</p>;
  }

  // 3. Handle Empty States (after loading is done, or if search yields no results)
  // If not loading and no items, it means loading finished and found nothing, or search found nothing.
  if (!isLoading && historyItems.length === 0) { 
    return <p className="text-sm text-gray-500 text-center py-4">{searchQuery.trim() ? "No results match your search." : "No history yet."}</p>;
  }
  
  // 4. If we have items, render them (and potentially "Load More" or "End of history")
  // This condition is implicitly met if none of the above returned.
  // However, explicitly checking historyItems.length > 0 can be clearer before mapping.
  if (historyItems.length > 0) {
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
              onSaveToDam={onSaveToDamItem}
              onSaveAsToDam={onSaveAsToDamItem}
              headlessPlayerCurrentlyPlayingUrl={headlessPlayerCurrentlyPlayingUrl}
              isHeadlessPlayerPlaying={isHeadlessPlayerPlaying}
              isHeadlessPlayerLoading={isHeadlessPlayerLoading}
              // Pass headlessPlayerError to TtsHistoryItem if it needs to display item-specific playback errors
              // headlessPlayerError={headlessPlayerError} // Already passed
            />
          );
        })}
        {!allItemsLoaded && ( // Show "Load More" only if there are items and not all are loaded.
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
        {allItemsLoaded && ( // Show "End of history" only if all items are loaded.
          <p className="text-sm text-gray-500 text-center py-4 mt-4">You've reached the end of the history.</p>
        )}
      </>
    );
  }

  // Fallback: Should ideally be unreachable if the logic for empty/loading/error/items is exhaustive.
  // This could occur if !isLoading && historyItems.length === 0 was false, but historyItems.length > 0 was also false
  // (which is impossible if historyItems is always an array).
  return null;
} 