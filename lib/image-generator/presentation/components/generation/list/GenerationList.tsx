'use client';

import React, { useMemo } from 'react';
import { GenerationDto } from '../../application/dto';
import { GenerationCard } from './GenerationCard';
import { EmptyState } from './EmptyState';
import { VirtualizedGenerationList, useVirtualizedList } from './VirtualizedGenerationList';

interface GenerationListProps {
  generations: GenerationDto[];
  loading?: boolean;
  compact?: boolean;
  onGenerationClick?: (generation: GenerationDto) => void;
  onEditImage?: (baseImageUrl: string, originalPrompt: string) => void;
  className?: string;
  // Virtualization props
  hasNextPage?: boolean;
  loadMore?: () => Promise<void>;
  enableVirtualization?: boolean;
  virtualizationThreshold?: number;
}

const LoadingSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="animate-pulse">
        <div className="bg-gray-200 rounded-lg aspect-square mb-3"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          <div className="flex justify-between">
            <div className="h-3 bg-gray-200 rounded w-16"></div>
            <div className="h-3 bg-gray-200 rounded w-12"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const GenerationList: React.FC<GenerationListProps> = ({
  generations,
  loading = false,
  compact = false,
  onGenerationClick,
  onEditImage,
  className = '',
  hasNextPage = false,
  loadMore,
  enableVirtualization = true,
  virtualizationThreshold = 50
}) => {
  const { containerHeight } = useVirtualizedList();

  // Determine if we should use virtualization
  const shouldVirtualize = useMemo(() => {
    return enableVirtualization && 
           generations.length >= virtualizationThreshold &&
           !compact; // Don't virtualize compact lists
  }, [enableVirtualization, generations.length, virtualizationThreshold, compact]);
  if (loading) {
    return (
      <div className={className}>
        <LoadingSkeleton count={compact ? 3 : 6} />
      </div>
    );
  }

  if (generations.length === 0) {
    return (
      <div className={className}>
        <EmptyState
          title="No generations yet"
          description="Start by creating your first AI-generated image"
          showCreateButton={!compact}
        />
      </div>
    );
  }

  // Use virtualized list for large datasets
  if (shouldVirtualize) {
    return (
      <div className={className}>
        <div className="mb-4 text-sm text-gray-500 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Virtual scrolling enabled for {generations.length} items
        </div>
        <VirtualizedGenerationList
          generations={generations}
          hasNextPage={hasNextPage}
          isLoading={loading}
          loadMore={loadMore}
          onGenerationClick={onGenerationClick}
          height={containerHeight}
          itemHeight={compact ? 120 : 180}
          className="rounded-lg border border-gray-200"
        />
      </div>
    );
  }

  // Use regular grid for smaller lists
  const gridClasses = compact 
    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
    : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4";

  const cardSize = compact ? 'small' : 'medium';

  return (
    <div className={`${gridClasses} ${className}`}>
      {generations.map((generation) => (
        <GenerationCard
          key={generation.id}
          generation={generation}
          size={cardSize}
          showActions={!compact}
          onClick={() => onGenerationClick?.(generation)}
          onEditImage={onEditImage}
          className="h-fit"
        />
      ))}
    </div>
  );
}; 