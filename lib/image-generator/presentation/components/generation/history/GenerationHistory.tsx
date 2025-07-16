'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { GenerationDto } from '../../../../application/dto';
import { GenerationSearchBar } from './GenerationSearchBar';
import { GenerationListItem } from '../list/GenerationListItem';
import { GenerationEmptyState } from '../list/GenerationEmptyState';
import { useGenerationSearch, useGenerationActions } from '../../../hooks';

interface GenerationHistoryProps {
  generations: GenerationDto[];
  onRefresh: () => void;
  onEditImage?: (baseImageUrl: string, originalPrompt: string) => void;
  onImageSelect?: (imageUrl: string) => void;
  onMakeBaseImage?: (imageUrl: string) => void;
  onClose?: () => void;
  compact?: boolean;
  className?: string;
  // Infinite scroll props
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
}

export const GenerationHistory: React.FC<GenerationHistoryProps> = ({
  generations,
  onRefresh: _onRefresh,
  onEditImage,
  onImageSelect,
  onMakeBaseImage,
  onClose,
  compact = false,
  className = '',
  hasNextPage = false,
  isFetchingNextPage = false,
  onLoadMore
}) => {
  // Custom hooks following SRP
  const search = useGenerationSearch(generations);
  const actions = useGenerationActions({ onImageSelect, onEditImage });
  
  // Ref for scroll-based infinite loading
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Handle scroll-based infinite loading for regular list
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || !hasNextPage || isFetchingNextPage || !onLoadMore) {
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    // Trigger load more when scrolling near bottom
    if (distanceFromBottom < 200) {
      onLoadMore();
    }
  }, [hasNextPage, isFetchingNextPage, onLoadMore]);

  // Add scroll listener for infinite loading
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  if (compact) {
    return (
      <div className={`flex flex-col h-full bg-white border-l border-gray-200/60 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200/60">
          <h2 className="text-lg font-semibold text-gray-900">Recent Generations</h2>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200/60">
          <GenerationSearchBar
            searchQuery={search.searchQuery}
            onSearchChange={search.setSearchQuery}
          />
        </div>

        {/* Results - Always use detailed list view for history panel */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto"
        >
          {search.isSearchLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              Searching generations...
            </div>
          ) : search.filteredGenerations.length === 0 ? (
            <GenerationEmptyState
              hasSearchQuery={!!search.searchQuery}
              onClearSearch={search.clearSearch}
            />
          ) : (
            <div className="p-4 space-y-3">
              {search.filteredGenerations.map((generation) => (
                <GenerationListItem
                  key={generation.id}
                  generation={generation}
                  onImageClick={() => actions.handleImageClick(generation)}
                  onEditClick={() => actions.handleEditClick(generation)}
                  onCopyUrl={() => generation.imageUrl && actions.copyImageUrl(generation.imageUrl)}
                  onDownloadImage={() => generation.imageUrl && actions.downloadImage(generation.imageUrl, generation.prompt)}
                  onMakeBaseImage={() => generation.imageUrl && onMakeBaseImage?.(generation.imageUrl)}
                />
              ))}
              {/* Infinite scroll loading indicator */}
              {hasNextPage && (
                <div className="p-4 text-center">
                  {isFetchingNextPage ? (
                    <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                      <span>Loading more generations...</span>
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-sm">
                      Scroll down to load more...
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Non-compact version (legacy)
  return (
    <div className={`p-4 ${className}`}>
      <div className="space-y-4">
        {generations.slice(0, 6).map((generation) => (
          <div key={generation.id} className="border rounded-lg p-4">
            <div className="text-sm font-medium mb-2">{generation.prompt}</div>
            {generation.imageUrl && (
              <div className="relative w-full h-32 cursor-pointer" onClick={() => actions.handleImageClick(generation)}>
                <Image 
                  src={generation.imageUrl} 
                  alt={generation.prompt}
                  fill
                  className="object-cover rounded"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}; 