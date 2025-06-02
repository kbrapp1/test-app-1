'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { GenerationDto } from '../../application/dto';
import { GenerationSearchBar } from './GenerationSearchBar';
import { GenerationListItem } from './GenerationListItem';
import { GenerationEmptyState } from './GenerationEmptyState';
import { useGenerationSearch, useGenerationActions } from '../hooks';

interface GenerationHistoryProps {
  generations: GenerationDto[];
  onRefresh: () => void;
  onEditImage?: (baseImageUrl: string, originalPrompt: string) => void;
  onImageSelect?: (imageUrl: string) => void;
  onClose?: () => void;
  compact?: boolean;
  className?: string;
}

export const GenerationHistory: React.FC<GenerationHistoryProps> = ({
  generations,
  onRefresh,
  onEditImage,
  onImageSelect,
  onClose,
  compact = false,
  className = ''
}) => {
  // Custom hooks following SRP
  const search = useGenerationSearch(generations);
  const actions = useGenerationActions({ onImageSelect, onEditImage });

  if (compact) {
    return (
      <div className={`flex flex-col h-full bg-white ${className}`}>
        {/* Header */}
        {onClose && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200/60">
            <h3 className="font-medium text-gray-900">Recent Generations</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-600 hover:text-gray-800"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Search Bar */}
        <GenerationSearchBar
          searchQuery={search.searchQuery}
          onSearchChange={search.setSearchQuery}
        />

        {/* History List */}
        <div className="flex-1 overflow-y-auto">
          {search.filteredGenerations.length === 0 ? (
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
                />
              ))}
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
              <img 
                src={generation.imageUrl} 
                alt={generation.prompt}
                className="w-full h-32 object-cover rounded cursor-pointer"
                onClick={() => actions.handleImageClick(generation)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}; 