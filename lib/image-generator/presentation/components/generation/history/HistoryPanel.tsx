'use client';

import React from 'react';
import { GenerationHistory } from './GenerationHistory';
import type { GenerationDto } from '../../../../application/dto/GenerationDto';

interface HistoryPanelProps {
  panelVisible: boolean;
  showHistory: boolean;
  generations: GenerationDto[];
  onRefresh: () => void;
  onEditImage: (baseImageUrl: string, originalPrompt: string) => void;
  onImageSelect: (imageUrl: string) => void;
  onMakeBaseImage?: (imageUrl: string) => void;
  onClose: () => void;
  // Infinite scroll props
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  panelVisible,
  showHistory,
  generations,
  onRefresh,
  onEditImage,
  onImageSelect,
  onMakeBaseImage,
  onClose,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}) => {
  if (!panelVisible) return null;

  return (
    <>
      {/* Dark overlay */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-200 z-40 ${
          showHistory ? 'opacity-20 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-[460px] bg-white flex flex-col border-l border-gray-200/60 z-50 transform transition-transform duration-200 ease-in-out ${
          showHistory ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <GenerationHistory
          generations={generations}
          onRefresh={onRefresh}
          onEditImage={onEditImage}
          onImageSelect={onImageSelect}
          onMakeBaseImage={onMakeBaseImage}
          compact={true}
          onClose={onClose}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={onLoadMore}
        />
      </div>
    </>
  );
}; 