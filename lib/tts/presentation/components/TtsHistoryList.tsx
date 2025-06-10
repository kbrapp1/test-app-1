'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { TtsHistoryItem, TtsHistoryActionCallbacks, TtsAudioPlayerState } from '../types/TtsPresentation';
import { TtsHistoryItem as TtsHistoryItemComponent, TtsHistoryItemProps } from './TtsHistoryItem';
import { Button } from '@/components/ui/button';
import { isPredictionLinkLikelyExpired } from './ttsHistoryUtils';

interface TtsHistoryListProps extends TtsAudioPlayerState {
  historyItems: TtsHistoryItem[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  allItemsLoaded: boolean;
  isLoadingMore: boolean;
  handleLoadMore: () => void;
  // History item action callbacks
  onReplayItem: TtsHistoryActionCallbacks['onReplayItem'];
  onReloadInputFromItem: TtsHistoryActionCallbacks['onReloadInputFromItem'];
  onDeleteItem: TtsHistoryActionCallbacks['onDeleteItem'];
  onViewInDamItem: TtsHistoryActionCallbacks['onViewInDamItem'];
  onSaveToDamItem: TtsHistoryActionCallbacks['onSaveToDam'];
  onSaveAsToDamItem: TtsHistoryActionCallbacks['onSaveAsToDam'];
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
            <TtsHistoryItemComponent 
              key={item.id} 
              item={item} 
              isLikelyExpired={itemIsLikelyExpired}
              hasActualPlaybackError={itemHasPlaybackError}
              actualPlaybackErrorMessage={itemHasPlaybackError ? headlessPlayerError : null}
              isProblematicFromDb={item.isOutputUrlProblematic}
              dbProblematicMessage={item.outputUrlLastError}
              onReplay={onReplayItem}
              onReloadInput={onReloadInputFromItem}
              onDelete={onDeleteItem}
              onViewInDam={onViewInDamItem}
              onSaveToDam={onSaveToDamItem}
              onSaveAsToDam={onSaveAsToDamItem}
              headlessPlayerCurrentlyPlayingUrl={headlessPlayerCurrentlyPlayingUrl}
              isHeadlessPlayerPlaying={isHeadlessPlayerPlaying}
              isHeadlessPlayerLoading={isHeadlessPlayerLoading}
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