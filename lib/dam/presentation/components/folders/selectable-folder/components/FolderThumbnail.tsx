'use client';

import React from 'react';
import { Folder } from 'lucide-react';

interface FolderThumbnailProps {
  isOver: boolean;
  variant: 'grid' | 'list';
  dragListeners: Record<string, (event: Event) => void>;
}

/**
 * FolderThumbnail - Enhanced folder icon with clear drag/click distinction
 * 
 * Provides visual cues to distinguish between click-to-open and drag-to-move.
 * Follows SRP by focusing solely on icon presentation and interaction hints.
 */
export const FolderThumbnail: React.FC<FolderThumbnailProps> = ({
  isOver,
  variant,
  dragListeners: _dragListeners
}) => {
  if (variant === 'list') {
    return (
      <div 
        className={`w-8 h-8 rounded-md bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0 transition-colors duration-200 ${
          isOver ? 'bg-blue-200 scale-105' : ''
        }`}
      >
        {/* Main folder icon - clickable area */}
        <Folder className={`w-4 h-4 text-blue-600 ${isOver ? 'animate-pulse' : ''}`} />
      </div>
    );
  }

  // Grid variant
  return (
    <div 
      className={`w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-3 transition-colors duration-200 ${
        isOver ? 'bg-blue-200 scale-105' : ''
      }`}
    >
      {/* Main folder icon - clickable area */}
      <Folder className={`w-6 h-6 text-blue-600 ${isOver ? 'animate-pulse' : ''}`} />
    </div>
  );
}; 